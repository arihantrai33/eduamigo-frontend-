import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenCheck, Trash2, X } from "lucide-react";
import PortalHeader from "../../components/ui/PortalHeader";
import Segmented from "../../components/ui/Segmented";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import BottomNav from "../../layout/BottomNav";
import { confirmAction, toast, errorMessage } from "../../utils/toast";
import HomeworkCard, { Attachments } from "./HomeworkCard";
import { giveHomework, givenHomework, homeworkDetail, removeHomework } from "./homeworkApi";
import "./homework.css";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const splitClass = (k) => { const [c, ...s] = String(k).split("-"); return { class: c, section: s.join("-") }; };
const today = () => new Date().toLocaleDateString("en-CA");

// A teacher gives homework to a whole class, to chosen students of it, or to one student, and sees who has finished it.
// `office` is the school office's read-only view of every homework given: no form, no bottom bar, and it opens from the office menu.
export default function TeacherHomework({ office = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("given");
  const [teacher, setTeacher] = useState(null);
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  const [round, setRound] = useState(0);
  const load = useCallback(() => setRound((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    // The office has no teacher record (and is refused by /teachers/me), so it only loads the list.
    Promise.all([office ? Promise.resolve({}) : fetch(`${API}/teachers/me`, { headers: auth() }).then((r) => r.json()), givenHomework()])
      .then(([t, h]) => { if (!alive) return; if (t.success) setTeacher(t.data); setError(""); setList(h.data); })
      .catch((e) => { if (alive) { setError(errorMessage(e, "Could not load homework")); setList([]); } });
    return () => { alive = false; };
  }, [round, office]);

  const open = async (hw) => {
    try { setDetail((await homeworkDetail(hw._id)).data); } catch (e) { toast.error(errorMessage(e, "Could not open this homework")); }
  };
  const del = async (hw) => {
    if (!(await confirmAction(`Remove "${hw.title}"? Students will no longer see it.`))) return;
    try { await removeHomework(hw._id); setDetail(null); toast.success("Homework removed."); load(); } catch (e) { toast.error(errorMessage(e, "Could not remove it")); }
  };

  return (
    <div className="ea-pd-read hw-page">
      <PortalHeader title="Homework" subtitle={office ? "Homework given by every teacher, and who has finished it" : "Give homework and see who has finished it"} onBack={office ? undefined : () => navigate("/teacher/home")} />
      <div className="ea-pd-body hw-body">
        {!office && <Segmented label="Homework view" value={tab} onChange={setTab} options={[{ value: "given", label: "Given" }, { value: "new", label: "+ Give homework" }]} />}
        {!office && tab === "new" && <GiveForm teacher={teacher} onDone={() => { setTab("given"); load(); }} />}
        {tab === "given" && (
          <>
            {list === null && <Skeleton rows={3} label="Loading homework" />}
            {error && <div className="ea-card hw-error" role="alert">{error} <button type="button" className="ea-btn ea-btn--ghost" onClick={load}>Try again</button></div>}
            {list && !error && list.length === 0 && <EmptyState icon={BookOpenCheck} title="No homework given yet" text="Choose “Give homework” to send the first one." />}
            <div className="hw-list">
              {(list || []).map((hw) => (
                <HomeworkCard key={hw._id} hw={hw} readOnly={false}>
                  <button type="button" className="hw-progress" onClick={() => open(hw)} aria-label={`${hw.title}: ${hw.done} of ${hw.assigned} done. Open details`}>
                    <span className="hw-progress__bar"><i style={{ width: `${hw.assigned ? (hw.done / hw.assigned) * 100 : 0}%` }} /></span>
                    <span>{hw.done} of {hw.assigned} done · Class {hw.class}{hw.section ? `-${hw.section}` : ""}</span>
                  </button>
                </HomeworkCard>
              ))}
            </div>
          </>
        )}
      </div>
      {detail && (
        <div className="hw-modal" role="dialog" aria-modal="true" aria-label={detail.title} onClick={() => setDetail(null)}>
          <div className="hw-modal__card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="hw-modal__x" aria-label="Close" onClick={() => setDetail(null)}><X size={18} /></button>
            <span className="hw-subject">{detail.subject}</span>
            <h2>{detail.title}</h2>
            <p className="hw-by">Class {detail.class}{detail.section ? `-${detail.section}` : ""} · due {detail.dueDate} · {detail.done} of {detail.assigned} done</p>
            {detail.description && <p className="hw-desc">{detail.description}</p>}
            <Attachments list={detail.attachments} />
            <ul className="hw-students">
              {detail.students.map((s) => <li key={s._id}><span>{s.rollNumber ? `${s.rollNumber}. ` : ""}{s.name}</span><span className={`hw-state${s.done ? " is-done" : ""}`}>{s.done ? "Done" : "Not yet"}</span></li>)}
            </ul>
            <button type="button" className="ea-btn ea-btn--ghost hw-del" onClick={() => del(detail)}><Trash2 size={15} aria-hidden="true" />Remove homework</button>
          </div>
        </div>
      )}
      {!office && <BottomNav role="teacher" />}
    </div>
  );
}

function GiveForm({ teacher, onDone }) {
  const classes = teacher?.assignedClasses || [];
  const subjects = teacher?.subjects || [];
  const [form, setForm] = useState({ classKey: classes[0] || "", subject: subjects[0] || "", title: "", description: "", dueDate: "", audience: "class" });
  const [students, setStudents] = useState([]);
  const [chosen, setChosen] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const key = useMemo(() => splitClass(form.classKey || classes[0] || ""), [form.classKey, classes]);

  useEffect(() => {
    if (form.audience !== "students" || !key.class) return;
    const q = new URLSearchParams({ class: key.class, ...(key.section ? { section: key.section } : {}), limit: "200" });
    fetch(`${API}/students?${q}`, { headers: auth() }).then((r) => r.json()).then((r) => { setStudents(r.data || []); setChosen([]); }).catch(() => setStudents([]));
  }, [form.audience, key.class, key.section]);

  const submit = async (e) => {
    e.preventDefault();
    setProblem("");
    if (!key.class) return setProblem("Choose a class.");
    if (!form.subject.trim()) return setProblem("Choose or type the subject.");
    if (!form.title.trim()) return setProblem("Write a title.");
    if (!form.dueDate) return setProblem("Choose the due date.");
    if (form.audience === "students" && !chosen.length) return setProblem("Choose at least one student.");
    setBusy(true);
    try {
      await giveHomework({ title: form.title, subject: form.subject, description: form.description, class: key.class, section: key.section, dueDate: form.dueDate, audience: form.audience, studentIds: form.audience === "students" ? chosen : undefined }, files);
      toast.success("Homework sent to the students and their parents.");
      onDone();
    } catch (err) { setProblem(errorMessage(err, "Could not send the homework")); } finally { setBusy(false); }
  };

  if (teacher && !classes.length) return <EmptyState icon={BookOpenCheck} title="No classes assigned to you yet" text="The school office assigns classes to teachers." />;
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  return (
    <form className="ea-card hw-form" onSubmit={submit} noValidate>
      <div className="hw-form__row">
        <label className="ea-field"><span className="ea-label">Class</span>
          <select className="ea-select" value={form.classKey || classes[0] || ""} onChange={set("classKey")}>{classes.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></label>
        <label className="ea-field"><span className="ea-label">Subject</span>
          <input className="ea-input" list="hw-subjects" value={form.subject} onChange={set("subject")} /><datalist id="hw-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist></label>
      </div>
      <label className="ea-field"><span className="ea-label">Title</span><input className="ea-input" value={form.title} onChange={set("title")} maxLength={200} placeholder="e.g. Fractions worksheet, Q1 to Q10" /></label>
      <label className="ea-field"><span className="ea-label">Instructions (optional)</span><textarea className="ea-input" rows={3} value={form.description} onChange={set("description")} maxLength={4000} /></label>
      <div className="hw-form__row">
        <label className="ea-field"><span className="ea-label">Due date</span><input className="ea-input" type="date" min={today()} value={form.dueDate} onChange={set("dueDate")} /></label>
        <fieldset className="ea-field hw-aud"><legend className="ea-label">Give it to</legend>
          <label><input type="radio" name="aud" checked={form.audience === "class"} onChange={() => setForm((f) => ({ ...f, audience: "class" }))} /> Whole class</label>
          <label><input type="radio" name="aud" checked={form.audience === "students"} onChange={() => setForm((f) => ({ ...f, audience: "students" }))} /> Chosen students</label>
        </fieldset>
      </div>
      {form.audience === "students" && (
        <div className="hw-pick" role="group" aria-label="Choose students">
          {students.length === 0 && <p className="hw-by">Loading students…</p>}
          {students.map((s) => (
            <label key={s._id} className={chosen.includes(s._id) ? "is-on" : ""}><input type="checkbox" checked={chosen.includes(s._id)} onChange={() => toggle(s._id)} />{s.rollNumber ? `${s.rollNumber}. ` : ""}{s.name}</label>
          ))}
          {students.length > 0 && <p className="hw-by">{chosen.length} chosen</p>}
        </div>
      )}
      <label className="ea-field"><span className="ea-label">Files (optional, up to 3: photo, PDF, Word, voice note)</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,audio/*,.docx,.xlsx,.pptx,.txt" onChange={(e) => setFiles([...e.target.files].slice(0, 3))} /></label>
      {files.length > 0 && <p className="hw-by">{files.map((f) => f.name).join(", ")}</p>}
      {problem && <div className="hw-problem" role="alert">{problem}</div>}
      <button type="submit" className="ea-btn ea-btn--primary" disabled={busy}>{busy ? "Sending…" : "Send homework"}</button>
    </form>
  );
}
