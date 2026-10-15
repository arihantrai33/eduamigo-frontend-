import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Square, Volume2, VolumeX, Plus, History, Trash2, X, RotateCcw, Compass, Sparkles, Calculator, Lightbulb, Shapes, TrendingUp, WifiOff, Clock, AlertTriangle, Wrench } from "lucide-react";
import { learningApi, streamChat, visibleWhileStreaming } from "./api";
import AnswerView from "./AnswerView";
import { useVoice, VOICE_LANGS } from "./useVoice";
import { takeSentences } from "./speakable";
import { toast, errorMessage, confirmAction } from "../../../utils/toast";

// AI Tutor, Guided Learning and Voice Learning in one conversation. Text and voice share the same conversation; the
// answer streams in, can be stopped, and is read aloud sentence by sentence when voice is used (unless muted).

const CONSENT_KEY = "ea-voice-consent";
const readConsent = () => { try { return localStorage.getItem(CONSENT_KEY) === "yes"; } catch { return false; } };
const saveConsent = () => { try { localStorage.setItem(CONSENT_KEY, "yes"); } catch { /* private mode: ask again next time */ } };
let seq = 0;
const nextId = () => { seq += 1; return `m${seq}`; };

// A failed answer says what kind of failure it was. A temporary one (network, slow, busy) offers "Try again"; a server that is
// switched off or set up wrongly does not, because trying again cannot help. `reason` comes from the server (llm failure kind).
const FAILURE = {
  network: { Icon: WifiOff, title: "Temporary network problem", retry: true },
  timeout: { Icon: Clock, title: "The AI took too long to answer", retry: true },
  busy: { Icon: AlertTriangle, title: "The AI service is busy", retry: true },
  config: { Icon: Wrench, title: "The AI service is not available", retry: false },
  off: { Icon: Wrench, title: "The AI is switched off", retry: false },
  no_provider: { Icon: Wrench, title: "The AI is not set up", retry: false },
  limit: { Icon: AlertTriangle, title: "AI limit reached", retry: false },
  failed: { Icon: AlertTriangle, title: "Could not answer", retry: true },
};
const failureOf = (reason) => FAILURE[reason] || FAILURE.failed;
// An error from the browser's own request (not from the server): a lost connection is a network problem.
const reasonOfRequestError = (err) => {
  const code = err?.response?.data?.code;
  if (code === "AI_LIMIT") return "limit";
  if (code === "AI_BUSY") return "busy";
  return err?.response ? "failed" : "network";
};

// Starting points on an empty chat. They only fill the box (the student presses Send), so nothing is asked by accident.
const STARTERS = [
  { Icon: Lightbulb, title: "Understand a topic", text: "Photosynthesis samjhao" },
  { Icon: Calculator, title: "Solve step by step", text: "Solve 2x + 5 = 17" },
  { Icon: Shapes, title: "Learn with an example", text: "Explain fractions with an example" },
  { Icon: TrendingUp, title: "See it as a picture", text: "Draw the graph of y = 2x + 1" },
];

