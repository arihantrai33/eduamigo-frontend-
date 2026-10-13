import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { errorMessage } from "../../utils/toast";
import { Printer } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";

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

  const header = (
    <div className="no-print" style={{ marginBottom: 14, fontFamily: "inherit" }}>
      <PageHeader title="Transfer Certificate" onBack={() => navigate(-1)}
        actions={tc && <button type="button" className="ea-btn ea-btn--primary" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print</button>} />
    </div>
  );
  if (error) return <div>{header}<div className="ea-alert" role="alert"><span>{error}</span></div></div>;
  if (!tc) return <div>{header}<div role="status" style={{ padding: 24, color: "var(--ea-muted)" }}>Loading…</div></div>;
  const s = tc.student;
  const rows = [
    ["Name of the student", s.name], ["Admission number", s.admissionNo || "—"], ["Date of birth", d(s.dateOfBirth)],
    ["Gender", s.gender || "—"], ["Parent / guardian", s.parentName || "—"], ["Address", s.address || "—"],
    ["Date of admission", d(s.admittedOn)], ["Class last studied", s.lastClass || "—"],
    ["Date of leaving", d(s.leftOn)], ["Reason for leaving", s.reason || "—"],
  ];

  return (
    <div className="ea-print-doc" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {header}
      <div className="tc-sheet" style={{ background: "#fff", maxWidth: 760, margin: "0 auto", padding: "36px 44px", border: "1px solid #CBD5E1", color: "#0F172A" }}>
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
        <div className="tc-signs" style={{ display: "flex", justifyContent: "space-between", marginTop: 70, fontSize: 13 }}>
          <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #0F172A", width: 180, paddingTop: 4 }}>Class teacher</div></div>
          <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #0F172A", width: 180, paddingTop: 4 }}>Principal{tc.school?.principal ? ` (${tc.school.principal})` : ""}</div></div>
        </div>
      </div>
      {/* The shell around the page is left out by the shared .ea-print-doc rule (index.css). */}
      <style>{`@media print {
        @page { size: A4; margin: 14mm; }
        .tc-sheet { border: 0 !important; padding: 0 !important; max-width: none !important; }
        .tc-sheet tr, .tc-signs { break-inside: avoid; }
      }`}</style>
    </div>
  );
}
