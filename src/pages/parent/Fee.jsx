import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const STATUS_CONFIG = {
  Paid:    { color: "#16a34a", bg: "#dcfce7", icon: "✓" },
  Unpaid:  { color: "#dc2626", bg: "#fee2e2", icon: "!" },
  Partial: { color: "#d97706", bg: "#fef3c7", icon: "~" },
};

export default function ParentFee() {
  const navigate = useNavigate();
  const [child,         setChild]         = useState(null);
  const [fees,          setFees]          = useState([]);
  const [summary,       setSummary]       = useState({ total: 0, totalPaid: 0, totalDue: 0 });
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeTab,     setActiveTab]     = useState("all");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [parentRes, feeRes] = await Promise.all([
        axios.get(`${API}/parents/my-child`, authHeader()),
        axios.get(`${API}/fees/my`, authHeader()),
      ]);
      if (parentRes.data.success) {
        setChild(parentRes.data.data.children?.[0] ?? null);
      }
      if (feeRes.data.success) {
        setFees(feeRes.data.data || []);
        setSummary(feeRes.data.summary || { total: 0, totalPaid: 0, totalDue: 0 });
      }
    } catch {
      setError("Failed to load fee details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const paidPct = summary.total > 0
    ? Math.round((summary.totalPaid / summary.total) * 100)
    : 0;

  const filteredFees = fees.filter((f) => {
    if (activeTab === "all")     return true;
    if (activeTab === "paid")    return f.status === "Paid";
    if (activeTab === "pending") return f.status !== "Paid";
    return true;
  });

  const overdueFees = fees.filter((f) => {
    if (f.status === "Paid") return false;
    if (!f.dueDate) return false;
    return new Date(f.dueDate) < new Date();
  });

  /* ── Loading ── */
  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <div style={{ color: "#6b7280", fontSize: 13, marginTop: 12 }}>Loading fee details...</div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={styles.centered}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
      <div style={{ color: "#ef4444", fontSize: 14, fontWeight: 600 }}>{error}</div>
      <button onClick={fetchData} style={styles.retryBtn}>Try Again</button>
    </div>
  );

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>←</button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "white" }}>Fee Overview</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
              {child?.name ?? "—"} &nbsp;·&nbsp; Class {child?.class ?? "—"}-{child?.section ?? "—"}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div style={styles.summaryCard}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
            Academic Year 2025–26
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, color: "white", letterSpacing: -1 }}>
            ₹{summary.total.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
            Total Annual Fee
          </div>

          {/* Progress Bar */}
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressFill, width: `${paidPct}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
            <span>{paidPct}% paid</span>
            <span>{100 - paidPct}% remaining</span>
          </div>

          {/* Paid / Due chips */}
          <div style={styles.chipRow}>
            <div style={styles.chip}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3 }}>PAID</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>
                ₹{summary.totalPaid.toLocaleString("en-IN")}
              </div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
            <div style={styles.chip}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3 }}>DUE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: summary.totalDue > 0 ? "#f87171" : "#4ade80" }}>
                ₹{summary.totalDue.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={styles.body}>

        {/* Overdue Alert */}
        {overdueFees.length > 0 && (
          <div style={styles.alert}>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>
                {overdueFees.length} Overdue Payment{overdueFees.length > 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
                Please clear your dues at the school office.
              </div>
            </div>
          </div>
        )}

        {/* All Clear */}
        {summary.totalDue === 0 && fees.length > 0 && (
          <div style={styles.allClear}>
            <div style={{ fontSize: 22 }}>🎉</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#14532d" }}>All fees cleared!</div>
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>No outstanding dues.</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabRow}>
          {[
            { key: "all",     label: `All (${fees.length})` },
            { key: "paid",    label: `Paid (${fees.filter(f => f.status === "Paid").length})` },
            { key: "pending", label: `Pending (${fees.filter(f => f.status !== "Paid").length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{ ...styles.tab, ...(activeTab === t.key ? styles.tabActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Fee Records */}
        <div style={styles.card}>
          {filteredFees.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 600, color: "#374151" }}>No records found</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                {activeTab === "paid" ? "No payments made yet." : "No pending fees."}
              </div>
            </div>
          ) : (
            filteredFees.map((f, i) => {
              const cfg = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.Unpaid;
              return (
                <div key={i} style={{
                  ...styles.feeRow,
                  borderBottom: i < filteredFees.length - 1 ? "1px solid #f3f4f6" : "none"
                }}>
                  <div style={{ ...styles.feeIcon, background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
                      {f.feeType ?? "Fee"}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                      {f.month} {f.year} &nbsp;·&nbsp;
                      {f.status === "Paid"
                        ? `Paid on ${f.paidDate ? new Date(f.paidDate).toLocaleDateString("en-IN") : "—"}`
                        : `Due: ${f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: cfg.color }}>
                      ₹{(f.amount ?? 0).toLocaleString("en-IN")}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: cfg.color,
                      background: cfg.bg, borderRadius: 6,
                      padding: "2px 6px", marginTop: 4, display: "inline-block"
                    }}>
                      {f.status?.toUpperCase()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Fee Breakdown */}
        {fees.length > 0 && (
          <div style={styles.card}>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              style={styles.breakdownToggle}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 1 }}>
                FEE BREAKDOWN
              </span>
              <span style={{
                color: "#4f46e5", fontSize: 16,
                transform: showBreakdown ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s", display: "inline-block"
              }}>⌄</span>
            </button>
            {showBreakdown && (
              <div style={{ marginTop: 14 }}>
                {fees.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "10px 0",
                    borderBottom: i < fees.length - 1 ? "1px solid #f9fafb" : "none"
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                        {f.feeType ?? "Fee"}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {f.month} {f.year}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                        ₹{(f.amount ?? 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={styles.breakdownTotal}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: 15, color: "#4f46e5" }}>
                    ₹{summary.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Coming Soon */}
        <div style={styles.paymentCard}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>Online Payment</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, textAlign: "center", lineHeight: 1.6 }}>
            Online fee payment will be available soon.{"\n"}
            For now, please pay at the school office.
          </div>
          <div style={styles.comingSoonBadge}>Coming Soon</div>
        </div>

      </div>
    </div>
  );
}

/* ── Styles ── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f6fa",
    fontFamily: "'Inter', sans-serif",
    paddingBottom: 48,
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
  },
  spinner: {
    width: 32, height: 32,
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  retryBtn: {
    marginTop: 16, padding: "10px 24px",
    background: "#4f46e5", color: "white",
    border: "none", borderRadius: 10,
    fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  header: {
    background: "linear-gradient(135deg, #4338ca, #7c3aed)",
    padding: "48px 20px 28px",
  },
  headerTop: {
    display: "flex", alignItems: "center",
    gap: 14, marginBottom: 20,
  },
  backBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "none", borderRadius: 10,
    padding: "8px 14px", color: "white",
    cursor: "pointer", fontSize: 18, fontWeight: 700,
  },
  summaryCard: {
    background: "rgba(255,255,255,0.12)",
    borderRadius: 20, padding: 20,
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  progressWrap: {
    background: "rgba(255,255,255,0.2)",
    borderRadius: 99, height: 8,
    margin: "14px 0 6px",
  },
  progressFill: {
    background: "#4ade80",
    borderRadius: 99, height: 8,
    transition: "width 0.8s ease",
  },
  chipRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1px 1fr",
    gap: 0,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 14, padding: "12px 16px",
    marginTop: 16, alignItems: "center",
  },
  chip: { textAlign: "center" },
  body: { padding: "16px 16px 0" },
  alert: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 14, padding: "14px 16px",
    display: "flex", alignItems: "center",
    gap: 12, marginBottom: 14,
  },
  allClear: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 14, padding: "14px 16px",
    display: "flex", alignItems: "center",
    gap: 12, marginBottom: 14,
  },
  tabRow: {
    display: "flex", gap: 8,
    marginBottom: 14,
  },
  tab: {
    flex: 1, padding: "9px 4px",
    border: "1px solid #e5e7eb",
    borderRadius: 10, background: "white",
    fontSize: 12, fontWeight: 600,
    color: "#6b7280", cursor: "pointer",
  },
  tabActive: {
    background: "#4f46e5",
    color: "white",
    border: "1px solid #4f46e5",
  },
  card: {
    background: "white", borderRadius: 16,
    padding: 16, marginBottom: 14,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  feeRow: {
    display: "flex", alignItems: "center",
    gap: 14, padding: "14px 0",
  },
  feeIcon: {
    width: 40, height: 40, borderRadius: 12,
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 16,
    fontWeight: 800, flexShrink: 0,
  },
  empty: {
    textAlign: "center",
    padding: "28px 0",
  },
  breakdownToggle: {
    width: "100%", background: "none",
    border: "none", cursor: "pointer",
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: 0,
  },
  breakdownTotal: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginTop: 12,
    paddingTop: 12,
    borderTop: "2px solid #f3f4f6",
  },
  paymentCard: {
    background: "white", borderRadius: 16,
    padding: "24px 20px", marginBottom: 14,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column",
    alignItems: "center",
  },
  comingSoonBadge: {
    marginTop: 14, padding: "6px 18px",
    background: "#f3f4f6", borderRadius: 99,
    fontSize: 12, fontWeight: 700,
    color: "#6b7280", letterSpacing: 0.5,
  },
};