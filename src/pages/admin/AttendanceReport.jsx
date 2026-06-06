import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function StatCard({ label, value, icon, color, border, delay }) {
  return (
    <div style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${border}`, position:"relative", overflow:"hidden", animation:`fadeUp 0.5s ease ${delay}s both` }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:color, opacity:0.1 }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:28, fontWeight:900, color:"#0F172A" }}>{value}</div>
        </div>
        <div style={{ width:42, height:42, borderRadius:12, background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>
      </div>
    </div>
  );
}

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
        axios.get(`${API}/attendance?month=${filterMonth}&year=${filterYear}`, auth()),
      ]);
      setStudents(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
      setAttendance(aRes.status === "fulfilled" ? (aRes.value.data.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const classes = [...new Set(students.map(s => s.class))].sort();

  // Build class-wise stats
  const classStats = classes.map(cls => {
    const classStudents = students.filter(s => s.class === cls);
    const classAttendance = attendance.filter(a => {
      const studentIds = classStudents.map(s => s._id);
      return studentIds.includes(a.student?._id || a.student);
    });
    const totalRecords = classAttendance.length;
    const presentRecords = classAttendance.filter(a => a.status === "Present").length;
    const pct = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    return { cls, students: classStudents.length, total: totalRecords, present: presentRecords, absent: totalRecords - presentRecords, pct };
  }).filter(c => !filterClass || c.cls === filterClass);

  const totalPresent = attendance.filter(a => a.status === "Present").length;
  const totalAbsent = attendance.filter(a => a.status === "Absent").length;
  const totalLate = attendance.filter(a => a.status === "Late").length;
  const totalRecords = attendance.length;
  const overallPct = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
  const lowAttendance = classStats.filter(c => c.pct < 75 && c.total > 0);

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .cls-row:hover { background:#F8FAFF !important; }
        .cls-row { transition: background 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#EC4899,#F43F5E,#EF4444)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Attendance Reports</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>School-wide attendance analytics and insights</div>
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
          <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white" }}>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>YEAR</div>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white" }}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <StatCard label="OVERALL RATE" value={`${overallPct}%`} icon="📊" color="#EEF2FF" border="#6366F1" delay={0} />
        <StatCard label="TOTAL PRESENT" value={totalPresent} icon="✅" color="#F0FDF4" border="#10B981" delay={0.08} />
        <StatCard label="TOTAL ABSENT" value={totalAbsent} icon="❌" color="#FEF2F2" border="#EF4444" delay={0.16} />
        <StatCard label="LATE" value={totalLate} icon="⏰" color="#FFFBEB" border="#F59E0B" delay={0.24} />
      </div>

      {/* Overall Progress */}
      <div style={{ background:"white", borderRadius:16, padding:"20px 24px", marginBottom:24, boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:"fadeUp 0.4s ease 0.3s both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Overall Attendance Rate — {MONTHS[filterMonth-1]} {filterYear}</div>
          <div style={{ fontSize:24, fontWeight:900, color: overallPct >= 75 ? "#10B981" : "#EF4444" }}>{overallPct}%</div>
        </div>
        <ProgressBar value={overallPct} color={overallPct >= 75 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)"} />
        <div style={{ display:"flex", gap:16, marginTop:10 }}>
          <span style={{ fontSize:12, color:"#10B981", fontWeight:700 }}>✓ {totalPresent} Present</span>
          <span style={{ fontSize:12, color:"#EF4444", fontWeight:700 }}>✗ {totalAbsent} Absent</span>
          <span style={{ fontSize:12, color:"#F59E0B", fontWeight:700 }}>⏰ {totalLate} Late</span>
        </div>
      </div>

      {/* Low Attendance Alert */}
      {lowAttendance.length > 0 && (
        <div style={{ background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:16, padding:"16px 24px", marginBottom:24, animation:"fadeUp 0.4s ease 0.35s both" }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#C2410C", marginBottom:8 }}>⚠️ Low Attendance Alert</div>
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
            <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
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
                const good = c.pct >= 75;
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
                      <span style={{ fontSize:13, fontWeight:700, color:"#F59E0B" }}>{c.total - c.present - c.absent < 0 ? 0 : c.total - c.present - c.absent}</span>
                    </td>
                    <td style={{ padding:"14px 18px", width:200 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1 }}>
                          <ProgressBar value={c.pct} color={good ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)"} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:800, color: good ? "#10B981" : "#EF4444", minWidth:40 }}>{c.pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background: good ? "#F0FDF4" : "#FEF2F2", color: good ? "#15803D" : "#DC2626", border:`1px solid ${good ? "#BBF7D0" : "#FECACA"}` }}>
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
