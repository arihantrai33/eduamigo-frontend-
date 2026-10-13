import { useState, useEffect } from "react";
import axios from "axios";
import { toast, showCredentials } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import { can } from "../../utils/permissions";

import { Plus, Search } from "lucide-react";
import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export default function ParentsList() {
  const { user } = useAuth();
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", phone:"", gender:"", occupation:"", address:"", childrenIds:[] });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.allSettled([
        axios.get(`${API}/parents`, auth()),
        axios.get(`${API}/students`, auth()),
      ]);
      setParents(pRes.status === "fulfilled" ? (pRes.value.data.data || []) : []);
      setStudents(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const handleAddParent = async () => {
    if (!form.name || !form.email || !form.phone) return toast.error("Name, email and phone required");
    setSaving(true);
    try {
      const res = await axios.post(`${API}/parents`, { ...form, children: form.childrenIds }, auth());
      showCredentials([{ label: "Parent", ...res.data.credentials }], "Parent added");
      setShowAddModal(false);
      setForm({ name:"", email:"", phone:"", gender:"", occupation:"", address:"", childrenIds:[] });
      fetchAll();
    } catch(e) { toast.error(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const toggleChild = (id) => {
    setForm(p => ({
      ...p,
      childrenIds: p.childrenIds.includes(id) ? p.childrenIds.filter(c => c !== id) : [...p.childrenIds, id]
    }));
  };

  const filtered = parents.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) ||
    p.children?.some(c => c.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const withChildren = parents.filter(p => p.children?.length > 0).length;

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .parent-row:hover { background:#FFF7ED !important; transform:translateX(2px); cursor:pointer; }
        .parent-row { transition: all 0.15s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Parents" subtitle="All registered parent accounts linked to students"
          actions={can(user, "parents.manage") && <button type="button" className="ea-btn ea-btn--primary" onClick={() => setShowAddModal(true)}><Plus size={16} aria-hidden="true" /> Add Parent</button>} />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"TOTAL PARENTS",   value: parents.length,  icon:<Glyph e="👨‍👩‍👧" />, border:"var(--brand)" },
            { label:"WITH STUDENTS",   value: withChildren,    icon:<Glyph e="🔗" />, border:"var(--brand)" },
            { label:"ACTIVE",          value: parents.filter(p=>p.isActive).length, icon:<Glyph e="✅" />, border:"#10B981" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Search */}
      <div className="ea-toolbar" style={{ marginBottom:20 }}>
        <div className="ea-search">
          <Search aria-hidden="true" />
          <input className="ea-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by parent name, email, phone or child name..." aria-label="Search parents" />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Parent","Phone","Email","Occupation","Linked Students","Status"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #F59E0B", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading parents...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}><Glyph e="👨‍👩‍👧" /></div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No parents found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Add parents and link them to students</div>
              </td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p._id} className="parent-row" onClick={() => setSelectedParent(p)}
                style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                <td style={{ padding:"14px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#F59E0B,#F97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"white", flexShrink:0 }}>
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{p.name}</div>
                      {p.gender && <div style={{ fontSize:11, color:"#94A3B8" }}>{p.gender}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{p.phone || "—"}</td>
                <td style={{ padding:"14px 18px", fontSize:13, color:"#374151" }}>{p.email || "—"}</td>
                <td style={{ padding:"14px 18px", fontSize:13, color:"#374151" }}>{p.occupation || "—"}</td>
                <td style={{ padding:"14px 18px" }}>
                  {p.children?.length > 0 ? (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {p.children.map(child => (
                        <span key={child._id} style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"var(--brand-soft)", color:"var(--brand)", border:"1px solid var(--brand-border)" }}>
                          {child.name} · {child.class}{child.section ? `-${child.section}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize:12, color:"#CBD5E1", fontWeight:600 }}>No student linked</span>
                  )}
                </td>
                <td style={{ padding:"14px 18px" }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background: p.isActive ? "#F0FDF4" : "#FEF2F2", color: p.isActive ? "#15803D" : "#DC2626", border:`1px solid ${p.isActive ? "#BBF7D0" : "#FECACA"}` }}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal show={!!selectedParent} onClose={() => setSelectedParent(null)} title="Parent Details">
        {selectedParent && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Parent Info */}
            <div style={{ display:"flex", alignItems:"center", gap:16, padding:"16px", background:"linear-gradient(135deg,#FFF7ED,#FFFBEB)", borderRadius:14 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#F59E0B,#F97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"white" }}>
                {selectedParent.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{selectedParent.name}</div>
                <div style={{ fontSize:13, color:"#64748B" }}>{selectedParent.email}</div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                ["Phone", selectedParent.phone],
                ["Gender", selectedParent.gender],
                ["Occupation", selectedParent.occupation],
                ["Address", selectedParent.address],
              ].map(([label, value]) => value ? (
                <div key={label} style={{ background:"#F8FAFC", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{value}</div>
                </div>
              ) : null)}
            </div>

            {/* Linked Students */}
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:"#0F172A", marginBottom:10 }}>Linked Students</div>
              {selectedParent.children?.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {selectedParent.children.map(child => (
                    <div key={child._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"var(--brand-soft)", borderRadius:12, border:"1px solid var(--brand-border)" }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"var(--brand-gradient)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white" }}>
                        {child.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{child.name}</div>
                        <div style={{ fontSize:11, color:"var(--brand)", fontWeight:600 }}>
                          Class {child.class}{child.section ? `-${child.section}` : ""} · Roll {child.rollNumber || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:"20px", textAlign:"center", background:"#F8FAFC", borderRadius:12, color:"#94A3B8", fontSize:13 }}>
                  No students linked yet
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Parent Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Parent">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#FFFBEB", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#D97706", fontWeight:600 }}>
            A temporary password will be generated and shown after saving
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["FULL NAME","name","text"],["PHONE","phone","tel"],["EMAIL","email","email"],["OCCUPATION","occupation","text"]].map(([label,key,type]) => (
              <div key={key}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
                <input type={type} value={form[key]||""} onChange={e => f(key, e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                  onFocus={e => e.target.style.borderColor="#F59E0B"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>GENDER</div>
            <select value={form.gender} onChange={e => f("gender", e.target.value)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
              <option value="">Select Gender</option>
              {["Male","Female","Other"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>ADDRESS</div>
            <input value={form.address||""} onChange={e => f("address", e.target.value)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:8, letterSpacing:"0.06em" }}>LINK STUDENTS</div>
            <div style={{ maxHeight:160, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
              {students.map(s => (
                <label key={s._id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:10, background: form.childrenIds.includes(s._id) ? "var(--brand-soft)" : "#F8FAFC", cursor:"pointer", border:`1px solid ${form.childrenIds.includes(s._id) ? "var(--brand-border)" : "#E2E8F0"}` }}>
                  <input type="checkbox" checked={form.childrenIds.includes(s._id)} onChange={() => toggleChild(s._id)} style={{ accentColor:"var(--brand)" }} />
                  <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{s.name}</span>
                  <span style={{ fontSize:11, color:"var(--brand)", fontWeight:700 }}>Class {s.class}{s.section ? `-${s.section}` : ""}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowAddModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleAddParent} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#F59E0B,#F97316)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : "Add Parent"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
