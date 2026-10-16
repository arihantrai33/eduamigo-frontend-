import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, showCredentials, errorMessage } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import { can } from "../../utils/permissions";
import { todayLocal } from "../../utils/dates";
import EmptyState from "../../components/ui/EmptyState";

import { Plus, SearchX } from "lucide-react";
import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard as SharedStat, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
import Avatar from "../../components/ui/Avatar";
import Skeleton from "../../components/ui/Skeleton";
import SearchField from "../../components/ui/SearchField";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });


const FEE_BADGE = {
  Paid:    { bg:"#F0FDF4", color:"#15803D", dot:"#22C55E" },
  Pending: { bg:"#FEF9C3", color:"#854D0E", dot:"#EAB308" },
  Partial: { bg:"#FFF7ED", color:"#C2410C", dot:"#F97316" },
  "Not billed": { bg:"#F1F5F9", color:"var(--ea-muted)", dot:"#94A3B8" },
};

// The shared stat card; the border colour this screen passes becomes the card's status tone.
const StatCard = ({ label, value, icon, border }) => <SharedStat label={label} value={value} icon={icon} tone={toneOf(border)} />;


function StudentForm({ form, setForm, onSave, loading, onClose }) {
  const f = (k,v) => setForm(p => ({ ...p, [k]:v }));
  const inp = (label, key, type="text", placeholder="") => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <input type={type} value={type === "date" ? String(form[key]||"").slice(0, 10) : form[key]||""} onChange={e=>f(key,e.target.value)} placeholder={placeholder}
        max={type === "date" ? todayLocal() : undefined}
        style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border 0.2s" }}
        onFocus={e=>e.target.style.borderColor="var(--brand)"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
    </div>
  );
  const sel = (label, key, options) => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <select value={form[key]||""} onChange={e=>f(key,e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white", fontFamily:"inherit" }}>
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    f('photoFile', file);
    f('photoPreview', URL.createObjectURL(file));
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", overflow: "hidden",
          background: "#F1F5F9", border: "1.5px solid #E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {(form.photoPreview || form.photo) ? (
            <img src={form.photoPreview || form.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <span style={{ fontSize: 22, color: "var(--ea-muted)" }}><Glyph e="👤" /></span>
          )}
        </div>
        <div>
          <label style={{
            display: "inline-block", padding: "8px 16px", borderRadius: 10,
            border: "1.5px solid #E2E8F0", background: "white",
            fontSize: 12, fontWeight: 700, color: "var(--brand-text)", cursor: "pointer",
          }}>
            {form.photoFile ? "Change Photo" : "Upload Photo"}
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </label>
          <div style={{ fontSize: 11, color: "var(--ea-muted)", marginTop: 6 }}>Optional. JPG or PNG, up to 5MB.</div>
        </div>
      </div>
      <div style={{ height:1, background:"#F1F5F9", margin:"4px 0" }} />
      <div style={{ fontSize:12, fontWeight:700, color:"var(--brand-text)", marginBottom:2, letterSpacing:"0.06em" }}>PERSONAL INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {inp("FULL NAME","name","text","e.g. Rahul Sharma")}
        {inp("EMAIL","email","email","student@school.com")}
        {inp("PHONE","phone","tel","10-digit number")}
        {inp("DATE OF BIRTH","dateOfBirth","date")}
      </div>
      {sel("GENDER","gender",["Male","Female","Other"])}
      <div style={{ height:1, background:"#F1F5F9", margin:"4px 0" }} />
      <div style={{ fontSize:12, fontWeight:700, color:"var(--brand-text)", marginBottom:2, letterSpacing:"0.06em" }}>ACADEMIC INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {inp("CLASS","class","text","e.g. 10")}
        {inp("SECTION","section","text","e.g. A")}
        {inp("ROLL NUMBER","rollNumber","text","e.g. 23")}
      </div>
      <div>
        {inp("DATE OF ADMISSION","admittedOn","date")}
        <div style={{ fontSize:11, color:"var(--ea-muted)", marginTop:5 }}>The day the school admitted the student. Leave empty if not known; it is printed on the transfer certificate.</div>
      </div>
      <div style={{ height:1, background:"#F1F5F9", margin:"4px 0" }} />
      <div style={{ fontSize:12, fontWeight:700, color:"var(--brand-text)", marginBottom:2, letterSpacing:"0.06em" }}>PARENT INFO</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {inp("PARENT NAME","parentName","text","e.g. Rajesh Sharma")}
        {inp("PARENT PHONE","parentPhone","tel","10-digit number")}
        {inp("PARENT EMAIL","parentEmail","email","parent@email.com")}
      </div>
      <div style={{ display:"flex", gap:10, marginTop:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--ea-muted)" }}>Cancel</button>
        <button onClick={onSave} disabled={loading} className="ea-btn ea-btn--primary">
          {loading ? "Saving..." : "Save Student"}
        </button>
      </div>
    </div>
  );
}

export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  // Accountants can view students but not add, edit or remove them.
  const canManage = can(user, "students.manage");
  const openEdit = (s) => { setEditStudent(s); setForm({...s}); setShowModal(true); };

  const showStudentCredentials = (data) => {
    const c = data?.credentials || {};
    showCredentials([
      c.student && { label: "Student", ...c.student },
      c.parent && { label: "Parent", ...c.parent },
    ], data?.linkedExistingParent ? "Student added (linked to existing parent account)" : "Student added");
  };

  const handleSave = async () => {
    if (!form.name || !form.class || !form.section) return toast.error("Name, class and section are required");
    setSaving(true);
    try {
      if (form.photoFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (['photoFile', 'photoPreview', '_id', '__v', 'createdAt', 'updatedAt', 'school', 'bus', 'userId', 'parentUserId', 'isActive'].includes(k)) return;
          if (v !== null && typeof v === 'object') return; // skip populated objects (school/bus/user refs)
          fd.append(k, v ?? "");
        });
        fd.append("photo", form.photoFile);
        if (editStudent) {
          await axios.put(`${API}/students/${editStudent._id}`, fd, {
            headers: { ...auth().headers, "Content-Type": "multipart/form-data" },
          });
        } else {
          const res = await axios.post(`${API}/students`, fd, {
            headers: { ...auth().headers, "Content-Type": "multipart/form-data" },
          });
          showStudentCredentials(res.data);
        }
      } else if (editStudent) {
        await axios.put(`${API}/students/${editStudent._id}`, form, auth());
      } else {
        const res = await axios.post(`${API}/students`, form, auth());
        showStudentCredentials(res.data);
      }
      setShowModal(false);
      fetchStudents();
    } catch(e) { toast.error(errorMessage(e, "Could not save the student")); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/students/${id}`, auth()); toast.success("Student deleted"); fetchStudents(); }
    catch(e) { toast.error(errorMessage(e, "Could not delete the student")); }
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
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .row-hover:hover { background: var(--ea-hover) !important; }
        .row-hover { transition: all 0.15s ease; }
        .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .action-btn { transition: all 0.15s ease; }
      `}</style>

      <div className="ea-page" style={{ marginBottom: 20 }}>
        <PageHeader title="Students" subtitle={`Manage all enrolled students · ${students.length} total`}
          actions={canManage && <button type="button" className="ea-btn ea-btn--primary" onClick={openAdd}><Plus size={16} aria-hidden="true" /> Add Student</button>} />

        <StatGrid>
          <StatCard label="TOTAL STUDENTS" value={stats.total} icon={<Glyph e="🎒" />} border="var(--brand)" />
          <StatCard label="FEE PAID" value={stats.paid} icon={<Glyph e="✅" />} border="#10B981" />
          <StatCard label="FEE PENDING" value={stats.pending} icon={<Glyph e="⏳" />} border="#F59E0B" />
          <StatCard label="PARTIAL" value={stats.partial} icon={<Glyph e="⚡" />} border="#F97316" />
        </StatGrid>

        <div className="ea-toolbar">
          <SearchField value={search} onChange={setSearch} label="Search students" placeholder="Search by name, email or roll number..." />
          <select className="ea-select" value={filterClass} onChange={e=>setFilterClass(e.target.value)} aria-label="Class">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select className="ea-select" value={filterFee} onChange={e=>setFilterFee(e.target.value)} aria-label="Fee status">
            <option value="">All Fee Status</option>
            {["Paid","Partial","Pending","Not billed"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <span className="ea-toolbar__count">{filtered.length} of {students.length}</span>
        </div>
      </div>

      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeSlideUp 0.5s ease 0.15s both" }}>
        <table data-stack style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"var(--ea-hover)" }}>
              {["Student","Roll No","Class","Parent","Phone","Fee Status","Actions"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--ea-muted)", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <Skeleton rows={4} label="Loading students" />
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 16 }}>
                <EmptyState plain icon={SearchX} title="No students found" text="Try adjusting your filters" />
              </td></tr>
            ) : filtered.map((s, i) => {
              const fee = FEE_BADGE[s.feeStatus] || FEE_BADGE["Not billed"];
              return (
                <tr key={s._id} className="row-hover" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeSlideUp 0.3s ease ${i*0.04}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Avatar name={s.name} photo={s.photo} alt={s.name} size="md" />
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", cursor:"pointer" }}
                          onClick={() => navigate(`/admin/students/${s._id}`)}
                          onMouseEnter={e=>e.target.style.color="var(--brand)"} onMouseLeave={e=>e.target.style.color="#0F172A"}>
                          {s.name}
                        </div>
                        <div style={{ fontSize:12, color:"var(--ea-muted)", marginTop:1 }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#374151", background:"#F8FAFC", padding:"4px 10px", borderRadius:8, border:"1px solid #E2E8F0" }}>#{s.rollNumber}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span className="ea-badge ea-badge--neutral">
                      {s.class}-{s.section}
                    </span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{s.parentName || "—"}</div>
                    <div style={{ fontSize:11, color:"var(--ea-muted)", marginTop:1 }}>{s.parentEmail}</div>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{s.phone}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:fee.bg, width:"fit-content" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:fee.dot }} />
                      <span style={{ fontSize:12, fontWeight:700, color:fee.color }}>{s.feeStatus || "Not billed"}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button type="button" className="action-btn" onClick={() => navigate(`/admin/students/${s._id}`)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"var(--brand-soft)", color:"var(--brand-text)", fontSize:12, fontWeight:700, cursor:"pointer" }}>View</button>
                      {canManage && <>
                      <button className="action-btn" onClick={() => openEdit(s)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:12, fontWeight:700, cursor:"pointer" }}>Edit</button>
                      <button type="button" className="action-btn" onClick={() => setDeleteId(s._id)} aria-label={`Delete ${s.name}`} title="Delete"
                        style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#FEF2F2", color:"#B91C1C", fontSize:12, fontWeight:700, cursor:"pointer" }}><Glyph e="🗑" /></button>
                      </>}
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
          <div style={{ fontSize:52, marginBottom:16 }}><Glyph e="🗑" /></div>
          <div style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>Are you sure?</div>
          <div style={{ fontSize:13, color:"var(--ea-muted)", marginBottom:24 }}>This action cannot be undone.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setDeleteId(null)} style={{ padding:"10px 28px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--ea-muted)" }}>Cancel</button>
            <button onClick={() => handleDelete(deleteId)} className="ea-btn ea-btn--danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
