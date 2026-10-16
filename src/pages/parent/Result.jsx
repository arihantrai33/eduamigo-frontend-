import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { pickChild } from "../../utils/selectedChild";
import EmptyState from "../../components/ui/EmptyState";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import Segmented from "../../components/ui/Segmented";
import { Trophy } from "lucide-react";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
const gradeColor = (grade) => {
  if (!grade) return { bg: "#f3f4f6", color: "var(--ea-muted)" };
  if (grade.startsWith("A")) return { bg: "#dcfce7", color: "#166534" };
  if (grade.startsWith("B")) return { bg: "#dbeafe", color: "#1d4ed8" };
  return { bg: "color-mix(in srgb, var(--ea-on-card-warning) 16%, transparent)", color: "var(--ea-on-card-warning)" };
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
      const parentRes = await axios.get(`${API}/parents/my-child`, authHeader());
      if (!parentRes.data.success) { setError("Could not load child info"); setLoading(false); return; }
      const childData = pickChild(parentRes.data.data.children);
      if (!childData) { setError("No child linked to this account"); setLoading(false); return; }
      setChild(childData);
      const resRes = await axios.get(`${API}/exams/student/${childData._id}/results`, authHeader());
      if (resRes.data.success) {
        const data = resRes.data.data || [];
        setResults(data);
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
      <Skeleton rows={3} label="Loading results" />
    </div>
  );
  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
      <div style={{ color: "var(--ea-on-card-danger)", fontSize: 14 }}>{error}</div>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)", fontFamily: "inherit", paddingBottom: 40 }}>
      <PortalHeader title="Results" subtitle={child?.name ?? "—"} onBack={() => navigate(-1)}
        actions={child?._id && (
          <button type="button" className="ea-portal-head__btn" onClick={() => navigate(`/report-card?studentId=${child._id}`)}>Report Card</button>
        )} />
      <div className="ea-pd-body" style={{ padding: "16px" }}>
        {exams.length > 1 && (
          <div style={{ marginBottom: 12, overflowX: "auto" }}>
            <Segmented label="Exam" value={selExam} onChange={setSelExam} options={exams.map((e) => ({ value: e, label: e }))} />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <SummaryCard title="Overall result" value={`${pct}%`} caption={`${total}/${max} marks • Grade ${topGrade}`}
            items={[
              { label: "Subjects", value: filtered.length },
              { label: "Total", value: `${total}/${max}` },
              { label: "Grade", value: topGrade },
            ]} />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Trophy} title="No results yet" text="Results appear here once teachers publish marks." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((r, i) => {
              const gc  = gradeColor(r.grade);
              const pct = r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0;
              return (
                <div key={i} style={{ background: "var(--card)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: gc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: gc.color, flexShrink: 0 }}>
                    {r.grade ?? "—"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ea-ink)" }}>{r.subject}</div>
                    <div style={{ fontSize: 11, color: "var(--ea-muted)", marginTop: 2 }}>{r.examName}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ea-ink)" }}>
                      {r.absent ? "Absent" : <>{r.marksObtained}<span style={{ fontSize: 11, color: "var(--subtext)" }}>/{r.totalMarks}</span></>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ea-muted)" }}>{pct}%</div>
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