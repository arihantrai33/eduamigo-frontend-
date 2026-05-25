import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const YEARS = ["2024-25", "2025-26", "2026-27"];

export default function FeeReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selYear, setSelYear] = useState("2025-26");

  useEffect(() => { fetchSummary(); }, [selYear]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fee-structures/summary?academicYear=${selYear}`, authHeader());
      if (res.data.success) setSummary(res.data.data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const collectionRate = summary?.totalBilled > 0
    ? Math.round((summary.totalPaid / summary.totalBilled) * 100) : 0;

  const RateBar = ({ rate }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, width: `${rate}%`, background: rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626", minWidth: 36 }}>{rate}%</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Fee Reports</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Fee collection summary by type and class</div>
        </div>
        <select value={selYear} onChange={e => setSelYear(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "white", cursor: "pointer" }}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Billed",    value: `₹${(summary?.totalBilled ?? 0).toLocaleString("en-IN")}`, color: "#4f46e5", bg: "#ede9fe" },
          { label: "Total Collected", value: `₹${(summary?.totalPaid   ?? 0).toLocaleString("en-IN")}`, color: "#16a34a", bg: "#dcfce7" },
          { label: "Total Pending",   value: `₹${(summary?.totalDue    ?? 0).toLocaleString("en-IN")}`, color: "#dc2626", bg: "#fee2e2" },
          { label: "Collection Rate", value: `${collectionRate}%`,                                        color: "#d97706", bg: "#fef3c7" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: c.color, marginTop: 4, fontWeight: 500 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>Loading reports...</div>
      ) : !summary ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>No data available for {selYear}</div>
      ) : (
        <>
          {/* By Fee Type */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 20 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 13, fontWeight: 700, color: "#111827" }}>
              By Fee Type — {selYear}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", padding: "10px 20px", background: "#f9fafb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
              <span>Fee Type</span><span>Billed</span><span>Collected</span><span>Pending</span><span>Collection Rate</span>
            </div>
            {Object.keys(summary.byType ?? {}).length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 13 }}>No data available</div>
            ) : (
              Object.entries(summary.byType).map(([type, data], i) => {
                const rate = data.billed > 0 ? Math.round((data.paid / data.billed) * 100) : 0;
                return (
                  <div key={type} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", padding: "13px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{type}</span>
                    <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 700 }}>₹{data.billed?.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>₹{data.paid?.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>₹{data.due?.toLocaleString("en-IN")}</span>
                    <RateBar rate={rate} />
                  </div>
                );
              })
            )}
          </div>

          {/* By Class */}
          {summary.byClass && Object.keys(summary.byClass).length > 0 && (
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 13, fontWeight: 700, color: "#111827" }}>
                By Class — {selYear}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", padding: "10px 20px", background: "#f9fafb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                <span>Class</span><span>Billed</span><span>Collected</span><span>Pending</span><span>Collection Rate</span>
              </div>
              {Object.entries(summary.byClass).sort().map(([cls, data], i) => {
                const rate = data.billed > 0 ? Math.round((data.paid / data.billed) * 100) : 0;
                return (
                  <div key={cls} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", padding: "13px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Class {cls}</span>
                    <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 700 }}>₹{data.billed?.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>₹{data.paid?.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>₹{data.due?.toLocaleString("en-IN")}</span>
                    <RateBar rate={rate} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}