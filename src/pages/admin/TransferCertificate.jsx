import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast, errorMessage } from "../../utils/toast";
import { Printer, FileText } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import { todayLocal } from "../../utils/dates";
import Skeleton from "../../components/ui/Skeleton";

// Printable transfer certificate (backend: GET /api/students/:id/transfer-certificate).
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const d = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—");
// Calendar days (birth, admission, leaving) are stored at midnight UTC: shown in UTC so they never move a day.
const day = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "—");
// Facts the school has not recorded are printed as such, never guessed (backend lists them in `missing`).
const NOT_RECORDED = "Not recorded";
const MISSING_LABELS = { admittedOn: "Date of admission", dateOfBirth: "Date of birth" };

export default function TransferCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tc, setTc] = useState(null);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => axios.get(`${API}/students/${id}/transfer-certificate`, auth())
    .then((r) => setTc(r.data.data))
    .catch((err) => setError(errorMessage(err, "Could not load the transfer certificate"))), [id]);
  useEffect(() => { load(); }, [load]);

  // Records the dates entered for the missing facts on the student, then shows the certificate again.
  const saveMissing = async () => {
    const body = Object.fromEntries(Object.entries(entries).filter(([, v]) => v));
    if (!Object.keys(body).length) return toast.error("Enter a date first, or print it as “Not recorded”");
    setSaving(true);
    try {
      await axios.put(`${API}/students/${tc.student._id}`, body, auth());
      toast.success("Saved on the student's record");
      setEntries({});
      await load();
    } catch (err) { toast.error(errorMessage(err, "Could not save the date")); }
    setSaving(false);
  };

  const header = (
    <div className="no-print" style={{ marginBottom: 14, fontFamily: "inherit" }}>
      <PageHeader title="Transfer Certificate" onBack={() => navigate(-1)}
        actions={tc && <button type="button" className="ea-btn ea-btn--primary" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print</button>} />
    </div>
  );
  // Usually "the student has not left yet": say so, and offer where a TC is started.
  if (error) return (
    <div>{header}
      <EmptyState icon={FileText} role="alert" title="Transfer certificate not available" text={error}
        actions={<>
          <button type="button" className="ea-btn ea-btn--primary" onClick={() => navigate("/admin/year-end")}>Go to Year End &amp; TC</button>
          <button type="button" className="ea-btn ea-btn--ghost" onClick={() => navigate(`/admin/students/${id}`)}>Back to the student</button>
        </>} />
    </div>
  );
  if (!tc) return <div>{header}<div style={{ padding: 24 }}><Skeleton rows={5} label="Loading the certificate" /></div></div>;
  const s = tc.student;
  const missing = (tc.missing || []).filter((k) => MISSING_LABELS[k]);
  const rows = [
    ["Name of the student", s.name], ["Admission number", s.admissionNo || "—"], ["Date of birth", s.dateOfBirth ? day(s.dateOfBirth) : NOT_RECORDED],
    ["Gender", s.gender || "—"], ["Parent / guardian", s.parentName || "—"], ["Address", s.address || "—"],
    ["Date of admission", s.admittedOn ? day(s.admittedOn) : NOT_RECORDED], ["Class last studied", s.lastClass || "—"],
    ["Date of leaving", day(s.leftOn)], ["Reason for leaving", s.reason || "—"],
  ];

  return (
    <div className="ea-print-doc">
      {header}
      {missing.length > 0 && (
        <div className="no-print ea-alert ea-alert--warning" role="alert" style={{ marginBottom: 14, display: "block" }}>
          <strong>Not recorded for this student: {missing.map((k) => MISSING_LABELS[k].toLowerCase()).join(" and ")}.</strong>
          <div style={{ margin: "4px 0 10px", fontWeight: 400 }}>The certificate prints “{NOT_RECORDED}” for it. Enter the real date from the school&apos;s admission register if you have it; do not guess.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            {missing.map((k) => (
              <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                {MISSING_LABELS[k]}
                <input type="date" className="ea-input" style={{ flex: "none" }} max={todayLocal()} value={entries[k] || ""} onChange={(e) => setEntries((p) => ({ ...p, [k]: e.target.value }))} />
              </label>
            ))}
            <button type="button" className="ea-btn ea-btn--primary" onClick={saveMissing} disabled={saving}>{saving ? "Saving…" : "Save to student record"}</button>
          </div>
        </div>
      )}
      <div className="tc-sheet" style={{ background: "#fff", maxWidth: 760, margin: "0 auto", border: "1px solid #CBD5E1", color: "#0F172A", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        <div style={{ textAlign: "center", borderBottom: "2px solid var(--brand)", paddingBottom: 14, marginBottom: 18 }}>
          {tc.school?.branding?.logoUrl && <img src={tc.school.branding.logoUrl} alt="" style={{ height: 64, marginBottom: 6 }} />}
          <div style={{ fontSize: 22, fontWeight: 700 }}>{tc.school?.name}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{[tc.school?.address, tc.school?.city].filter(Boolean).join(", ")}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{[tc.school?.phone, tc.school?.email].filter(Boolean).join(" · ")}</div>
          <div style={{ marginTop: 12, fontSize: 18, letterSpacing: 2, fontWeight: 700 }}>TRANSFER CERTIFICATE</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "4px 16px", fontSize: 13, marginBottom: 16 }}>
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
      <style>{`.tc-sheet { padding: 36px 44px; overflow-wrap: anywhere; }
      @media (max-width: 600px) { .tc-sheet { padding: 20px 16px; } .tc-signs > div > div { width: 130px !important; } }
      /* A certificate, not a data table: the phone rule that lets admin tables scroll sideways does not apply. */
      .ea-admin-main .tc-sheet table { min-width: 0 !important; }
      .ea-admin-main .tc-sheet td { white-space: normal !important; position: static !important; box-shadow: none !important; background: none !important; }
      @media print {
        @page { size: A4; margin: 14mm; }
        .tc-sheet { border: 0 !important; padding: 0 !important; max-width: none !important; }
        .tc-sheet tr, .tc-signs { break-inside: avoid; }
      }`}</style>
    </div>
  );
}
