import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'
import { useTheme } from '../../context/ThemeContext';

import Glyph from "../../components/Glyph";
const API = import.meta.env.VITE_API_URL;

const TYPING_CHARS_PER_TICK = 2;
const TYPING_TICK_MS = 22;

export default function Revise() {
  const navigate = useNavigate();
  const { darkMode: dm } = useTheme();
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'ai', text: "Hi! I'm your revision assistant. Ask me about any topic from your class notes, or switch to **Quiz me** to test yourself." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Thinking');
  const [mode, setMode] = useState('explain');

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const loadingLabelTimeoutRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (loadingLabelTimeoutRef.current) clearTimeout(loadingLabelTimeoutRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const focusInput = () => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const startTypewriter = (messageId, fullTextRef, doneRef) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === messageId);
        if (idx === -1) return prev;

        const msg = prev[idx];
        const shown = msg.text.length;
        const total = fullTextRef.current.length;

        if (shown >= total) {
          if (doneRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
            setStreaming(false);
            focusInput();
          }
          return prev;
        }

        const next = fullTextRef.current.slice(0, Math.min(total, shown + TYPING_CHARS_PER_TICK));
        const updated = [...prev];
        updated[idx] = { ...msg, text: next };
        return updated;
      });
    }, TYPING_TICK_MS);
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading || streaming) return;

    // The welcome message and error notices are UI only; they are not sent as conversation history.
    const history = messages
      .filter(m => m.id !== 'welcome' && !m.isError)
      .slice(-8)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

    setMessages(prev => [...prev, { id: Date.now() + '-user', role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    setLoadingLabel('Thinking');
    focusInput();

    loadingLabelTimeoutRef.current = setTimeout(() => {
      setLoadingLabel('Checking your notes');
    }, 3500);

    let aiMessageStarted = false;
    let aiMessageId = null;
    const fullTextRef = { current: '' };
    const doneRef = { current: false };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API}/revision/ask`, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ question, history, mode }),
      });

      if (!response.ok || !response.body) {
        let message = 'Sorry, something went wrong. Please try again.';
        try { message = (await response.json()).message || message; } catch { /* non-JSON error body */ }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sourcesParsed = false;
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        if (!sourcesParsed) {
          const newlineIndex = buffer.indexOf('\n');
          if (newlineIndex === -1) continue;
          const firstLine = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          try {
            sources = JSON.parse(firstLine).sources || [];
          } catch {
            sources = [];
          }
          sourcesParsed = true;
        }

        if (buffer) {
          const textChunk = buffer;
          buffer = '';
          fullTextRef.current += textChunk;

          if (!aiMessageStarted) {
            aiMessageStarted = true;
            aiMessageId = Date.now() + '-ai';
            clearTimeout(loadingLabelTimeoutRef.current);
            setLoading(false);
            setStreaming(true);
            setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', text: '', sources }]);
            startTypewriter(aiMessageId, fullTextRef, doneRef);
          }
        }
      }

      doneRef.current = true;

      if (!aiMessageStarted) {
        clearTimeout(loadingLabelTimeoutRef.current);
        setLoading(false);
        setMessages(prev => [...prev, { id: Date.now() + '-ai-empty', role: 'ai', isError: true, text: "Sorry, I couldn't generate a response. Please try again.", sources: [] }]);
        focusInput();
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      clearTimeout(loadingLabelTimeoutRef.current);
      doneRef.current = true;
      setLoading(false);
      if (!aiMessageStarted) {
        setMessages(prev => [...prev, { id: Date.now() + '-ai-error', role: 'ai', isError: true, text: err.message || "Sorry, something went wrong. Please try again.", sources: [] }]);
      }
      setStreaming(false);
      focusInput();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBusy = loading || streaming;

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: dm ? '#0b1220' : '#F4F5FA', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{`
  .typing-dot { width: 7px; height: 7px; border-radius: 50%; background: ${dm ? '#64748b' : '#b0b0c0'}; animation: bounce 1.2s infinite ease-in-out; }
  @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }
  .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-size: 15px; font-weight: 700; margin: 10px 0 4px; color: inherit; }
  .markdown-body p { margin: 0 0 8px; line-height: 1.5; }
  .markdown-body ul, .markdown-body ol { margin: 4px 0 8px; padding-left: 18px; }
  .markdown-body li { margin-bottom: 4px; line-height: 1.5; }
  .markdown-body strong { font-weight: 700; }
  .markdown-body hr { border: none; border-top: 1px solid ${dm ? '#334155' : '#eee'}; margin: 10px 0; }
  .markdown-body > *:last-child { margin-bottom: 0; }
  .revise-textarea::placeholder { color: ${dm ? '#64748b' : '#9AA0B4'}; }
  .revise-send-btn:not(:disabled):hover { transform: scale(1.05); }
  .revise-send-btn:not(:disabled):active { transform: scale(0.95); }
