import { useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Mic, Paperclip, Send, Square, Trash2, X } from "lucide-react";
import { toast } from "../../utils/toast";
import { bytes } from "./chatApi";

const MAX = 10 * 1024 * 1024;
const PHOTO = "image/jpeg,image/png,image/webp";
const FILES = "application/pdf,.docx,.xlsx,.pptx,.txt";

// The message box: text, photos, files and voice notes (recorded here, sent as a file). Calls onSend(text, files).
export default function Composer({ onSend, disabled, placeholder, label = "Message" }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [menu, setMenu] = useState(false);
  const [rec, setRec] = useState(null); // { seconds }
  const [busy, setBusy] = useState(false);
  const photoRef = useRef(null);
  const fileRef = useRef(null);
  const area = useRef(null);
  const media = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(0);
  const cancelled = useRef(false);

  useEffect(() => () => { clearInterval(timer.current); try { media.current?.stream?.getTracks().forEach((t) => t.stop()); } catch { /* already stopped */ } }, []);
  useEffect(() => { const a = area.current; if (a) { a.style.height = "auto"; a.style.height = `${Math.min(a.scrollHeight, 140)}px`; } }, [text]);

  const add = (list) => {
    const ok = [];
    for (const f of [...list]) {
      if (f.size > MAX) { toast.error(`${f.name} is bigger than 10 MB.`); continue; }
      ok.push(f);
    }
    setFiles((cur) => [...cur, ...ok].slice(0, 2));
    setMenu(false);
  };

  const send = async (override) => {
    const list = override || files;
    const body = text.trim();
    if (busy || disabled || (!body && !list.length)) return;
    setBusy(true);
    try { await onSend(body, list); setText(""); setFiles([]); } catch { /* the page shows the error; what was typed stays */ } finally { setBusy(false); }
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return toast.error("Voice messages are not supported in this browser.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks.current = []; cancelled.current = false;
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timer.current); setRec(null);
        if (cancelled.current || !chunks.current.length) return;
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        const ext = /mp4/.test(blob.type) ? "m4a" : "webm";
        send([new File([blob], `voice-message-${Date.now()}.${ext}`, { type: blob.type })]);
      };
      media.current = r; r.start();
      setRec({ seconds: 0 });
      timer.current = setInterval(() => setRec((s) => (s ? { seconds: s.seconds + 1 } : s)), 1000);
    } catch { toast.error("Allow the microphone to send a voice message."); }
  };
  const stop = (cancel) => { cancelled.current = !!cancel; try { media.current?.stop(); } catch { /* not recording */ } };

  if (rec) {
    return (
      <div className="cs-composer cs-composer--rec" role="status" aria-live="polite">
        <button type="button" className="cs-iconbtn" onClick={() => stop(true)} aria-label="Cancel recording"><Trash2 size={19} /></button>
        <span className="cs-rec"><i aria-hidden="true" />Recording {String(Math.floor(rec.seconds / 60)).padStart(1, "0")}:{String(rec.seconds % 60).padStart(2, "0")}</span>
        <button type="button" className="cs-send" onClick={() => stop(false)} aria-label="Stop and send voice message"><Square size={16} fill="currentColor" /></button>
      </div>
    );
  }
  return (
    <div className="cs-composer">
      {files.length > 0 && (
        <ul className="cs-chips" aria-label="Files to send">
          {files.map((f, i) => (
            <li key={f.name + i}>{f.type.startsWith("image/") ? <ImageIcon size={14} /> : <FileText size={14} />}<span>{f.name}</span><small>{bytes(f.size)}</small>
              <button type="button" onClick={() => setFiles((c) => c.filter((_, k) => k !== i))} aria-label={`Remove ${f.name}`}><X size={13} /></button></li>
          ))}
        </ul>
      )}
      <div className="cs-composer__row">
        <div className="cs-attach">
          <button type="button" className="cs-iconbtn" onClick={() => setMenu((m) => !m)} aria-label="Attach a photo or file" aria-expanded={menu} disabled={disabled}><Paperclip size={20} /></button>
          {menu && (
            <div className="cs-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => photoRef.current?.click()}><ImageIcon size={18} />Photo</button>
              <button type="button" role="menuitem" onClick={() => fileRef.current?.click()}><FileText size={18} />Document</button>
            </div>
          )}
          <input ref={photoRef} type="file" accept={PHOTO} multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          <input ref={fileRef} type="file" accept={FILES} multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </div>
        <textarea ref={area} className="cs-input" rows={1} value={text} placeholder={placeholder || "Type a message"} disabled={disabled} aria-label={label}
          onChange={(e) => setText(e.target.value)} maxLength={4000}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        {text.trim() || files.length
          ? <button type="button" className="cs-send" onClick={() => send()} disabled={busy || disabled} aria-label="Send message"><Send size={18} /></button>
          : <button type="button" className="cs-send cs-send--mic" onClick={start} disabled={disabled} aria-label="Record a voice message"><Mic size={19} /></button>}
      </div>
    </div>
  );
}
