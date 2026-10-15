import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { currentAcademicYear } from "../../utils/academicYear";
import { pickChild, childQuery } from "../../utils/selectedChild";
import { getPaymentConfig, balanceOf } from "../../utils/payments";
import { PayFeeButton, ReceiptLinks, PaymentInfo } from "../../components/FeePayment";

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import Segmented from "../../components/ui/Segmented";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const STATUS_CONFIG = {
  Paid:    { color: "#15803D", bg: "#dcfce7", icon: "✓", amount: "var(--ea-on-card-success)" },
  Unpaid:  { color: "#B91C1C", bg: "#fee2e2", icon: "!", amount: "var(--ea-on-card-danger)" },
  Partial: { color: "#B45309", bg: "#fef3c7", icon: "~", amount: "var(--ea-on-card-warning)" },
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
  const [onlineEnabled, setOnlineEnabled] = useState(false);

  const fetchData = async () => {
    try {
      const [parentRes, feeRes] = await Promise.all([
        axios.get(`${API}/parents/my-child`, authHeader()),
        axios.get(`${API}/fees/my${childQuery()}`, authHeader()),
      ]);
      if (parentRes.data.success) {
        setChild(pickChild(parentRes.data.data.children));
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

  useEffect(() => { Promise.resolve().then(fetchData); getPaymentConfig().then(c => setOnlineEnabled(!!c.enabled)); }, []);

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
      <div style={{ fontSize: 40, marginBottom: 12 }}></div>
      <div style={{ color: "#ef4444", fontSize: 14, fontWeight: 600 }}>{error}</div>
      <button onClick={fetchData} style={styles.retryBtn}>Try Again</button>
    </div>
  );

  return (
    <div className="ea-pd-narrow" style={styles.page}>

      {/* ── Header ── */}
      <PortalHeader title="Fee Overview" onBack={() => navigate(-1)}
        subtitle={`${child?.name ?? "—"} · Class ${child?.class ?? "—"}-${child?.section ?? "—"}`} />

      {/* ── Body ── */}
      <div className="ea-pd-body" style={styles.body}>

        {/* Summary */}
        <div style={{ marginBottom: 16 }}>
          <SummaryCard title={`Academic Year ${currentAcademicYear()}`} value={`₹${summary.total.toLocaleString("en-IN")}`} caption="Total Annual Fee"
            items={[
              { label: "Paid", value: `₹${summary.totalPaid.toLocaleString("en-IN")}`, tone: "success" },
              { label: "Due", value: `₹${summary.totalDue.toLocaleString("en-IN")}`, tone: summary.totalDue > 0 ? "danger" : "success" },
            ]}>
            <div>
              <div style={styles.progressWrap} role="progressbar" aria-label="Fee paid" aria-valuenow={paidPct} aria-valuemin={0} aria-valuemax={100}>
                <div style={{ ...styles.progressFill, width: `${paidPct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ea-muted)" }}>
                <span>{paidPct}% paid</span>
                <span>{100 - paidPct}% remaining</span>
              </div>
            </div>
          </SummaryCard>
        </div>

        {/* Overdue Alert */}
        {overdueFees.length > 0 && (
          <div style={styles.alert}>
            <div style={{ fontSize: 22 }}><Glyph e="⚠" /></div>
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
            <div style={{ fontSize: 22 }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#14532d" }}>All fees cleared!</div>
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>No outstanding dues.</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ marginBottom: 14 }}>
          <Segmented label="Fee records" value={activeTab} onChange={setActiveTab} options={[
            { value: "all",     label: `All (${fees.length})` },
            { value: "paid",    label: `Paid (${fees.filter(f => f.status === "Paid").length})` },
            { value: "pending", label: `Pending (${fees.filter(f => f.status !== "Paid").length})` },
          ]} />
        </div>

        {/* Fee Records */}
        <div style={styles.card}>
          {filteredFees.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: 36, marginBottom: 8 }}><Glyph e="📭" /></div>
              <div style={{ fontWeight: 600, color: "#374151" }}>No records found</div>
              <div style={{ fontSize: 12, color: "var(--ea-muted)", marginTop: 4 }}>
                {activeTab === "paid" ? "No payments made yet." : "No pending fees."}
              </div>
            </div>
          ) : (
            filteredFees.map((f, i) => {
              const cfg = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.Unpaid;
              return (
                <div key={i} style={{
                  ...styles.feeRow,
                  borderBottom: i < filteredFees.length - 1 ? "1px solid var(--ea-line)" : "none"
                }}>
                  <div style={{ ...styles.feeIcon, background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                      {f.feeType ?? "Fee"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ea-muted)", marginTop: 3 }}>
                      {[
                        f.academicYear,
                        f.status === "Paid"
                          ? `Paid on ${f.paidDate ? new Date(f.paidDate).toLocaleDateString("en-IN") : "—"}`
                          : `Due: ${f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}`,
                      ].filter(Boolean).join(" · ")}
                    </div>
                    <ReceiptLinks fee={f} />
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: cfg.amount }}>
                      ₹{(f.amount ?? 0).toLocaleString("en-IN")}
                    </div>
                    {f.status === "Partial" && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Balance ₹{balanceOf(f).toLocaleString("en-IN")}</div>
                    )}
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: cfg.color,
                      background: cfg.bg, borderRadius: 6,
                      padding: "2px 6px", marginTop: 4, display: "inline-block"
                    }}>
                      {f.status?.toUpperCase()}
                    </div>
                    <div><PayFeeButton fee={f} enabled={onlineEnabled} onPaid={fetchData} /></div>
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
              type="button" aria-expanded={showBreakdown}
              onClick={() => setShowBreakdown(!showBreakdown)}
              style={styles.breakdownToggle}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 1 }}>
                FEE BREAKDOWN
              </span>
              <span style={{
                color: "var(--brand)", fontSize: 16,
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
                      <div style={{ fontSize: 11, color: "var(--ea-muted)", marginTop: 2 }}>
                        {f.month} {f.year}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                        ₹{(f.amount ?? 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={styles.breakdownTotal}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: 15, color: "var(--brand)" }}>
                    ₹{summary.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <PaymentInfo enabled={onlineEnabled} />

      </div>
      <BottomNav role="parent" />
    </div>
  );
}

/* ── Styles ── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    fontFamily: "inherit",
    paddingBottom: 48,
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
  },
  spinner: {
    width: 32, height: 32,
    border: "3px solid #e5e7eb",
    borderTop: "3px solid var(--brand)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  retryBtn: {
    marginTop: 16, padding: "10px 24px",
    background: "var(--brand)", color: "white",
    border: "none", borderRadius: 10,
    fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  progressWrap: {
    background: "var(--ea-hover)",
    borderRadius: 99, height: 8,
    margin: "0 0 6px",
  },
  progressFill: {
    background: "var(--brand)",
    borderRadius: 99, height: 8,
    transition: "width 0.8s ease",
  },
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
  card: {
    background: "var(--card)", borderRadius: 16,
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
    alignItems: "center", padding: "6px 0", minHeight: 32,
  },
  breakdownTotal: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginTop: 12,
    paddingTop: 12,
    borderTop: "2px solid #f3f4f6",
  },
};