import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmptyState from "../../components/ui/EmptyState";
import { CalendarCheck } from "lucide-react";

import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
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
    <div className="ea-pd-narrow" style={{ height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)", fontFamily: "inherit" }}>

      {/* Header */}
      <PortalHeader title="My Attendance" onBack={() => navigate(-1)} />

      {/* Body */}
      <div className="ea-pd-body" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

        <div style={{ marginBottom: 16 }}>
          <SummaryCard title="Overall attendance" value={`${pct}%`} ring={pct} caption={`${present} of ${total} days present`} />
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total Days", val: total,   bg: "#f0f4ff", color: "var(--brand)" },
            { label: "Present",    val: present, bg: "#f0fdf4", color: "#15803D" },
            { label: "Absent",     val: absent,  bg: "#fff5f5", color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14,
              padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{s.label}</div>
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
              <div style={{ fontSize: 13, color: "var(--ea-body)" }}>
                {pct >= 75
                  ? "Good standing — Keep it up!"
                  : pct >= 50
                  ? "Below average — Improvement needed"
                  : "Critical — Please attend regularly"}
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
          <EmptyState icon={CalendarCheck} title="No attendance records yet" text="Attendance will appear here once it is marked by your teacher." />
        )}
      </div>

      <BottomNav role="student" />
    </div>
  );
}