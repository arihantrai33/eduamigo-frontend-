import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const STATUS_CONFIG = {
  Paid:    { bg:"#F0FDF4", color:"#15803D", dot:"#22C55E", border:"#BBF7D0" },
  Pending: { bg:"#FFFBEB", color:"#D97706", dot:"#F59E0B", border:"#FDE68A" },
  Overdue: { bg:"#FEF2F2", color:"#DC2626", dot:"#EF4444", border:"#FECACA" },
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

export default function FeeCollection() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.allSettled([
        axios.get(`${API}/fees`, auth()),
        axios.get(`${API}/students`, auth()),
      ]);
      setFees(fRes.status === "fulfilled" ? (fRes.value.data.data || []) : []);
      setStudents(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const openCollect = (fee) => { setSelectedFee(fee); setPayAmount(fee.amount || ""); setPayMethod("Cash"); setShowModal(true); };

  const handleCollect = async () => {
    if (!payAmount) return alert("Enter amount");
    setSaving(true);
    try {
      await axios.put(`${API}/fees/${selectedFee._id}`, { status:"Paid", paidAmount: payAmount, paymentMethod: payMethod, paidDate: new Date() }, auth());
      setShowModal(false);
      fetchAll();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const classes = [...new Set(students.map(s => s.class))].sort();

  const enriched = fees.map(f => {
    const student = students.find(s => s._id === (f.student?._id || f.student));
    return { ...f, studentName: student?.name || f.studentName || "Unknown", studentClass: student?.class || f.class || "—", studentSection: student?.section || f.section || "" };
  });

  const filtered = enriched.filter(f =>
    (!search || f.studentName?.toLowerCase().includes(search.toLowerCase()) || f.feeType?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || f.status === filterStatus) &&
    (!filterClass || f.studentClass === filterClass)
  );

  const totalCollected = enriched.filter(f => f.status === "Paid").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
  const totalPending = enriched.filter(f => f.status !== "Paid").reduce((s, f) => s + Number(f.amount || 0), 0);
  const paidCount = enriched.filter(f => f.status === "Paid").length;
  const pendingCount = enriched.filter(f => f.status === "Pending").length;
  const overdueCount = enriched.filter(f => f.status === "Overdue").length;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .fee-row:hover { background:#F0FDF4 !important; transform:translateX(2px); }
        .fee-row { transition: all 0.15s ease; }
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#10B981,#059669,#047857)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Fee Collection</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Track and collect student fee payments</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"COLLECTED",    value:`Rs.${totalCollected.toLocaleString()}`, icon:"✅", border:"#10B981", bg:"#F0FDF4" },
          { label:"PENDING",      value:`Rs.${totalPending.toLocaleString()}`,   icon:"⏳", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"PAID",         value: paidCount,    icon:"💚", border:"#22C55E", bg:"#F0FDF4" },
          { label:"PENDING",      value: pendingCount, icon:"🟡", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"OVERDUE",      value: overdueCount, icon:"🔴", border:"#EF4444", bg:"#FEF2F2" },
        ].map((card, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"16px 20px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.07}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:6 }}>{card.label}</div>
                <div style={{ fontSize:20, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:38, height:38, borderRadius:10, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", animation:"fadeUp 0.4s ease 0.1s both" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94A3B8" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name or fee type..."
            style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
            onFocus={e => e.target.style.borderColor="#10B981"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Status</option>
          {["Paid","Pending","Overdue"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, whiteSpace:"nowrap" }}>{filtered.length} records</div>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Student","Class","Fee Type","Amount","Due Date","Paid Date","Status","Action"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #10B981", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading fee records...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>💳</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No fee records found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Fee records will appear here once generated</div>
              </td></tr>
            ) : filtered.map((f, i) => {
              const status = f.status || "Pending";
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
              return (
                <tr key={f._id} className="fee-row" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{f.studentName}</div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:8, background:"#EEF2FF", color:"#6366F1" }}>
                      {f.studentClass}{f.studentSection ? `-${f.studentSection}` : ""}
                    </span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{f.feeType || "—"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:14, fontWeight:800, color:"#059669" }}>Rs.{Number(f.amount||0).toLocaleString()}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151" }}>{fmtDate(f.dueDate)}</td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151" }}>{fmtDate(f.paidDate)}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}`, width:"fit-content" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />
                      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{status}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    {status !== "Paid" ? (
                      <button className="act-btn" onClick={() => openCollect(f)}
                        style={{ padding:"7px 16px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(16,185,129,0.3)" }}>
                        Collect
                      </button>
                    ) : (
                      <span style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>✓ Done</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Collect Fee Payment">
        {selectedFee && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"#F8FAFC", borderRadius:12, padding:"14px 18px" }}>
              <div style={{ fontSize:12, color:"#94A3B8", fontWeight:700 }}>STUDENT</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0F172A", marginTop:4 }}>{selectedFee.studentName}</div>
              <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>{selectedFee.feeType} — Due: {fmtDate(selectedFee.dueDate)}</div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>AMOUNT (Rs.)</div>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box" }}
                onFocus={e => e.target.style.borderColor="#10B981"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>PAYMENT METHOD</div>
              <div style={{ display:"flex", gap:8 }}>
                {["Cash","Online","Cheque","DD"].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    style={{ flex:1, padding:"10px", borderRadius:10, border:`2px solid ${payMethod===m?"#10B981":"#E2E8F0"}`, background:payMethod===m?"#F0FDF4":"white", color:payMethod===m?"#059669":"#64748B", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.15s" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
              <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
              <button onClick={handleCollect} disabled={saving}
                style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(16,185,129,0.4)", opacity:saving?0.7:1 }}>
                {saving ? "Processing..." : "Mark as Paid"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
