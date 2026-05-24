import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const gradeColor = (grade) => {
  if (!grade) return { bg: "#f3f4f6", color: "#6b7280" };
  if (grade.startsWith("A")) return { bg: "#dcfce7", color: "#16a34a" };
  if (grade.startsWith("B")) return { bg: "#dbeafe", color: "#1d4ed8" };
  return { bg: "#fef9c3", color: "#ca8a04" };
};

export default function ParentResult() {
  const navigate = useNavigate();

  const [child,   setChild]   = useState(null);
  const [exams,   setExams]   = useState([]);
  const [selExam, setSelExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // Step 1 — get child
      const parentRes = await axios.get(`${API}/parents/my-child`, authHeader());
      if (!parentRes.data.success) { setError("Could not load child info"); setLoading(false); return; }
      const childData = parentRes.data.data.children?.[0];
      if (!childData) { setError("No child linked to this account"); setLoading(false); return; }
      setChild(childData);

      // Step 2 — get results
      const resRes = await axios.get(`${API}/exams/student/${childData._id}/results`, authHeader());
      if (resRes.data.success) {
        const data = resRes.data.data || [];
        setResults(data);

        // Unique exam names for filter
        const uniqueExams = [...new Set(data.map((r) => r.examName).filter(Boolean))];
        setExams(uniqueExams);
        if (uniqueExams.length > 0) setSelExam(uniqueExams[0]);
      }
    } catch {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const filtered = selExam ? results.filter((r) => r.examName === selExam) : results;

  const total    = filtered.reduce((s, r) => s + (r.marksObtained ?? 0), 0);
  const max      = filtered.reduce((s, r) => s + (r.totalMarks   ?? 0), 0);
  const pct      = max > 0 ? Math.round((total / max) * 100) : 0;
  const topGrade = filtered[0]?.grade ?? "—";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ color: "#999", fontSize: 14 }}>Loading results...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB", fontFamily: "Inter, sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", padding: "48px 20px 32px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer", fontSize: 16 }}>
            ←
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>📊 Results</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{child?.name ?? "—"}</div>
          </div>
        </div>

        {/* Summary Card */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 20, backdropFilter: "blur(10px)", textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 900 }}>{pct}%</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            {total}/{max} marks • Grade {topGrade}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
            {[
              { label: "Subjects", val: filtered.length },
              { label: "Total",    val: `${total}/${max}` },
              { label: "Grade",    val: topGrade },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", marginTop: "-16px" }}>

        {/* Exam Filter */}
        {exams.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {exams.map((e) => (
              <button key={e} onClick={() => setSelExam(e)}
                style={{
                  padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  background: selExam === e ? "#4f46e5" : "#fff",
                  color:      selExam === e ? "#fff"    : "#666",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div style={{ background: "white", borderRadius: 16, padding: "40px 20px", textAlign: "center", color: "#999", fontSize: 13 }}>
            No results found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((r, i) => {
              const gc  = gradeColor(r.grade);
              const pct = r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0;
              return (
                <div key={i} style={{ background: "white", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: gc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: gc.color, flexShrink: 0 }}>
                    {r.grade ?? "—"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1C2033" }}>{r.subject}</div>
                    <div style={{ fontSize: 11, color: "#7B8099", marginTop: 2 }}>{r.examName}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1C2033" }}>
                      {r.marksObtained}<span style={{ fontSize: 11, color: "#999" }}>/{r.totalMarks}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#7B8099" }}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}