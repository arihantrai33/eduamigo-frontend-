import { useState, useEffect } from "react";
import axios from "axios";
import { toast, errorMessage } from "../../utils/toast";
import EmptyState from "../../components/ui/EmptyState";

import { Plus, CalendarDays } from "lucide-react";
import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
import Badge, { CategoryBadge } from "../../components/ui/Badge";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";
import Skeleton from "../../components/ui/Skeleton";

// Checked fields; each input's id is "exam-<key>".
const FIELDS = Object.fromEntries(["title", "subject", "class", "date", "totalMarks", "startTime", "endTime"].map((k) => [k, `exam-${k}`]));
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Fallback only; the real list comes from GET /exams/options so it always matches the server.
const DEFAULT_EXAM_TYPES = ["Unit Test","Mid Term","Half Yearly","Pre-Board","Final Exam","Board Exam","Practical","Quiz","Assignment","Custom"];
// Native selects look different in every browser (Safari draws a small grey pill); this matches the text inputs.
const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";
const SELECT_STYLE = {
  width:"100%", padding:"0 36px 0 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none",
  fontFamily:"inherit", color:"#0F172A", boxSizing:"border-box", appearance:"none", WebkitAppearance:"none", MozAppearance:"none",
  background:`white ${CHEVRON} no-repeat right 14px center`, cursor:"pointer", height:42,
};
const FILTER_STYLE = { ...SELECT_STYLE, width:"auto", height:44, padding:"0 38px 0 16px", borderRadius:12, fontWeight:600 };

const EMPTY_FORM = { title:"", examType:"Unit Test", term:"", subject:"", class:"", section:"", date:"", startTime:"", endTime:"", totalMarks:"", venue:"", instructions:"" };

