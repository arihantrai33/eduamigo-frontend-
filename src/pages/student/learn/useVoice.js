import { useCallback, useEffect, useRef, useState } from "react";
import { speakable } from "./speakable";

// Voice Learning with the browser's own speech services (no extra provider or cost):
//   listening  SpeechRecognition (Chrome and Edge send the audio to their speech service; Safari uses Apple's)
//   speaking   speechSynthesis (voices installed on the device)
// Nothing is sent when nothing was recognised. Errors are said plainly, and typing always works.
// States: idle | listening | speaking | error. Interim words are shown while listening.

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

export const VOICE_LANGS = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "हिन्दी" },
];

const ERRORS = {
  "not-allowed": "Microphone permission is off. Allow the microphone for this site in your browser settings, or type your question.",
  "service-not-allowed": "Speech recognition is blocked in this browser. Please type your question.",
  "no-speech": "I did not hear anything. Tap the microphone and speak, or type your question.",
  "audio-capture": "No microphone was found. Please type your question.",
  network: "The speech service could not be reached. Check your connection, or type your question.",
  "language-not-supported": "This language is not supported for speech here. Choose English or type your question.",
};

const HINDI_TEXT = /[ऀ-ॿ]/;
const wantsHindi = (language, text) => language === "hi" || language === "hinglish" || HINDI_TEXT.test(text || "");

// The best voice installed on this device for the language: Hindi (and Hinglish) answers use a Hindi voice, because an English
// voice reading Hindi words is what gives the "foreign accent". Natural, neural, premium and Google voices rank above the
// basic ones; robotic novelty voices are never chosen.
const BAD = /compact|eloquence|novelty|whisper|zarvox|trinoids|albert|bubbles|cellos|boing|bells|bahh|deranged|hysterical|organ|superstar|wobble|jester|junior|fred|ralph/i;
function voiceScore(v, want) {
  const lang = String(v.lang || "").replace("_", "-").toLowerCase();
  const order = want.map((w) => w.toLowerCase());
  const i = order.findIndex((w) => lang === w || lang.startsWith(`${w}-`) || (w.length === 2 && lang.startsWith(w)));
  if (i < 0 || BAD.test(v.name || "")) return -1;
  let score = 1000 - i * 100;
  if (/neural|natural|online/i.test(v.name)) score += 60;
  if (/premium|enhanced/i.test(v.name)) score += 45;
  if (/siri/i.test(v.name)) score += 40;
  if (/google/i.test(v.name)) score += 35;
  if (v.localService) score += 5;
  return score;
}
export function pickVoice(language, text = "") {
  const voices = synth?.getVoices?.() || [];
  const want = wantsHindi(language, text) ? ["hi-IN", "hi"] : ["en-IN", "en-GB", "en-AU", "en-US", "en"];
  let best = null; let top = -1;
  for (const v of voices) { const sc = voiceScore(v, want); if (sc > top) { top = sc; best = v; } }
  return best;
}

export function useVoice() {
  const [state, setState] = useState("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [noHindiVoice, setNoHindiVoice] = useState(false);
  const recRef = useRef(null);
  const pending = useRef(0); // utterances queued or playing
  const firstAudio = useRef(null);
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const stopSpeaking = useCallback(() => {
    pending.current = 0;
    try { synth?.cancel(); } catch { /* nothing to stop */ }
    setState((s) => (s === "speaking" ? "idle" : s));
  }, []);

  const stopListening = useCallback(() => {
    try { recRef.current?.abort(); } catch { /* already stopped */ }
    recRef.current = null;
    setInterim("");
    setState((s) => (s === "listening" ? "idle" : s));
  }, []);

  // listen({ lang, onFinal(text, { endedAt }) }): one utterance. Speaking is interrupted first.
  const listen = useCallback(({ lang = "en-IN", onFinal }) => {
    if (!SR) { setError("Voice input is not supported in this browser. Please type your question."); setState("error"); return; }
    stopSpeaking();
    setError(null);
    setInterim("");
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    let failed = false;
    let endedAt = null;
    rec.onstart = () => setState("listening");
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const t = e.results[i][0]?.transcript || "";
        if (e.results[i].isFinal) finalText += t; else live += t;
      }
      setInterim((finalText + live).trim());
    };
    rec.onspeechend = () => { endedAt = performance.now(); };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      failed = true;
      setError(ERRORS[e.error] || "Speech could not be recognised. Please try again or type your question.");
      setState("error");
    };
    rec.onend = () => {
      recRef.current = null;
      setInterim("");
      if (failed) return;
      const text = finalText.trim();
      if (!text) { setError(ERRORS["no-speech"]); setState("error"); return; }
      setState("idle");
      onFinal?.(text, { endedAt: endedAt ?? performance.now() });
    };
    recRef.current = rec;
    try { rec.start(); } catch { setError("The microphone could not be started. Please try again."); setState("error"); }
  }, [stopSpeaking]);

  // Queues one piece of the answer to be spoken. Resolves the first-audio time through onFirstAudio.
  const say = useCallback((text, language, onFirstAudio) => {
    if (!synth || mutedRef.current) return;
    const words = speakable(text, language);
    if (!words) return;
    const hindi = wantsHindi(language, words);
    const u = new SpeechSynthesisUtterance(words);
    const v = pickVoice(language, words);
    if (v) u.voice = v;
    u.lang = v?.lang || (hindi ? "hi-IN" : "en-IN");
    // A little slower than the default and steady, so a student can follow an explanation.
    u.rate = hindi ? 0.92 : 0.97;
    u.pitch = 1;
    if (hindi && !v) setNoHindiVoice(true);
    pending.current += 1;
    u.onstart = () => {
      setState("speaking");
      if (!firstAudio.current) { firstAudio.current = performance.now(); onFirstAudio?.(firstAudio.current); }
    };
    const done = () => { pending.current = Math.max(0, pending.current - 1); if (!pending.current) setState((s) => (s === "speaking" ? "idle" : s)); };
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  }, []);

  const resetFirstAudio = useCallback(() => { firstAudio.current = null; }, []);

  // Chrome fills the voice list after the page loads; asking for it early makes the later pick see all voices.
  useEffect(() => {
    try { synth?.getVoices?.(); synth?.addEventListener?.("voiceschanged", () => synth.getVoices()); } catch { /* no voices */ }
  }, []);

  useEffect(() => () => { try { recRef.current?.abort(); synth?.cancel(); } catch { /* leaving */ } }, []);

  return {
    supported: { listen: !!SR, speak: !!synth },
    state, interim, error, muted, noHindiVoice,
    setMuted: (m) => { setMuted(m); if (m) stopSpeaking(); },
    listen, stopListening, say, stopSpeaking, resetFirstAudio,
    clearError: () => { setError(null); setState((s) => (s === "error" ? "idle" : s)); },
  };
}
