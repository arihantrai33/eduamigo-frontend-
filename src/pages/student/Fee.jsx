import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Fee() {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const mockFees = [
      { id: 1, feeType: "Tuition Fee",        amount: 12000, dueDate: "7 Apr 2026",  status: "pending" },
      { id: 2, feeType: "Bus Fee",             amount: 3500,  dueDate: "7 Apr 2026",  status: "pending" },
      { id: 3, feeType: "Lab & Activity Fee",  amount: 2000,  dueDate: "7 Apr 2026",  status: "pending" },
      { id: 4, feeType: "Library & Smart Card",amount: 1000,  dueDate: "7 Apr 2026",  status: "pending" },
      { id: 5, feeType: "Tuition Fee Q1",      amount: 12000, dueDate: "15 Jan 2026", status: "paid", paidDate: "15 Jan 2026" },
      { id: 6, feeType: "Bus Fee Q1",          amount: 3500,  dueDate: "15 Jan 2026", status: "paid", paidDate: "10 Oct 2025" },
      { id: 7, feeType: "Tuition Fee Q2",      amount: 12000, dueDate: "5 Jul 2025",  status: "paid", paidDate: "5 Jul 2025"  },
    ];
    setFees(mockFees);
    const total   = mockFees.filter(f => f.status === "pending").reduce((a, f) => a + f.amount, 0);
    const paid    = mockFees.filter(f => f.status === "paid").reduce((a, f) => a + f.amount, 0);
    const pending = total;
    setSummary({ total: total + paid, paid, pending });
  }, []);

  const statusColor = { paid: "#22c55e", pending: "#f59e0b", overdue: "#ef4444" };

  const pendingFees = fees.filter(f => f.status === "pending");
  const paidFees    = fees.filter(f => f.status === "paid");

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "'Poppins', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 70px", color: "white", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "18px" }}>←</button>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>💳 Fee Status</h2>
            {user?.role === "parent" && (
              <div style={{ fontSize: "11px", opacity: .8, marginTop: 2 }}>Rahul Kumar — Class X-A</div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {[
            { label: "Total",   value: summary.total,   color: "#fff"     },
            { label: "Paid",    value: summary.paid,    color: "#bbf7d0"  },
            { label: "Pending", value: summary.pending, color: "#fde68a"  },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontWeight: "800", fontSize: "16px", color: s.color, marginTop: 3 }}>₹{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", marginTop: "-30px" }}>

        {/* Reminder banner */}
        {summary.pending > 0 && (
          <div style={{ background: "#FFF8E1", borderRadius: "16px", padding: "14px 16px", marginBottom: "14px", borderLeft: "4px solid #FFB300", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ fontSize: "22px" }}>⏰</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#E65100" }}>Payment Due — 7 April 2026</div>
              <div style={{ fontSize: "11.5px", color: "#7B8099", marginTop: "2px", lineHeight: 1.6 }}>Pay before due date to avoid late charges.</div>
            </div>
          </div>
        )}

        {/* Pending fees */}
        {pendingFees.length > 0 && (
          <>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7B8099", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "10px" }}>
              Pending Payment
            </div>
            {pendingFees.map((f, i) => (
              <div key={f.id} style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderLeft: "3px solid #f59e0b" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#111" }}>{f.feeType}</div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Due: {f.dueDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "800", fontSize: "16px", color: "#111" }}>₹{f.amount.toLocaleString()}</div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: statusColor[f.status], background: statusColor[f.status] + "20", padding: "3px 8px", borderRadius: "20px", marginTop: "4px" }}>
                      {f.status.toUpperCase()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => alert("🎉 Redirecting to Payment Gateway...")}
                  style={{ marginTop: "12px", width: "100%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: "10px", padding: "10px", fontWeight: "700", cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontSize: "13px" }}>
                  💳 Pay Now — ₹{f.amount.toLocaleString()}
                </button>
              </div>
            ))}

            {/* Total due */}
            <div style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#111" }}>Total Due</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#ef4444" }}>₹{summary.pending.toLocaleString()}</div>
            </div>

            <button
              onClick={() => alert("🎉 Redirecting to Payment Gateway...")}
              style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: "14px", padding: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontSize: "15px", marginBottom: "20px", boxShadow: "0 6px 20px rgba(79,70,229,.35)" }}>
              💳 Pay All — ₹{summary.pending.toLocaleString()}
            </button>
          </>
        )}

        {/* Payment History */}
        {paidFees.length > 0 && (
          <>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7B8099", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "10px" }}>
              Payment History
            </div>
            {paidFees.map(f => (
              <div key={f.id} style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px", color: "#111" }}>{f.feeType}</div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Due: {f.dueDate}</div>
                    {f.paidDate && (
                      <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "2px" }}>✓ Paid on {f.paidDate}</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", fontSize: "16px", color: "#111" }}>₹{f.amount.toLocaleString()}</div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: statusColor[f.status], background: statusColor[f.status] + "20", padding: "3px 8px", borderRadius: "20px", marginTop: "4px" }}>
                      ✅ PAID
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}