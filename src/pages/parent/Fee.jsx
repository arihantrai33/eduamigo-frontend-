// pages/parent/Fee.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const FEE_DATA = {
  totalAnnual: 85000,
  paid: 63750,
  due: 21250,
  nextDueDate: "7 April 2026",
  quarters: [
    { label: "Q1 — April 2025", amount: 21250, status: "paid", date: "3 Apr 2025", method: "UPI" },
    { label: "Q2 — July 2025", amount: 21250, status: "paid", date: "1 Jul 2025", method: "Net Banking" },
    { label: "Q3 — October 2025", amount: 21250, status: "paid", date: "5 Oct 2025", method: "UPI" },
    { label: "Q4 — January 2026", amount: 21250, status: "due", date: "7 Apr 2026", method: null },
  ],
  breakdown: [
    { label: "Tuition Fee", amount: 48000 },
    { label: "Transport Fee", amount: 12000 },
    { label: "Lab & Library", amount: 8000 },
    { label: "Sports & Activity", amount: 6000 },
    { label: "Exam Fee", amount: 5000 },
    { label: "Miscellaneous", amount: 6000 },
  ],
};

export default function ParentFee() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const paidPct = Math.round((FEE_DATA.paid / FEE_DATA.totalAnnual) * 100);

  if (paySuccess) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Poppins', sans-serif", background: "#f5f6fa" }}>
        <div style={{ fontSize: "72px" }}>🎉</div>
        <div style={{ fontWeight: "800", fontSize: "22px", marginTop: "16px", color: "#111" }}>Payment Successful!</div>
        <div style={{ color: "#888", fontSize: "13px", marginTop: "8px" }}>₹21,250 paid for Q4 — January 2026</div>
        <div style={{ marginTop: "12px", fontSize: "12px", color: "#aaa" }}>Ref: TXN{Math.floor(Math.random() * 9000000 + 1000000)}</div>
        <button onClick={() => navigate(-1)} style={{ marginTop: "32px", padding: "14px 36px", borderRadius: "14px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Poppins', sans-serif", paddingBottom: "40px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 20px 32px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
          <div>
            <div style={{ fontWeight: "800", fontSize: "18px" }}>💳 Fee Status</div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>{user?.childName || "Rahul Kumar"} • {user?.childClass || "X-A"}</div>
          </div>
        </div>

        {/* Summary Card */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "20px", backdropFilter: "blur(10px)" }}>
          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>Annual Fee 2025–26</div>
          <div style={{ fontSize: "36px", fontWeight: "900" }}>₹{FEE_DATA.totalAnnual.toLocaleString("en-IN")}</div>

          {/* Progress Bar */}
          <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "99px", height: "8px", marginTop: "16px", marginBottom: "8px" }}>
            <div style={{ width: `${paidPct}%`, background: "#4ade80", borderRadius: "99px", height: "8px", transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: "12px", opacity: 0.85 }}>{paidPct}% paid</div>

          {/* Paid / Due */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
            {[
              { label: "PAID", value: `₹${FEE_DATA.paid.toLocaleString("en-IN")}`, color: "#4ade80" },
              { label: "DUE", value: `₹${FEE_DATA.due.toLocaleString("en-IN")}`, color: "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", marginTop: "-16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Due Alert */}
        <div style={{ background: "#fff7ed", borderRadius: "14px", padding: "14px 16px", border: "1px solid #fed7aa", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", fontSize: "14px", color: "#c2410c" }}>Q4 Fee Due</div>
            <div style={{ fontSize: "12px", color: "#ea580c", marginTop: "2px" }}>₹21,250 due by {FEE_DATA.nextDueDate}</div>
          </div>
          <button
            onClick={() => setPaySuccess(true)}
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)", color: "white", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
          >
            Pay Now
          </button>
        </div>

        {/* Quarterly History */}
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", letterSpacing: "1px", marginBottom: "14px" }}>QUARTERLY BREAKDOWN</div>
          {FEE_DATA.quarters.map((q, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: i < FEE_DATA.quarters.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: q.status === "paid" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                {q.status === "paid" ? "✅" : "⏳"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#111" }}>{q.label}</div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                  {q.status === "paid" ? `Paid on ${q.date} • ${q.method}` : `Due on ${q.date}`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "700", fontSize: "14px", color: q.status === "paid" ? "#16a34a" : "#ef4444" }}>
                  ₹{q.amount.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: q.status === "paid" ? "#16a34a" : "#ef4444", marginTop: "2px" }}>
                  {q.status === "paid" ? "PAID" : "DUE"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fee Breakdown Toggle */}
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div
            onClick={() => setShowBreakdown(!showBreakdown)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", letterSpacing: "1px" }}>FEE STRUCTURE</div>
            <span style={{ fontSize: "18px", color: "#4f46e5", transition: "transform 0.3s", display: "inline-block", transform: showBreakdown ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</span>
          </div>
          {showBreakdown && (
            <div style={{ marginTop: "14px" }}>
              {FEE_DATA.breakdown.map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < FEE_DATA.breakdown.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ fontSize: "13px", color: "#444" }}>{b.label}</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#111" }}>₹{b.amount.toLocaleString("en-IN")}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid #f3f4f6" }}>
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#111" }}>Total</div>
                <div style={{ fontWeight: "800", fontSize: "14px", color: "#4f46e5" }}>₹{FEE_DATA.totalAnnual.toLocaleString("en-IN")}</div>
              </div>
            </div>
          )}
        </div>

        {/* Download Receipt */}
        <button
          onClick={() => alert("Receipt downloading... (connect to backend)")}
          style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1.5px solid #4f46e5", background: "white", color: "#4f46e5", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
        >
          📄 Download Receipt
        </button>

      </div>
    </div>
  );
}