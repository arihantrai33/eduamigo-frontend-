import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function StudentFee() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [fees,      setFees]      = useState([]);
  const [summary,   setSummary]   = useState({ total: 0, totalPaid: 0, totalDue: 0 });
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => { fetchFees(); }, []);

  const fetchFees = async () => {
    try {
      const res = await axios.get(`${API}/fees/my`, authHeader());
      if (res.data.success) {
        setFees(res.data.data || []);
        setSummary(res.data.summary || { total: 0, totalPaid: 0, totalDue: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingFees = fees.filter(f => f.status === "Unpaid");
  const paidFees    = fees.filter(f => f.status === "Paid");

  const nearestDue = pendingFees.reduce((nearest, f) => {
    if (!nearest) return f;
    return new Date(f.dueDate) < new Date(nearest.dueDate) ? f : nearest;
  }, null);

  const formatDate   = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatAmount = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg }}>
      <div style={{ fontSize: 14, color: colors.subtext }}>Loading fee details...</div>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: colors.bg, fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", padding: "48px 20px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>Fee Statement</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Total Fees",  value: formatAmount(summary.total),    color: "#fff"    },
            { label: "Paid",        value: formatAmount(summary.totalPaid), color: "#bbf7d0" },
            { label: "Outstanding", value: formatAmount(summary.totalDue),  color: "#fde68a" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Due Alert */}
      {nearestDue && (
        <div style={{ margin: "16px 16px 0", background: "#FFF8E1", borderRadius: 14, padding: "14px 16px", borderLeft: "4px solid #f59e0b", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 22 }}>⚠️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Payment Due: {formatDate(nearestDue.dueDate)}</div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>Please clear outstanding dues to avoid late charges.</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", margin: "16px 16px 0", background: colors.card, borderRadius: 12, padding: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {[
          { key: "pending", label: `Outstanding (${pendingFees.length})` },
          { key: "paid",    label: `Paid (${paidFees.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: activeTab === tab.key ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "transparent",
              color: activeTab === tab.key ? "white" : "#888" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fee List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>

        {activeTab === "pending" && (
          <>
            {pendingFees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e" }}>All fees cleared</div>
                <div style={{ fontSize: 13, color: colors.subtext, marginTop: 4 }}>No outstanding payments</div>
              </div>
            ) : (
              <>
                {pendingFees.map(f => (
                  <div key={f._id} style={{ background: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{f.feeType}</div>
                        <div style={{ fontSize: 12, color: colors.subtext, marginTop: 3 }}>{f.month} {f.year}</div>
                        <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>Due: {formatDate(f.dueDate)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: colors.text }}>{formatAmount(f.amount)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "#fef3c7", padding: "3px 10px", borderRadius: 20, marginTop: 4 }}>UNPAID</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ background: colors.card, borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>Total Outstanding</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#ef4444" }}>{formatAmount(summary.totalDue)}</div>
                </div>

                <div style={{ background: "#eff6ff", borderRadius: 14, padding: "18px 20px", textAlign: "center", border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e40af" }}>Online Payment Coming Soon</div>
                  <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 6, lineHeight: 1.6 }}>
                    Please visit the school office to clear your dues.
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "paid" && (
          <>
            {paidFees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: colors.subtext }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>No payment history</div>
              </div>
            ) : (
              paidFees.map(f => (
                <div key={f._id} style={{ background: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: "4px solid #22c55e" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{f.feeType}</div>
                      <div style={{ fontSize: 12, color: colors.subtext, marginTop: 3 }}>{f.month} {f.year}</div>
                      {f.paidDate && <div style={{ fontSize: 12, color: "#22c55e", marginTop: 2 }}>Paid on {formatDate(f.paidDate)}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: colors.text }}>{formatAmount(f.amount)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "#dcfce7", padding: "3px 10px", borderRadius: 20, marginTop: 4 }}>PAID</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: colors.card, borderTop: `1px solid ${colors.border}`, display: "flex", padding: "8px 0 16px", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "🏠", label: "Home",  path: "/student/home"    },
          { icon: "🚌", label: "Bus",   path: "/student/bus"     },
          { icon: "📚", label: "Learn", path: "/student/notes"   },
          { icon: "💬", label: "Chat",  path: "/student/chat"    },
          { icon: "👤", label: "Me",    path: "/student/profile" },
        ].map(tab => (
          <button key={tab.label} onClick={() => navigate(tab.path)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: colors.subtext }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}