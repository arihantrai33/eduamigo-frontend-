import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const SUBJECT_COLORS = {
  "Math":        "#6366F1", "Science":     "#10B981", "English":     "#F59E0B",
  "Hindi":       "#EC4899", "History":     "#F97316", "Geography":   "#14B8A6",
  "Physics":     "#8B5CF6", "Chemistry":   "#EF4444", "Biology":     "#22C55E",
  "Computer":    "#06B6D4", "Economics":   "#F43F5E", "Commerce":    "#3B82F6",
  "default":     "#94A3B8"
};
const getSubjectColor = (sub) => SUBJECT_COLORS[sub] || SUBJECT_COLORS.default;

const STATUS_CONFIG = {
  Active:   { bg: "#F0FDF4", color: "#15803D", dot: "#22C55E" },
  Inactive: { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  "On Leave": { bg: "#FFFBEB", color: "#D97706", dot: "#F59E0B" },
};

function Avatar({ name, photo, size = 40 }) {
  const colors = ["#6366F1","#8B5CF6","#EC4899","#F43F5E","#F97316","#22C55E","#14B8A6","#06B6D4","#3B82F6","#EAB308"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() : "?";
  if (photo) return <img src={photo} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border:"2px solid white", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}BB)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32, fontWeight:800, color:"white", border:"2px solid white", boxShadow:`0 2px 8px ${color}44`, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, icon, color, border, delay }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof value !== "number") return;
    let start = 0;
    const step = Math.ceil(value / 20) || 1;
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(t); }
      else setCount(start);
    }, 40);
    return () => clearInterval(t);
  }, [value]);
  return (
    <div style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${border}`, position:"relative", overflow:"hidden", animation:`fadeUp 0.5s ease ${delay}s both` }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:color, opacity:0.1 }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:28, fontWeight:900, color:"#0F172A" }}>{typeof value === "number" ? count : value}</div>
        </div>
        <div style={{ width:42, height:42, borderRadius:12, background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>
      </div>
    </div>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)", animation:"fadeIn 0.2s ease" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:540, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TeacherForm({ form, setForm, onSave, loading, onClose }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inp = (label, key, type="text", placeholder="") => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <input type={type} value={form[key]||""} onChange={e => f(key, e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border 0.2s" }}
        onFocus={e => e.target.style.borderColor="#10B981"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
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
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#10B981", letterSpacing:"0.06em" }}>PERSONAL INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {inp("FULL NAME","name","text","e.g. Priya Sharma")}
        {inp("EMAIL","email","email","teacher@school.com")}
        {inp("PHONE","phone","tel","10-digit number")}
        {inp("EMPLOYEE ID","employeeId","text","e.g. TCH001")}
      </div>
      {sel("GENDER","gender",["Male","Female","Other"])}
      <div style={{ height:1, background:"#F1F5F9", margin:"4px 0" }} />
      <div style={{ fontSize:12, fontWeight:700, color:"#10B981", letterSpacing:"0.06em" }}>PROFESSIONAL INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {inp("SUBJECTS","subjects","text","e.g. Math, Science")}
        {inp("QUALIFICATION","qualification","text","e.g. B.Ed, M.Sc")}
        {inp("EXPERIENCE (years)","experience","number","e.g. 5")}
        {sel("STATUS","status",["Active","Inactive","On Leave"])}
      </div>
      {inp("PASSWORD","password","password","Login password")}
      <div style={{ display:"flex", gap:10, marginTop:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
        <button onClick={onSave} disabled={loading} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(16,185,129,0.4)", opacity:loading?0.7:1 }}>
          {loading ? "Saving..." : "Save Teacher"}
        </button>
      </div>
    </div>
  );
}

export default function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/teachers`, auth());
      setTeachers(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => { setEditTeacher(null); setForm({ status:"Active" }); setShowModal(true); };
  const openEdit = (t) => { setEditTeacher(t); setForm({...t}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.employeeId) return alert("Name, email and employee ID required");
    setSaving(true);
    try {
      if (editTeacher) await axios.put(`${API}/teachers/${editTeacher._id}`, form, auth());
      else await axios.post(`${API}/teachers`, form, auth());
      setShowModal(false);
      fetchTeachers();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/teachers/${id}`, auth()); fetchTeachers(); }
    catch(e) {}
    setDeleteId(null);
  };

  const allSubjects = [...new Set(teachers.flatMap(t => (t.subjects||"").split(",").map(s => s.trim()).filter(Boolean)))].sort();

  const filtered = teachers.filter(t =>
    (!search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase()) || t.employeeId?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || t.status === filterStatus) &&
    (!filterSubject || (t.subjects||"").includes(filterSubject))
  );

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === "Active" || !t.status).length,
    onLeave: teachers.filter(t => t.status === "On Leave").length,
    inactive: teachers.filter(t => t.status === "Inactive").length,
  };

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .t-row:hover { background: linear-gradient(90deg,#F0FDF8,#ECFDF5) !important; transform:translateX(2px); }
        .t-row { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .act-btn { transition: all 0.15s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#10B981,#059669,#047857)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Teachers</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Manage all teaching staff · {teachers.length} total</div>
          </div>
          <button onClick={openAdd}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:14, border:"none", background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", backdropFilter:"blur(8px)", transition:"all 0.2s", border:"1px solid rgba(255,255,255,0.3)" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.2)"}>
            <span style={{ fontSize:18 }}>+</span> Add Teacher
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <StatCard label="TOTAL TEACHERS" value={stats.total}    icon="👩‍🏫" color="#EEF2FF" border="#6366F1" delay={0} />
        <StatCard label="ACTIVE"         value={stats.active}   icon="✅"   color="#F0FDF4" border="#10B981" delay={0.08} />
        <StatCard label="ON LEAVE"       value={stats.onLeave}  icon="🌴"   color="#FFFBEB" border="#F59E0B" delay={0.16} />
        <StatCard label="INACTIVE"       value={stats.inactive} icon="⛔"   color="#FEF2F2" border="#EF4444" delay={0.24} />
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", animation:"fadeUp 0.5s ease 0.1s both" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94A3B8" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or employee ID..."
            style={{ width:"100%", padding:"11px 14px 11px 40px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
            onFocus={e => e.target.style.borderColor="#10B981"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Status</option>
          {["Active","On Leave","Inactive"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Subjects</option>
          {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, whiteSpace:"nowrap" }}>{filtered.length} of {teachers.length}</div>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Teacher","Employee ID","Subjects","Qualification","Experience","Status","Actions"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #10B981", animation:"spin 0.8s linear infinite" }} />
                  <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading teachers...</div>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No teachers found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Try adjusting your filters</div>
              </td></tr>
            ) : filtered.map((t, i) => {
              const status = t.status || "Active";
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Active;
              const subjects = (t.subjects||"").split(",").map(s => s.trim()).filter(Boolean);
              return (
                <tr key={t._id} className="t-row" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Avatar name={t.name} photo={t.photo} size={40} />
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", cursor:"pointer" }}
                          onClick={() => navigate(`/admin/teachers/${t._id}`)}
                          onMouseEnter={e => e.target.style.color="#10B981"} onMouseLeave={e => e.target.style.color="#0F172A"}>
                          {t.name}
                        </div>
                        <div style={{ fontSize:12, color:"#94A3B8", marginTop:1 }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#374151", background:"#F8FAFC", padding:"4px 10px", borderRadius:8, border:"1px solid #E2E8F0" }}>{t.employeeId || "—"}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {subjects.slice(0,3).map((s,j) => (
                        <span key={j} style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6, background:`${getSubjectColor(s)}18`, color:getSubjectColor(s), border:`1px solid ${getSubjectColor(s)}30` }}>{s}</span>
                      ))}
                      {subjects.length > 3 && <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>+{subjects.length-3}</span>}
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{t.qualification || "—"}</td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{t.experience ? `${t.experience} yrs` : "—"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:cfg.bg, width:"fit-content" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />
                      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{status}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="act-btn" onClick={() => navigate(`/admin/teachers/${t._id}`)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#ECFDF5", color:"#059669", fontSize:12, fontWeight:700, cursor:"pointer" }}>View</button>
                      <button className="act-btn" onClick={() => openEdit(t)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:12, fontWeight:700, cursor:"pointer" }}>Edit</button>
                      <button className="act-btn" onClick={() => setDeleteId(t._id)}
                        style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#FEF2F2", color:"#DC2626", fontSize:12, fontWeight:700, cursor:"pointer" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editTeacher ? "Edit Teacher" : "Add New Teacher"}>
        <TeacherForm form={form} setForm={setForm} onSave={handleSave} loading={saving} onClose={() => setShowModal(false)} />
      </Modal>

      <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Teacher">
        <div style={{ textAlign:"center", padding:"8px 0 24px" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>Are you sure?</div>
          <div style={{ fontSize:13, color:"#94A3B8", marginBottom:24 }}>This teacher record will be permanently deleted.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setDeleteId(null)} style={{ padding:"10px 28px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={() => handleDelete(deleteId)} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#EF4444,#DC2626)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(239,68,68,0.4)" }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
