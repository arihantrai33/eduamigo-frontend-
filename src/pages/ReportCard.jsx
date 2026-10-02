import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast, errorMessage } from "../utils/toast";
import { currentAcademicYear } from "../utils/academicYear";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const PERIODS = ["Term 1", "Term 2", "Full Year"];
const GRADE_SCALE = [["A+", "90–100"], ["A", "80–89"], ["B", "70–79"], ["C", "60–69"], ["D", "50–59"], ["E", "33–49"], ["F", "Below 33"], ["AB", "Absent"]];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "—");
const num = (n) => (Number.isInteger(n) ? n : Number(n).toFixed(1));

// Printable report cards. Opened with ?studentId= for one student, or ?class=&section= for a whole class
// (one card per printed page). "Download PDF" uses the browser's Save as PDF from the print dialog.
export default function ReportCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const studentId = params.get("studentId");
  const cls = params.get("class");
  const section = params.get("section");
  const term = params.get("term") || "Term 1";
  const academicYear = params.get("academicYear") || currentAcademicYear();
  const canEditRemarks = user && (user.role === "admin" || user.role === "teacher");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = `term=${encodeURIComponent(term)}&academicYear=${academicYear}`;
      const url = studentId
        ? `${API}/report-cards/student/${studentId}?${q}`
        : `${API}/report-cards?class=${encodeURIComponent(cls || "")}&section=${encodeURIComponent(section || "")}&${q}`;
      const res = await axios.get(url, auth());
      setReport(res.data.data);
    } catch (err) {
      setError(errorMessage(err, "Could not load the report card"));
    } finally {
      setLoading(false);
    }
  }, [studentId, cls, section, term, academicYear]);

  useEffect(() => { load(); }, [load]);

  const setParam = (k, v) => { const next = new URLSearchParams(params); next.set(k, v); setParams(next, { replace: true }); };
  const startYear = Number(currentAcademicYear().slice(0, 4));
  const years = [startYear - 1, startYear].map((y) => `${y}-${String((y + 1) % 100).padStart(2, "0")}`);
  const title = studentId ? "Report Card" : `Report Cards · Class ${cls}-${section}`;

  return (
    <div className="rc-root">
      <style>{CSS}</style>
      <div className="rc-toolbar no-print">
        <button className="rc-btn ghost" onClick={() => navigate(-1)} aria-label="Back">← Back</button>
        <div className="rc-toolbar-title">{title}</div>
        <select value={term} onChange={(e) => setParam("term", e.target.value)} aria-label="Term">
          {PERIODS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={academicYear} onChange={(e) => setParam("academicYear", e.target.value)} aria-label="Academic year">
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <button className="rc-btn" onClick={() => window.print()} disabled={!report?.cards?.length}>Download PDF / Print</button>
      </div>

      {loading && <div className="rc-msg no-print">Loading report card...</div>}
      {!loading && error && <div className="rc-msg error no-print">{error}</div>}
      {!loading && !error && report && report.cards.length === 0 && <div className="rc-msg no-print">No students found.</div>}
      {!loading && !error && report?.cards?.map((card) => (
        <Card key={card.student._id} card={card} report={report} canEditRemarks={canEditRemarks} onSaved={load} />
      ))}
    </div>
  );
}