export default function TutorChat({ context, initialQuestion, onSuggest }) {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState(initialQuestion || "");
  const [subject, setSubject] = useState("");
  const [guided, setGuided] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(null); // null = closed
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [consentAsk, setConsentAsk] = useState(false);
  const controller = useRef(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const timing = useRef({});
  const sending = useRef(false); // set at once, before React re-renders: a double tap or Enter twice cannot send two requests
  const voice = useVoice();
  const voiceDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("voicedebug") === "1";

  useEffect(() => { logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight }); }, [messages]);
  useEffect(() => { if (initialQuestion) inputRef.current?.focus(); }, [initialQuestion]);
  // The box grows with what is typed, up to a limit, and shrinks again after sending.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const patch = (id, fn) => setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...fn(m) } : m)));

  async function send(text, { spoken = false, endedAt = null } = {}) {
    const question = String(text || "").trim();
    if (!question || busy || sending.current) return;
    sending.current = true;
    setInput("");
    voice.stopSpeaking();
    voice.resetFirstAudio();
    timing.current = { endedAt, firstText: null, firstAudio: null };
    const userMsg = { id: nextId(), role: "user", text: question, voice: spoken };
    const answerId = nextId();
    setMessages((list) => [...list, userMsg, { id: answerId, role: "assistant", text: "", streaming: true, raw: "" }]);
    setBusy(true);
    const mine = new AbortController();
    controller.current = mine;
    let raw = "";
    let spokenUpTo = 0;
    let language = "en";
    // Measured on this device from the end of the student's speech: to the first text, and to the first sound of the answer
    // (which may come after the stream has finished). Kept on the conversation element for the latency checks.
    const record = () => {
      const t = timing.current;
      if (!spoken || !t.endedAt || !logRef.current) return;
      if (t.firstText) logRef.current.dataset.voiceFirstTextMs = String(Math.round(t.firstText - t.endedAt));
      if (t.firstAudio) logRef.current.dataset.voiceFirstAudioMs = String(Math.round(t.firstAudio - t.endedAt));
      // Shown under the answer with ?voicedebug=1, so the delay can be read off a real phone.
      if (voiceDebug) patch(answerId, () => ({ voiceTiming: { text: t.firstText ? Math.round(t.firstText - t.endedAt) : null, audio: t.firstAudio ? Math.round(t.firstAudio - t.endedAt) : null } }));
    };
    const speakNew = (final = false) => {
      if (!spoken) return;
      const visible = visibleWhileStreaming(raw).replace(/\[\[diagram:\d+\]\]/g, "");
      const fresh = visible.slice(spokenUpTo);
      const { sentences, rest } = takeSentences(fresh);
      const parts = final && rest.trim() ? [...sentences, rest.trim()] : sentences;
      for (const s of parts) voice.say(s, language, (t) => { timing.current.firstAudio = t; record(); });
      spokenUpTo = final ? visible.length : visible.length - rest.length;
    };
    try {
      await streamChat(
        { message: question, conversationId, subject: subject || undefined, mode: guided ? "guided" : "tutor", voice: spoken },
        {
          signal: mine.signal,
          onEvent: (ev) => {
            // A stopped or replaced answer must not touch the new one (stale events can still arrive after an abort).
            if (mine.signal.aborted) return;
            if (ev.type === "meta") { if (ev.conversationId) setConversationId(ev.conversationId); language = ev.language || "en"; }
            if (ev.type === "delta") {
              if (!timing.current.firstText) timing.current.firstText = performance.now();
              raw += ev.text;
              patch(answerId, () => ({ raw, text: visibleWhileStreaming(raw) }));
              speakNew();
            }
            if (ev.type === "final") {
              patch(answerId, () => ({ streaming: false, text: ev.text, confidence: ev.confidence, sources: ev.used, checks: ev.checks, diagrams: ev.diagrams, timings: ev.timings, suggest: ev.suggest, cached: ev.cached }));
              // An answer that arrived only as its final text (nothing streamed) is still read aloud.
              if (!raw && ev.text) { raw = ev.text; if (!timing.current.firstText) timing.current.firstText = performance.now(); }
              // The rest of what was streamed is spoken (the final text has the hidden blocks removed, so it is not re-read).
              if (spoken) speakNew(true);
            }
            if (ev.type === "error") patch(answerId, () => ({ streaming: false, error: ev.message, errorReason: ev.reason || "failed", retry: failureOf(ev.reason).retry && ev.retryable !== false ? question : null }));
          },
        },
      );
      patch(answerId, (m) => (m.streaming ? { streaming: false, error: m.text ? null : "The answer did not arrive. Please try again.", errorReason: "network", retry: question } : {}));
    } catch (err) {
      if (err.name === "AbortError") patch(answerId, (m) => ({ streaming: false, stopped: true, text: m.text }));
      else {
        const reason = reasonOfRequestError(err);
        patch(answerId, () => ({ streaming: false, error: errorMessage(err, "Could not get an answer"), errorReason: reason, retry: failureOf(reason).retry ? question : null }));
      }
    } finally {
      setBusy(false);
      sending.current = false;
      if (controller.current === mine) controller.current = null;
      record();
    }
  }

  const stop = () => { controller.current?.abort(); voice.stopSpeaking(); };
  // Escape: stop talking, stop listening, or stop the answer that is coming in, whichever is happening.
  const onComposerKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); return; }
    if (e.key === "Escape") { voice.stopSpeaking(); voice.stopListening(); if (busy) stop(); }
  };

  function startVoice() {
    if (!readConsent()) { setConsentAsk(true); return; }
    voice.listen({ lang: voiceLang, onFinal: (text, meta) => send(text, { spoken: true, endedAt: meta.endedAt }) });
  }

  async function openHistory() {
    try { setHistory(await learningApi.get("/conversations")); } catch (err) { toast.error(errorMessage(err, "Could not load your chats")); }
  }
  async function openConversation(id) {
    try {
      const c = await learningApi.get(`/conversations/${id}`);
      setConversationId(c._id);
      setSubject(c.subject || "");
      setGuided(c.mode === "guided");
      setMessages(c.turns.map((t) => ({ id: nextId(), role: t.role, text: t.text, voice: t.meta?.voice, confidence: t.meta?.confidence, sources: t.meta?.sources, checks: t.meta?.checks, diagrams: t.meta?.diagrams })));
      setHistory(null);
    } catch (err) { toast.error(errorMessage(err, "Could not open the chat")); }
  }
  async function deleteConversation(id) {
    try {
      await learningApi.del(`/conversations/${id}`);
      setHistory((h) => h.filter((c) => c._id !== id));
      if (id === conversationId) newChat();
      toast.success("Chat deleted");
    } catch (err) { toast.error(errorMessage(err, "Could not delete the chat")); }
  }
  async function clearHistory() {
    if (!(await confirmAction("Delete all your AI Tutor chats? This cannot be undone.", { confirmLabel: "Delete all" }))) return;
    try { await learningApi.del("/conversations"); setHistory([]); newChat(); toast.success("All chats deleted"); } catch (err) { toast.error(errorMessage(err, "Could not delete the chats")); }
  }
  function newChat() { stop(); setMessages([]); setConversationId(null); setInput(""); }

  const listening = voice.state === "listening";
  const aiOff = context?.capabilities?.ai?.available === false;
  return (
    <section className="ea-learn__tutor" aria-label="AI Tutor">
      <div className="ea-learn__toolbar">
        <label className="ea-learn__field">
          <span className="ea-sr-only">Subject</span>
          <select className="ea-select" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
            <option value="">Any subject</option>
            {(context?.subjects || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" className={`ea-btn ea-btn--ghost${guided ? " is-on" : ""}`} aria-pressed={guided} onClick={() => setGuided((g) => !g)} title="Step by step: the tutor gives one step at a time and lets you try the next">
          <Compass size={16} aria-hidden="true" /> Guided Learning
        </button>
        <span className="ea-learn__spacer" />
        <button type="button" className="ea-btn ea-btn--ghost" onClick={openHistory}><History size={16} aria-hidden="true" /> History</button>
        <button type="button" className="ea-btn ea-btn--ghost" onClick={newChat}><Plus size={16} aria-hidden="true" /> New chat</button>
      </div>

      {history && (
        <div className="ea-learn__history" role="dialog" aria-label="Chat history">
          <div className="ea-learn__history-head">
            <strong>Your chats</strong>
            <span className="ea-learn__muted">Kept for {context?.capabilities?.historyDays || 180} days after the last message.</span>
            <button type="button" className="ea-btn ea-btn--ghost" aria-label="Close history" onClick={() => setHistory(null)}><X size={16} aria-hidden="true" /></button>
          </div>
          {history.length === 0 ? <p className="ea-learn__muted">No chats yet.</p> : (
            <ul>
              {history.map((c) => (
                <li key={c._id}>
                  <button type="button" className="ea-learn__history-item" onClick={() => openConversation(c._id)}>
                    <span>{c.title}</span>
                    <span className="ea-learn__muted">{c.subject ? `${c.subject} · ` : ""}{new Date(c.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </button>
                  <button type="button" className="ea-btn ea-btn--ghost" aria-label={`Delete chat: ${c.title}`} onClick={() => deleteConversation(c._id)}><Trash2 size={15} aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
          {history.length > 0 && <button type="button" className="ea-btn ea-btn--ghost ea-learn__danger" onClick={clearHistory}>Delete all chats</button>}
        </div>
      )}

      <div ref={logRef} className="ea-learn__log" role="log" aria-live="polite" aria-busy={busy} aria-label="Conversation">
        {messages.length === 0 && aiOff && (
          // The banner above says why; inviting a question here would only lead to an error, so point at what still works.
          <div className="ea-learn__empty">
            <span className="ea-learn__hero-icon" aria-hidden="true"><Wrench size={24} /></span>
            <h2 className="ea-learn__empty-title">Answers are not available right now</h2>
            <p className="ea-learn__muted">Your past chats are still in History. Plan your revision or check your progress meanwhile.</p>
            <div className="ea-learn__row">
              <button type="button" className="ea-btn ea-btn--primary" onClick={() => onSuggest?.({ action: "planner" })}>Open Revision Planner</button>
            </div>
          </div>
        )}
        {messages.length === 0 && !aiOff && (
          <div className="ea-learn__empty">
            <span className="ea-learn__hero-icon" aria-hidden="true"><Sparkles size={24} /></span>
            <h2 className="ea-learn__empty-title">Ask anything from your subjects</h2>
            <p className="ea-learn__muted">I explain step by step, check calculations, and use your teachers' notes when they cover the topic. Turn on Guided Learning to solve a problem one step at a time.</p>
            <ul className="ea-learn__starters">
              {STARTERS.map(({ Icon, title, text }) => (
                <li key={text}>
                  <button type="button" className="ea-learn__starter" onClick={() => { setInput(text); inputRef.current?.focus(); }}>
                    <Icon size={18} aria-hidden="true" />
                    <span><strong>{title}</strong><small>{text}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m) => (m.role === "user"
          ? <div key={m.id} className="ea-learn__bubble is-user">{m.voice && <Mic size={12} aria-label="Spoken" />} {m.text}</div>
          : (
            <div key={m.id} className="ea-learn__msg">
            <span className="ea-learn__avatar" aria-hidden="true"><Sparkles size={15} /></span>
            <div className="ea-learn__bubble is-ai">
              {m.streaming && !m.text && <span className="ea-learn__typing"><i /><i /><i /><span className="ea-sr-only">Thinking…</span></span>}
              {m.text && <AnswerView msg={m} idPrefix={m.id} />}
              {m.stopped && <p className="ea-learn__muted">Stopped.</p>}
              {m.suggest?.action === "practice" && (
                <button type="button" className="ea-btn ea-btn--primary" onClick={() => onSuggest?.(m.suggest)}>Start practice{m.suggest.topic ? `: ${m.suggest.topic}` : ""} ({m.suggest.count} questions)</button>
              )}
              {m.suggest?.action === "planner" && <button type="button" className="ea-btn ea-btn--primary" onClick={() => onSuggest?.(m.suggest)}>Open Revision Planner</button>}
              {m.voiceTiming && <p className="ea-learn__muted" data-testid="voice-timing">Voice timing on this device: first text {m.voiceTiming.text ?? "n/a"} ms, first sound {m.voiceTiming.audio ?? "n/a"} ms after you stopped speaking.</p>}
              {m.error && (() => {
                const { Icon, title } = failureOf(m.errorReason);
                return (
                  <div className={`ea-alert ea-learn__failure is-${m.errorReason || "failed"}`} role="alert">
                    <Icon size={18} aria-hidden="true" />
                    <div className="ea-learn__failure-text"><strong>{title}</strong><span>{m.error}</span></div>
                    {m.retry && <button type="button" className="ea-btn ea-btn--ghost" onClick={() => send(m.retry)}><RotateCcw size={14} aria-hidden="true" /> Try again</button>}
                  </div>
                );
              })()}
            </div>
            </div>
          )))}
      </div>

      {consentAsk && (
        <div className="ea-learn__consent" role="dialog" aria-label="Voice privacy">
          <p><strong>Before you use your voice</strong></p>
          <p>Your browser turns your speech into text. In Chrome and Edge the audio is sent to the browser maker's speech service; in Safari to Apple's. EduAmigo receives only the text, not the audio, and keeps the text in your chat history. The answer is read aloud by your device.</p>
          <div className="ea-learn__row">
            <button type="button" className="ea-btn ea-btn--primary" onClick={() => { saveConsent(); setConsentAsk(false); startVoice(); }}>I understand, use my voice</button>
            <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setConsentAsk(false)}>Type instead</button>
          </div>
        </div>
      )}

      {(listening || voice.state === "speaking" || voice.error) && (
        <div className={`ea-learn__voice-status${voice.error ? " is-error" : ""}${listening ? " is-listening" : ""}`} role="status">
          {listening && <><span className="ea-learn__pulse" aria-hidden="true"><Mic size={16} /></span><span>Listening… {voice.interim && <em>“{voice.interim}”</em>}</span></>}
          {voice.state === "speaking" && <><span className="ea-learn__wave" aria-hidden="true"><i /><i /><i /><i /></span><span>Speaking…</span><button type="button" className="ea-btn ea-btn--ghost" onClick={voice.stopSpeaking}>Stop speaking</button></>}
          {voice.error && <><span>{voice.error}</span><button type="button" className="ea-btn ea-btn--ghost" onClick={voice.clearError}>OK</button></>}
        </div>
      )}
      {voice.noHindiVoice && <p className="ea-learn__muted ea-learn__note">This device has no Hindi voice installed, so Hindi answers may sound unclear. You can read the written answer, or add a Hindi voice in your device's speech settings.</p>}

      <form className="ea-learn__composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label className="ea-sr-only" htmlFor="ea-learn-input">Your question</label>
        <textarea id="ea-learn-input" ref={inputRef} className="ea-learn__input" rows={1} maxLength={2000} value={input} placeholder="Type your question…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onComposerKey} />
        <div className="ea-learn__composer-actions">
          {voice.supported.listen ? (
            <>
              <select className="ea-select ea-learn__lang" value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} aria-label="Language you will speak">
                {VOICE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <button type="button" className={`ea-btn ${listening ? "ea-btn--primary" : "ea-btn--ghost"}`} aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Ask with your voice"} onClick={() => { if (listening) { voice.stopListening(); return; } if (busy) stop(); startVoice(); }}>
                {listening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
              </button>
            </>
          ) : <span className="ea-learn__muted ea-learn__novoice">Voice input is not available in this browser; typing works.</span>}
          {voice.supported.speak && (
            <button type="button" className="ea-btn ea-btn--ghost" aria-pressed={voice.muted} aria-label={voice.muted ? "Turn spoken answers on" : "Mute spoken answers"} onClick={() => voice.setMuted(!voice.muted)}>
              {voice.muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            </button>
          )}
          {busy
            ? <button type="button" className="ea-btn ea-btn--primary" onClick={stop} aria-label="Stop the answer"><Square size={16} aria-hidden="true" /> <span className="ea-learn__btn-text">Stop</span></button>
            : <button type="submit" className="ea-btn ea-btn--primary" disabled={!input.trim()} aria-label="Send"><Send size={16} aria-hidden="true" /> <span className="ea-learn__btn-text">Send</span></button>}
        </div>
        <p className="ea-learn__hint">Enter to send, Shift+Enter for a new line, Esc to stop. The tutor can make mistakes: check important answers with your teacher.</p>
      </form>
    </section>
  );
}
