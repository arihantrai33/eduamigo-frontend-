const REPORTS = [
  { month: "May 2026", collected: 124500, pending: 34000, partial: 12000, total: 170500, students: 48 },
  { month: "Apr 2026", collected: 158000, pending: 12000, partial: 8000, total: 178000, students: 51 },
  { month: "Mar 2026", collected: 142000, pending: 28000, partial: 6000, total: 176000, students: 49 },
];

const FeeReports = () => {
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Fee Reports</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Monthly fee collection summary</div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Collected", value: "₹4.25L", color: "#3B6D11", bg: "#EAF3DE" },
          { label: "Total Pending", value: "₹74K", color: "#993C1D", bg: "#FAECE7" },
          { label: "Collection Rate", value: "82%", color: "#534AB7", bg: "#EEEDFE" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
          padding: "10px 16px", background: "#F5F5F3",
          fontSize: 11, fontWeight: 500, color: "#666"
        }}>
          <span>Month</span><span>Collected</span><span>Pending</span><span>Partial</span><span>Total</span><span>Students</span>
        </div>
        {REPORTS.map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
            padding: "12px 16px", alignItems: "center",
            borderTop: "0.5px solid #E8E8E5"
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{r.month}</span>
            <span style={{ fontSize: 12, color: "#3B6D11" }}>₹{r.collected.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: "#993C1D" }}>₹{r.pending.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: "#854F0B" }}>₹{r.partial.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: "#666" }}>₹{r.total.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{r.students}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeeReports;