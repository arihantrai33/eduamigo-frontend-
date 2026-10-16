import { useState, useEffect } from "react";
import axios from "axios";
import EmptyState from "../../components/ui/EmptyState";
import { BarChart3 } from "lucide-react";

import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
import Skeleton from "../../components/ui/Skeleton";
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
    const sid = f.studentId?._id || f.studentId;
    const student = (f.studentId && typeof f.studentId === "object") ? f.studentId : students.find(s => s._id === sid);
    return { ...f, studentClass: student?.class || "Unknown" };
  });

  const filtered = enriched.filter(f =>
    (!filterClass || f.studentClass === filterClass) &&
    (!filterMonth || (f.dueDate && new Date(f.dueDate).getMonth() + 1 === Number(filterMonth)))
  );

  const totalAmount    = filtered.reduce((s, f) => s + Number(f.amount || 0), 0);
  const collectedAmt   = filtered.reduce((s, f) => s + Number(f.paidAmount || 0), 0);
  const pendingAmt     = totalAmount - collectedAmt;
  const collectionPct  = totalAmount > 0 ? Math.round((collectedAmt / totalAmount) * 100) : 0;

  // Class-wise breakdown
  const classStats = classes.map(cls => {
    const clsFees = enriched.filter(f => f.studentClass === cls);
    const total   = clsFees.reduce((s, f) => s + Number(f.amount || 0), 0);
    const paid    = clsFees.reduce((s, f) => s + Number(f.paidAmount || 0), 0);
    const pct     = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { cls, total, paid, pending: total - paid, pct, count: clsFees.length };
  }).filter(c => c.count > 0);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const fmtAmt = (n) => `₹${Number(n).toLocaleString()}`;

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .cls-row:hover { background:#F0FDF4 !important; }
        .cls-row { transition: background 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Fee Reports" subtitle="Fee collection analytics and class-wise breakdown" />
      </div>

      {/* Filters */}
      <div style={{ background:"white", borderRadius:16, padding:"18px 24px", marginBottom:24, boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", display:"flex", flexWrap:"wrap", gap:16, alignItems:"end", animation:"fadeUp 0.4s ease 0.05s both" }}>
        <label style={{ flex:"1 1 140px" }}>
          <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>CLASS</span>
          <select className="ea-select" value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ width:"100%" }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </label>
        <label style={{ flex:"1 1 140px" }}>
          <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>MONTH</span>
          <select className="ea-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width:"100%" }}>
            <option value="">All Months</option>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </label>
        <div className="ea-toolbar__count" style={{ alignSelf:"center" }}>{filtered.length} records</div>
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"TOTAL BILLED",   value: fmtAmt(totalAmount),   icon:<Glyph e="📋" />, border:"var(--brand)" },
            { label:"COLLECTED",      value: fmtAmt(collectedAmt),  icon:<Glyph e="✅" />, border:"#10B981" },
            { label:"PENDING",        value: fmtAmt(pendingAmt),    icon:<Glyph e="⏳" />, border:"#F59E0B" },
            { label:"COLLECTION RATE",value: `${collectionPct}%`,   icon:<Glyph e="📊" />, border:"var(--brand)" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Overall Progress */}
      <div style={{ background:"white", borderRadius:16, padding:"20px 24px", marginBottom:24, boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:"fadeUp 0.4s ease 0.3s both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Overall Collection Rate</div>
          <div style={{ fontSize:24, fontWeight:900, color: collectionPct >= 75 ? "var(--ea-on-card-success)" : "var(--ea-on-card-danger)" }}>{collectionPct}%</div>
        </div>
        <ProgressBar value={collectionPct} color={collectionPct >= 75 ? "var(--ea-success)" : "var(--ea-warning)"} />
        <div style={{ display:"flex", gap:20, marginTop:10 }}>
          <span style={{ fontSize:12, color:"var(--ea-on-card-success)", fontWeight:700 }}>✓ Collected: {fmtAmt(collectedAmt)}</span>
          <span style={{ fontSize:12, color:"var(--ea-on-card-warning)", fontWeight:700 }}><Glyph e="⏳" /> Pending: {fmtAmt(pendingAmt)}</span>
        </div>
      </div>

      {/* Class-wise Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.4s ease 0.4s both" }}>
        <div style={{ padding:"16px 24px", borderBottom:"1px solid #F1F5F9", background:"var(--ea-hover)" }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Class-wise Fee Collection</div>
        </div>
        {loading ? (
          <div style={{ padding:"60px 0", textAlign:"center" }}>
            <Skeleton rows={4} label="Loading reports" />
          </div>
        ) : classStats.length === 0 ? (
          <div style={{ padding: 16, textAlign:"center" }}>
            <EmptyState plain icon={BarChart3} title="No fee data available" text="Fee records will appear here once generated" />
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"var(--ea-hover)" }}>
                {["Class","Records","Total Billed","Collected","Pending","Collection Rate","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#56657A", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
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
                    <td style={{ padding:"14px 18px", fontSize:13, color:"#56657A", fontWeight:600 }}>{c.count}</td>
                    <td style={{ padding:"14px 18px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{fmtAmt(c.total)}</td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--ea-on-card-success)" }}>{fmtAmt(c.paid)}</span>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--ea-on-card-warning)" }}>{fmtAmt(c.pending)}</span>
                    </td>
                    <td style={{ padding:"14px 18px", minWidth:180 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1 }}>
                          <ProgressBar value={c.pct} color={good ? "var(--ea-success)" : "var(--ea-warning)"} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:800, color: good ? "var(--ea-on-card-success)" : "var(--ea-on-card-warning)", minWidth:40 }}>{c.pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background: good ? "#F0FDF4" : "#FFFBEB", color: good ? "#15803D" : "var(--ea-on-card-warning)", border:`1px solid ${good ? "#BBF7D0" : "#FDE68A"}` }}>
                        {good ? "✓ Good" : "Low"}
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
