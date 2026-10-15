import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { errorMessage } from "../../utils/toast";
import { FileText } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const feeColors = {
  Paid:    { bg: "#EAF3DE", color: "#3B6D11" },
  Partial: { bg: "#FAEEDA", color: "#854F0B" },
  Pending: { bg: "#FAECE7", color: "#993C1D" },
};

const card = { background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 12 };
const sectionTitle = { fontSize: 12, fontWeight: 600, color: "var(--brand)", marginBottom: 10 };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#999" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginTop: 2, wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API}/students/${id}`, auth());
        if (cancelled) return;
        setStudent(res.data.data);
        const [f, a, r] = await Promise.allSettled([
          axios.get(`${API}/fees/${id}`, auth()),
          axios.get(`${API}/attendance/student/${id}/summary`, auth()),
          axios.get(`${API}/exams/student/${id}/results`, auth()),
        ]);
        if (cancelled) return;
        setFees(f.status === "fulfilled" ? f.value.data : null);
        setAttendance(a.status === "fulfilled" ? a.value.data.summary : null);
        setResults(r.status === "fulfilled" ? r.value.data : null);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load this student"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const header = (
    <div style={{ marginBottom: "1.5rem" }}>
      <PageHeader title="Student Profile" onBack={() => navigate("/admin/students")} backLabel="Back to students"
        actions={<button type="button" className="ea-btn ea-btn--primary" onClick={() => navigate(`/report-card?studentId=${id}`)}><FileText size={16} aria-hidden="true" /> Report Card</button>} />
    </div>
  );

  if (loading) return <div style={{ fontFamily: "inherit" }}>{header}<Skeleton rows={3} label="Loading student details" /></div>;
  if (error || !student) {
    return (
      <div style={{ fontFamily: "inherit" }}>
        {header}
        <div style={{ ...card, color: "#B91C1C", fontSize: 13 }}>{error || "Student not found"}</div>
      </div>
    );
  }

  const s = student;
  const feeSummary = fees?.summary;
  const feeStatus = feeSummary ? (feeSummary.totalDue <= 0 ? "Paid" : feeSummary.totalPaid > 0 ? "Partial" : "Pending") : null;

  return (
    <div style={{ fontFamily: "inherit" }}>
      {header}

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {s.photo
            ? <img src={s.photo} alt={s.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 500, color: "var(--brand)" }}>{s.name?.[0]?.toUpperCase()}</div>}
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Class {s.class} · Section {s.section} · Roll {s.rollNumber}</div>
            {feeStatus && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: feeColors[feeStatus].bg, color: feeColors[feeStatus].color, marginTop: 4, display: "inline-block" }}>Fees: {feeStatus}</span>}
          </div>
        </div>

        <div style={sectionTitle}>Personal Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
          <Field label="Email" value={s.email} />
          <Field label="Phone" value={s.phone} />
          <Field label="Gender" value={s.gender} />
          <Field label="Date of Birth" value={s.dateOfBirth ? fmtDate(s.dateOfBirth) : null} />
          <Field label="Address" value={s.address} />
          {/* A calendar day stored at midnight UTC: shown in UTC so it never moves a day. */}
          <Field label="Date of Admission" value={s.admittedOn ? new Date(s.admittedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "Not recorded"} />
        </div>

        <div style={sectionTitle}>Parent Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Field label="Parent Name" value={s.parentName} />
          <Field label="Parent Phone" value={s.parentPhone} />
          <Field label="Parent Email" value={s.parentEmail} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>Attendance</div>
          {attendance ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Attendance" value={attendance.percentage} />
              <Field label="Working days" value={attendance.total} />
              <Field label="Present" value={attendance.present} />
              <Field label="Absent" value={attendance.absent} />
            </div>
          ) : <div style={{ fontSize: 12, color: "#999" }}>No attendance recorded yet.</div>}
        </div>

        <div style={card}>
          <div style={sectionTitle}>Fees</div>
          {feeSummary && fees.data?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Billed" value={money(feeSummary.total)} />
              <Field label="Paid" value={money(feeSummary.totalPaid)} />
              <Field label="Due" value={money(feeSummary.totalDue)} />
              <Field label="Fee records" value={fees.data.length} />
            </div>
          ) : <div style={{ fontSize: 12, color: "#999" }}>No fees billed yet.</div>}
        </div>

        <div style={card}>
          <div style={sectionTitle}>Results</div>
          {results?.data?.length ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                <Field label="Average" value={`${results.averagePercentage}%`} />
                <Field label="Overall grade" value={results.overallGrade} />
              </div>
              {results.data.slice(0, 5).map((r) => (
                <div key={r._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderTop: "0.5px solid #F0F0EE" }}>
                  <span>{r.subject} · {r.examName}</span>
                  <strong>{r.marksObtained}/{r.totalMarks} ({r.grade})</strong>
                </div>
              ))}
            </>
          ) : <div style={{ fontSize: 12, color: "#999" }}>No published results yet.</div>}
        </div>
      </div>
    </div>
  );
}
