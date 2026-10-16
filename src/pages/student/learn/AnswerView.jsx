import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => <div className="ea-learn__table"><table>{children}</table></div>,
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

// Text that arrives in bursts is shown at a steady typing pace (like a chat assistant): the shown length catches up with the
// received text a little faster when it has fallen far behind. Not used for answers that were already complete (history).
const PARTIAL_TAIL = /\[{1,2}(?:d(?:i(?:a(?:g(?:r(?:a(?:m(?::\d*(?:\]\]?)?)?)?)?)?)?)?)?|S\d*\]?)?$/;
function useTypedText(target, active, onGrow) {
  const full = String(target || "");
  const [n, setN] = useState(active ? 0 : full.length);
  const grow = useRef(onGrow);
  useEffect(() => { grow.current = onGrow; }, [onGrow]);
  useEffect(() => {
    if (!active || n >= full.length) return undefined;
    const id = requestAnimationFrame(() => {
      const left = full.length - n;
      setN(Math.min(full.length, n + Math.min(8, Math.max(1, Math.ceil(left / 28)))));
    });
    return () => cancelAnimationFrame(id);
  }, [active, n, full.length]);
  useEffect(() => { grow.current?.(); }, [n]);
  if (!active || n >= full.length) return { text: full, done: true };
  return { text: full.slice(0, n).replace(PARTIAL_TAIL, ""), done: false };
}

export default function AnswerView({ msg, idPrefix, onGrow }) {
  const typed = useTypedText(msg.text, !!msg.live && !msg.stopped, onGrow);
  const parts = typed.text.split(/\[\[diagram:(\d+)\]\]/);
  const passed = (msg.checks || []).filter((c) => c.status === "passed");
  const failed = (msg.checks || []).filter((c) => c.status === "failed");
  const sources = msg.sources || [];
  // Drawings go beside the explanation; a table stays where it was placed in the text.
  const figures = [];
  const body = parts.map((p, i) => {
    if (i % 2 === 0) return p.trim() && <Markdown key={i} text={p} idPrefix={idPrefix} />;
    const d = msg.diagrams?.[Number(p)];
    if (!d) return null;
    if (d.type === "table") return <Diagram key={i} d={d} />;
    figures.push(<Diagram key={i} d={d} />);
    return null;
  });
  const side = figures.length > 0;
  return (
    <div className="ea-learn__answer">
      <div className={`ea-learn__answer-grid${side ? " has-figure" : ""}`}>
        <div className="ea-learn__answer-text">{body}</div>
        {side && <div className="ea-learn__answer-figs">{figures}</div>}
      </div>
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
