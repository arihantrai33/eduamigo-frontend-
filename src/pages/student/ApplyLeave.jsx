import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { ref, push, serverTimestamp, onValue } from "firebase/database";

const LEAVE_TYPES = [
  "Medical / Sick Leave",
  "Family Emergency",
  "Personal Leave",
  "Vacation",
  "Other",
];

export default function ApplyLeave() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);

  useEffect(() => {
    const leavesRef = ref(db, "leaves");
    const unsub = onValue(leavesRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      const myLeaves = Object.values(data)
        .filter((l) => l.userId === user.id)
        .sort((a, b) => b.timestamp - a.timestamp);
      setLeaveHistory(myLeaves);
    });
    return () => unsub();
  }, []);

  const total = 12;
  const used = leaveHistory.filter((l) => l.status === "approved").length;
  const available = total - used;

  const handleSubmit = async () => {
    if (!fromDate || !toDate || !reason) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      await push(ref(db, "leaves"), {
        userId: user.id,
        appliedBy: "student",
        leaveType,
        fromDate,
        toDate,
        reason,
        attachedFileName: attachedFile ? attachedFile.name : null,
        status: "pending",
        timestamp: serverTimestamp(),
      });
      setSuccess(true);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Poppins', sans-serif", background: "#f5f6fa",
      }}>
        <div style={{ fontSize: "64px" }}>✅</div>
        <div style={{ fontWeight: "800", fontSize: "20px", marginTop: "16px", color: "#111" }}>
          Leave Applied Successfully!
        </div>
        <div style={{ color: "#888", fontSize: "13px", marginTop: "8px" }}>
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
      minHeight: "100vh", background: "#f5f6fa",
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
              📝 Leave Application
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
              Apply for your leave
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px", marginTop: "20px",
        }}>
          {[
            { label: "TOTAL", value: total, color: "#1a73e8" },
            { label: "AVAILABLE", value: available, color: "#22c55e" },
            { label: "USED", value: used, color: "#ef4444" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "white", borderRadius: "12px",
              padding: "12px", textAlign: "center",
            }}>
              <div style={{ fontSize: "24px", fontWeight: "800", color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "10px", color: "#999", fontWeight: "700", letterSpacing: "0.5px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{
          background: "white", borderRadius: "16px", padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", letterSpacing: "1px", marginBottom: "16px" }}>
            APPLY NEW LEAVE
          </div>

          {/* Leave Type */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#666", letterSpacing: "0.5px" }}>
              LEAVE TYPE
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{
                width: "100%", marginTop: "8px", padding: "12px",
                borderRadius: "10px", border: "1px solid #e0e0e0",
                fontSize: "14px", color: "#111", outline: "none",
                fontFamily: "'Poppins', sans-serif",
                background: "white", boxSizing: "border-box",
              }}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* From / To Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#666", letterSpacing: "0.5px" }}>
                FROM DATE
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  width: "100%", marginTop: "8px", padding: "12px",
                  borderRadius: "10px", border: "1px solid #e0e0e0",
                  fontSize: "13px", outline: "none", color: "#111",
                  fontFamily: "'Poppins', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#666", letterSpacing: "0.5px" }}>
                TO DATE
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  width: "100%", marginTop: "8px", padding: "12px",
                  borderRadius: "10px", border: "1px solid #e0e0e0",
                  fontSize: "13px", outline: "none", color: "#111",
                  fontFamily: "'Poppins', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#666", letterSpacing: "0.5px" }}>
              REASON
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for leave..."
              rows={4}
              style={{
                width: "100%", marginTop: "8px", padding: "12px",
                borderRadius: "10px", border: "1px solid #e0e0e0",
                fontSize: "14px", outline: "none", color: "#111",
                resize: "none", fontFamily: "'Poppins', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Attach Document */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#666", letterSpacing: "0.5px" }}>
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
                <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                  {attachedFile ? `${(attachedFile.size / 1024).toFixed(1)} KB` : "PDF, JPG, PNG supported"}
                </div>
              </div>
              {attachedFile && (
                <span
                  onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }}
                  style={{ fontSize: "18px", color: "#999", cursor: "pointer" }}
                >
                  ✕
                </span>
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
        {leaveHistory.length > 0 && (
          <div style={{
            background: "white", borderRadius: "16px", padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", letterSpacing: "1px", marginBottom: "16px" }}>
              LEAVE HISTORY
            </div>
            {leaveHistory.map((leave, i) => {
              const statusColor =
                leave.status === "approved" ? "#22c55e" :
                leave.status === "rejected" ? "#ef4444" : "#f59e0b";
              const days = leave.fromDate && leave.toDate
                ? Math.max(1, Math.round(
                    (new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24) + 1
                  ))
                : 1;
              return (
                <div key={i} style={{
                  padding: "14px", borderRadius: "12px",
                  background: leave.status === "rejected" ? "#fff5f5" : "#f9fafb",
                  marginBottom: "10px",
                  border: `1px solid ${leave.status === "rejected" ? "#fee2e2" : "#f0f0f0"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#111" }}>
                      {leave.leaveType}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: statusColor }}>
                      {leave.status === "pending" ? "⏳ Pending" :
                       leave.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    {leave.fromDate} — {leave.toDate} • {days} day{days > 1 ? "s" : ""}
                  </div>
                  {leave.reason && (
                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
                      {leave.reason}
                    </div>
                  )}
                  {leave.attachedFileName && (
                    <div style={{
                      marginTop: "8px", fontSize: "11px", color: "#1a73e8",
                      display: "flex", alignItems: "center", gap: "4px",
                    }}>
                      📎 {leave.attachedFileName}
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