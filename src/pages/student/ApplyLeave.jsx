import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const API = import.meta.env.VITE_API_URL;

const LEAVE_TYPES = [
  "Sick",
  "Family",
  "Personal",
  "Other",
  "Other",
];

export default function ApplyLeave() {
  const { user } = useAuth();
  const { colors } = useTheme();
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

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchQuota();
    fetchHistory();
  }, []);

  const fetchQuota = async () => {
    try {
      const res = await fetch(`${API}/leaves/quota`, { headers });
      const data = await res.json();
      if (data.success) setQuota(data.data);
    } catch {
      // quota fetch failed silently
    } finally {
      setQuotaLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/leaves/my`, { headers });
      const data = await res.json();
      if (data.success) setLeaveHistory(data.data);
    } catch {
      // history fetch failed silently
    } finally {
      setHistoryLoading(false);
    }
  };

  const calcDays = () => {
    if (!fromDate || !toDate) return 0;
    const diff = new Date(toDate) - new Date(fromDate);
    if (diff < 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!fromDate || !toDate || !reason.trim()) {
      setFormError("Please fill all required fields.");
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setFormError("End date cannot be before start date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/leaves/apply`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, fromDate, toDate, reason }),
      });
      const data = await res.json();
      if (!data.success) {
        setFormError(data.message || "Submission failed. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setFormError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const days = calcDays();

  if (success) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Poppins', sans-serif", background: colors.bg,
      }}>
        <div style={{ fontSize: "64px" }}>✅</div>
        <div style={{ fontWeight: "800", fontSize: "20px", marginTop: "16px", color: colors.text }}>
          Leave Applied Successfully!
        </div>
        <div style={{ color: colors.subtext, fontSize: "13px", marginTop: "8px" }}>
          Your request has been submitted for approval.
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "32px", padding: "14px 32px", borderRadius: "12px",
            background: "linear-gradient(135deg, #1a73e8, #6c63ff)",
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
      minHeight: "100vh", background: colors.bg,
      fontFamily: "'Poppins', sans-serif", paddingBottom: "32px",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a73e8, #6c63ff)",
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
              Leave Application
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
              Submit and track your leave requests
            </div>
          </div>
        </div>

        {/* Quota Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px", marginTop: "20px",
        }}>
          {quotaLoading ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
              Loading balance...
            </div>
          ) : (
            [
              { label: "TOTAL", value: quota.total, color: "#1a73e8" },
              { label: "AVAILABLE", value: quota.available, color: "#22c55e" },
              { label: "USED", value: quota.used, color: "#ef4444" },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: colors.card, borderRadius: "12px",
                padding: "12px", textAlign: "center",
              }}>
                <div style={{ fontSize: "24px", fontWeight: "800", color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "10px", color: colors.subtext, fontWeight: "700", letterSpacing: "0.5px" }}>
                  {stat.label}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{
          background: colors.card, borderRadius: "16px", padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: colors.subtext, letterSpacing: "1px", marginBottom: "16px" }}>
            APPLY NEW LEAVE
          </div>

          {/* Leave Type */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: colors.subtext2, letterSpacing: "0.5px" }}>
              LEAVE TYPE
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{
                width: "100%", marginTop: "8px", padding: "12px",
                borderRadius: "10px", border: "1px solid #e0e0e0",
                fontSize: "14px", color: colors.text, outline: "none",
                fontFamily: "'Poppins', sans-serif",
                background: colors.card, boxSizing: "border-box",
              }}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* From / To Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: colors.subtext2, letterSpacing: "0.5px" }}>
                FROM DATE
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setFormError(""); }}
                style={{
                  width: "100%", marginTop: "8px", padding: "12px",
                  borderRadius: "10px", border: "1px solid #e0e0e0",
                  fontSize: "13px", outline: "none", color: colors.text,
                  fontFamily: "'Poppins', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: colors.subtext2, letterSpacing: "0.5px" }}>
                TO DATE
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setFormError(""); }}
                style={{
                  width: "100%", marginTop: "8px", padding: "12px",
                  borderRadius: "10px", border: "1px solid #e0e0e0",
                  fontSize: "13px", outline: "none", color: colors.text,
                  fontFamily: "'Poppins', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Live days counter */}
          {days > 0 && (
            <div style={{
              marginBottom: "16px", padding: "8px 12px",
              background: "#f0f4ff", borderRadius: "8px",
              fontSize: "12px", color: "#1a73e8", fontWeight: "600",
            }}>
              Duration: {days} day{days > 1 ? "s" : ""}
            </div>
          )}

          {/* Reason */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: colors.subtext2, letterSpacing: "0.5px" }}>
              REASON
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setFormError(""); }}
              placeholder="Explain the reason for leave..."
              rows={4}
              style={{
                width: "100%", marginTop: "8px", padding: "12px",
                borderRadius: "10px", border: "1px solid #e0e0e0",
                fontSize: "14px", outline: "none", color: colors.text,
                resize: "none", fontFamily: "'Poppins', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Attach Document */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: colors.subtext2, letterSpacing: "0.5px" }}>
              ATTACH DOCUMENT (Optional)
            </label>
            <div
              onClick={() => document.getElementById("fileInputStudent").click()}
              style={{
                marginTop: "8px", padding: "12px 16px",
                borderRadius: "10px", border: "1.5px dashed #c0c0c0",
                cursor: "pointer", display: "flex", alignItems: "center",
                gap: "10px", background: "#fafafa",
              }}
            >
              <span style={{ fontSize: "20px" }}>📎</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#444" }}>
                  {attachedFile ? attachedFile.name : "Attach Medical Report or Document"}
                </div>
                <div style={{ fontSize: "11px", color: colors.subtext, marginTop: "2px" }}>
                  {attachedFile ? `${(attachedFile.size / 1024).toFixed(1)} KB` : "PDF, JPG, PNG supported"}
                </div>
              </div>
              {attachedFile && (
                <span
                  onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }}
                  style={{ fontSize: "18px", color: colors.subtext, cursor: "pointer" }}
                >✕</span>
              )}
            </div>
            <input
              id="fileInputStudent"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={(e) => setAttachedFile(e.target.files[0] || null)}
            />
          </div>

          {/* Inline Error */}
          {formError && (
            <div style={{
              marginBottom: "12px", padding: "10px 14px",
              background: "#fff5f5", borderRadius: "8px",
              border: "1px solid #fee2e2",
              fontSize: "13px", color: "#ef4444", fontWeight: "600",
            }}>
              {formError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "16px",
              borderRadius: "12px", border: "none",
              background: loading ? "#aaa" : "linear-gradient(135deg, #1a73e8, #6c63ff)",
              color: "white", fontSize: "15px", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>

        {/* Leave History */}
        <div style={{
          background: colors.card, borderRadius: "16px", padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: colors.subtext, letterSpacing: "1px", marginBottom: "16px" }}>
            LEAVE HISTORY
          </div>

          {historyLoading ? (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: "13px", padding: "20px 0" }}>
              Loading history...
            </div>
          ) : leaveHistory.length === 0 ? (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: "13px", padding: "20px 0" }}>
              No leave requests found.
            </div>
          ) : (
            leaveHistory.map((leave, i) => {
              const statusColor =
                leave.status === "Approved" ? "#22c55e" :
                leave.status === "Rejected" ? "#ef4444" : "#f59e0b";
              const statusLabel =
                leave.status === "Approved" ? "Approved" :
                leave.status === "Rejected" ? "Rejected" : "Pending";
              const leaveDays = leave.fromDate && leave.toDate
                ? Math.max(1, Math.round(
                  (new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24) + 1
                ))
                : 1;
              return (
                <div key={leave._id || i} style={{
                  padding: "14px", borderRadius: "12px",
                  background: leave.status === "Rejected" ? "#fff5f5" : "#f9fafb",
                  marginBottom: "10px",
                  border: `1px solid ${leave.status === "Rejected" ? "#fee2e2" : "#f0f0f0"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: colors.text }}>
                      {leave.leaveType}
                    </div>
                    <span style={{
                      fontSize: "11px", fontWeight: "700", color: statusColor,
                      background: `${statusColor}18`, padding: "3px 10px",
                      borderRadius: "20px",
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: colors.subtext, marginTop: "4px" }}>
                    {new Date(leave.fromDate).toLocaleDateString("en-GB")} — {new Date(leave.toDate).toLocaleDateString("en-GB")} • {leaveDays} day{leaveDays > 1 ? "s" : ""}
                  </div>
                  {leave.reason && (
                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
                      {leave.reason}
                    </div>
                  )}
                  {leave.reviewNote && (
                    <div style={{
                      marginTop: "8px", fontSize: "11px", color: colors.subtext2,
                      background: "#f0f4ff", padding: "6px 10px",
                      borderRadius: "6px",
                    }}>
                      Reviewer Note: {leave.reviewNote}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}