import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function StudentAttendance() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API}/attendance/my-summary`, authHeader());
      if (res.data.success) setAttendance(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pct     = attendance?.percentage ?? 0;
  const present = attendance?.present    ?? 0;
  const absent  = attendance?.absent     ?? 0;
  const total   = attendance?.total      ?? 0;
  const color   = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ fontSize: 14, color: "var(--subtext)" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)", fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a73e8 0%, #6c63ff 100%)",
        padding: "48px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 18 }}>
            ←
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>My Attendance</div>
        </div>

        {/* Circle Progress */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none"
                stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{pct}%</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Overall</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total Days", val: total,   bg: "#f0f4ff", color: "#1a73e8" },
            { label: "Present",    val: present, bg: "#f0fdf4", color: "#22c55e" },
            { label: "Absent",     val: absent,  bg: "#fff5f5", color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14,
              padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--subtext2)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Status Card — only show when data exists */}
        {total > 0 && (
          <div style={{ background: "var(--card)", borderRadius: 14, padding: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Attendance Status
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              <div style={{ fontSize: 13, color: "#444" }}>
                {pct >= 75
                  ? "✅ Good standing — Keep it up!"
                  : pct >= 50
                  ? "⚠️ Below average — Improvement needed"
                  : "❌ Critical — Please attend regularly"}
              </div>
            </div>
            {pct < 75 && (
              <div style={{ marginTop: 10, background: "#fff5f5", borderRadius: 10,
                padding: "10px 12px", fontSize: 12, color: "#ef4444" }}>
                Minimum 75% attendance required. You need{" "}
                {Math.max(0, Math.ceil((0.75 * total - present) / 0.25))} more present days to reach 75%.
              </div>
            )}
          </div>
        )}

        {/* No data */}
        {total === 0 && (
          <div style={{ background: "var(--card)", borderRadius: 14, padding: 24,
            textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14, color: "var(--subtext)" }}>No attendance records yet</div>
            <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
              Attendance will appear here once it is marked by your teacher.
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: "var(--card)", borderTop: `1px solid ${"#f0f0f0"}`,
        display: "flex", padding: "8px 0 16px", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "🏠", label: "Home",  path: "/student/home" },
          { icon: "🚌", label: "Bus",   path: "/student/bus" },
          { icon: "📚", label: "Learn", path: "/student/notes" },
          { icon: "💬", label: "Chat",  path: "/student/chat" },
          { icon: "👤", label: "Me",    path: "/student/profile" },
        ].map((tab) => (
          <button key={tab.label} onClick={() => navigate(tab.path)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, color: "var(--subtext)" }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}