export default function ExamSchedule() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const fe = useFieldErrors(FIELDS);
  const [examTypes, setExamTypes] = useState(DEFAULT_EXAM_TYPES);
  const [terms, setTerms] = useState(["Term 1", "Term 2"]);
  const [subjectList, setSubjectList] = useState([]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/exams`, auth());
      setExams(r.data.data || []);
    } catch (e) { toast.error(errorMessage(e, "Could not load exams")); }
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(fetchExams);
    (async () => {
      const [opt, teachers, extra] = await Promise.allSettled([
        axios.get(`${API}/exams/options`, auth()),
        axios.get(`${API}/teachers`, auth()),
        axios.get(`${API}/schools/subjects`, auth()),
      ]);
      if (opt.status === "fulfilled") { setExamTypes(opt.value.data.data.examTypes); setTerms(opt.value.data.data.terms); }
      // Suggest the subjects teachers actually teach, so teachers can find the exam when entering marks.
      const fromTeachers = teachers.status === "fulfilled" ? (teachers.value.data.data || []).flatMap(t => t.subjects || []) : [];
      const fromSchool = extra.status === "fulfilled" ? (extra.value.data.data || []) : [];
      setSubjectList([...new Set([...fromTeachers, ...fromSchool])].sort());
    })();
  }, []);

  const openAdd = () => { setEditExam(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (e) => { setEditExam(e); setForm({...e, date: e.date ? new Date(e.date).toISOString().split("T")[0] : ""}); setShowModal(true); };

  const handleSave = async () => {
    if (!fe.check({
      title: !form.title?.trim() && "Enter the exam title",
      subject: !form.subject?.trim() && "Enter the subject",
      class: !String(form.class || "").trim() && "Enter the class",
      date: !form.date && "Choose the exam date",
      totalMarks: !(Number(form.totalMarks) > 0) && "Enter the total marks, so that teachers can enter marks",
      startTime: !form.startTime && "Choose the start time",
      endTime: !form.endTime ? "Choose the end time" : form.startTime && form.endTime <= form.startTime && "End time must be after the start time",
    })) return;
    setSaving(true);
    try {
      if (editExam) await axios.put(`${API}/exams/${editExam._id}`, form, auth());
      else await axios.post(`${API}/exams`, form, auth());
      setShowModal(false);
      toast.success(editExam ? "Exam updated" : "Exam scheduled");
      fetchExams();
    } catch (e) { toast.error(errorMessage(e)); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/exams/${id}`, auth()); toast.success("Exam deleted"); fetchExams(); }
    catch (e) { toast.error(errorMessage(e)); }
    setDeleteId(null);
  };

  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); fe.clear(k); };
  const classes = [...new Set(exams.map(e => e.class))].filter(Boolean).sort();

  const filtered = exams.filter(e =>
    (!filterType || e.examType === filterType) &&
    (!filterClass || e.class === filterClass)
  );

  const upcoming = exams.filter(e => e.date && new Date(e.date) >= new Date()).length;
  const today = exams.filter(e => e.date && new Date(e.date).toDateString() === new Date().toDateString()).length;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" }) : "—";

  // A <label> around the caption and the field, so the field takes the caption as its name.
  const inp = (label, key, type="text", placeholder="") => (
    <label style={{ display:"block" }}>
      <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>{label}</span>
      <input id={`exam-${key}`} type={type} value={form[key]||""} onChange={e => f(key, e.target.value)} placeholder={placeholder} {...fe.invalid(key)}
        style={{ width:"100%", height:42, padding:"0 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white", color:"#0F172A" }}
        onFocus={e => e.target.style.borderColor="var(--brand)"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
      <FieldError id={`exam-${key}-error`}>{fe.errors[key]}</FieldError>
    </label>
  );
  const sel = (label, key, options) => (
    <label style={{ display:"block" }}>
      <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>{label}</span>
      <select value={form[key]||""} onChange={e => f(key, e.target.value)} style={SELECT_STYLE}>
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .exam-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.12) !important; }
        .exam-card { transition: all 0.2s ease; }
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Exam Schedule" subtitle="Create and manage exam timetables"
          actions={<button type="button" className="ea-btn ea-btn--primary" onClick={openAdd}><Plus size={16} aria-hidden="true" /> Schedule Exam</button>} />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"TOTAL EXAMS",   value: exams.length, icon:<Glyph e="📝" />, border:"var(--brand)" },
            { label:"UPCOMING",      value: upcoming,     icon:<Glyph e="📅" />, border:"var(--brand)" },
            { label:"TODAY",         value: today,        icon:<Glyph e="🔔" />, border: today ? "#F59E0B" : "var(--brand)" },
            { label:"EXAM TYPES",    value: [...new Set(exams.map(e=>e.examType))].length, icon:<Glyph e="🗂" />, border:"var(--brand)" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:20, alignItems:"center", animation:"fadeUp 0.4s ease 0.1s both" }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Filter by exam type"
          style={{ ...FILTER_STYLE, minWidth:170 }}>
          <option value="">All Exam Types</option>
          {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} aria-label="Filter by class"
          style={{ ...FILTER_STYLE, minWidth:150 }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <div style={{ fontSize:12, color:"var(--ea-muted)", fontWeight:600 }}>{filtered.length} exams</div>
      </div>

      {/* Exam Cards */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <Skeleton rows={4} label="Loading exams" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"white", borderRadius:20, padding: 16, textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
          <EmptyState plain icon={CalendarDays} title="No exams scheduled" text={`Click "Schedule Exam" to add your first exam`} />
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {filtered.map((exam, i) => {
            const isUpcoming = exam.date && new Date(exam.date) >= new Date();
            return (
              <div key={exam._id} className="exam-card"
                style={{ background:"var(--ea-surface)", borderRadius:16, padding:"20px", boxShadow:"var(--ea-shadow)", border:"1px solid var(--ea-line)", animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <CategoryBadge>{exam.examType}</CategoryBadge>
                  {isUpcoming && <Badge tone="success">Upcoming</Badge>}
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:"#0F172A", marginBottom:4 }}>{exam.title}</div>
                <div style={{ fontSize:13, color:"var(--brand-text)", fontWeight:700, marginBottom:12 }}>{exam.subject}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                  {exam.class && <div style={{ fontSize:12, color:"var(--ea-muted)" }}><Glyph e="🏫" /> Class {exam.class}{exam.section ? `-${exam.section}` : ""}</div>}
                  <div style={{ fontSize:12, color:"var(--ea-muted)" }}><Glyph e="📅" /> {fmtDate(exam.date)}</div>
                  {exam.startTime && <div style={{ fontSize:12, color:"var(--ea-muted)" }}><Glyph e="🕐" /> {exam.startTime}{exam.endTime ? ` – ${exam.endTime}` : ""}</div>}
                  {exam.totalMarks ? <div style={{ fontSize:12, color:"var(--ea-muted)" }}><Glyph e="📊" /> Total Marks: {exam.totalMarks}</div> : <div style={{ fontSize:12, color:"#B45309", fontWeight:600 }}>Total marks not set: teachers cannot enter marks yet</div>}
                  {exam.term && <div style={{ fontSize:12, color:"var(--ea-muted)" }}><Glyph e="🗂" /> {exam.term} · {exam.academicYear}</div>}
                  {exam.venue && <div style={{ fontSize:12, color:"var(--ea-muted)" }}><Glyph e="📍" /> {exam.venue}</div>}
                </div>
                <div style={{ display:"flex", gap:8, borderTop:"1px solid #F1F5F9", paddingTop:12 }}>
                  <button className="act-btn" onClick={() => openEdit(exam)}
                    style={{ flex:1, padding:"8px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:12, fontWeight:700, cursor:"pointer" }}>Edit</button>
                  <button type="button" className="act-btn" onClick={() => setDeleteId(exam._id)} aria-label={`Delete ${exam.subject} exam`} title="Delete"
                    style={{ padding:"8px 14px", borderRadius:10, border:"none", background:"#FEF2F2", color:"#B91C1C", fontSize:12, fontWeight:700, cursor:"pointer" }}><Glyph e="🗑" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showModal} onClose={() => { setShowModal(false); fe.setErrors({}); }} title={editExam ? "Edit Exam" : "Schedule New Exam"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {inp("EXAM TITLE","title","text","e.g. Mathematics Mid Term")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {sel("EXAM TYPE","examType",examTypes)}
            <div>
              <label htmlFor="exam-subject" style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>SUBJECT</label>
              <input id="exam-subject" list="exam-subjects" value={form.subject||""} onChange={e => f("subject", e.target.value)} placeholder="e.g. Mathematics" {...fe.invalid("subject")}
                style={{ width:"100%", height:42, padding:"0 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white", color:"#0F172A" }} />
              <FieldError id="exam-subject-error">{fe.errors.subject}</FieldError>
              <datalist id="exam-subjects">{subjectList.map(sub => <option key={sub} value={sub} />)}</datalist>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {inp("CLASS","class","text","e.g. 10")}
            {inp("SECTION","section","text","e.g. A")}
            <div style={{ gridColumn:"1 / -1", fontSize:11, color:"var(--ea-muted)", marginTop:-4 }}>Leave section empty to schedule the exam for every section of the class.</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {inp("DATE","date","date","")}
            {inp("START TIME","startTime","time","")}
            {inp("END TIME","endTime","time","")}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {inp("TOTAL MARKS","totalMarks","number","e.g. 100")}
            {inp("VENUE","venue","text","e.g. Room 101")}
          </div>
          <div>
            <label htmlFor="exam-term" style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>TERM</label>
            <select id="exam-term" value={form.term||""} onChange={e => f("term", e.target.value)} style={SELECT_STYLE}>
              <option value="">Set from the exam date (Apr–Sep: Term 1, Oct–Mar: Term 2)</option>
              {terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ fontSize:11, color:"var(--ea-muted)", marginTop:6 }}>Report cards group results by term.</div>
          </div>
          <div>
            <label htmlFor="exam-instructions" style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>INSTRUCTIONS</label>
            <textarea id="exam-instructions" value={form.instructions||""} onChange={e => f("instructions", e.target.value)} placeholder="Special instructions..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:70 }} />
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--ea-muted)" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ea-btn ea-btn--primary">
              {saving ? "Saving..." : "Save Exam"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Exam">
        <div style={{ textAlign:"center", padding:"8px 0 24px" }}>
          <div style={{ fontSize:52, marginBottom:16 }}><Glyph e="🗑" /></div>
          <div style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>Delete this exam?</div>
          <div style={{ fontSize:13, color:"var(--ea-muted)", marginBottom:24 }}>This exam will be permanently removed. Exams that already have marks cannot be deleted.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setDeleteId(null)} style={{ padding:"10px 28px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--ea-muted)" }}>Cancel</button>
            <button onClick={() => handleDelete(deleteId)} className="ea-btn ea-btn--danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
