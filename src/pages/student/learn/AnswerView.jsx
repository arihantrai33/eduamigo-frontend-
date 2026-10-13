import ReactMarkdown from "react-markdown";
import { BookOpen, CheckCircle2, AlertTriangle } from "lucide-react";
import Diagram from "./Diagram";
import Reliability from "./Reliability";

// One tutor answer: Markdown text (raw HTML is never rendered), [S1] citations as chips that point to the sources list,
// diagrams where the tutor placed them, the reliability note and the calculation checks. Links the model may write are
// shown as text, not followed: only the app's own source references are links.

function Markdown({ text, idPrefix }) {
  // [S1] -> a link to this answer's source list.
  const withRefs = String(text).replace(/\[S(\d{1,2})\](?!\()/g, (m, n) => `[S${n}](#${idPrefix}-S${n})`);
  return (
    <ReactMarkdown
      skipHtml
      components={{
        a: ({ href, children }) => (String(href || "").startsWith(`#${idPrefix}-`)
          ? <a href={href} className="ea-learn__cite" aria-label={`Source ${String(children)}`}>{children}</a>
          : <span>{children}</span>),
        img: () => null,
      }}
    >
      {withRefs}
    </ReactMarkdown>
  );
}

export default function AnswerView({ msg, idPrefix }) {
  const parts = String(msg.text || "").split(/\[\[diagram:(\d+)\]\]/);
  const passed = (msg.checks || []).filter((c) => c.status === "passed");
  const failed = (msg.checks || []).filter((c) => c.status === "failed");
  const sources = msg.sources || [];
  return (
    <div className="ea-learn__answer">
      {parts.map((p, i) => (i % 2 === 1
        ? <Diagram key={i} d={msg.diagrams?.[Number(p)]} />
        : p.trim() && <Markdown key={i} text={p} idPrefix={idPrefix} />))}
      {failed.map((c, i) => <p key={`f${i}`} className="ea-learn__check is-failed"><AlertTriangle size={14} aria-hidden="true" /> Check failed: {c.detail}</p>)}
      {passed.length > 0 && <p className="ea-learn__check"><CheckCircle2 size={14} aria-hidden="true" /> Checked: {passed.map((c) => c.detail).join("; ")}</p>}
      <Reliability value={msg.confidence} />
      {sources.length > 0 && (
        <details className="ea-learn__sources">
          <summary><BookOpen size={14} aria-hidden="true" /> From your school material ({sources.length})</summary>
          <ul>
            {sources.map((s) => (
              <li key={s.ref} id={`${idPrefix}-${s.ref}`}>
                <span className="ea-learn__cite">{s.ref}</span> {s.title}
                <span className="ea-learn__muted"> · {s.type}, {s.subject}, part {s.part}</span>
              </li>
            ))}
          </ul>
          <p className="ea-learn__muted">Open it under Notes & Assignments. Page numbers are not available for uploaded notes.</p>
        </details>
      )}
    </div>
  );
}
