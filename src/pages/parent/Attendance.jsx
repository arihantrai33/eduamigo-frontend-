import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { pickChild, childQuery } from "../../utils/selectedChild";

import Glyph from "../../components/Glyph";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { CheckCircle2, XCircle, CalendarMinus } from "lucide-react";
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
  // The month being viewed (month is 0-11). Attendance is shown one month at a time.
  const [view, setView] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [view.year, view.month]); // eslint-disable-line react-hooks/exhaustive-deps

  const shiftMonth = (delta) => setView((v) => {
    const d = new Date(v.year, v.month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const now = new Date();
  const isCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth();

  const fetchData = async () => {
    try {
      const parentRes = await axios.get(`${API}/parents/my-child`, authHeader());
      if (!parentRes.data.success) { setError("Could not load child info"); setLoading(false); return; }
      const childData = pickChild(parentRes.data.data.children);
      if (!childData) { setError("No child linked to this account"); setLoading(false); return; }
      setChild(childData);

      const q = childQuery();
      const period = `${q ? "&" : "?"}month=${view.month + 1}&year=${view.year}`;
      const [sumRes, recRes] = await Promise.allSettled([
        axios.get(`${API}/attendance/child-summary${q}${period}`, authHeader()),
        axios.get(`${API}/attendance/child-records${q}${period}`, authHeader()),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value.data.success)
        setSummary(sumRes.value.data.data);
      if (recRes.status === "fulfilled" && recRes.value.data.success)
        setRecords(recRes.value.data.data || []);
    } catch {
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const buildCalendar = () => {
    const year        = view.year;
    const month       = view.month;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const recordMap   = {};
    records.forEach((r) => {
      // Attendance dates are stored as midnight UTC of the school day.
      const d   = new Date(r.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      recordMap[key] = r.status;
    });
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key    = `${year}-${month}-${d}`;
      const status = recordMap[key];
      cells.push({ d, status, today: isCurrentMonth && d === now.getDate() && !status });
    }
    return { cells, monthLabel: new Date(year, month, 1).toLocaleString("en-IN", { month: "long", year: "numeric" }) };
  };

  const { cells, monthLabel } = buildCalendar();
  const absentRecords = records.filter((r) => r.status === "Absent" || r.status === "Leave");

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
      <div style={{ color: "var(--subtext)", fontSize: 14 }}>Loading attendance...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
      <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "inherit", paddingBottom: 30 }}>

      {/* Header */}
      <div className="ea-pd-band" style={{ background: "var(--brand-gradient)", padding: "48px 16px 40px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" aria-label="Back" onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer", fontSize: 16 }}>
            <Glyph e="←" />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}><Glyph e="✅" /> Attendance Report</h2>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{monthLabel} — {child?.name || ""}</div>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1 }}>{summary?.total ? `${summary.percentage}%` : "—"}</div>
          {!summary?.total && <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>No attendance marked this month</div>}
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {summary?.present ?? 0} Present &nbsp;•&nbsp; {summary?.absent ?? 0} Absent &nbsp;•&nbsp; {summary?.late ?? 0} Late
          </div>
        </div>
      </div>

      <div className="ea-pd-body ea-pd-cols" style={{ padding: 16, marginTop: -20 }}>

        {/* Calendar (desktop: the main column, beside the numbers and the absent days) */}
        <div className="ea-pd-main ea-pd-tall" style={{ background: "var(--card)", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={() => shiftMonth(-1)} aria-label="Previous month"
              style={{ border: "none", background: "var(--bg)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "var(--text)" }}>‹</button>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{monthLabel}</div>
            <button onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label="Next month"
              style={{ border: "none", background: "var(--bg)", borderRadius: 8, width: 32, height: 32, cursor: isCurrentMonth ? "default" : "pointer", fontSize: 16, color: "var(--text)", opacity: isCurrentMonth ? 0.35 : 1 }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center" }}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "var(--subtext)", padding: "4px 0" }}>{d}</div>
            ))}
            {cells.map((c, i) => (
              <div key={i} style={{
                padding: "6px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: !c
                  ? "transparent"
                  : c.status === "Present"
                  ? "#e8f5e9"
                  : c.status === "Absent"
                  ? "#ffebee"
                  : c.status === "Leave"
                  ? "#fef9c3"
                  : c.today
                  ? "var(--brand)"
                  : "transparent",
                color: !c
                  ? "transparent"
                  : c.status === "Present"
                  ? "#2e7d32"
                  : c.status === "Absent"
                  ? "#ef4444"
                  : c.status === "Leave"
                  ? "#854d0e"
                  : c.today
                  ? "white"
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
              { color: "var(--brand)", label: "Today"   },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ea-pd-side" style={{ marginBottom: 16 }}>
          <StatGrid columns={3} label="Attendance days">
            <StatCard label="Present" value={summary?.present ?? 0} icon={<CheckCircle2 />} tone="success" />
            <StatCard label="Absent" value={summary?.absent ?? 0} icon={<XCircle />} tone="danger" />
            <StatCard label="Leave" value={summary?.leave ?? 0} icon={<CalendarMinus />} tone="warning" />
          </StatGrid>
        </div>

        {/* Absent / Leave Days */}
        <div className="ea-pd-side" style={{ background: "var(--card)", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Absent / Leave Days</div>
          {absentRecords.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--subtext)", padding: "20px 0", fontSize: 13 }}>
              No absences recorded
            </div>
          ) : (
            absentRecords.map((r, i) => {
              const isLeave = r.status === "Leave";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                  borderBottom: i < absentRecords.length - 1 ? "1px solid var(--ea-line)" : "none",
                }}>
                  <span style={{ fontSize: 20 }}>{isLeave ? <Glyph e="✅" /> : <Glyph e="❌" />}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {new Date(r.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--subtext)", marginTop: 2 }}>
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