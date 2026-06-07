import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const GRADE_CONFIG = {
  "A+": { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0" },
  "A":  { bg:"#F0FDF4", color:"#16A34A", border:"#BBF7D0" },
  "B+": { bg:"#EEF2FF", color:"#4338CA", border:"#C7D2FE" },
  "B":  { bg:"#EEF2FF", color:"#6366F1", border:"#C7D2FE" },
  "C":  { bg:"#FFFBEB", color:"#D97706", border:"#FDE68A" },
  "D":  { bg:"#FFF7ED", color:"#EA580C", border:"#FED7AA" },
  "F":  { bg:"#FEF2F2", color:"#DC2626", border:"#FECACA" },
};

function getGrade(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterExam, setFilterExam] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.allSettled([
        axios.get(`${API}/results`, auth()),
        axios.get(`${API}/students`, auth()),
      ]);
      setResults(rRes.status === "fulfilled" ? (rRes.value.data.data || []) : []);
      setStudents(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const enriched = results.map(r => {
    const student = students.find(s => s._id === (r.student?._id || r.student));
    const pct = r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0;
    return { ...r, studentName: student?.name || r.studentName || "Unknown", studentClass: student?.class || r.class || "—", studentSection: student?.section || r.section || "", pct, grade: r.grade || getGrade(pct) };
  });

  const classes   = [...new Set(enriched.map(r => r.studentClass))].filter(Boolean).sort();
  const sections  = [...new Set(enriched.filter(r => r.studentClass === filterClass).map(r => r.studentSection))].filter(Boolean).sort();
  const examNames = [...new Set(enriched.map(r => r.examName || r.exam))].filter(Boolean).sort();

  const filtered = enriched.filter(r =>
    (!search || r.studentName?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterClass || r.studentClass === filterClass) &&
    (!filterSection || r.studentSection === filterSection) &&
    (!filterExam || (r.examName || r.exam) === filterExam)
  );

  const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.pct, 0) / filtered.length) : 0;
  const passed   = filtered.filter(r => r.pct >= 40).length;
  const failed   = filtered.filter(r => r.pct < 40).length;
  const toppers  = filtered.filter(r => r.pct >= 90).length;

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .res-row:hover { background:linear-gradient(90deg,#F8FAFF,#F0F4FF) !important; transform:translateX(2px); }
        .res-row { transition: all 0.15s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#7C3AED,#6366F1,#3B82F6)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Results & Grades</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>View student exam performance and academic results</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL RECORDS", value: filtered.length, icon:"📋", border:"#6366F1", bg:"#EEF2FF" },
          { label:"AVG SCORE",     value: `${avgScore}%`,  icon:"📊", border:"#3B82F6", bg:"#EFF6FF" },
          { label:"PASSED",        value: passed,          icon:"✅", border:"#10B981", bg:"#F0FDF4" },
          { label:"TOPPERS (90%+)",value: toppers,         icon:"🏆", border:"#F59E0B", bg:"#FFFBEB" },
        ].map((card, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:26, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap", animation:"fadeUp 0.4s ease 0.1s both" }}>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94A3B8" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student name..."
            style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
            onFocus={e => e.target.style.borderColor="#6366F1"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
        </div>
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSection(""); }}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:130 }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:130 }}>
          <option value="">All Sections</option>
          {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={filterExam} onChange={e => setFilterExam(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:160 }}>
          <option value="">All Exams</option>
          {examNames.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, whiteSpace:"nowrap" }}>{filtered.length} records</div>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Student","Class","Exam","Subject","Marks","Percentage","Grade","Status"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #6366F1", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading results...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No results found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Results will appear once teachers publish marks</div>
              </td></tr>
            ) : filtered.map((r, i) => {
              const gcfg = GRADE_CONFIG[r.grade] || GRADE_CONFIG["C"];
              const passed = r.pct >= 40;
              return (
                <tr key={r._id} className="res-row" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", flexShrink:0 }}>
                        {r.studentName?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{r.studentName}</div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:8, background:"#EEF2FF", color:"#6366F1" }}>
                      {r.studentClass}{r.studentSection ? `-${r.studentSection}` : ""}
                    </span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{r.examName || r.exam || "—"}</td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{r.subject || "—"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>{r.marksObtained ?? "—"}</span>
                    <span style={{ fontSize:12, color:"#94A3B8" }}>/{r.totalMarks || "—"}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:60, height:6, borderRadius:999, background:"#F1F5F9", overflow:"hidden" }}>
                        <div style={{ width:`${r.pct}%`, height:"100%", background: r.pct >= 60 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#F59E0B,#EF4444)", borderRadius:999 }} />
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color: r.pct >= 60 ? "#10B981" : "#F59E0B" }}>{r.pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:800, padding:"4px 12px", borderRadius:8, background:gcfg.bg, color:gcfg.color, border:`1px solid ${gcfg.border}` }}>{r.grade}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background: passed ? "#F0FDF4" : "#FEF2F2", color: passed ? "#15803D" : "#DC2626", border:`1px solid ${passed ? "#BBF7D0" : "#FECACA"}` }}>
                      {passed ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
