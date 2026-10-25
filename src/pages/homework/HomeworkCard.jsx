import { Check, Download, FileText, Image as ImageIcon, Mic, Paperclip, Undo2 } from "lucide-react";
import { dueLabel } from "./homeworkApi";

const KIND_ICON = { image: ImageIcon, audio: Mic, pdf: FileText, document: FileText };

// One homework: subject, title, the teacher's words, files, when it is due and (for a student) a button to say it is done.
export function Attachments({ list }) {
  if (!list?.length) return null;
  return (
    <ul className="hw-files" aria-label="Attachments">
      {list.map((a) => {
        const Icon = KIND_ICON[a.kind] || Paperclip;
        return (
          <li key={a.url}>
            <a href={a.url} target="_blank" rel="noreferrer"><Icon size={15} aria-hidden="true" /><span>{a.name}</span><Download size={14} aria-hidden="true" /></a>
          </li>
        );
      })}
    </ul>
  );
}

export default function HomeworkCard({ hw, onToggle, busy, readOnly = false, children }) {
  const due = dueLabel(hw.dueDate, hw.done);
  return (
    <article className={`hw-card${hw.done ? " is-done" : ""}${hw.overdue ? " is-overdue" : ""}`}>
      <div className="hw-card__top">
        <span className="hw-subject">{hw.subject}</span>
        <span className={`hw-due hw-due--${due.tone}`}>{due.text}</span>
      </div>
      <h3 className="hw-title">{hw.title}</h3>
      {hw.description && <p className="hw-desc">{hw.description}</p>}
      <Attachments list={hw.attachments} />
      <div className="hw-card__foot">
        <span className="hw-by">{hw.teacherName ? `Given by ${hw.teacherName}` : "From your school"}{hw.audience === "students" ? " · only for some students" : ""}</span>
        {children}
        {!readOnly && onToggle && (
          <button type="button" className={`hw-done${hw.done ? " is-on" : ""}`} onClick={() => onToggle(hw)} disabled={busy} aria-pressed={!!hw.done}>
            {hw.done ? <><Undo2 size={15} aria-hidden="true" />Marked done</> : <><Check size={15} aria-hidden="true" />Mark as done</>}
          </button>
        )}
        {readOnly && <span className={`hw-state${hw.done ? " is-done" : ""}`}>{hw.done ? "Done" : "Not done yet"}</span>}
      </div>
    </article>
  );
}