`}</style>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '48px 20px 16px',
        background: 'linear-gradient(135deg, var(--brand-deep), var(--brand-dark) 55%, var(--brand))',
        boxShadow: '0 4px 14px rgba(46, 16, 101, 0.25)',
      }}>
        <button type="button" aria-label="Back" style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => navigate('/student/notes')}><Glyph e="←" /></button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span><Glyph e="🤖" /></span> Revise with AI
        </h1>
        <div style={{ width: 32 }} />
      </div>

      <div role="tablist" aria-label="Revision mode" style={{ display: 'flex', gap: 8, padding: '12px 16px 0', justifyContent: 'center' }}>
        {[{ id: 'explain', label: 'Explain' }, { id: 'quiz', label: 'Quiz me' }].map(m => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            disabled={isBusy}
            onClick={() => setMode(m.id)}
            style={{ padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: isBusy ? 'default' : 'pointer', border: mode === m.id ? 'none' : `1px solid ${dm ? '#293449' : '#E2E4EE'}`, background: mode === m.id ? 'var(--brand-gradient)' : (dm ? '#141b2e' : '#fff'), color: mode === m.id ? '#fff' : (dm ? '#cbd5e1' : '#4B5563') }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--brand-gradient)' : (dm ? '#141b2e' : '#fff'),
              color: m.role === 'user' ? '#fff' : (dm ? '#e2e8f0' : '#1A1A2E'),
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              fontSize: 14,
              lineHeight: 1.6,
              wordBreak: 'break-word',
              border: m.role === 'ai' ? `1px solid ${dm ? '#1f2a44' : '#EEF0F7'}` : 'none',
              boxShadow: m.role === 'ai' ? '0 2px 10px rgba(20, 20, 43, 0.06)' : '0 2px 10px color-mix(in srgb, var(--brand) 18%, transparent)',
            }}>
              <div className="markdown-body"><ReactMarkdown>{m.text}</ReactMarkdown></div>
            </div>
            {m.role === 'ai' && m.sources && m.sources.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {m.sources.map((s, j) => (
                  <span key={j} style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-dark)', background: dm ? '#1e2a4a' : '#EEF0FF', padding: '4px 10px', borderRadius: 12 }}>
                    <Glyph e="📄" /> {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: dm ? '#141b2e' : '#fff', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', fontSize: 13, color: dm ? '#94a3b8' : '#888', boxShadow: '0 2px 10px rgba(20,20,43,0.06)', border: `1px solid ${dm ? '#1f2a44' : '#EEF0F7'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{loadingLabel}</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 10 }}>
              <span className="typing-dot" style={{ animationDelay: '0s' }}></span>
              <span className="typing-dot" style={{ animationDelay: '0.15s' }}></span>
              <span className="typing-dot" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: dm ? '#101a2e' : '#fff', borderTop: `1px solid ${dm ? '#1f2a44' : '#F0F0F0'}`, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'flex-end', zIndex: 100 }}>
        <textarea
          ref={textareaRef}
          className="revise-textarea"
          rows={1}
          style={{ flex: 1, resize: 'none', border: `1.5px solid ${dm ? '#293449' : '#E8E8F0'}`, borderRadius: 20, padding: '10px 16px', fontSize: 14, fontFamily: 'inherit', background: dm ? '#0f172a' : '#F8F8FF', color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', maxHeight: 100 }}
          placeholder={mode === 'quiz' ? 'Name a topic, or type your answer...' : 'Ask about your notes...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          aria-label="Send question"
          className="revise-send-btn"
          style={{ background: 'var(--brand-gradient)', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 18, color: '#fff', cursor: 'pointer', flexShrink: 0, opacity: isBusy || !input.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s ease' }}
          onClick={handleSend}
          disabled={isBusy || !input.trim()}
        >
          <Glyph e="➤" />
        </button>
      </div>
    </div>
  );
}