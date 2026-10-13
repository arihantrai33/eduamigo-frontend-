import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, showCredentials, errorMessage } from "../../utils/toast";

import { Plus, Search } from "lucide-react";
import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard as SharedStat, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
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
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},color-mix(in srgb, ${color} 73%, transparent))`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32, fontWeight:800, color:"white", border:"2px solid white", boxShadow:`0 2px 8px color-mix(in srgb, ${color} 27%, transparent)`, flexShrink:0 }}>
      {initials}
    </div>
  );
}

// The shared stat card; the border colour this screen passes becomes the card's status tone.
const StatCard = ({ label, value, icon, border }) => <SharedStat label={label} value={value} icon={icon} tone={toneOf(border)} />;

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
  // "Edit Profile" on a teacher's profile opens this screen's edit form for that teacher.
  const editId = useLocation().state?.editId;
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
      const list = r.data.data || [];
      setTeachers(list);
      const toEdit = editId && list.find((t) => t._id === editId);
      if (toEdit) {
        setEditTeacher(toEdit); setForm({ ...toEdit }); setShowModal(true);
        navigate(".", { replace: true, state: null });   // a refresh does not reopen the form
      }
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => { setEditTeacher(null); setForm({ status:"Active" }); setShowModal(true); };
  const openEdit = (t) => { setEditTeacher(t); setForm({...t}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.employeeId) return toast.error("Name, email and employee ID required");
    setSaving(true);
    try {
      if (editTeacher) await axios.put(`${API}/teachers/${editTeacher._id}`, form, auth());
      else {
        const res = await axios.post(`${API}/teachers`, form, auth());
        showCredentials([{ label: "Teacher", ...res.data.credentials }], "Teacher added");
      }
      setShowModal(false);
      fetchTeachers();
    } catch(e) { toast.error(errorMessage(e, "Could not save the teacher")); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/teachers/${id}`, auth()); toast.success("Teacher deleted"); fetchTeachers(); }
    catch(e) { toast.error(errorMessage(e, "Could not delete the teacher")); }
    setDeleteId(null);
  };

  const allSubjects = [...new Set(teachers.flatMap(t => Array.isArray(t.subjects) ? t.subjects : (t.subjects||"").split(",").map(s => s.trim()).filter(Boolean)))].sort();

  const filtered = teachers.filter(t =>
    (!search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase()) || t.employeeId?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || t.status === filterStatus) &&
    (!filterSubject || (Array.isArray(t.subjects) ? t.subjects.join(",") : (t.subjects||"")).includes(filterSubject))
  );

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === "Active" || !t.status).length,
    onLeave: teachers.filter(t => t.status === "On Leave").length,
    inactive: teachers.filter(t => t.status === "Inactive").length,
  };

  return (
    <div style={{ fontFamily: "inherit" }}>
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
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Teachers" subtitle={`Manage all teaching staff · ${teachers.length} total`}
          actions={<button type="button" className="ea-btn ea-btn--primary" onClick={openAdd}><Plus size={16} aria-hidden="true" /> Add Teacher</button>} />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          <StatCard label="TOTAL TEACHERS" value={stats.total}    icon={<Glyph e="👩‍🏫" />} border="var(--brand)" />
          <StatCard label="ACTIVE"         value={stats.active}   icon={<Glyph e="✅" />}   border="#10B981" />
          <StatCard label="ON LEAVE"       value={stats.onLeave}  icon={<Glyph e="🌴" />}   border="#F59E0B" />
          <StatCard label="INACTIVE"       value={stats.inactive} icon={<Glyph e="⛔" />}   border="#EF4444" />
        </StatGrid>
      </div>

      {/* Filters */}
      <div className="ea-toolbar" style={{ marginBottom:20 }}>
        <div className="ea-search">
          <Search aria-hidden="true" />
          <input className="ea-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or employee ID..." aria-label="Search teachers" />
        </div>
        <select className="ea-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Status">
          <option value="">All Status</option>
          {["Active","On Leave","Inactive"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="ea-select" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} aria-label="Subject">
          <option value="">All Subjects</option>
          {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ea-toolbar__count">{filtered.length} of {teachers.length}</span>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table data-stack style={{ width:"100%", borderCollapse:"collapse" }}>
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
                <div style={{ fontSize:48, marginBottom:12 }}><Glyph e="🔍" /></div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No teachers found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Try adjusting your filters</div>
              </td></tr>
            ) : filtered.map((t, i) => {
              const status = t.status || "Active";
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Active;
              const subjects = Array.isArray(t.subjects) ? t.subjects : (t.subjects||"").split(",").map(s => s.trim()).filter(Boolean);
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
                        <span key={j} style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6, background:`color-mix(in srgb, ${getSubjectColor(s)} 9%, transparent)`, color:getSubjectColor(s), border:`1px solid color-mix(in srgb, ${getSubjectColor(s)} 19%, transparent)` }}>{s}</span>
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
                        style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#FEF2F2", color:"#DC2626", fontSize:12, fontWeight:700, cursor:"pointer" }}><Glyph e="🗑" /></button>
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
          <div style={{ fontSize:52, marginBottom:16 }}><Glyph e="🗑" /></div>
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
