import { useState, useEffect } from "react";
import axios from "axios";

import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard as SharedStat } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// The shared stat card; the border colour this screen passes becomes the card's status tone.
const StatCard = ({ label, value, icon, border }) => <SharedStat label={label} value={value} icon={icon} tone={toneOf(border)} />;

function ProgressBar({ value, color }) {
  return (
    <div style={{ height:8, borderRadius:999, background:"#F1F5F9", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(value,100)}%`, background:color, borderRadius:999, transition:"width 1s ease" }} />
    </div>
  );
}

export default function AttendanceReports() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchData(); }, [filterMonth, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.allSettled([
        axios.get(`${API}/students`, auth()),
        axios.get(`${API}/attendance/report?month=${filterMonth}&year=${filterYear}`, auth()),
      ]);
      setStudents(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
      setAttendance(aRes.status === "fulfilled" ? (aRes.value.data.data || []) : []);
    } catch { /* handled by empty state */ }
    setLoading(false);
  };

  const classes = [...new Set(students.map(s => s.class))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  // `attendance` holds one summary row per class-section from /attendance/report.
  // Late counts as attended; holidays are excluded by the server.
  const classStats = classes.map(cls => {
    const rows = attendance.filter(r => r.class === cls);
    const sum = (key) => rows.reduce((s, r) => s + (r[key] || 0), 0);
    const total = sum("total");
    const present = sum("present");
    const late = sum("late");
    const absent = sum("absent");
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : null;
    return { cls, students: students.filter(s => s.class === cls).length, total, present, late, absent, pct };
  }).filter(c => !filterClass || c.cls === filterClass);

  // Summary cards follow the class filter, so they always match the table below.
  const totalPresent = classStats.reduce((s, c) => s + c.present, 0);
  const totalAbsent = classStats.reduce((s, c) => s + c.absent, 0);
  const totalLate = classStats.reduce((s, c) => s + c.late, 0);
  const totalRecords = classStats.reduce((s, c) => s + c.total, 0);
  const hasData = totalRecords > 0;
  const overallPct = hasData ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : null;
  const lowAttendance = classStats.filter(c => c.pct !== null && c.pct < 75);
  const pctText = (v) => (v === null ? "—" : `${v}%`);

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .cls-row:hover { background:#F8FAFF !important; }
        .cls-row { transition: background 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Attendance Reports" subtitle="School-wide attendance analytics and insights" />
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
          <select className="ea-select" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} style={{ width:"100%" }}>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </label>
        <label style={{ flex:"1 1 140px" }}>
          <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>YEAR</span>
          <select className="ea-select" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ width:"100%" }}>
            {[0, 1, 2, 3].map(i => new Date().getFullYear() - 3 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      {/* Stat Cards */}
      <div className="ea-stats" style={{ marginBottom:24 }}>
        <StatCard label="OVERALL RATE" value={pctText(overallPct)} icon={<Glyph e="📊" />} color="var(--brand-soft)" border="var(--brand)" delay={0} />
        <StatCard label="TOTAL PRESENT" value={totalPresent} icon={<Glyph e="✅" />} color="#F0FDF4" border="#10B981" delay={0.08} />
        <StatCard label="TOTAL ABSENT" value={totalAbsent} icon={<Glyph e="❌" />} color="#FEF2F2" border="#EF4444" delay={0.16} />
        <StatCard label="LATE" value={totalLate} icon={<Glyph e="⏰" />} color="#FFFBEB" border="#F59E0B" delay={0.24} />
      </div>

      {/* Overall Progress */}
      <div style={{ background:"white", borderRadius:16, padding:"20px 24px", marginBottom:24, boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:"fadeUp 0.4s ease 0.3s both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Overall Attendance Rate — {MONTHS[filterMonth-1]} {filterYear}</div>
          <div style={{ fontSize:24, fontWeight:900, color: !hasData ? "#94A3B8" : overallPct >= 75 ? "#10B981" : "#EF4444" }}>{pctText(overallPct)}</div>
        </div>
        <ProgressBar value={overallPct || 0} color={overallPct >= 75 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)"} />
        <div style={{ display:"flex", gap:16, marginTop:10 }}>
          <span style={{ fontSize:12, color:"#10B981", fontWeight:700 }}>✓ {totalPresent} Present</span>
          <span style={{ fontSize:12, color:"#EF4444", fontWeight:700 }}>✗ {totalAbsent} Absent</span>
          <span style={{ fontSize:12, color:"#F59E0B", fontWeight:700 }}><Glyph e="⏰" /> {totalLate} Late</span>
        </div>
      </div>

      {/* Low Attendance Alert */}
      {lowAttendance.length > 0 && (
        <div style={{ background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:16, padding:"16px 24px", marginBottom:24, animation:"fadeUp 0.4s ease 0.35s both" }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#C2410C", marginBottom:8 }}><Glyph e="⚠" /> Low Attendance Alert</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {lowAttendance.map((c,i) => (
              <span key={i} style={{ fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:20, background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA" }}>
                Class {c.cls} — {c.pct}%
              </span>
            ))}
          </div>
          <div style={{ fontSize:12, color:"#92400E", marginTop:8 }}>These classes have attendance below 75%. Immediate attention required.</div>
        </div>
      )}

      {/* Class-wise Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.4s ease 0.4s both" }}>
        <div style={{ padding:"16px 24px", borderBottom:"1px solid #F1F5F9", background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Class-wise Attendance Breakdown</div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{MONTHS[filterMonth-1]} {filterYear}</div>
        </div>
        {loading ? (
          <div style={{ padding:"60px 0", textAlign:"center" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #EC4899", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading attendance data...</div>
          </div>
        ) : classStats.length === 0 ? (
          <div style={{ padding:"80px 0", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}><Glyph e="📊" /></div>
            <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No attendance data found</div>
            <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Attendance will appear here once teachers start marking it</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
                {["Class","Students","Present","Absent","Late","Attendance Rate","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStats.map((c, i) => {
                const noData = c.pct === null;
                const good = !noData && c.pct >= 75;
                return (
                  <tr key={i} className="cls-row" style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>Class {c.cls}</span>
                    </td>
                    <td style={{ padding:"14px 18px", fontSize:13, fontWeight:600, color:"#374151" }}>{c.students}</td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#10B981" }}>{c.present}</span>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#EF4444" }}>{c.absent}</span>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#F59E0B" }}>{c.late}</span>
                    </td>
                    <td style={{ padding:"14px 18px", width:200 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1 }}>
                          <ProgressBar value={c.pct || 0} color={good ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)"} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:800, color: noData ? "#94A3B8" : good ? "#10B981" : "#EF4444", minWidth:40 }}>{pctText(c.pct)}</span>
                      </div>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background: noData ? "#F8FAFC" : good ? "#F0FDF4" : "#FEF2F2", color: noData ? "#64748B" : good ? "#15803D" : "#DC2626", border:`1px solid ${noData ? "#E2E8F0" : good ? "#BBF7D0" : "#FECACA"}` }}>
                        {noData ? "Not marked" : good ? "✓ Good" : "Low"}
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
