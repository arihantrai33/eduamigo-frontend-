import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const CLASS_COLORS = {
  "1":"#F43F5E","2":"#F97316","3":"#EAB308","4":"#22C55E","5":"#14B8A6",
  "6":"#06B6D4","7":"#3B82F6","8":"#6366F1","9":"#8B5CF6","10":"#EC4899",
  "11":"#F43F5E","12":"#0EA5E9"
};
const getClassColor = (cls) => CLASS_COLORS[String(cls)] || "#6366F1";

const FEE_BADGE = {
  Paid:    { bg:"#F0FDF4", color:"#15803D", dot:"#22C55E" },
  Pending: { bg:"#FEF9C3", color:"#854D0E", dot:"#EAB308" },
  Partial: { bg:"#FFF7ED", color:"#C2410C", dot:"#F97316" },
};

function StatCard({ label, value, icon, gradient, delay, border }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof value !== "number") return;
    let start = 0;
    const step = Math.ceil(value / 20);
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(t); }
      else setCount(start);
    }, 40);
    return () => clearInterval(t);
  }, [value]);

  return (
    <div style={{ background:"white", borderRadius:20, padding:"20px 24px", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", position:"relative", overflow:"hidden", animation:`fadeSlideUp 0.5s ease ${delay}s both`, cursor:"default", border:`2px solid ${border}` }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"} >
      <div style={{ position:"absolute", top:-20, right:-20, width:90, height:90, borderRadius:"50%", background:gradient, opacity:0.08 }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:10 }}>{label}</div>
          <div style={{ fontSize:32, fontWeight:900, color:"#0F172A", letterSpacing:"-1px" }}>
            {typeof value === "number" ? count : value}
          </div>
        </div>
        <div style={{ width:44, height:44, borderRadius:14, background:gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:`0 4px 14px ${gradient}44` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, photo, size=38 }) {
  const colors = ["#6366F1","#8B5CF6","#EC4899","#F43F5E","#F97316","#EAB308","#22C55E","#14B8A6","#06B6D4","#3B82F6"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const initials = name ? name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() : "?";
  if (photo) return <img src={photo} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border:"2px solid white", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}BB)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32, fontWeight:800, color:"white", border:"2px solid white", boxShadow:`0 2px 8px ${color}44`, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)", animation:"fadeIn 0.2s ease" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:520, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StudentForm({ form, setForm, onSave, loading, onClose }) {
  const f = (k,v) => setForm(p => ({ ...p, [k]:v }));
  const inp = (label, key, type="text", placeholder="") => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <input type={type} value={form[key]||""} onChange={e=>f(key,e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border 0.2s" }}
        onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
    </div>
  );
  const sel = (label, key, options) => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <select value={form[key]||""} onChange={e=>f(key,e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white", fontFamily:"inherit" }}>
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#6366F1", marginBottom:2, letterSpacing:"0.06em" }}>PERSONAL INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {inp("FULL NAME","name","text","e.g. Rahul Sharma")}
        {inp("EMAIL","email","email","student@school.com")}
        {inp("PHONE","phone","tel","10-digit number")}
        {inp("DATE OF BIRTH","dob","date")}
      </div>
      {sel("GENDER","gender",["Male","Female","Other"])}
      <div style={{ height:1, background:"#F1F5F9", margin:"4px 0" }} />
      <div style={{ fontSize:12, fontWeight:700, color:"#6366F1", marginBottom:2, letterSpacing:"0.06em" }}>ACADEMIC INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {inp("CLASS","class","text","e.g. 10")}
        {inp("SECTION","section","text","e.g. A")}
        {inp("ROLL NUMBER","rollNumber","text","e.g. 23")}
      </div>
      <div style={{ height:1, background:"#F1F5F9", margin:"4px 0" }} />
      <div style={{ fontSize:12, fontWeight:700, color:"#6366F1", marginBottom:2, letterSpacing:"0.06em" }}>PARENT INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {inp("PARENT NAME","parentName","text","e.g. Rajesh Sharma")}
        {inp("PARENT PHONE","parentPhone","tel","10-digit number")}
        {inp("PARENT EMAIL","parentEmail","email","parent@email.com")}
        {sel("FEE STATUS","feeStatus",["Paid","Pending","Partial"])}
      </div>
      <div style={{ display:"flex", gap:10, marginTop:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
        <button onClick={onSave} disabled={loading} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(99,102,241,0.4)", opacity:loading?0.7:1 }}>
          {loading ? "Saving..." : "Save Student"}
        </button>
      </div>
    </div>
  );
}

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterFee, setFilterFee] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/students`, auth());
      setStudents(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => { setEditStudent(null); setForm({}); setShowModal(true); };
  const openEdit = (s) => { setEditStudent(s); setForm({...s}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.class || !form.section || !form.rollNumber) return alert("Name, class, section, roll number required");
    setSaving(true);
    try {
      if (editStudent) await axios.put(`${API}/students/${editStudent._id}`, form, auth());
      else await axios.post(`${API}/students`, form, auth());
      setShowModal(false);
      fetchStudents();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/students/${id}`, auth()); fetchStudents(); }
    catch(e) {}
    setDeleteId(null);
  };

  const classes = [...new Set(students.map(s => s.class))].sort();
  const filtered = students.filter(s =>
    (!search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.includes(search)) &&
    (!filterClass || s.class === filterClass) &&
    (!filterFee || s.feeStatus === filterFee)
  );

  const stats = {
    total: students.length,
    paid: students.filter(s => s.feeStatus === "Paid").length,
    pending: students.filter(s => s.feeStatus === "Pending").length,
    partial: students.filter(s => s.feeStatus === "Partial").length,
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .row-hover:hover { background: linear-gradient(90deg,#F8FAFF,#F5F3FF) !important; transform: translateX(2px); }
        .row-hover { transition: all 0.15s ease; }
        .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .action-btn { transition: all 0.15s ease; }
      `}</style>

      <div style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6,#A78BFA)", borderRadius:20, padding:"28px 32px", marginBottom:28, position:"relative", overflow:"hidden", animation:"fadeSlideUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
        <div>
          <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Students</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Manage all enrolled students · {students.length} total</div>
        </div>
        <button onClick={openAdd}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 4px 20px rgba(99,102,241,0.4)", transition:"all 0.2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
          <span style={{ fontSize:18 }}>+</span> Add Student
        </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        <StatCard label="TOTAL STUDENTS" value={stats.total} icon="��" gradient="linear-gradient(135deg,#6366F1,#8B5CF6)" delay={0} border="#6366F1" />
        <StatCard label="FEE PAID" value={stats.paid} icon="✅" gradient="linear-gradient(135deg,#10B981,#059669)" delay={0.08} border="#10B981" />
        <StatCard label="FEE PENDING" value={stats.pending} icon="⏳" gradient="linear-gradient(135deg,#F59E0B,#D97706)" delay={0.16} border="#F59E0B" />
        <StatCard label="PARTIAL" value={stats.partial} icon="⚡" gradient="linear-gradient(135deg,#F97316,#EA580C)" delay={0.24} border="#F97316" />
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", animation:"fadeSlideUp 0.5s ease 0.1s both" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94A3B8" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email or roll number..."
            style={{ width:"100%", padding:"11px 14px 11px 40px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border 0.2s", background:"white" }}
            onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
        </div>
        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={filterFee} onChange={e=>setFilterFee(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Fee Status</option>
          {["Paid","Pending","Partial"].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, whiteSpace:"nowrap" }}>{filtered.length} of {students.length}</div>
      </div>

      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeSlideUp 0.5s ease 0.15s both" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Student","Roll No","Class","Parent","Phone","Fee Status","Actions"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #6366F1", animation:"spin 0.8s linear infinite" }} />
                  <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading students...</div>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No students found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Try adjusting your filters</div>
              </td></tr>
            ) : filtered.map((s, i) => {
              const fee = FEE_BADGE[s.feeStatus] || FEE_BADGE.Pending;
              const clsColor = getClassColor(s.class);
              return (
                <tr key={s._id} className="row-hover" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeSlideUp 0.3s ease ${i*0.04}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Avatar name={s.name} photo={s.photo} size={40} />
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", cursor:"pointer" }}
                          onClick={() => navigate(`/admin/student-profile/${s._id}`)}
                          onMouseEnter={e=>e.target.style.color="#6366F1"} onMouseLeave={e=>e.target.style.color="#0F172A"}>
                          {s.name}
                        </div>
                        <div style={{ fontSize:12, color:"#94A3B8", marginTop:1 }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#374151", background:"#F8FAFC", padding:"4px 10px", borderRadius:8, border:"1px solid #E2E8F0" }}>#{s.rollNumber}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:800, padding:"5px 12px", borderRadius:20, background:`${clsColor}15`, color:clsColor, border:`1px solid ${clsColor}30` }}>
                      {s.class}-{s.section}
                    </span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{s.parentName || "—"}</div>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>{s.parentEmail}</div>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{s.phone}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:fee.bg, width:"fit-content" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:fee.dot }} />
                      <span style={{ fontSize:12, fontWeight:700, color:fee.color }}>{s.feeStatus || "Pending"}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="action-btn" onClick={() => navigate(`/admin/student-profile/${s._id}`)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#EEF2FF", color:"#6366F1", fontSize:12, fontWeight:700, cursor:"pointer" }}>View</button>
                      <button className="action-btn" onClick={() => openEdit(s)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:12, fontWeight:700, cursor:"pointer" }}>Edit</button>
                      <button className="action-btn" onClick={() => setDeleteId(s._id)}
                        style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#FEF2F2", color:"#DC2626", fontSize:12, fontWeight:700, cursor:"pointer" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editStudent ? "Edit Student" : "Add New Student"}>
        <StudentForm form={form} setForm={setForm} onSave={handleSave} loading={saving} onClose={() => setShowModal(false)} />
      </Modal>

      <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Student">
        <div style={{ textAlign:"center", padding:"8px 0 24px" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>Are you sure?</div>
          <div style={{ fontSize:13, color:"#94A3B8", marginBottom:24 }}>This action cannot be undone.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setDeleteId(null)} style={{ padding:"10px 28px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={() => handleDelete(deleteId)} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#EF4444,#DC2626)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(239,68,68,0.4)" }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
