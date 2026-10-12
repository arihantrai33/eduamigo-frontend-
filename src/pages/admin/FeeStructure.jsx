import { useState, useEffect } from "react";
import axios from "axios";
import { toast, confirmAction, errorMessage } from "../../utils/toast";
import { currentAcademicYear } from "../../utils/academicYear";

import Glyph from "../../components/Glyph";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const FEE_TYPES = ["Tuition Fee","Admission Fee","Exam Fee","Library Fee","Sports Fee","Transport Fee","Hostel Fee","Miscellaneous"];
const CLASS_COLORS = ["#6366F1","#8B5CF6","#EC4899","#F43F5E","#F97316","#EAB308","#22C55E","#14B8A6","#06B6D4","#3B82F6","#10B981","#F43F5E"];

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

export default function FeeStructure() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterClass, setFilterClass] = useState("");
  const emptyForm = () => ({ class:"", section:"All", academicYear: currentAcademicYear(), feeType:"Tuition Fee", amount:"", dueDate:"", description:"" });
  const [form, setForm] = useState(emptyForm);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => { fetchStructures(); }, []);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/fee-structures`, auth());
      setStructures(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => { setEditItem(null); setForm(emptyForm()); setShowModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ ...s, dueDate: s.dueDate ? new Date(s.dueDate).toISOString().slice(0, 10) : "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.class || !form.feeType || !form.amount || !form.dueDate || !form.academicYear) return toast.error("Class, fee type, amount, due date and academic year are required");
    setSaving(true);
    try {
      const payload = { class: form.class, section: form.section || "All", academicYear: form.academicYear, feeType: form.feeType, amount: Number(form.amount), dueDate: form.dueDate, description: form.description };
      if (editItem) {
        // Updating also updates every unpaid fee already billed from this structure.
        await axios.put(`${API}/fee-structures/${editItem._id}/reapply`, payload, auth());
        toast.success("Fee structure updated");
      } else {
        await axios.post(`${API}/fee-structures`, payload, auth());
        toast.success("Fee structure created. Use Apply to bill the students.");
      }
      setShowModal(false);
      fetchStructures();
    } catch(e) { toast.error(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/fee-structures/${id}`, auth()); toast.success("Fee structure deleted"); fetchStructures(); }
    catch (e) { toast.error(errorMessage(e)); }
    setDeleteId(null);
  };

  // Creates a fee record for every active student of the class (students already billed are skipped).
  const handleApply = async (s) => {
    if (!(await confirmAction(`Bill Rs.${Number(s.amount).toLocaleString()} (${s.feeType}) to every student of Class ${s.class}${s.section && s.section !== "All" ? `-${s.section}` : ""}?`, { confirmLabel: "Apply", danger: false }))) return;
    setApplyingId(s._id);
    try {
      const r = await axios.post(`${API}/fee-structures/${s._id}/apply`, {}, auth());
      toast.success(r.data.message);
      fetchStructures();
    } catch (e) { toast.error(errorMessage(e)); }
    setApplyingId(null);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const classes = [...new Set(structures.map(s => s.class))].sort();
  const filtered = structures.filter(s => !filterClass || s.class === filterClass);
  const totalAmount = filtered.reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const inp = (label, key, type="text", placeholder="") => (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
      <input type={type} value={form[key]||""} onChange={e => f(key, e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
        onFocus={e => e.target.style.borderColor="#06B6D4"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
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
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .fee-row:hover { background:#F0FDFF !important; transform:translateX(2px); }
        .fee-row { transition: all 0.15s ease; }
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); }
      `}</style>

      <div style={{ background:"linear-gradient(135deg,#06B6D4,#0EA5E9,#3B82F6)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Fee Structure</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Define and manage fee categories for each class</div>
          </div>
          <button onClick={openAdd}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:14, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.2)"}>
            + Add Fee
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL STRUCTURES", value: structures.length,    icon:<Glyph e="📋" />, border:"var(--brand)", bg:"var(--brand-soft)" },
          { label:"CLASSES COVERED",  value: classes.length,       icon:<Glyph e="🏫" />, border:"#10B981", bg:"#F0FDF4" },
          { label:"FEE TYPES",        value: [...new Set(structures.map(s=>s.feeType))].length, icon:<Glyph e="🏷" />, border:"#F59E0B", bg:"#FFFBEB" },
          { label:"TOTAL AMOUNT",     value: `₹${totalAmount.toLocaleString()}`, icon:<Glyph e="💰" />, border:"#06B6D4", bg:"#ECFEFF" },
        ].map((card, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:24, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:160 }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>{filtered.length} structures</div>
      </div>

      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Class","Fee Type","Amount","Academic Year","Due Date","Description","Actions"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #06B6D4", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13 }}>Loading...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}><Glyph e="💰" /></div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No fee structures found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Click "Add Fee" to get started</div>
              </td></tr>
            ) : filtered.map((s, i) => {
              const clsColor = CLASS_COLORS[parseInt(s.class) % CLASS_COLORS.length] || "var(--brand)";
              return (
                <tr key={s._id} className="fee-row" style={{ borderBottom:"1px solid #F1F5F9" }}>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:800, padding:"5px 12px", borderRadius:20, background:`color-mix(in srgb, ${clsColor} 8%, transparent)`, color:clsColor, border:`1px solid color-mix(in srgb, ${clsColor} 19%, transparent)` }}>Class {s.class}{s.section && s.section !== "All" ? `-${s.section}` : ""}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{s.feeType}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:15, fontWeight:800, color:"#059669" }}>Rs.{Number(s.amount||0).toLocaleString()}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:8, background:"var(--brand-soft)", color:"var(--brand)" }}>{s.academicYear}</span>
                    {s.applyHistory?.length > 0 && <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>Billed {s.applyHistory.reduce((n, h) => n + (h.created || 0), 0)} student(s)</div>}
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{s.dueDate ? (isNaN(new Date(s.dueDate)) ? s.dueDate : new Date(s.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})) : 'Not set'}</td>
                  <td style={{ padding:"14px 18px", fontSize:12, color:"#94A3B8", maxWidth:180 }}>{s.description || "No description"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="act-btn" onClick={() => handleApply(s)} disabled={applyingId === s._id}
                        style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#ECFDF5", color:"#047857", fontSize:12, fontWeight:700, cursor:"pointer" }}>{applyingId === s._id ? "Applying..." : "Apply"}</button>
                      <button className="act-btn" onClick={() => openEdit(s)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:12, fontWeight:700, cursor:"pointer" }}>Edit</button>
                      <button className="act-btn" onClick={() => setDeleteId(s._id)}
                        style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#FEF2F2", color:"#DC2626", fontSize:12, fontWeight:700, cursor:"pointer" }}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editItem ? "Edit Fee Structure" : "Add Fee Structure"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {inp("CLASS","class","text","e.g. 10")}
            {inp("SECTION","section","text","All, or e.g. A")}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {sel("FEE TYPE","feeType",FEE_TYPES)}
            {sel("ACADEMIC YEAR","academicYear",(() => { const y = Number(currentAcademicYear().slice(0, 4)); return [y - 1, y, y + 1].map(v => `${v}-${String((v + 1) % 100).padStart(2, "0")}`); })())}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {inp("AMOUNT (Rs.)","amount","number","e.g. 5000")}
            {inp("DUE DATE","dueDate","date","")}
          </div>
          <div style={{ fontSize:12, color:"#64748B" }}>For monthly or quarterly fees, add one structure per instalment (for example "Tuition Fee - April").</div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>DESCRIPTION</div>
            <textarea value={form.description||""} onChange={e => f("description", e.target.value)} placeholder="Optional..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:70 }} />
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#06B6D4,#0EA5E9)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Fee Structure">
        <div style={{ textAlign:"center", padding:"8px 0 24px" }}>
          <div style={{ fontSize:52, marginBottom:16 }}><Glyph e="🗑" /></div>
          <div style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>Are you sure?</div>
          <div style={{ fontSize:13, color:"#94A3B8", marginBottom:24 }}>This fee structure will be permanently deleted.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setDeleteId(null)} style={{ padding:"10px 28px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={() => handleDelete(deleteId)} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#EF4444,#DC2626)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
