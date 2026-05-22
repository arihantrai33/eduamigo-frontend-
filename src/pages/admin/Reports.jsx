const STATS = [
  { label: "Total Students", value: "1,284", change: "+12 this month", color: "#534AB7", bg: "#EEEDFE" },
  { label: "Total Teachers", value: "87", change: "+2 this month", color: "#0F6E56", bg: "#E1F5EE" },
  { label: "Avg Attendance", value: "94.2%", change: "Same as last week", color: "#854F0B", bg: "#FAEEDA" },
  { label: "Fee Collected", value: "₹2.1L", change: "₹40k pending", color: "#993C1D", bg: "#FAECE7" },
];

const ATTENDANCE = [
  { cls: "X-A", pct: 95 }, { cls: "XII-A", pct: 91 },
  { cls: "X-B", pct: 88 }, { cls: "XI-B", pct: 83 }, { cls: "IX-A", pct: 76 },
];

const Reports = () => (
  <div style={{ fontFamily: "Inter, sans-serif" }}>
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Reports & Analytics</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>School-wide performance overview</div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
      {STATS.map((s, i) => (
        <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 12, color: s.color, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          <div style={{ fontSize: 11, color: s.color, marginTop: 4, opacity: 0.7 }}>{s.change}</div>
        </div>
      ))}
    </div>

    <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.25rem" }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", marginBottom: 12 }}>📊 Attendance by Class</div>
      {ATTENDANCE.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "#666", width: 42 }}>{a.cls}</span>
          <div style={{ flex: 1, height: 8, background: "#F0F0EE", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${a.pct}%`, height: "100%", background: a.pct >= 90 ? "#1D9E75" : a.pct >= 80 ? "#534AB7" : "#BA7517", borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, width: 36, textAlign: "right", color: "#534AB7" }}>{a.pct}%</span>
        </div>
      ))}
    </div>
  </div>
);

export default Reports;