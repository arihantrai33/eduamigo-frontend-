import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle, CalendarDays } from "lucide-react";
import { learningApi } from "./api";
import { toast, errorMessage, confirmAction } from "../../../utils/toast";
import { todayLocal } from "../../../utils/dates";

// Revision Planner: a day-by-day plan from an exam date (from the school's exam schedule, or one the student enters),
// the topics to revise and the time available. The plan is made by fixed rules, not by the AI, and anything that does not
// fit is listed, never dropped silently.

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmt = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function Planner({ context }) {
  const [plan, setPlan] = useState(undefined); // undefined = loading, null = none
  const [weak, setWeak] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ source: "school", examId: "", examDate: "", examName: "", minutesPerDay: 60, restDays: [0], topics: [{ subject: "", topic: "" }] });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    learningApi.get("/plan").then(setPlan).catch(() => setPlan(null));
    learningApi.get("/progress").then((p) => setWeak(p.weak || [])).catch(() => setWeak([]));
  }, []);
  // Without exams in the school's schedule, the student enters the date.
  const source = context?.exams?.length ? form.source : "own";

  const setTopic = (i, key, value) => setForm((f) => ({ ...f, topics: f.topics.map((t, j) => (j === i ? { ...t, [key]: value } : t)) }));
  const addWeak = () => setForm((f) => ({ ...f, topics: [...f.topics.filter((t) => t.subject || t.topic), ...weak.map((w) => ({ subject: w.subject, topic: w.topic }))] }));

  async function create(e) {
    e.preventDefault();
    const topics = form.topics.filter((t) => t.subject.trim() && t.topic.trim());
    if (!topics.length) return toast.error("Add at least one topic with its subject");
    if (source === "school" && !form.examId) return toast.error("Choose an exam from your school's schedule");
    if (source === "own" && !form.examDate) return toast.error("Enter your exam date");
    setBusy(true);
    try {
      const body = { topics, minutesPerDay: Number(form.minutesPerDay), restDays: form.restDays, ...(source === "school" ? { examId: form.examId } : { examDate: form.examDate, examName: form.examName }) };
      setPlan(await learningApi.post("/plan", body));
      setEditing(false);
      toast.success("Revision plan ready");
    } catch (err) { toast.error(errorMessage(err, "Could not make the plan")); }
    setBusy(false);
  }
  async function mark(item) {
    try { setPlan(await learningApi.patch(`/plan/${plan._id}/items/${item.id}`, { done: !item.done })); } catch (err) { toast.error(errorMessage(err, "Could not update the plan")); }
  }
  async function remove() {
    if (!(await confirmAction("Delete this revision plan?", { confirmLabel: "Delete" }))) return;
    try { await learningApi.del(`/plan/${plan._id}`); setPlan(null); toast.success("Plan deleted"); } catch (err) { toast.error(errorMessage(err, "Could not delete the plan")); }
  }

  if (plan === undefined) return <p className="ea-learn__muted" role="status">Loading…</p>;

  if (plan && !editing) {
    const byDay = plan.items.reduce((m, i) => { (m[i.date] = m[i.date] || []).push(i); return m; }, {});
    const today = todayLocal();
    return (
      <section className="ea-learn__planner" aria-label="Revision plan">
        <div className="ea-learn__toolbar">
          <div>
            <strong>{plan.title}</strong>
            <span className="ea-learn__muted"> · exam {fmt(plan.examDate)} ({plan.examSource === "school" ? "from your school's exam schedule" : "the date you entered"}) · {plan.done} of {plan.total} done</span>
          </div>
          <span className="ea-learn__spacer" />
          <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setEditing(true)}><Plus size={15} aria-hidden="true" /> New plan</button>
          <button type="button" className="ea-btn ea-btn--ghost" aria-label="Delete this plan" onClick={remove}><Trash2 size={15} aria-hidden="true" /></button>
        </div>
        {plan.warnings.map((w) => <p key={w} className="ea-alert ea-alert--warning"><AlertTriangle size={15} aria-hidden="true" /> <span>{w}</span></p>)}
        <ol className="ea-learn__days">
          {Object.entries(byDay).map(([date, items]) => (
            <li key={date} className={`ea-card ea-learn__day${date === today ? " is-today" : ""}${date < today && items.some((i) => !i.done) ? " is-late" : ""}`}>
              <p className="ea-learn__day-head"><CalendarDays size={15} aria-hidden="true" /> <strong>{fmt(date)}</strong>{date === today && <span className="ea-badge ea-badge--info">Today</span>}</p>
              <ul>
                {items.map((i) => (
                  <li key={i.id}>
                    <label className={`ea-learn__task${i.done ? " is-done" : ""}`}>
                      <input type="checkbox" checked={i.done} onChange={() => mark(i)} />
                      <span><strong>{i.kind === "study" ? "Study" : i.kind === "practice" ? "Practise" : "Review"}</strong> {i.subject}: {i.topic} <span className="ea-learn__muted">· {i.minutes} min{i.reason ? ` · ${i.reason}` : ""}</span></span>
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="ea-learn__planner" aria-label="Make a revision plan">
      <form className="ea-card ea-learn__form" onSubmit={create}>
        <fieldset className="ea-learn__formats">
          <legend>Which exam?</legend>
          <label><input type="radio" name="src" checked={source === "school"} disabled={!context?.exams?.length} onChange={() => setForm({ ...form, source: "school" })} /> From my school's exam schedule</label>
          <label><input type="radio" name="src" checked={source === "own"} onChange={() => setForm({ ...form, source: "own" })} /> I will enter the date</label>
        </fieldset>
        {!context?.exams?.length && <p className="ea-learn__muted">Your school has not scheduled any upcoming exams for your class, so enter your exam date.</p>}
        {source === "school" ? (
          <label className="ea-learn__field-block">Exam
            <select className="ea-select" value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value })}>
              <option value="">Choose…</option>
              {(context?.exams || []).map((x) => <option key={x._id} value={x._id}>{x.title} · {x.subject} · {fmt(x.date)}</option>)}
            </select>
          </label>
        ) : (
          <div className="ea-learn__grid">
            <label className="ea-learn__field-block">Exam date<input type="date" className="ea-input" min={todayLocal()} value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} /></label>
            <label className="ea-learn__field-block">Exam name (optional)<input className="ea-input" maxLength={100} value={form.examName} onChange={(e) => setForm({ ...form, examName: e.target.value })} placeholder="e.g. Science unit test" /></label>
          </div>
        )}
        <fieldset className="ea-learn__topics">
          <legend>Topics to revise</legend>
          {form.topics.map((t, i) => (
            <div key={i} className="ea-learn__topic-row">
              <input className="ea-input" aria-label={`Subject ${i + 1}`} placeholder="Subject" maxLength={40} list="ea-learn-subjects-plan" value={t.subject} onChange={(e) => setTopic(i, "subject", e.target.value)} />
              <input className="ea-input" aria-label={`Topic ${i + 1}`} placeholder="Topic or chapter" maxLength={120} value={t.topic} onChange={(e) => setTopic(i, "topic", e.target.value)} />
              <button type="button" className="ea-btn ea-btn--ghost" aria-label={`Remove topic ${i + 1}`} onClick={() => setForm((f) => ({ ...f, topics: f.topics.filter((_, j) => j !== i) }))}><Trash2 size={15} aria-hidden="true" /></button>
            </div>
          ))}
          <datalist id="ea-learn-subjects-plan">{(context?.subjects || []).map((s) => <option key={s} value={s} />)}</datalist>
          <div className="ea-learn__row">
            <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setForm((f) => ({ ...f, topics: [...f.topics, { subject: "", topic: "" }] }))}><Plus size={15} aria-hidden="true" /> Add topic</button>
            {weak.length > 0 && <button type="button" className="ea-btn ea-btn--ghost" onClick={addWeak}>Add my weak topics ({weak.length})</button>}
          </div>
        </fieldset>
        <div className="ea-learn__grid">
          <label className="ea-learn__field-block">Minutes a day
            <select className="ea-select" value={form.minutesPerDay} onChange={(e) => setForm({ ...form, minutesPerDay: Number(e.target.value) })}>
              {[30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <fieldset className="ea-learn__formats">
            <legend>Rest days</legend>
            {DAYS.map((d, i) => (
              <label key={d}><input type="checkbox" checked={form.restDays.includes(i)} onChange={() => setForm((f) => ({ ...f, restDays: f.restDays.includes(i) ? f.restDays.filter((x) => x !== i) : [...f.restDays, i] }))} /> {d}</label>
            ))}
          </fieldset>
        </div>
        <div className="ea-learn__row">
          <button type="submit" className="ea-btn ea-btn--primary" disabled={busy}>{busy ? "Making the plan…" : "Make my plan"}</button>
          {plan && <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setEditing(false)}>Back to my plan</button>}
        </div>
      </form>
    </section>
  );
}
