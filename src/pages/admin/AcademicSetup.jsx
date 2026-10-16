import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, errorMessage, confirmAction } from "../../utils/toast";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";

// School setup: onboarding checklist, academic sessions and settings, and the class list
// (classes, sections, class teachers, subjects). Backed by /api/academic.
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

// Where each checklist step is done.
const STEP_LINKS = {
  session: { anchor: "sessions" }, classes: { anchor: "classes" }, subjects: { anchor: "classes" }, classTeachers: { anchor: "classes" },
  teachers: { path: "/admin/teachers" }, students: { path: "/admin/students" }, timetable: { path: "/admin/timetable" }, fees: { path: "/admin/fee-structure" },
};

const ui = {
  card: { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: 16 },
  title: { fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" },
  hint: { fontSize: 12, color: "var(--ea-muted)", margin: "0 0 14px", lineHeight: 1.5 },
  chip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "var(--brand-soft)", color: "#3730A3", fontSize: 12, fontWeight: 600 },
  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" },
};

const badge = (status) => {
  const c = { current: ["#DCFCE7", "#166534"], upcoming: ["#E0F2FE", "#075985"], closed: ["#F1F5F9", "#475569"] }[status] || ["#F1F5F9", "#475569"];
  return { padding: "2px 8px", borderRadius: 999, background: c[0], color: c[1], fontSize: 11, fontWeight: 700, textTransform: "capitalize" };
};

function nextSessionName(sessions, current) {
  const years = sessions.map((s) => Number(s.name.slice(0, 4)));
  const base = years.length ? Math.max(...years) + 1 : Number(String(current || "").slice(0, 4)) || new Date().getFullYear();
  return `${base}-${String((base + 1) % 100).padStart(2, "0")}`;
}

// ---------------- Checklist ----------------