function Card({ card, report, canEditRemarks, onSaved }) {
  const { school, term, academicYear } = report;
  const [remarks, setRemarks] = useState(card.remarks || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const empty = card.subjects.length === 0;

  const saveRemarks = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/report-cards/student/${card.student._id}/remarks`, { term, academicYear, remarks }, auth());
      toast.success("Remarks saved");
      setEditing(false);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rc-page">
      <header className="rc-head">
        <div className="rc-school">{school?.name}</div>
        {school?.address && <div className="rc-sub">{school.address}</div>}
        {(school?.phone || school?.email) && <div className="rc-sub">{[school.phone, school.email].filter(Boolean).join(" · ")}</div>}
        <div className="rc-title">Report Card · {term} · {academicYear}</div>
      </header>

      <div className="rc-info">
        <div><span>Student</span><b>{card.student.name}</b></div>
        <div><span>Class</span><b>{card.student.class}-{card.student.section}</b></div>
        <div><span>Roll No.</span><b>{card.student.rollNumber || "—"}</b></div>
        <div><span>Date of Birth</span><b>{fmtDate(card.student.dateOfBirth)}</b></div>
        <div><span>Parent / Guardian</span><b>{card.student.parentName || "—"}</b></div>
        <div><span>Attendance</span><b>{card.attendance.workingDays ? `${card.attendance.present} / ${card.attendance.workingDays} days (${card.attendance.percentage}%)` : "Not recorded"}</b></div>
      </div>

      {empty ? (
        <div className="rc-empty">No published results for {term} {academicYear} yet.</div>
      ) : (
        <table className="rc-table">
          <thead>
            <tr>
              <th className="left">Subject</th>
              {card.columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Total</th>
              <th>%</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {card.subjects.map((s) => (
              <tr key={s.subject} className={s.passed ? "" : "below"}>
                <td className="left">{s.subject}</td>
                {card.columns.map((c) => {
                  const cell = s.cells[c.key];
                  return <td key={c.key}>{!cell ? "—" : cell.absent ? "AB" : <>{num(cell.obtained)}<small>/{cell.max}</small></>}</td>;
                })}
                <td><b>{num(s.obtained)}</b><small>/{s.max}</small></td>
                <td>{num(s.percentage)}</td>
                <td><b>{s.grade}</b></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="left">Overall</td>
              <td colSpan={card.columns.length} />
              <td><b>{num(card.totals.obtained)}</b><small>/{card.totals.max}</small></td>
              <td><b>{num(card.totals.percentage)}</b></td>
              <td><b>{card.totals.grade}</b></td>
            </tr>
          </tfoot>
        </table>
      )}

      {!empty && (
        <div className="rc-summary">
          <div><span>Result</span><b className={card.totals.result === "Pass" ? "ok" : "warn"}>{card.totals.result === "Pass" ? "Pass" : `Below passing marks in ${card.totals.belowIn.join(", ")}`}</b></div>
          <div><span>Rank in class</span><b>{card.rank ? `${card.rank} of ${card.classSize}` : "—"}</b></div>
        </div>
      )}

      <div className="rc-remarks">
        <div className="rc-label">Class Teacher's Remarks</div>
        {editing ? (
          <div className="no-print">
            <textarea value={remarks} maxLength={600} rows={3} onChange={(e) => setRemarks(e.target.value)} placeholder="Strengths, areas to improve, conduct..." />
            <div className="rc-row">
              <span className="rc-count">{remarks.length}/600</span>
              <button className="rc-btn ghost" onClick={() => { setEditing(false); setRemarks(card.remarks || ""); }}>Cancel</button>
              <button className="rc-btn" onClick={saveRemarks} disabled={saving}>{saving ? "Saving..." : "Save Remarks"}</button>
            </div>
          </div>
        ) : (
          <div className="rc-remarks-text">
            {card.remarks || <span className="muted">—</span>}
            {canEditRemarks && <button className="rc-link no-print" onClick={() => setEditing(true)}>{card.remarks ? "Edit" : "Add remarks"}</button>}
          </div>
        )}
      </div>

      <div className="rc-signs">
        <div>Class Teacher</div>
        <div>Principal{school?.principal ? <small>{school.principal}</small> : null}</div>
        <div>Parent / Guardian</div>
      </div>

      <footer className="rc-foot">
        <div className="rc-scale">{GRADE_SCALE.map(([g, r]) => <span key={g}><b>{g}</b> {r}</span>)}</div>
        <div>Issued on {fmtDate(report.generatedOn)} · Pass mark 33% in each subject</div>
      </footer>
    </section>
  );
}

const CSS = `
.rc-root { min-height: 100vh; background: #EEF0F4; padding: 0 0 40px; font-family: Inter, 'Segoe UI', sans-serif; color: #111827; }
.rc-toolbar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 12px 16px; background: #fff; border-bottom: 1px solid #E5E7EB; }
.rc-toolbar-title { font-weight: 700; font-size: 15px; margin-right: auto; }
.rc-toolbar select { padding: 8px 10px; border-radius: 8px; border: 1px solid #D1D5DB; font: inherit; font-size: 13px; background: #fff; }
.rc-btn { padding: 9px 16px; border-radius: 8px; border: none; background: #4338CA; color: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.rc-btn:disabled { opacity: .5; cursor: default; }
.rc-btn.ghost { background: #F3F4F6; color: #374151; }
.rc-msg { max-width: 794px; margin: 24px auto; padding: 24px; background: #fff; border-radius: 12px; text-align: center; color: #6B7280; }
.rc-msg.error { color: #B91C1C; }
.rc-page { box-sizing: border-box; width: 100%; max-width: 794px; margin: 20px auto; background: #fff; padding: 36px 40px; border-radius: 4px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
.rc-head { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
.rc-school { font-size: 22px; font-weight: 800; letter-spacing: .3px; }
.rc-sub { font-size: 12px; color: #4B5563; margin-top: 2px; }
.rc-title { margin-top: 10px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4338CA; }
.rc-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; margin-bottom: 16px; font-size: 13px; }
.rc-info span, .rc-summary span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #6B7280; }
.rc-info b { font-weight: 600; }
.rc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rc-table th, .rc-table td { border: 1px solid #D1D5DB; padding: 7px 8px; text-align: center; }
.rc-table th { background: #F3F4F6; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
.rc-table .left { text-align: left; }
.rc-table small { color: #6B7280; font-size: 10px; }
.rc-table tr.below td { background: #FEF2F2; }
.rc-table tfoot td { background: #F9FAFB; font-weight: 600; }
.rc-empty { padding: 28px; text-align: center; color: #6B7280; border: 1px dashed #D1D5DB; border-radius: 8px; }
.rc-summary { display: flex; gap: 32px; margin: 14px 0; font-size: 14px; }
.rc-summary .ok { color: #15803D; } .rc-summary .warn { color: #B45309; }
.rc-remarks { margin-top: 10px; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px 12px; min-height: 56px; }
.rc-label { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #6B7280; margin-bottom: 4px; }
.rc-remarks-text { font-size: 13px; line-height: 1.5; }
.rc-remarks textarea { width: 100%; box-sizing: border-box; font: inherit; font-size: 13px; padding: 8px; border-radius: 6px; border: 1px solid #D1D5DB; }
.rc-row { display: flex; gap: 8px; justify-content: flex-end; align-items: center; margin-top: 6px; }
.rc-count { margin-right: auto; font-size: 11px; color: #9CA3AF; }
.rc-link { margin-left: 8px; background: none; border: none; color: #4338CA; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.muted { color: #9CA3AF; }
.rc-signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; font-size: 12px; text-align: center; }
.rc-signs div { border-top: 1px solid #111827; padding-top: 6px; }
.rc-signs small { display: block; color: #6B7280; }
.rc-foot { margin-top: 20px; font-size: 10px; color: #6B7280; display: flex; flex-direction: column; gap: 4px; }
.rc-scale { display: flex; flex-wrap: wrap; gap: 4px 12px; }
@media (max-width: 640px) {
  .rc-page { padding: 20px 14px; margin: 10px auto; }
  .rc-info { grid-template-columns: 1fr 1fr; }
  .rc-table { font-size: 11px; } .rc-table th, .rc-table td { padding: 5px 4px; }
}
@media print {
  @page { size: A4; margin: 12mm; }
  .no-print { display: none !important; }
  /* The app shell fixes its height for mobile screens; let printed pages flow instead. */
  html, body, #root, div:has(.rc-root) { height: auto !important; min-height: 0 !important; max-height: none !important; width: auto !important; max-width: none !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; position: static !important; display: block !important; background: #fff !important; box-shadow: none !important; border-radius: 0 !important; }
  /* Nothing but the cards: hide toasts, dialogs and anything else mounted beside the page. */
  body * { visibility: hidden; }
  .rc-root, .rc-root * { visibility: visible; }
  .rc-root { background: #fff; padding: 0; }
  .rc-page { box-shadow: none; margin: 0; max-width: none; padding: 0; page-break-after: always; break-after: page; }
  .rc-page:last-child { page-break-after: auto; break-after: auto; }
  .rc-table tr.below td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
