import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, errorMessage } from "../../utils/toast";
import { getSelectedChildId } from "../../utils/selectedChild";

import Glyph from "../../components/Glyph";
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
    if (!fromDate || !toDate || !reason.trim()) {
      toast.error("Please fill in the dates and the reason.");
      return;
    }
    if (toDate < fromDate) {
      toast.error("End date cannot be before start date.");
      return;
    }
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
          Leave Applied Successfully!
        </div>
        <div style={{ color: "var(--subtext)", fontSize: "13px", marginTop: "8px" }}>
          Your request has been submitted for approval.
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "32px", padding: "14px 32px", borderRadius: "12px",
            background: "var(--brand-gradient)",
            color: "white", border: "none", fontWeight: "700",
            fontSize: "15px", cursor: "pointer",
          }}
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

      {/* Header */}
      <div style={{
        background: "var(--brand-gradient)",
        padding: "48px 20px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none",
              borderRadius: "50%", width: "36px", height: "36px",
              color: "white", fontSize: "18px", cursor: "pointer",
            }}
          >←</button>
          <div>
            <div style={{ color: "white", fontWeight: "800", fontSize: "18px" }}>
              <Glyph e="📝" /> Leave Application
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
              Apply leave for your child
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px", marginTop: "20px",
        }}>
          {[
            { label: "TOTAL", value: total, color: "var(--brand)" },
            { label: "AVAILABLE", value: available, color: "#22c55e" },
            { label: "USED", value: used, color: "#ef4444" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--card)", borderRadius: "12px",
              padding: "12px", textAlign: "center",
            }}>
              <div style={{ fontSize: "24px", fontWeight: "800", color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "10px", color: "var(--subtext)", fontWeight: "700", letterSpacing: "0.5px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{
          background: "var(--card)", borderRadius: "16px", padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--subtext)", letterSpacing: "1px", marginBottom: "16px" }}>
            APPLY NEW LEAVE
          </div>

          {/* Leave Type */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="leave-type" style={{ fontSize: "11px", fontWeight: "700", color: "var(--subtext2)", letterSpacing: "0.5px" }}>
              LEAVE TYPE
            </label>
            <select
              id="leave-type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{
                width: "100%", marginTop: "8px", padding: "12px",
                borderRadius: "10px", border: "1px solid #e0e0e0",
                fontSize: "14px", color: "var(--text)", outline: "none",
                fontFamily: "inherit",
                background: "var(--card)", boxSizing: "border-box",
              }}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* From / To Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label htmlFor="leave-from" style={{ fontSize: "11px", fontWeight: "700", color: "var(--subtext2)", letterSpacing: "0.5px" }}>
                FROM DATE
              </label>
              <input
                id="leave-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  width: "100%", marginTop: "8px", padding: "12px",
                  borderRadius: "10px", border: "1px solid #e0e0e0",
                  fontSize: "13px", outline: "none", color: "var(--text)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label htmlFor="leave-to" style={{ fontSize: "11px", fontWeight: "700", color: "var(--subtext2)", letterSpacing: "0.5px" }}>
                TO DATE
              </label>
              <input
                id="leave-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  width: "100%", marginTop: "8px", padding: "12px",
                  borderRadius: "10px", border: "1px solid #e0e0e0",
                  fontSize: "13px", outline: "none", color: "var(--text)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="leave-reason" style={{ fontSize: "11px", fontWeight: "700", color: "var(--subtext2)", letterSpacing: "0.5px" }}>
              REASON
            </label>
            <textarea
              id="leave-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for leave..."
              rows={4}
              style={{
                width: "100%", marginTop: "8px", padding: "12px",
                borderRadius: "10px", border: "1px solid #e0e0e0",
                fontSize: "14px", outline: "none", color: "var(--text)",
                resize: "none", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Attach Document */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--subtext2)", letterSpacing: "0.5px" }}>
              ATTACH DOCUMENT (Optional)
            </label>
            <div
              onClick={() => document.getElementById("fileInputParent").click()}
              style={{
                marginTop: "8px", padding: "12px 16px",
                borderRadius: "10px", border: "1.5px dashed #c0c0c0",
                cursor: "pointer", display: "flex", alignItems: "center",
                gap: "10px", background: "#fafafa",
              }}
            >
              <span style={{ fontSize: "20px" }}><Glyph e="📎" /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#444" }}>
                  {attachedFile ? attachedFile.name : "Attach Medical Report or Document"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--subtext)", marginTop: "2px" }}>
                  {attachedFile ? `${(attachedFile.size / 1024).toFixed(1)} KB` : "PDF, JPG, PNG supported"}
                </div>
              </div>
              {attachedFile && (
                <span
                  onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }}
                  style={{ fontSize: "18px", color: "var(--subtext)", cursor: "pointer" }}
                >
                  ✕
                </span>
              )}
            </div>
            <input
              id="fileInputParent"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={(e) => setAttachedFile(e.target.files[0] || null)}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "16px",
              borderRadius: "12px", border: "none",
              background: loading ? "#aaa" : "var(--brand-gradient)",
              color: "white", fontSize: "15px", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>

        {/* Leave History */}
        {leaveHistory.length > 0 && (
          <div style={{
            background: "var(--card)", borderRadius: "16px", padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--subtext)", letterSpacing: "1px", marginBottom: "16px" }}>
              LEAVE HISTORY
            </div>
            {leaveHistory.map((leave, i) => {
              const statusColor =
                leave.status === "Approved" ? "#22c55e" :
                leave.status === "Rejected" ? "#ef4444" : "#f59e0b";
              const days = leave.days || 1;
              const fmtDay = (d) => new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
              return (
                <div key={i} style={{
                  padding: "14px", borderRadius: "12px",
                  background: leave.status === "Rejected" ? "#fff5f5" : "#f9fafb",
                  marginBottom: "10px",
                  border: `1px solid ${leave.status === "Rejected" ? "#fee2e2" : "#f0f0f0"}`,
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
                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
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