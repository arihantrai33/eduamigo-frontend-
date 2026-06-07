import { useState, useEffect } from "react";
import axios from "axios";

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
  const [form, setForm] = useState({ class:"", feeType:"Tuition Fee", amount:"", frequency:"Monthly", dueDate:"", description:"" });

  useEffect(() => { fetchStructures(); }, []);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/fee-structures`, auth());
      setStructures(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => { setEditItem(null); setForm({ class:"", feeType:"Tuition Fee", amount:"", frequency:"Monthly", dueDate:"", description:"" }); setShowModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({...s}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.class || !form.feeType || !form.amount) return alert("Class, fee type and amount required");
    setSaving(true);
    try {
      if (editItem) await axios.put(`${API}/fee-structures/${editItem._id}`, form, auth());
      else await axios.post(`${API}/fee-structures`, form, auth());
      setShowModal(false);
      fetchStructures();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/fee-structures/${id}`, auth()); fetchStructures(); }
    catch(e) {}
    setDeleteId(null);
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
    <div style={{ fontFamily:"Inter,sans-serif" }}>
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
          { label:"TOTAL STRUCTURES", value: structures.length,    icon:"📋", border:"#6366F1", bg:"#EEF2FF" },
          { label:"CLASSES COVERED",  value: classes.length,       icon:"🏫", border:"#10B981", bg:"#F0FDF4" },
          { label:"FEE TYPES",        value: [...new Set(structures.map(s=>s.feeType))].length, icon:"🏷️", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"TOTAL AMOUNT",     value: `₹${totalAmount.toLocaleString()}`, icon:"💰", border:"#06B6D4", bg:"#ECFEFF" },
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
              {["Class","Fee Type","Amount","Frequency","Due Date","Description","Actions"].map(h => (
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
                <div style={{ fontSize:48, marginBottom:12 }}>💰</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No fee structures found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Click "Add Fee" to get started</div>
              </td></tr>
            ) : filtered.map((s, i) => {
              const clsColor = CLASS_COLORS[parseInt(s.class) % CLASS_COLORS.length] || "#6366F1";
              return (
                <tr key={s._id} className="fee-row" style={{ borderBottom:"1px solid #F1F5F9" }}>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:800, padding:"5px 12px", borderRadius:20, background:`${clsColor}15`, color:clsColor, border:`1px solid ${clsColor}30` }}>Class {s.class}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{s.feeType}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:15, fontWeight:800, color:"#059669" }}>Rs.{Number(s.amount||0).toLocaleString()}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:8, background:"#EEF2FF", color:"#6366F1" }}>{s.frequency || "Monthly"}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{s.dueDate ? (isNaN(new Date(s.dueDate)) ? s.dueDate : new Date(s.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})) : 'Not set'}</td>
                  <td style={{ padding:"14px 18px", fontSize:12, color:"#94A3B8", maxWidth:180 }}>{s.description || "No description"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
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
            {sel("FEE TYPE","feeType",FEE_TYPES)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {inp("AMOUNT","amount","number","e.g. 5000")}
            {sel("FREQUENCY","frequency",["Monthly","Quarterly","Half-Yearly","Annually","One-Time"])}
          </div>
          {inp("DUE DATE","dueDate","text","e.g. 10th of every month")}
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
          <div style={{ fontSize:52, marginBottom:16 }}>🗑️</div>
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
