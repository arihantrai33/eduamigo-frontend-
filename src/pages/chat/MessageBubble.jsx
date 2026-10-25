import { Check, CheckCheck, Download, FileText } from "lucide-react";
import { bytes, clock } from "./chatApi";

// One message: the words, any photo, voice note or document, the time and (for mine) whether it has been read.
export default function MessageBubble({ m, mine }) {
  const files = [...(m.attachments || [])];
  if (m.fileUrl && !files.length) files.push({ url: m.fileUrl, name: m.fileName || "File", type: m.fileType || "", kind: /^image\//.test(m.fileType || "") ? "image" : "document" }); // messages from before private files
  return (
    <div className={`cs-row${mine ? " is-mine" : ""}`}>
      <div className={`cs-bubble${mine ? " is-mine" : ""}`}>
        {files.map((f) => (
          f.kind === "image" ? <a key={f.url} className="cs-photo" href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.name} loading="lazy" /></a>
            : f.kind === "audio" ? <audio key={f.url} className="cs-audio" controls preload="none" src={f.url} aria-label="Voice message" />
              : (
                <a key={f.url} className="cs-file" href={f.url} target="_blank" rel="noreferrer" download={f.name}>
                  <span className="cs-file__icon"><FileText size={20} /></span>
                  <span className="cs-file__text"><b>{f.name}</b><small>{f.size ? bytes(f.size) : "Open"}</small></span><Download size={16} aria-hidden="true" />
                </a>
              )
        ))}
        {m.text && <p className="cs-text">{m.text}</p>}
        <span className="cs-meta">{clock(m.createdAt)}{mine && (m.read ? <CheckCheck size={14} className="is-read" aria-label="Read" /> : <Check size={14} aria-label="Sent" />)}</span>
      </div>
    </div>
  );
}