function Checklist({ status, onJump }) {
  const navigate = useNavigate();
  if (!status) return null;
  const pct = Math.round((status.done / status.total) * 100);
  return (
    <div style={ui.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h3 style={ui.title}>{status.complete ? "Your school is set up" : "Set up your school"}</h3>
        <span style={{ fontSize: 12, color: "var(--ea-muted)", fontWeight: 600 }}>{status.done} of {status.total} done</span>
      </div>
      <div style={{ height: 6, background: "var(--brand-soft)", borderRadius: 999, margin: "10px 0 14px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand)", transition: "width .3s" }} />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {status.steps.map((step, i) => {
          const link = STEP_LINKS[step.key] || {};
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: step.done ? "var(--ea-muted)" : "#0F172A" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: step.done ? "#DCFCE7" : "#F1F5F9", color: step.done ? "#166534" : "var(--ea-muted)", flexShrink: 0 }}>
                {step.done ? "✓" : i + 1}
              </span>
              <span style={{ flex: 1, textDecoration: step.done ? "line-through" : "none" }}>{step.label}</span>
              {!step.done && (
                <button type="button" className="ea-btn ea-btn--ghost" aria-label={`Go to: ${step.label}`} onClick={() => (link.path ? navigate(link.path) : onJump(link.anchor))}>Go</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Sessions and settings ----------------

function Sessions({ onChanged }) {
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState("");
  const [settings, setSettings] = useState({ sessionStartMonth: 4, admissionNoPrefix: "" });
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [s, cfg] = await Promise.all([axios.get(`${API}/academic/sessions`, auth()), axios.get(`${API}/academic/settings`, auth())]);
      setSessions(s.data.data || []);
      setCurrent(s.data.current || "");
      setSettings({ sessionStartMonth: cfg.data.data.sessionStartMonth, admissionNoPrefix: cfg.data.data.admissionNoPrefix || "" });
      setForm((f) => (f.name ? f : { ...f, name: nextSessionName(s.data.data || [], s.data.current) }));
    } catch (err) {
      toast.error(errorMessage(err, "Could not load sessions"));
    }
  };
  useEffect(() => { load(); }, []);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      await load();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const create = () => run(async () => {
    const body = { name: form.name.trim() };
    if (form.startDate) body.startDate = form.startDate;
    if (form.endDate) body.endDate = form.endDate;
    await axios.post(`${API}/academic/sessions`, body, auth());
    setForm({ name: "", startDate: "", endDate: "" });
  }, `Session ${form.name} created`);

  const makeCurrent = async (s) => {
    if (!(await confirmAction(`Make ${s.name} the current session? ${current ? `${current} will be closed.` : ""}`, { confirmLabel: "Make current", danger: false }))) return;
    run(() => axios.patch(`${API}/academic/sessions/${s._id}/current`, {}, auth()), `${s.name} is now the current session`);
  };

  const saveSettings = () => run(() => axios.put(`${API}/academic/settings`, settings, auth()), "Settings saved");

  return (
    <div id="sessions" tabIndex={-1} style={ui.card}>
      <h3 style={ui.title}>Academic sessions</h3>
      <p style={ui.hint}>
        Current session: <strong style={{ color: "#0F172A" }}>{current || "—"}</strong>. New admissions, fees, exams and report
        cards use it. Create next year's session before the year starts, then make it current.
      </p>
      {sessions.length > 0 && (
        <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
          {sessions.map((s) => (
            <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: "1px solid #F1F5F9", borderRadius: 8, fontSize: 13 }}>
              <strong style={{ minWidth: 70 }}>{s.name}</strong>
              <span style={{ color: "var(--ea-muted)", flex: 1 }}>{fmtDate(s.startDate)} – {fmtDate(s.endDate)}</span>
              <span style={badge(s.status)}>{s.status}</span>
              {s.status !== "current" && <button className="ea-btn ea-btn--ghost" disabled={busy} onClick={() => makeCurrent(s)}>Make current</button>}
            </div>
          ))}
        </div>
      )}
      <div style={ui.row}>
        <label className="ea-field ea-label">Session
          <input className="ea-input" style={{ width: 110 }} value={form.name} placeholder="2026-27" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="ea-field ea-label">Starts (optional)
          <input type="date" className="ea-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </label>
        <label className="ea-field ea-label">Ends (optional)
          <input type="date" className="ea-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </label>
        <button className="ea-btn ea-btn--primary" disabled={busy || !form.name.trim()} onClick={create}>Add session</button>
      </div>

      <div style={{ borderTop: "1px solid #F1F5F9", margin: "18px 0 14px" }} />
      <div style={ui.row}>
        <label className="ea-field ea-label">Session starts in
          <select className="ea-select" value={settings.sessionStartMonth} onChange={(e) => setSettings({ ...settings, sessionStartMonth: Number(e.target.value) })}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="ea-field ea-label">Admission number prefix
          <input className="ea-input" style={{ width: 140 }} value={settings.admissionNoPrefix} placeholder="e.g. GV/" maxLength={12}
            onChange={(e) => setSettings({ ...settings, admissionNoPrefix: e.target.value })} />
        </label>
        <button className="ea-btn ea-btn--ghost" disabled={busy} onClick={saveSettings}>Save settings</button>
      </div>
      <p style={{ ...ui.hint, margin: "8px 0 0" }}>
        New students get the next admission number automatically, for example <strong>{settings.admissionNoPrefix || ""}1025</strong>.
      </p>
    </div>
  );
}

// ---------------- Classes ----------------

const emptyClass = { name: "", displayName: "", sections: ["A"], subjects: "" };

function ClassEditor({ initial, teachers, onSave, onCancel, busy }) {
  const [form, setForm] = useState(() => (initial
    ? { name: initial.name, displayName: initial.displayName || "", sections: initial.sections.map((s) => ({ name: s.name, classTeacher: s.classTeacher || "", students: s.students || 0 })), subjects: (initial.subjects || []).join(", ") }
    : { ...emptyClass, sections: [{ name: "A", classTeacher: "", students: 0 }] }));
  const [newSection, setNewSection] = useState("");
  const hasStudents = (initial?.students || 0) > 0;

  const addSection = () => {
    const name = newSection.trim().toUpperCase();
    if (!name || form.sections.some((s) => s.name === name)) return;
    setForm({ ...form, sections: [...form.sections, { name, classTeacher: "", students: 0 }] });
    setNewSection("");
  };
  const setTeacher = (name, classTeacher) => setForm({ ...form, sections: form.sections.map((s) => (s.name === name ? { ...s, classTeacher } : s)) });
  const removeSection = (name) => setForm({ ...form, sections: form.sections.filter((s) => s.name !== name) });

  const submit = () => onSave({
    name: form.name.trim(),
    displayName: form.displayName.trim() || `Class ${form.name.trim()}`,
    sections: form.sections.map((s) => ({ name: s.name, classTeacher: s.classTeacher || null })),
    subjects: form.subjects.split(",").map((x) => x.trim()).filter(Boolean),
  });

  return (
    <div style={{ border: "1px solid var(--brand-border)", background: "#F8FAFF", borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={ui.row}>
        <label className="ea-field ea-label">Class
          <input className="ea-input" style={{ width: 120 }} value={form.name} disabled={hasStudents} placeholder="10, LKG, 11 Science"
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="ea-field ea-label">Display name
          <input className="ea-input" style={{ width: 180 }} value={form.displayName} placeholder={form.name ? `Class ${form.name}` : "Class 10"}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </label>
      </div>
      {hasStudents && <p style={{ ...ui.hint, margin: "6px 0 0" }}>The class name is locked because students are in it.</p>}

      <div style={{ fontSize: 11, color: "var(--ea-muted)", fontWeight: 600, margin: "14px 0 6px" }}>SECTIONS AND CLASS TEACHERS</div>
      <div style={{ display: "grid", gap: 6 }}>
        {form.sections.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...ui.chip, minWidth: 34, justifyContent: "center" }}>{s.name}</span>
            <select className="ea-select" style={{ minWidth: 200 }} value={s.classTeacher} onChange={(e) => setTeacher(s.name, e.target.value)}>
              <option value="">No class teacher</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            {s.students > 0
              ? <span style={{ fontSize: 11, color: "var(--ea-muted)" }}>{s.students} students</span>
              : <button className="ea-btn ea-btn--ghost" onClick={() => removeSection(s.name)}>Remove</button>}
          </div>
        ))}
      </div>
      <div style={{ ...ui.row, marginTop: 8 }}>
        <input className="ea-input" style={{ width: 90 }} value={newSection} placeholder="e.g. B" maxLength={10}
          onChange={(e) => setNewSection(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSection()} />
        <button className="ea-btn ea-btn--ghost" onClick={addSection}>+ Add section</button>
      </div>

      <label className="ea-field ea-label" style={{ marginTop: 14 }}>Subjects (separate with commas)
        <input className="ea-input" value={form.subjects} placeholder="English, Hindi, Mathematics, Science, Social Science"
          onChange={(e) => setForm({ ...form, subjects: e.target.value })} />
      </label>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
        <button className="ea-btn ea-btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="ea-btn ea-btn--primary" disabled={busy || !form.name.trim()} onClick={submit}>{initial ? "Save class" : "Add class"}</button>
      </div>
    </div>
  );
}

function Classes({ onChanged }) {
  const [classes, setClasses] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [editing, setEditing] = useState(null); // class _id, "new", or null
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, t] = await Promise.all([
        axios.get(`${API}/academic/classes?all=true`, auth()),
        axios.get(`${API}/teachers`, auth()).catch(() => ({ data: { data: [] } })),
      ]);
      setClasses(c.data.data || []);
      setTeachers((t.data.data || []).filter((x) => x.isActive !== false));
    } catch (err) {
      toast.error(errorMessage(err, "Could not load classes"));
      setClasses([]);
    }
  };
  useEffect(() => { load(); }, []);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      setEditing(null);
      await load();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = (cls, body) => run(
    () => (cls ? axios.put(`${API}/academic/classes/${cls._id}`, body, auth()) : axios.post(`${API}/academic/classes`, body, auth())),
    cls ? `Class ${body.name} saved` : `Class ${body.name} added`,
  );
  const importFromStudents = () => run(async () => {
    const r = await axios.post(`${API}/academic/classes/import`, {}, auth());
    toast.info(r.data.message);
  }, "Class list built from your students");
  const toggleActive = (cls) => run(() => axios.put(`${API}/academic/classes/${cls._id}`, { isActive: !cls.isActive }, auth()),
    cls.isActive ? `Class ${cls.name} deactivated` : `Class ${cls.name} activated`);
  const remove = async (cls) => {
    if (!(await confirmAction(`Delete class ${cls.name}? This cannot be undone.`, { confirmLabel: "Delete" }))) return;
    run(() => axios.delete(`${API}/academic/classes/${cls._id}`, auth()), `Class ${cls.name} deleted`);
  };

  if (!classes) return <div style={ui.card}><Skeleton rows={3} label="Loading classes" /></div>;

  return (
    <div id="classes" tabIndex={-1} style={ui.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={ui.title}>Classes, sections and subjects</h3>
          <p style={ui.hint}>Once classes are listed here, students and teachers can only be placed in these classes and sections.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {classes.length === 0 && <button className="ea-btn ea-btn--ghost" disabled={busy} onClick={importFromStudents}>Import from existing students</button>}
          <button className="ea-btn ea-btn--primary" disabled={busy || editing === "new"} onClick={() => setEditing("new")}>+ Add class</button>
        </div>
      </div>

      {editing === "new" && <ClassEditor teachers={teachers} busy={busy} onCancel={() => setEditing(null)} onSave={(body) => save(null, body)} />}

      {classes.length === 0 && editing !== "new" && (
        <p style={{ ...ui.hint, textAlign: "center", padding: "18px 0" }}>
          No classes yet. Add them one by one, or import them from the classes your students are already in.
        </p>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {classes.map((cls) => (editing === cls._id ? (
          <ClassEditor key={cls._id} initial={cls} teachers={teachers} busy={busy} onCancel={() => setEditing(null)} onSave={(body) => save(cls, body)} />
        ) : (
          <div key={cls._id} style={{ border: "1px solid #F1F5F9", borderRadius: 10, padding: "10px 12px", opacity: cls.isActive ? 1 : 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 14, color: "#0F172A", minWidth: 90 }}>{cls.displayName || `Class ${cls.name}`}</strong>
              <span style={{ fontSize: 12, color: "var(--ea-muted)" }}>{cls.students} students</span>
              {!cls.isActive && <span style={badge("closed")}>inactive</span>}
              <span style={{ flex: 1 }} />
              <button className="ea-btn ea-btn--ghost" onClick={() => setEditing(cls._id)}>Edit</button>
              {cls.students === 0 && <button className="ea-btn ea-btn--ghost" disabled={busy} onClick={() => toggleActive(cls)}>{cls.isActive ? "Deactivate" : "Activate"}</button>}
              {cls.students === 0 && <button className="ea-btn ea-btn--danger-ghost" disabled={busy} onClick={() => remove(cls)}>Delete</button>}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {cls.sections.length === 0 && <span style={{ fontSize: 12, color: "#B45309" }}>No sections yet</span>}
              {cls.sections.map((s) => (
                <span key={s.name} style={ui.chip} title={s.classTeacherName ? `Class teacher: ${s.classTeacherName}` : "No class teacher"}>
                  {s.name}
                  <span style={{ fontWeight: 500, color: s.classTeacherName ? "var(--brand-dark)" : "#B45309" }}>· {s.classTeacherName || "no class teacher"}</span>
                  <span style={{ fontWeight: 500, color: "var(--ea-muted)" }}>· {s.students}</span>
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: cls.subjects.length ? "#475569" : "#B45309", marginTop: 6 }}>
              {cls.subjects.length ? `Subjects: ${cls.subjects.join(", ")}` : "No subjects yet"}
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}

// ---------------- Page ----------------

export default function AcademicSetup() {
  const [status, setStatus] = useState(null);
  const loadStatus = useCallback(() => {
    axios.get(`${API}/academic/setup-status`, auth()).then((r) => setStatus(r.data.data)).catch(() => {});
  }, []);
  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Scroll to the section and move keyboard focus there, so Tab continues inside it.
  const jump = (anchor) => {
    const el = document.getElementById(anchor);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  };

  return (
    <div className="ea-page--read" style={{ fontFamily: "inherit" }}>
      <div style={{ marginBottom: 18 }}>
        <PageHeader title="School Setup" subtitle="Sessions, classes, sections, class teachers and subjects" />
      </div>
      <Checklist status={status} onJump={jump} />
      <Sessions onChanged={loadStatus} />
      <Classes onChanged={loadStatus} />
    </div>
  );
}
