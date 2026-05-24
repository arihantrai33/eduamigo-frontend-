import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function ParentAttendance() {
  const navigate = useNavigate();
  const [child,   setChild]   = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const parentRes = await axios.get(`${API}/parents/my-child`, authHeader());
      if (!parentRes.data.success) { setError("Could not load child info"); setLoading(false); return; }
      const childData = parentRes.data.data.children?.[0];
      if (!childData) { setError("No child linked to this account"); setLoading(false); return; }
      setChild(childData);

      const [sumRes, recRes] = await Promise.allSettled([
        axios.get(`${API}/attendance/child-summary`, authHeader()),
        axios.get(`${API}/attendance/child-records`, authHeader()),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value.data.success)
        setSummary(sumRes.value.data.data);
      if (recRes.status === "fulfilled" && recRes.value.data.success)
        setRecords(recRes.value.data.data || []);
    } catch (err) {
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const buildCalendar = () => {
    const now         = new Date();
    const year        = now.getFullYear();
    const month       = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const recordMap   = {};
    records.forEach((r) => {
      const d   = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      recordMap[key] = r.status;
    });
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key    = `${year}-${month}-${d}`;
      const status = recordMap[key];
      cells.push({ d, status, today: d === now.getDate() });
    }
    return { cells, monthLabel: now.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
  };

  const { cells, monthLabel } = buildCalendar();
  const absentRecords = records.filter((r) => r.status === "Absent" || r.status === "Leave");

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ color: "#999", fontSize: 14 }}>Loading attendance...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "Inter, sans-serif", paddingBottom: 30 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", padding: "48px 16px 40px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer", fontSize: 16 }}>
            ←
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>✅ Attendance Report</h2>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{monthLabel} — {child?.name || ""}</div>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1 }}>{summary?.percentage ?? "—"}%</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {summary?.present ?? 0} Present &nbsp;•&nbsp; {summary?.absent ?? 0} Absent &nbsp;•&nbsp; {summary?.late ?? 0} Late
          </div>
        </div>
      </div>

      <div style={{ padding: 16, marginTop: -20 }}>

        {/* Calendar */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{monthLabel} Calendar</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center" }}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#888", padding: "4px 0" }}>{d}</div>
            ))}
            {cells.map((c, i) => (
              <div key={i} style={{
                padding: "6px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: !c
                  ? "transparent"
                  : c.today
                  ? "#4f46e5"
                  : c.status === "Present"
                  ? "#e8f5e9"
                  : c.status === "Absent"
                  ? "#ffebee"
                  : c.status === "Leave"
                  ? "#fef9c3"
                  : "transparent",
                color: !c
                  ? "transparent"
                  : c.today
                  ? "white"
                  : c.status === "Present"
                  ? "#2e7d32"
                  : c.status === "Absent"
                  ? "#ef4444"
                  : c.status === "Leave"
                  ? "#854d0e"
                  : "#ccc",
              }}>
                {c?.d || ""}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {[
              { color: "#e8f5e9", label: "Present" },
              { color: "#ffebee", label: "Absent"  },
              { color: "#fef9c3", label: "Leave"   },
              { color: "#4f46e5", label: "Today"   },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Present", value: summary?.present ?? 0, color: "#16a34a", bg: "#dcfce7" },
            { label: "Absent",  value: summary?.absent  ?? 0, color: "#ef4444", bg: "#fee2e2" },
            { label: "Leave",   value: summary?.leave   ?? 0, color: "#ca8a04", bg: "#fef9c3" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Absent / Leave Days */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Absent / Leave Days</div>
          {absentRecords.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: "20px 0", fontSize: 13 }}>
              No absences recorded
            </div>
          ) : (
            absentRecords.map((r, i) => {
              const isLeave = r.status === "Leave";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                  borderBottom: i < absentRecords.length - 1 ? "1px solid #f3f4f6" : "none",
                }}>
                  <span style={{ fontSize: 20 }}>{isLeave ? "✅" : "❌"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {new Date(r.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {r.note || (isLeave ? "Leave approved" : "Marked absent")}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color:      isLeave ? "#22c55e" : "#ef4444",
                    background: isLeave ? "#dcfce7" : "#fee2e2",
                    padding: "4px 10px", borderRadius: 20,
                  }}>
                    {r.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}