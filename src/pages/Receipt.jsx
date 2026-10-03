import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { errorMessage } from "../utils/toast";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d, time = false) => (d ? new Date(d).toLocaleString("en-IN", time
  ? { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
  : { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "—");

// Fee payment receipt (cash or online), printable on A5/A4 or saved as PDF.
export default function Receipt() {
  const { feeId, receiptNo } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/fees/${feeId}/receipts/${encodeURIComponent(receiptNo)}`, auth())
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err, "Could not load the receipt")));
  }, [feeId, receiptNo]);

  return (
    <div className="rcpt-root">
      <style>{CSS}</style>
      <div className="rcpt-bar no-print">
        <button className="rcpt-btn ghost" onClick={() => navigate(-1)}>← Back</button>
        <button className="rcpt-btn" onClick={() => window.print()} disabled={!data}>Download PDF / Print</button>
      </div>
      {!data && !error && <div className="rcpt-msg">Loading receipt...</div>}
      {error && <div className="rcpt-msg error">{error}</div>}
      {data && (
        <section className="rcpt">
          <header>
            <div className="rcpt-school">{data.school?.name}</div>
            {data.school?.address && <div className="rcpt-sub">{data.school.address}</div>}
            {(data.school?.phone || data.school?.email) && <div className="rcpt-sub">{[data.school.phone, data.school.email].filter(Boolean).join(" · ")}</div>}
            <div className="rcpt-title">Fee Receipt</div>
          </header>
          <div className="rcpt-grid">
            <div><span>Receipt No.</span><b>{data.payment.receiptNo}</b></div>
            <div><span>Date</span><b>{fmt(data.payment.paidAt, true)}</b></div>
            <div><span>Student</span><b>{data.student?.name || "—"}</b></div>
            <div><span>Class</span><b>{data.student ? `${data.student.class}-${data.student.section}` : "—"}</b></div>
            <div><span>Roll No.</span><b>{data.student?.rollNumber || "—"}</b></div>
            <div><span>Academic Year</span><b>{data.fee.academicYear || "—"}</b></div>
          </div>
          <table>
            <tbody>
              <tr><td>{data.fee.feeType} fee{data.fee.month ? ` (${data.fee.month} ${data.fee.year || ""})` : ""}</td><td>{rupees(data.fee.amount)}</td></tr>
              <tr><td>Paid to date</td><td>{rupees(data.paidToDate)}</td></tr>
              <tr className="strong"><td>Amount received</td><td>{rupees(data.payment.amount)}</td></tr>
              <tr><td>Balance due</td><td>{rupees(data.balanceAfter)}</td></tr>
            </tbody>
          </table>
          <div className="rcpt-grid two">
            <div><span>Payment mode</span><b>{data.payment.mode}</b></div>
            <div><span>Reference</span><b>{data.payment.reference || "—"}</b></div>
          </div>
          <footer>
            <div>This is a computer-generated receipt and does not need a signature.</div>
            <div>Due date for this fee: {fmt(data.fee.dueDate)}</div>
          </footer>
        </section>
      )}
    </div>
  );
}

const CSS = `
.rcpt-root { min-height: 100vh; background: #EEF0F4; font-family: Inter, 'Segoe UI', sans-serif; color: #111827; padding-bottom: 40px; }
.rcpt-bar { position: sticky; top: 0; display: flex; justify-content: space-between; gap: 10px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #E5E7EB; }
.rcpt-btn { padding: 9px 16px; border-radius: 8px; border: none; background: var(--brand-dark); color: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.rcpt-btn.ghost { background: #F3F4F6; color: #374151; }
.rcpt-btn:disabled { opacity: .5; }
.rcpt-msg { max-width: 560px; margin: 24px auto; padding: 24px; background: #fff; border-radius: 12px; text-align: center; color: #6B7280; }
.rcpt-msg.error { color: #B91C1C; }
.rcpt { box-sizing: border-box; max-width: 560px; margin: 20px auto; background: #fff; padding: 28px 30px; border-radius: 6px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
.rcpt header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 14px; }
.rcpt-school { font-size: 19px; font-weight: 800; }
.rcpt-sub { font-size: 12px; color: #4B5563; margin-top: 2px; }
.rcpt-title { margin-top: 8px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--brand-dark); }
.rcpt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 13px; margin-bottom: 14px; }
.rcpt-grid span { display: block; font-size: 10px; letter-spacing: .6px; text-transform: uppercase; color: #6B7280; }
.rcpt table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 14px; }
.rcpt td { border-bottom: 1px solid #E5E7EB; padding: 8px 4px; }
.rcpt td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
.rcpt tr.strong td { font-weight: 800; font-size: 15px; background: #F9FAFB; }
.rcpt footer { font-size: 11px; color: #6B7280; display: flex; flex-direction: column; gap: 3px; border-top: 1px dashed #D1D5DB; padding-top: 10px; }
@media print {
  @page { size: A5; margin: 10mm; }
  .no-print { display: none !important; }
  html, body, #root, div:has(.rcpt-root) { height: auto !important; min-height: 0 !important; width: auto !important; max-width: none !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; position: static !important; display: block !important; background: #fff !important; }
  body * { visibility: hidden; }
  .rcpt-root, .rcpt-root * { visibility: visible; }
  .rcpt-root { background: #fff; padding: 0; }
  .rcpt { box-shadow: none; margin: 0; max-width: none; padding: 0; }
}
`;
