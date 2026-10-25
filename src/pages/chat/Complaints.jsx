import { useCallback, useEffect, useState } from "react";
import { Plus, ShieldAlert } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { getSelectedChildId } from "../../utils/selectedChild";
import { toast, errorMessage } from "../../utils/toast";
import { complaintsForStaff, complaintsOfChild, raiseComplaint, replyComplaint, setComplaintStatus } from "./chatApi";

const CATEGORIES = ["Behaviour", "Studies", "Attendance", "Fees", "Other"];
const STATUS = { open: ["Open", "warn"], acknowledged: ["Parent replied", "info"], resolved: ["Resolved", "ok"] };
const when = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Concerns the school raises with a student's parents. A parent sees them for the selected child and can reply; staff raise them
// (a teacher for their own students, the office for anyone), follow the replies and close them.
export default function Complaints({ role, contacts }) {
  const parent = role === "parent";
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [round, setRound] = useState(0);
  const [form, setForm] = useState(false);
  const reload = useCallback(() => setRound((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    (parent ? complaintsOfChild(getSelectedChildId() || undefined) : complaintsForStaff())
      .then((r) => { if (alive) { setList(r.data); setError(""); } })
      .catch((e) => { if (alive) { setError(errorMessage(e, "Could not load concerns")); setList([]); } });
    return () => { alive = false; };
  }, [parent, round]);

  const students = contacts.filter((c) => c.role === "student");
  return (
    <div className="cs-pad">
      <header className="cs-pane-head">
        <div><h2>{parent ? "Concerns from the school" : "Concerns raised"}</h2><p>{parent ? "What the school has shared about your child." : "Concerns you have raised with parents."}</p></div>
        {!parent && <button type="button" className="ea-btn ea-btn--primary" onClick={() => setForm((f) => !f)}><Plus size={16} aria-hidden="true" />Raise a concern</button>}
      </header>
      {form && <RaiseForm students={students} onDone={() => { setForm(false); reload(); }} />}
      {list === null && <Skeleton rows={3} label="Loading concerns" />}
      {error && <p className="cs-error" role="alert">{error}</p>}
      {list && !list.length && !error && <EmptyState icon={ShieldAlert} title={parent ? "No concerns" : "Nothing raised yet"} text={parent ? "The school has not raised anything about your child." : "Use “Raise a concern” when a parent needs to know something."} />}
      <div className="cs-cards">{(list || []).map((c) => <ConcernCard key={c._id} c={c} parent={parent} onChange={reload} />)}</div>
    </div>
  );
}

function ConcernCard({ c, parent, onChange }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [label, tone] = STATUS[c.status] || STATUS.open;
  const act = async (fn, ok) => { setBusy(true); try { await fn(); if (ok) toast.success(ok); setText(""); onChange(); } catch (e) { toast.error(errorMessage(e, "Could not save")); } finally { setBusy(false); } };
  return (
    <article className="cs-card cs-concern">
      <div className="cs-concern__top"><span className="cs-cat">{c.category}</span><span className={`cs-status cs-status--${tone}`}>{label}</span></div>
      <h3>{c.subject}</h3>
      {c.student && !parent && <p className="cs-sub">{c.student.name} · Class {c.student.class}-{c.student.section}</p>}
      {c.details && <p className="cs-details">{c.details}</p>}
      <p className="cs-sub">Raised by {c.raisedBy || "the school"} · {when(c.createdAt)}</p>
      {c.responses.length > 0 && (
        <ul className="cs-thread">{c.responses.map((r, i) => <li key={i} className={r.role === "parent" ? "is-parent" : ""}><b>{r.byName}</b><span>{r.text}</span><small>{when(r.at)}</small></li>)}</ul>
      )}
      {c.status !== "resolved" && (
        <form className="cs-reply" onSubmit={(e) => { e.preventDefault(); if (text.trim()) act(() => replyComplaint(c._id, text.trim()), "Reply sent."); }}>
          <input className="ea-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" aria-label="Reply" maxLength={2000} />
          <button type="submit" className="ea-btn ea-btn--primary" disabled={busy || !text.trim()}>Reply</button>
        </form>
      )}
      {!parent && (
        <div className="cs-actions">
          {c.status !== "resolved"
            ? <button type="button" className="ea-btn ea-btn--ghost" disabled={busy} onClick={() => act(() => setComplaintStatus(c._id, "resolved"), "Marked resolved.")}>Mark resolved</button>
            : <button type="button" className="ea-btn ea-btn--ghost" disabled={busy} onClick={() => act(() => setComplaintStatus(c._id, "open"))}>Reopen</button>}
        </div>
      )}
    </article>
  );
}

function RaiseForm({ students, onDone }) {
  const [f, setF] = useState({ studentId: "", category: "Behaviour", subject: "", details: "" });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const matches = students.filter((s) => !q.trim() || `${s.name} ${s.subtitle || ""}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  const submit = async (e) => {
    e.preventDefault(); setProblem("");
    if (!f.studentId) return setProblem("Choose the student.");
    if (!f.subject.trim()) return setProblem("Write what it is about.");
    setBusy(true);
    try { await raiseComplaint(f); toast.success("Sent to the parents."); onDone(); } catch (err) { setProblem(errorMessage(err, "Could not send it")); } finally { setBusy(false); }
  };
  const chosen = students.find((s) => s.studentId === f.studentId);
  return (
    <form className="cs-card cs-form" onSubmit={submit} noValidate>
      <label className="ea-field"><span className="ea-label">Student</span>
        {chosen ? <div className="cs-picked">{chosen.name} <small>{chosen.subtitle}</small><button type="button" onClick={() => setF((x) => ({ ...x, studentId: "" }))}>Change</button></div> : (
          <>
            <input className="ea-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a student" />
            <div className="cs-pick">{matches.map((s) => <button key={s.studentId} type="button" onClick={() => setF((x) => ({ ...x, studentId: s.studentId }))}>{s.name}<small>{s.subtitle}</small></button>)}</div>
          </>
        )}</label>
      <div className="cs-form__row">
        <label className="ea-field"><span className="ea-label">Type</span><select className="ea-select" value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="ea-field"><span className="ea-label">About</span><input className="ea-input" value={f.subject} onChange={set("subject")} maxLength={200} placeholder="e.g. Talking in class" /></label>
      </div>
      <label className="ea-field"><span className="ea-label">Details (optional)</span><textarea className="ea-input" rows={3} value={f.details} onChange={set("details")} maxLength={4000} /></label>
      {problem && <p className="cs-error" role="alert">{problem}</p>}
      <button type="submit" className="ea-btn ea-btn--primary" disabled={busy}>{busy ? "Sending…" : "Send to parents"}</button>
    </form>
  );
}
