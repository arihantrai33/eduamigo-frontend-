import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Glyph from "../../components/Glyph";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";
import EmptyState from "../../components/ui/EmptyState";
import { CalendarDays } from "lucide-react";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import Skeleton from "../../components/ui/Skeleton";
import FileAttach from "../../components/ui/FileAttach";

const FIELDS = { fromDate: "leave-from", toDate: "leave-to", reason: "leave-reason" };
const API = import.meta.env.VITE_API_URL;
const LEAVE_TYPES = ["Sick", "Family", "Personal", "Other"];
export default function ApplyLeave() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const dm = darkMode;
  const token = user?.token;
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [quota, setQuota] = useState({ total: 0, used: 0, available: 0 });
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const v = useFieldErrors(FIELDS);
  const headers = { Authorization: `Bearer ${token}` };
  useEffect(() => { fetchQuota(); fetchHistory(); }, []);
  const fetchQuota = async () => {
    try {
      const res = await fetch(`${API}/leaves/quota`, { headers });
      const data = await res.json();
      if (data.success) setQuota(data.data);
    } catch {} finally { setQuotaLoading(false); }
  };
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/leaves/my`, { headers });
      const data = await res.json();
      if (data.success) setLeaveHistory(data.data);
    } catch {} finally { setHistoryLoading(false); }
  };
  const calcDays = () => {
    if (!fromDate || !toDate) return 0;
    const diff = new Date(toDate) - new Date(fromDate);
    if (diff < 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };
  const handleSubmit = async () => {
    setFormError("");
    if (!v.check({
      fromDate: !fromDate && "Choose the first day of leave.",
      toDate: !toDate ? "Choose the last day of leave." : fromDate && new Date(toDate) < new Date(fromDate) && "End date cannot be before start date.",
      reason: !reason.trim() && "Write the reason for the leave.",
    })) return;
    setLoading(true);
    try {
      let attachment = {};
      if (attachedFile) {
        const fd = new FormData();
        fd.append("file", attachedFile);
        const up = await fetch(`${API}/chat/upload`, { method: "POST", headers, body: fd });
        const upData = await up.json();
        if (!up.ok) { setFormError(upData.message || "Could not upload the document."); return; }
        attachment = { attachmentUrl: upData.url, attachmentName: upData.fileName };
      }
      const res = await fetch(`${API}/leaves/apply`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, fromDate, toDate, reason, ...attachment }),
      });
      const data = await res.json();
      if (!data.success) setFormError(data.message || "Submission failed. Please try again.");
      else setSuccess(true);
    } catch { setFormError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  };
  const days = calcDays();
  // Shared field style (.ea-input): white, bordered, 40 px; its colours follow the portal's light or dark theme.
  const inputStyle = { width: "100%", marginTop: 6, colorScheme: dm ? "dark" : "light" };
  if (success) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "inherit", background: dm ? "#0f172a" : "#f5f6fa" }}>
      <div style={{ fontSize: "64px" }}><Glyph e="✅" /></div>
      <div style={{ fontWeight: "800", fontSize: "20px", marginTop: "16px", color: dm ? "#f1f5f9" : "#111" }}>Leave request sent</div>
      <div style={{ color: dm ? "var(--ea-muted)" : "var(--ea-muted)", fontSize: "13px", marginTop: "8px" }}>Your request has been submitted for approval.</div>
      <button type="button" className="ea-btn ea-btn--primary" onClick={() => navigate(-1)} style={{ marginTop: "32px", minHeight: 48, padding: "0 32px", fontSize: 15 }}>
        Go Back
      </button>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", background: dm ? "#0f172a" : "#f5f6fa", fontFamily: "inherit", paddingBottom: "32px" }}>
      <PortalHeader title="Leave Application" subtitle="Submit and track your leave requests" onBack={() => navigate(-1)} />
      <div className="ea-pd-body ea-pd-cols" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="ea-pd-full">
          <SummaryCard title="Leave balance" caption={quotaLoading ? "Loading balance..." : undefined}
            items={quotaLoading ? [] : [
              { label: "Total", value: quota.total },
              { label: "Available", value: quota.available, tone: "success" },
              { label: "Used", value: quota.used },
            ]} />
        </div>
        <div className="ea-pd-main ea-card" style={{ padding: 20 }}>
          <h2 className="ea-form-section__title">Apply new leave</h2>
          <div style={{ marginBottom: "16px" }}>
            <label className="ea-label" htmlFor="leave-type">Leave type</label>
            <select id="leave-type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="ea-select" style={inputStyle}>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
            <div>
              <label className="ea-label" htmlFor="leave-from">From date</label>
              <input id="leave-from" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setFormError(""); v.clear("fromDate"); }} className="ea-input" style={inputStyle} {...v.invalid("fromDate")} />
              <FieldError id={v.errorId("fromDate")}>{v.errors.fromDate}</FieldError>
            </div>
            <div>
              <label className="ea-label" htmlFor="leave-to">To date</label>
              <input id="leave-to" type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setFormError(""); v.clear("toDate"); }} className="ea-input" style={inputStyle} {...v.invalid("toDate")} />
              <FieldError id={v.errorId("toDate")}>{v.errors.toDate}</FieldError>
            </div>
          </div>
          {days > 0 && (
            <div style={{ marginBottom: "16px", padding: "8px 12px", background: dm ? "#1e3a5f" : "#f0f4ff", borderRadius: "8px", fontSize: "12px", color: "var(--brand-dark)", fontWeight: "600" }}>
              Duration: {days} day{days > 1 ? "s" : ""}
            </div>
          )}
          <div style={{ marginBottom: "16px" }}>
            <label className="ea-label" htmlFor="leave-reason">Reason</label>
            <textarea id="leave-reason" value={reason} onChange={(e) => { setReason(e.target.value); setFormError(""); v.clear("reason"); }} placeholder="Explain the reason for leave..." rows={4} className="ea-input" style={inputStyle} {...v.invalid("reason")} />
            <FieldError id={v.errorId("reason")}>{v.errors.reason}</FieldError>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <FileAttach id="leave-attachment" label="Attach document (optional)" file={attachedFile} onChange={setAttachedFile} />
          </div>
          {formError && (
            <div style={{ marginBottom: "12px", padding: "10px 14px", background: dm ? "#2a0f0f" : "#fff5f5", borderRadius: "8px", border: "1px solid #fee2e2", fontSize: "13px", color: "var(--ea-on-card-danger)", fontWeight: "600" }}>{formError}</div>
          )}
          <button type="button" className="ea-btn ea-btn--primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", minHeight: 48, fontSize: 15 }}>
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>
        <div className="ea-pd-side ea-card" style={{ padding: 20 }}>
          <h2 className="ea-form-section__title">Leave history</h2>
          {historyLoading ? (
            <Skeleton rows={3} label="Loading history" />
          ) : leaveHistory.length === 0 ? (
            <EmptyState plain icon={CalendarDays} title="No leave requests yet" text="Requests you send appear here with their status." />
          ) : leaveHistory.map((leave, i) => {
            const statusColor = leave.status === "Approved" ? "#22c55e" : leave.status === "Rejected" ? "#ef4444" : "#f59e0b";
            const leaveDays = leave.fromDate && leave.toDate ? Math.max(1, Math.round((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24) + 1)) : 1;
            return (
              <div key={leave._id || i} style={{ padding: "14px", borderRadius: "12px", background: dm ? "#0f172a" : (leave.status === "Rejected" ? "#fff5f5" : "#f9fafb"), marginBottom: "10px", border: `1px solid ${leave.status === "Rejected" ? "#fee2e2" : dm ? "#334155" : "#f0f0f0"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: dm ? "#f1f5f9" : "#111" }}>{leave.leaveType}</div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: statusColor, background: `color-mix(in srgb, ${statusColor} 9%, transparent)`, padding: "3px 10px", borderRadius: "20px" }}>{leave.status}</span>
                </div>
                <div style={{ fontSize: "12px", color: dm ? "var(--ea-muted)" : "var(--ea-muted)", marginTop: "4px" }}>
                  {new Date(leave.fromDate).toLocaleDateString("en-GB")} — {new Date(leave.toDate).toLocaleDateString("en-GB")} • {leaveDays} day{leaveDays > 1 ? "s" : ""}
                </div>
                {leave.reason && <div style={{ fontSize: "12px", color: dm ? "#64748b" : "var(--ea-muted)", marginTop: "4px" }}>{leave.reason}</div>}
                {leave.reviewNote && <div style={{ marginTop: "8px", fontSize: "11px", color: dm ? "var(--ea-muted)" : "#666", background: dm ? "#1e3a5f" : "#f0f4ff", padding: "6px 10px", borderRadius: "6px" }}>Reviewer Note: {leave.reviewNote}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
