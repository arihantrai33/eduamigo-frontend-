import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Square, Volume2, VolumeX, Plus, History, Trash2, X, RotateCcw, Compass } from "lucide-react";
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

export default function TutorChat({ context, initialQuestion }) {
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
  const voice = useVoice();

  useEffect(() => { logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight }); }, [messages]);
  useEffect(() => { if (initialQuestion) inputRef.current?.focus(); }, [initialQuestion]);

  const patch = (id, fn) => setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...fn(m) } : m)));

  async function send(text, { spoken = false, endedAt = null } = {}) {
    const question = String(text || "").trim();
    if (!question || busy) return;
    setInput("");
    voice.stopSpeaking();
    voice.resetFirstAudio();
    timing.current = { endedAt, firstText: null, firstAudio: null };
    const userMsg = { id: nextId(), role: "user", text: question, voice: spoken };
    const answerId = nextId();
    setMessages((list) => [...list, userMsg, { id: answerId, role: "assistant", text: "", streaming: true, raw: "" }]);
    setBusy(true);
    controller.current = new AbortController();
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
          signal: controller.current.signal,
          onEvent: (ev) => {
            if (ev.type === "meta") { if (ev.conversationId) setConversationId(ev.conversationId); language = ev.language || "en"; }
            if (ev.type === "delta") {
              if (!timing.current.firstText) timing.current.firstText = performance.now();
              raw += ev.text;
              patch(answerId, () => ({ raw, text: visibleWhileStreaming(raw) }));
              speakNew();
            }
            if (ev.type === "final") {
              patch(answerId, () => ({ streaming: false, text: ev.text, confidence: ev.confidence, sources: ev.used, checks: ev.checks, diagrams: ev.diagrams, timings: ev.timings }));
              // The rest of what was streamed is spoken (the final text has the hidden blocks removed, so it is not re-read).
              if (spoken) speakNew(true);
            }
            if (ev.type === "error") patch(answerId, () => ({ streaming: false, error: ev.message, retry: question }));
          },
        },
      );
      patch(answerId, (m) => (m.streaming ? { streaming: false, error: m.text ? null : "The answer did not arrive. Please try again.", retry: question } : {}));
    } catch (err) {
      if (err.name === "AbortError") patch(answerId, (m) => ({ streaming: false, stopped: true, text: m.text }));
      else patch(answerId, () => ({ streaming: false, error: errorMessage(err, "Could not get an answer"), retry: question }));
    } finally {
      setBusy(false);
      controller.current = null;
      record();
    }
  }

  const stop = () => { controller.current?.abort(); voice.stopSpeaking(); };

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
        {messages.length === 0 && (
          <div className="ea-learn__empty">
            <p><strong>Ask anything from your subjects.</strong> I explain step by step, check calculations, and use your teachers' notes when they cover the topic.</p>
            <p className="ea-learn__muted">Try: "Photosynthesis samjhao", "Solve 2x + 5 = 17", "Explain fractions with an example", or switch on Guided Learning to solve a problem one step at a time.</p>
          </div>
        )}
        {messages.map((m) => (m.role === "user"
          ? <div key={m.id} className="ea-learn__bubble is-user">{m.voice && <Mic size={12} aria-label="Spoken" />} {m.text}</div>
          : (
            <div key={m.id} className="ea-learn__bubble is-ai">
              {m.streaming && !m.text && <span className="ea-learn__muted">Thinking…</span>}
              {m.text && <AnswerView msg={m} idPrefix={m.id} />}
              {m.stopped && <p className="ea-learn__muted">Stopped.</p>}
              {m.error && (
                <div className="ea-alert" role="alert">
                  <span>{m.error}</span>
                  {m.retry && <button type="button" className="ea-btn ea-btn--ghost" onClick={() => send(m.retry)}><RotateCcw size={14} aria-hidden="true" /> Try again</button>}
                </div>
              )}
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
        <div className={`ea-learn__voice-status${voice.error ? " is-error" : ""}`} role="status">
          {listening && <span>Listening… {voice.interim && <em>“{voice.interim}”</em>}</span>}
          {voice.state === "speaking" && <span>Speaking… <button type="button" className="ea-btn ea-btn--ghost" onClick={voice.stopSpeaking}>Stop speaking</button></span>}
          {voice.error && <span>{voice.error} <button type="button" className="ea-btn ea-btn--ghost" onClick={voice.clearError}>OK</button></span>}
        </div>
      )}

      <form className="ea-learn__composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label className="ea-sr-only" htmlFor="ea-learn-input">Your question</label>
        <textarea id="ea-learn-input" ref={inputRef} className="ea-input" rows={2} maxLength={2000} value={input} placeholder="Type your question…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        <div className="ea-learn__composer-actions">
          {voice.supported.listen ? (
            <>
              <select className="ea-select ea-learn__lang" value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} aria-label="Language you will speak">
                {VOICE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <button type="button" className={`ea-btn ${listening ? "ea-btn--primary" : "ea-btn--ghost"}`} aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Ask with your voice"} disabled={busy} onClick={() => (listening ? voice.stopListening() : startVoice())}>
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
            ? <button type="button" className="ea-btn ea-btn--primary" onClick={stop} aria-label="Stop the answer"><Square size={16} aria-hidden="true" /> Stop</button>
            : <button type="submit" className="ea-btn ea-btn--primary" disabled={!input.trim()} aria-label="Send"><Send size={16} aria-hidden="true" /> Send</button>}
        </div>
      </form>
    </section>
  );
}
