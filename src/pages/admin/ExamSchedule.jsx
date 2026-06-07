import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const EXAM_TYPES = ["Unit Test","Mid Term","Final Exam","Pre-Board","Board Exam","Quiz","Assignment"];
const TYPE_COLORS = {
  "Unit Test":"#6366F1","Mid Term":"#F59E0B","Final Exam":"#EF4444",
  "Pre-Board":"#EC4899","Board Exam":"#DC2626","Quiz":"#10B981","Assignment":"#3B82F6"
};

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B" }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ExamSchedule() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [form, setForm] = useState({ title:"", examType:"Unit Test", subject:"", class:"", section:"", date:"", startTime:"", endTime:"", totalMarks:"", venue:"", instructions:"" });

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/exams`, auth());
      setExams(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => { setEditExam(null); setForm({ title:"", examType:"Unit Test", subject:"", class:"", section:"", date:"", startTime:"", endTime:"", totalMarks:"", venue:"", instructions:"" }); setShowModal(true); };
  const openEdit = (e) => { setEditExam(e); setForm({...e, date: e.date ? new Date(e.date).toISOString().split("T")[0] : ""}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.subject || !form.class || !form.date) return alert("Title, subject, class and date are required");
    setSaving(true);
    try {
      if (editExam) await axios.put(`${API}/exams/${editExam._id}`, form, auth());
      else await axios.post(`${API}/exams`, form, auth());
      setShowModal(false);
      fetchExams();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/exams/${id}`, auth()); fetchExams(); }
    catch(e) {}
    setDeleteId(null);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const classes = [...new Set(exams.map(e => e.class))].filter(Boolean).sort();

  const filtered = exams.filter(e =>
    (!filterType || e.examType === filterType) &&
    (!filterClass || e.class === filterClass)
  );

  const upcoming = exams.filter(e => e.date && new Date(e.date) >= new Date()).length;
  const today = exams.filter(e => e.date && new Date(e.date).toDateString() === new Date().toDateString()).length;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" }) : "—";

  const inp = (label, key, type="text", placeholder="") => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <input type={type} value={form[key]||""} onChange={e => f(key, e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
        onFocus={e => e.target.style.borderColor="#F97316"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
    </div>
  );
  const sel = (label, key, options) => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <select value={form[key]||""} onChange={e => f(key, e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white", fontFamily:"inherit" }}>
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
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
      <div style={{ background:"linear-gradient(135deg,#F97316,#EF4444,#DC2626)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Exam Schedule</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Create and manage exam timetables</div>
          </div>
          <button onClick={openAdd}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:14, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.2)"}>
            + Schedule Exam
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL EXAMS",   value: exams.length, icon:"📝", border:"#6366F1", bg:"#EEF2FF" },
          { label:"UPCOMING",      value: upcoming,     icon:"📅", border:"#F97316", bg:"#FFF7ED" },
          { label:"TODAY",         value: today,        icon:"🔔", border:"#EF4444", bg:"#FEF2F2" },
          { label:"EXAM TYPES",    value: [...new Set(exams.map(e=>e.examType))].length, icon:"🗂️", border:"#10B981", bg:"#F0FDF4" },
        ].map((card, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:28, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", animation:"fadeUp 0.4s ease 0.1s both" }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:160 }}>
          <option value="">All Exam Types</option>
          {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>{filtered.length} exams</div>
      </div>

      {/* Exam Cards */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #F97316", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading exams...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No exams scheduled</div>
          <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Click "Schedule Exam" to add your first exam</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {filtered.map((exam, i) => {
            const color = TYPE_COLORS[exam.examType] || "#6366F1";
            const isUpcoming = exam.date && new Date(exam.date) >= new Date();
            return (
              <div key={exam._id} className="exam-card"
                style={{ background:"white", borderRadius:20, padding:"22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`1px solid #E2E8F0`, borderTop:`4px solid ${color}`, animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background:`${color}15`, color, border:`1px solid ${color}30` }}>{exam.examType}</span>
                  {isUpcoming && <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#F0FDF4", color:"#15803D", border:"1px solid #BBF7D0" }}>Upcoming</span>}
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:"#0F172A", marginBottom:4 }}>{exam.title}</div>
                <div style={{ fontSize:13, color:"#6366F1", fontWeight:700, marginBottom:12 }}>{exam.subject}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                  {exam.class && <div style={{ fontSize:12, color:"#64748B" }}>🏫 Class {exam.class}{exam.section ? `-${exam.section}` : ""}</div>}
                  <div style={{ fontSize:12, color:"#64748B" }}>📅 {fmtDate(exam.date)}</div>
                  {(exam.startTime || exam.endTime) && <div style={{ fontSize:12, color:"#64748B" }}>🕐 {exam.startTime} - {exam.endTime}</div>}
                  {exam.totalMarks && <div style={{ fontSize:12, color:"#64748B" }}>📊 Total Marks: {exam.totalMarks}</div>}
                  {exam.venue && <div style={{ fontSize:12, color:"#64748B" }}>📍 {exam.venue}</div>}
                </div>
                <div style={{ display:"flex", gap:8, borderTop:"1px solid #F1F5F9", paddingTop:12 }}>
                  <button className="act-btn" onClick={() => openEdit(exam)}
                    style={{ flex:1, padding:"8px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:12, fontWeight:700, cursor:"pointer" }}>Edit</button>
                  <button className="act-btn" onClick={() => setDeleteId(exam._id)}
                    style={{ padding:"8px 14px", borderRadius:10, border:"none", background:"#FEF2F2", color:"#DC2626", fontSize:12, fontWeight:700, cursor:"pointer" }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editExam ? "Edit Exam" : "Schedule New Exam"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {inp("EXAM TITLE","title","text","e.g. Mathematics Mid Term")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {sel("EXAM TYPE","examType",EXAM_TYPES)}
            {inp("SUBJECT","subject","text","e.g. Mathematics")}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {inp("CLASS","class","text","e.g. 10")}
            {inp("SECTION","section","text","e.g. A")}
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
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>INSTRUCTIONS</div>
            <textarea value={form.instructions||""} onChange={e => f("instructions", e.target.value)} placeholder="Special instructions..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:70 }} />
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#F97316,#EF4444)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : "Save Exam"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Exam">
        <div style={{ textAlign:"center", padding:"8px 0 24px" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>Delete this exam?</div>
          <div style={{ fontSize:13, color:"#94A3B8", marginBottom:24 }}>This exam will be permanently removed.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setDeleteId(null)} style={{ padding:"10px 28px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={() => handleDelete(deleteId)} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#EF4444,#DC2626)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
