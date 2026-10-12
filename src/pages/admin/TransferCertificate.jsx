import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { errorMessage } from "../../utils/toast";

// Printable transfer certificate (backend: GET /api/students/:id/transfer-certificate).
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const d = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—");

export default function TransferCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tc, setTc] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/students/${id}/transfer-certificate`, auth())
      .then((r) => setTc(r.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) return <div style={{ padding: 24, color: "#B91C1C" }}>{error}</div>;
  if (!tc) return <div style={{ padding: 24, color: "#64748B" }}>Loading…</div>;
  const s = tc.student;
  const rows = [
    ["Name of the student", s.name], ["Admission number", s.admissionNo || "—"], ["Date of birth", d(s.dateOfBirth)],
    ["Gender", s.gender || "—"], ["Parent / guardian", s.parentName || "—"], ["Address", s.address || "—"],
    ["Date of admission", d(s.admittedOn)], ["Class last studied", s.lastClass || "—"],
    ["Date of leaving", d(s.leftOn)], ["Reason for leaving", s.reason || "—"],
  ];

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 14, fontFamily: "inherit" }}>
        <button onClick={() => navigate(-1)} style={btn}>← Back</button>
        <button onClick={() => window.print()} style={{ ...btn, background: "var(--brand)", color: "#fff", border: "none" }}>Print</button>
      </div>
      <div style={{ background: "#fff", maxWidth: 760, margin: "0 auto", padding: "36px 44px", border: "1px solid #CBD5E1", color: "#0F172A" }}>
        <div style={{ textAlign: "center", borderBottom: "2px solid var(--brand)", paddingBottom: 14, marginBottom: 18 }}>
          {tc.school?.branding?.logoUrl && <img src={tc.school.branding.logoUrl} alt="" style={{ height: 64, marginBottom: 6 }} />}
          <div style={{ fontSize: 22, fontWeight: 700 }}>{tc.school?.name}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{[tc.school?.address, tc.school?.city].filter(Boolean).join(", ")}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{[tc.school?.phone, tc.school?.email].filter(Boolean).join(" · ")}</div>
          <div style={{ marginTop: 12, fontSize: 18, letterSpacing: 2, fontWeight: 700 }}>TRANSFER CERTIFICATE</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 16 }}>
          <span>No. <strong>{tc.tcNumber}</strong></span>
          <span>Date of issue: <strong>{d(tc.issuedAt)}</strong></span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={k}>
                <td style={{ padding: "8px 6px", borderBottom: "1px dotted #94A3B8", width: "42%" }}>{i + 1}. {k}</td>
                <td style={{ padding: "8px 6px", borderBottom: "1px dotted #94A3B8", fontWeight: 600 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tc.history?.length > 0 && (
          <div style={{ marginTop: 18, fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Record of classes</div>
            {tc.history.map((h) => <div key={h.session}>{h.session}: Class {h.class} ({h.result})</div>)}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 70, fontSize: 13 }}>
          <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #0F172A", width: 180, paddingTop: 4 }}>Class teacher</div></div>
          <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #0F172A", width: 180, paddingTop: 4 }}>Principal{tc.school?.principal ? ` (${tc.school.principal})` : ""}</div></div>
        </div>
      </div>
      <style>{`@media print { .no-print { display: none !important; } aside, nav { display: none !important; } body { background: #fff !important; } }`}</style>
    </div>
  );
}

const btn = { padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" };
