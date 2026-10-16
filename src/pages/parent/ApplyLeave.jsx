import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, errorMessage } from "../../utils/toast";
import { getSelectedChildId } from "../../utils/selectedChild";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

const FIELDS = { fromDate: "leave-from", toDate: "leave-to", reason: "leave-reason" };

import Glyph from "../../components/Glyph";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import FileAttach from "../../components/ui/FileAttach";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Labels shown to parents, mapped to the leave types the school records.
const LEAVE_TYPES = [
  { label: "Medical / Sick Leave", value: "Sick" },
  { label: "Family Emergency", value: "Family" },
  { label: "Personal Leave", value: "Personal" },
  { label: "Other", value: "Other" },
];

export default function ApplyLeave() {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const v = useFieldErrors(FIELDS);
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0].value);
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [quota, setQuota] = useState({ total: 0, used: 0, available: 0 });

  const load = useCallback(async () => {
    const [my, q] = await Promise.allSettled([
      axios.get(`${API}/leaves/my`, authHeader()),
      axios.get(`${API}/leaves/quota`, authHeader()),
    ]);
    if (my.status === "fulfilled") setLeaveHistory(my.value.data.data || []);
    if (q.status === "fulfilled") setQuota(q.value.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const { total, used, available } = quota;

  const handleSubmit = async () => {
    if (!v.check({
      fromDate: !fromDate && "Choose the first day of leave.",
      toDate: !toDate ? "Choose the last day of leave." : fromDate && toDate < fromDate && "End date cannot be before start date.",
      reason: !reason.trim() && "Write the reason for the leave.",
    })) return;
    setLoading(true);
    try {
      let attachment = {};
      if (attachedFile) {
        const fd = new FormData();
        fd.append("file", attachedFile);
        const up = await axios.post(`${API}/chat/upload`, fd, { headers: { ...authHeader().headers, "Content-Type": "multipart/form-data" } });
        attachment = { attachmentUrl: up.data.url, attachmentName: up.data.fileName };
      }
      await axios.post(`${API}/leaves/apply`, {
        leaveType, fromDate, toDate, reason: reason.trim(),
        studentId: getSelectedChildId() || undefined,
        ...attachment,
      }, authHeader());
      setSuccess(true);
      load();
    } catch (e) {
      toast.error(errorMessage(e, "Could not submit the leave request"));
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", background: "var(--bg)",
      }}>
        <div style={{ fontSize: "64px" }}><Glyph e="✅" /></div>
        <div style={{ fontWeight: "800", fontSize: "20px", marginTop: "16px", color: "var(--text)" }}>
          Leave request sent
        </div>
        <div style={{ color: "var(--subtext)", fontSize: "13px", marginTop: "8px" }}>
          Your request has been submitted for approval.
        </div>
        <button
          onClick={() => navigate(-1)}
          className="ea-btn ea-btn--primary"
          style={{ marginTop: 32, minHeight: 48, padding: "0 32px", fontSize: 15 }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      fontFamily: "inherit", paddingBottom: "32px",
    }}>

      <PortalHeader title="Leave Application" subtitle="Apply leave for your child" onBack={() => navigate(-1)} />

      {/* Form */}
      <div className="ea-pd-body ea-pd-cols" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="ea-pd-full">
          <SummaryCard title="Leave balance" items={[
            { label: "Total", value: total },
            { label: "Available", value: available, tone: "success" },
            { label: "Used", value: used },
          ]} />
        </div>
        <div className="ea-pd-main ea-card" style={{ padding: 20 }}>
          <h2 className="ea-form-section__title">Apply new leave</h2>

          {/* Leave Type */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="leave-type" className="ea-label">
              Leave type
            </label>
            <select
              id="leave-type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="ea-select" style={{ width: "100%", marginTop: 6 }}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* From / To Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label htmlFor="leave-from" className="ea-label">
                From date
              </label>
              <input
                id="leave-from"
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); v.clear("fromDate"); }}
                {...v.invalid("fromDate")}
                className="ea-input" style={{ width: "100%", marginTop: 6 }}
              />
              <FieldError id={v.errorId("fromDate")}>{v.errors.fromDate}</FieldError>
            </div>
            <div>
              <label htmlFor="leave-to" className="ea-label">
                To date
              </label>
              <input
                id="leave-to"
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); v.clear("toDate"); }}
                {...v.invalid("toDate")}
                className="ea-input" style={{ width: "100%", marginTop: 6 }}
              />
              <FieldError id={v.errorId("toDate")}>{v.errors.toDate}</FieldError>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="leave-reason" className="ea-label">
              Reason
            </label>
            <textarea
              id="leave-reason"
              value={reason}
              onChange={(e) => { setReason(e.target.value); v.clear("reason"); }}
              {...v.invalid("reason")}
              placeholder="Explain the reason for leave..."
              rows={4}
              className="ea-input" style={{ width: "100%", marginTop: 6 }}
            />
            <FieldError id={v.errorId("reason")}>{v.errors.reason}</FieldError>
          </div>

          {/* Attach Document */}
          <div style={{ marginBottom: "16px" }}>
            <FileAttach id="leave-attachment" label="Attach document (optional)" file={attachedFile} onChange={setAttachedFile} />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="ea-btn ea-btn--primary"
            style={{ width: "100%", minHeight: 48, fontSize: 15 }}
          >
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>

        {/* Leave History */}
        {leaveHistory.length > 0 && (
          <div className="ea-pd-side ea-card" style={{ padding: 20 }}>
            <h2 className="ea-form-section__title">Leave history</h2>
            {leaveHistory.map((leave, i) => {
              const statusColor =
                leave.status === "Approved" ? "var(--ea-on-card-success)" :
                leave.status === "Rejected" ? "var(--ea-on-card-danger)" : "var(--ea-on-card-warning)";
              const days = leave.days || 1;
              const fmtDay = (d) => new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
              return (
                <div key={i} style={{
                  padding: "14px", borderRadius: "12px",
                  background: leave.status === "Rejected" ? "color-mix(in srgb, #EF4444 10%, var(--ea-surface))" : "var(--ea-hover)",
                  marginBottom: "10px",
                  border: `1px solid ${leave.status === "Rejected" ? "rgba(239, 68, 68, 0.25)" : "var(--ea-line)"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>
                      {leave.leaveType}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: statusColor }}>
                      {leave.status === "Pending" ? "Pending" :
                       leave.status === "Approved" ? "Approved" : "Rejected"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "4px" }}>
                    {fmtDay(leave.fromDate)} — {fmtDay(leave.toDate)} • {days} day{days > 1 ? "s" : ""}
                  </div>
                  {leave.reason && (
                    <div style={{ fontSize: "12px", color: "var(--ea-muted)", marginTop: "4px" }}>
                      {leave.reason}
                    </div>
                  )}
                  {leave.attachmentName && (
                    <div style={{
                      marginTop: "8px", fontSize: "11px", color: "var(--brand)",
                      display: "flex", alignItems: "center", gap: "4px",
                    }}>
                      <Glyph e="📎" /> {leave.attachmentName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}