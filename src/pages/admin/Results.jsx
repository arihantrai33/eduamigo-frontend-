import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, RefreshCw, Trophy, TrendingUp, Users } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const GRADE_META = {
  "A+": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  "A":  { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" },
  "B":  { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  "C":  { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  "D":  { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  "F":  { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
};

const CLASSES = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const SECTIONS = ["A","B","C","D","E"];

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, outline: "none", background: "#F8FAFC",
  fontFamily: "Inter, sans-serif", boxSizing: "border-box",
};

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ class: "", section: "", examName: "", search: "" });

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.class) params.class = filters.class;
      if (filters.section) params.section = filters.section;
      if (filters.examName) params.examName = filters.examName;
      const res = await axios.get(`${API}/marks`, { ...auth(), params });
      setResults(res.data.data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [filters.class, filters.section, filters.examName]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const filtered = results.filter(r => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return r.student?.name?.toLowerCase().includes(s) || r.examName?.toLowerCase().includes(s);
  });

  const avg = filtered.length ? Math.round(filtered.reduce((s, r) => s + (r.percentage || 0), 0) / filtered.length) : 0;
  const passed = filtered.filter(r => (r.percentage || 0) >= 33).length;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Results</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Student exam performance and grades</div>
        </div>
        <button onClick={fetchResults} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RefreshCw size={14} color="#64748B" />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Records", value: filtered.length, color: "#4F46E5", bg: "#EEF2FF", icon: <Users size={18} color="#4F46E5" /> },
          { label: "Average Score",  value: `${avg}%`,        color: "#D97706", bg: "#FFFBEB", icon: <TrendingUp size={18} color="#D97706" /> },
          { label: "Passed",         value: passed,           color: "#16A34A", bg: "#F0FDF4", icon: <Trophy size={18} color="#16A34A" /> },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${s.bg}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search student..." style={{ ...inp, paddingLeft: 30, width: 200 }} />
        </div>
        <select value={filters.class} onChange={e => setFilters({ ...filters, class: e.target.value })} style={{ ...inp, width: 120 }}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value })} style={{ ...inp, width: 120 }}>
          <option value="">All Sections</option>
          {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <input value={filters.examName} onChange={e => setFilters({ ...filters, examName: e.target.value })}
          placeholder="Exam name..." style={{ ...inp, width: 180 }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 80px 1fr 1fr", padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          {["Student", "Exam", "Subject", "Marks", "%", "Grade", "Remarks"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>Loading results...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>No results found</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Results will appear once teachers publish marks</div>
          </div>
        ) : filtered.map((r, i) => {
          const gm = GRADE_META[r.grade] || { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" };
          return (
            <div key={r._id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 80px 1fr 1fr", padding: "14px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #F1F5F9" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{r.student?.name || "—"}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>Class {r.class}{r.section ? `-${r.section}` : ""}</div>
              </div>
              <span style={{ fontSize: 12, color: "#64748B" }}>{r.examName}</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>{r.subject}</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>{r.marksObtained}/{r.totalMarks}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: r.percentage >= 75 ? "#16A34A" : r.percentage >= 33 ? "#D97706" : "#DC2626" }}>{r.percentage}%</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, background: gm.bg, color: gm.color, border: `1px solid ${gm.border}`, width: "fit-content" }}>{r.grade || "—"}</span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>{r.remarks || "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
