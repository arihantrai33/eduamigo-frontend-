import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

function ProgressBar({ value, color }) {
  return (
    <div style={{ height:8, borderRadius:999, background:"#F1F5F9", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(value,100)}%`, background:color, borderRadius:999, transition:"width 1s ease" }} />
    </div>
  );
}

export default function FeeReports() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

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

  const classes = [...new Set(students.map(s => s.class))].sort();

  const enriched = fees.map(f => {
    const student = students.find(s => s._id === (f.student?._id || f.student));
    return { ...f, studentClass: student?.class || f.class || "Unknown" };
  });

  const filtered = enriched.filter(f =>
    (!filterClass || f.studentClass === filterClass) &&
    (!filterMonth || (f.dueDate && new Date(f.dueDate).getMonth() + 1 === Number(filterMonth)))
  );

  const totalAmount    = filtered.reduce((s, f) => s + Number(f.amount || 0), 0);
  const collectedAmt   = filtered.filter(f => f.status === "Paid").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
  const pendingAmt     = filtered.filter(f => f.status !== "Paid").reduce((s, f) => s + Number(f.amount || 0), 0);
  const collectionPct  = totalAmount > 0 ? Math.round((collectedAmt / totalAmount) * 100) : 0;

  // Class-wise breakdown
  const classStats = classes.map(cls => {
    const clsFees = enriched.filter(f => f.studentClass === cls);
    const total   = clsFees.reduce((s, f) => s + Number(f.amount || 0), 0);
    const paid    = clsFees.filter(f => f.status === "Paid").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
    const pct     = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { cls, total, paid, pending: total - paid, pct, count: clsFees.length };
  }).filter(c => c.count > 0);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const fmtAmt = (n) => `Rs.${Number(n).toLocaleString()}`;

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .cls-row:hover { background:#F0FDF4 !important; }
        .cls-row { transition: background 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#8B5CF6,#7C3AED,#6D28D9)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Fee Reports</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Fee collection analytics and class-wise breakdown</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:"white", borderRadius:16, padding:"18px 24px", marginBottom:24, boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", display:"flex", gap:16, alignItems:"end", animation:"fadeUp 0.4s ease 0.05s both" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>CLASS</div>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white" }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>MONTH</div>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white" }}>
            <option value="">All Months</option>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, alignSelf:"center" }}>{filtered.length} records</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL BILLED",   value: fmtAmt(totalAmount),   icon:"📋", border:"#6366F1", bg:"#EEF2FF" },
          { label:"COLLECTED",      value: fmtAmt(collectedAmt),  icon:"✅", border:"#10B981", bg:"#F0FDF4" },
          { label:"PENDING",        value: fmtAmt(pendingAmt),    icon:"⏳", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"COLLECTION RATE",value: `${collectionPct}%`,   icon:"📊", border:"#8B5CF6", bg:"#F5F3FF" },
        ].map((card, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:22, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div style={{ background:"white", borderRadius:16, padding:"20px 24px", marginBottom:24, boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:"fadeUp 0.4s ease 0.3s both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Overall Collection Rate</div>
          <div style={{ fontSize:24, fontWeight:900, color: collectionPct >= 75 ? "#10B981" : "#EF4444" }}>{collectionPct}%</div>
        </div>
        <ProgressBar value={collectionPct} color={collectionPct >= 75 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#F59E0B,#EF4444)"} />
        <div style={{ display:"flex", gap:20, marginTop:10 }}>
          <span style={{ fontSize:12, color:"#10B981", fontWeight:700 }}>✓ Collected: {fmtAmt(collectedAmt)}</span>
          <span style={{ fontSize:12, color:"#F59E0B", fontWeight:700 }}>⏳ Pending: {fmtAmt(pendingAmt)}</span>
        </div>
      </div>

      {/* Class-wise Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.4s ease 0.4s both" }}>
        <div style={{ padding:"16px 24px", borderBottom:"1px solid #F1F5F9", background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Class-wise Fee Collection</div>
        </div>
        {loading ? (
          <div style={{ padding:"60px 0", textAlign:"center" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #8B5CF6", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading reports...</div>
          </div>
        ) : classStats.length === 0 ? (
          <div style={{ padding:"80px 0", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No fee data available</div>
            <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Fee records will appear here once generated</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
                {["Class","Records","Total Billed","Collected","Pending","Collection Rate","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStats.map((c, i) => {
                const good = c.pct >= 75;
                return (
                  <tr key={i} className="cls-row" style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>Class {c.cls}</span>
                    </td>
                    <td style={{ padding:"14px 18px", fontSize:13, color:"#64748B", fontWeight:600 }}>{c.count}</td>
                    <td style={{ padding:"14px 18px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{fmtAmt(c.total)}</td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#10B981" }}>{fmtAmt(c.paid)}</span>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#F59E0B" }}>{fmtAmt(c.pending)}</span>
                    </td>
                    <td style={{ padding:"14px 18px", minWidth:180 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1 }}>
                          <ProgressBar value={c.pct} color={good ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#F59E0B,#EF4444)"} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:800, color: good ? "#10B981" : "#F59E0B", minWidth:40 }}>{c.pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background: good ? "#F0FDF4" : "#FFFBEB", color: good ? "#15803D" : "#D97706", border:`1px solid ${good ? "#BBF7D0" : "#FDE68A"}` }}>
                        {good ? "✓ Good" : "⚠ Low"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
