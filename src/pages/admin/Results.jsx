import { useState, useEffect } from "react";
import axios from "axios";
import { gradeFor, GRADE_STYLE, PASS_PERCENT } from "../../utils/grades";
import { useNavigate } from "react-router-dom";
import { toast, confirmAction, errorMessage } from "../../utils/toast";
import EmptyState from "../../components/ui/EmptyState";

import { Search, Trophy } from "lucide-react";
import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const GRADE_CONFIG = GRADE_STYLE;

export default function Results() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [filterTerm, setFilterTerm] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.allSettled([
        axios.get(`${API}/exams/results`, auth()),
        axios.get(`${API}/students`, auth()),
      ]);
      setResults(rRes.status === "fulfilled" ? (rRes.value.data.data || []) : []);
      setStudents(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
    } catch (e) { toast.error(errorMessage(e, "Could not load results")); }
    setLoading(false);
  };

  // Reopens one exam for one section so the teacher can correct marks; its results are hidden until republished.
  const reopen = async (r) => {
    if (!r.exam) return toast.error("This older result is not linked to a scheduled exam and cannot be reopened");
    if (!(await confirmAction(`Reopen ${r.subject} (${r.examName}) for Class ${r.studentClass}-${r.studentSection}? All results of this exam for the section are hidden until the teacher publishes again.`, { confirmLabel: "Reopen" }))) return;
    try {
      const res = await axios.patch(`${API}/marks/unpublish`, { examId: r.exam, section: r.section }, auth());
      toast.success(`${res.data.count} mark(s) reopened for correction`);
      fetchAll();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const enriched = results.map(r => {
    const student = students.find(s => s._id === (r.student?._id || r.student));
    const pct = r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0;
    return { ...r, studentName: student?.name || r.studentName || "Unknown", studentClass: student?.class || r.class || "—", studentSection: student?.section || r.section || "", pct, grade: r.absent ? "AB" : (r.grade || gradeFor(pct)) };
  });

  const classes   = [...new Set(enriched.map(r => r.studentClass))].filter(Boolean).sort();
  const sections  = [...new Set(enriched.filter(r => r.studentClass === filterClass).map(r => r.studentSection))].filter(Boolean).sort();
  const examNames = [...new Set(enriched.map(r => r.examName))].filter(Boolean).sort();
  const termNames = [...new Set(enriched.map(r => r.term))].filter(Boolean).sort();

  const filtered = enriched.filter(r =>
    (!search || r.studentName?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterClass || r.studentClass === filterClass) &&
    (!filterSection || r.studentSection === filterSection) &&
    (!filterExam || r.examName === filterExam) &&
    (!filterTerm || r.term === filterTerm)
  );

  const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.pct, 0) / filtered.length) : 0;
  const passed   = filtered.filter(r => !r.absent && r.pct >= PASS_PERCENT).length;
  const failed   = filtered.filter(r => r.absent || r.pct < PASS_PERCENT).length;
  const toppers  = filtered.filter(r => r.pct >= 90).length;

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .res-row:hover { background:linear-gradient(90deg,#F8FAFF,#F0F4FF) !important; transform:translateX(2px); }
        .res-row { transition: all 0.15s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Results & Grades" subtitle="View student exam performance and academic results" />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"TOTAL RECORDS", value: filtered.length, icon:<Glyph e="📋" />, border:"var(--brand)" },
            { label:"AVG SCORE",     value: `${avgScore}%`,  icon:<Glyph e="📊" />, border:"var(--brand)" },
            { label:"PASSED",        value: passed,          icon:<Glyph e="✅" />, border:"#10B981" },
            { label:"TOPPERS (90%+)",value: toppers,         icon:<Glyph e="🏆" />, border:"var(--brand)" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Filters */}
      <div className="ea-toolbar" style={{ marginBottom:20 }}>
        <div className="ea-search">
          <Search aria-hidden="true" />
          <input className="ea-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student name..." aria-label="Search results" />
        </div>
        <select className="ea-select" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSection(""); }} aria-label="Class">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="ea-select" value={filterSection} onChange={e => setFilterSection(e.target.value)} aria-label="Section">
          <option value="">All Sections</option>
          {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select className="ea-select" value={filterExam} onChange={e => setFilterExam(e.target.value)} aria-label="Exam">
          <option value="">All Exams</option>
          {examNames.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="ea-select" value={filterTerm} onChange={e => setFilterTerm(e.target.value)} aria-label="Term">
          <option value="">All Terms</option>
          {termNames.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" className="ea-btn ea-btn--primary" onClick={() => (filterClass && filterSection)
            ? navigate(`/report-card?class=${filterClass}&section=${filterSection}&term=${encodeURIComponent(filterTerm || "Term 1")}`)
            : toast.error("Choose a class and section to print report cards")}
          style={{ whiteSpace:"nowrap" }}>
          Report Cards
        </button>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, whiteSpace:"nowrap" }}>{filtered.length} records</div>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table data-stack style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Student","Class","Exam","Subject","Marks","Percentage","Grade","Status",""].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid var(--brand)", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading results...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 16 }}>
                <EmptyState plain icon={Trophy} title="No results found" text="Results will appear once teachers publish marks" />
              </td></tr>
            ) : filtered.map((r, i) => {
              const gcfg = GRADE_CONFIG[r.grade] || GRADE_CONFIG["C"];
              const passed = !r.absent && r.pct >= PASS_PERCENT;
              return (
                <tr key={r._id} className="res-row" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"var(--brand-gradient)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", flexShrink:0 }}>
                        {r.studentName?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{r.studentName}</div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:8, background:"var(--brand-soft)", color:"var(--brand)" }}>
                      {r.studentClass}{r.studentSection ? `-${r.studentSection}` : ""}
                    </span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>
                    {r.examName || "—"}
                    {r.term && <div style={{ fontSize:11, color:"#94A3B8", fontWeight:500 }}>{r.term}</div>}
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:600 }}>{r.subject || "—"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>{r.absent ? "Absent" : (r.marksObtained ?? "—")}</span>
                    {!r.absent && <span style={{ fontSize:12, color:"#94A3B8" }}>/{r.totalMarks || "—"}</span>}
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
                      {r.absent ? "Absent" : passed ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    {r.exam && <button type="button" className="ea-btn ea-btn--ghost ea-btn--sm" onClick={() => reopen(r)} title="Reopen this exam's marks for correction">Reopen</button>}
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
