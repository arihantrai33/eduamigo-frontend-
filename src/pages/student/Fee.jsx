import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getPaymentConfig } from "../../utils/payments";
import { PayFeeButton, ReceiptLinks, PaymentInfo } from "../../components/FeePayment";

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import Segmented from "../../components/ui/Segmented";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function StudentFee() {
  const navigate = useNavigate();
  const [fees,      setFees]      = useState([]);
  const [summary,   setSummary]   = useState({ total: 0, totalPaid: 0, totalDue: 0 });
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const [onlineEnabled, setOnlineEnabled] = useState(false);

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

  useEffect(() => { Promise.resolve().then(fetchFees); getPaymentConfig().then(c => setOnlineEnabled(!!c.enabled)); }, []);


  // Anything with a balance is outstanding, including part-paid fees.
  const balanceOf = (f) => Math.max(0, (f.amount || 0) - (f.paidAmount || 0));
  const pendingFees = fees.filter(f => f.status !== "Paid" && balanceOf(f) > 0);
  // Every fee with at least one payment, so part-payments and their receipts are listed too.
  const paidFees    = fees.filter(f => (f.payments?.length || 0) > 0);

  const nearestDue = pendingFees.reduce((nearest, f) => {
    if (!nearest) return f;
    return new Date(f.dueDate) < new Date(nearest.dueDate) ? f : nearest;
  }, null);

  const formatDate   = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatAmount = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="ea-card" style={{ width: "calc(100% - 32px)", maxWidth: 520, padding: 16, margin: "0 auto" }}><Skeleton rows={5} label="Loading fee details" /></div>
    </div>
  );

  return (
    <div className="ea-pd-narrow" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", fontFamily: "inherit" }}>

      {/* Header */}
      <PortalHeader title="Fee Statement" onBack={() => navigate(-1)} />
      <div className="ea-pd-bar" style={{ margin: "16px 16px 0" }}>
        <SummaryCard title="Fee summary" items={[
          { label: "Total Fees", value: formatAmount(summary.total) },
          { label: "Paid", value: formatAmount(summary.totalPaid), tone: "success" },
          { label: "Outstanding", value: formatAmount(summary.totalDue), tone: "warning" },
        ]} />
      </div>

      {/* Due Alert */}
      {nearestDue && (
        <div className="ea-pd-bar" style={{ margin: "16px 16px 0", background: "#FFF8E1", borderRadius: 14, padding: "14px 16px", borderLeft: "4px solid #f59e0b", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 22 }}><Glyph e="⚠" /></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Payment Due: {formatDate(nearestDue.dueDate)}</div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>Please clear outstanding dues to avoid late charges.</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ea-pd-bar" style={{ margin: "16px 16px 0" }}>
        <Segmented label="Fee view" value={activeTab} onChange={setActiveTab} options={[
          { value: "pending", label: `Outstanding (${pendingFees.length})` },
          { value: "paid",    label: `Payments (${paidFees.length})` },
        ]} />
      </div>

      {/* Fee List */}
      <div className="ea-pd-body" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>

        {activeTab === "pending" && (
          <>
            {pendingFees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}><Glyph e="✅" /></div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e" }}>All fees cleared</div>
                <div style={{ fontSize: 13, color: "var(--subtext)", marginTop: 4 }}>No outstanding payments</div>
              </div>
            ) : (
              <>
                {pendingFees.map(f => (
                  <div key={f._id} style={{ background: "var(--card)", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{f.feeType}</div>
                        {f.academicYear && <div style={{ fontSize: 12, color: "var(--subtext)", marginTop: 3 }}>{f.academicYear}</div>}
                        <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>Due: {formatDate(f.dueDate)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{formatAmount(balanceOf(f))}</div>
                        {f.paidAmount > 0 && <div style={{ fontSize: 11, color: "var(--subtext)", marginTop: 2 }}>of {formatAmount(f.amount)}</div>}
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "#fef3c7", padding: "3px 10px", borderRadius: 20, marginTop: 4 }}>{f.paidAmount > 0 ? "PART PAID" : "UNPAID"}</div>
                        <PayFeeButton fee={f} enabled={onlineEnabled} onPaid={fetchFees} />
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Total Outstanding</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#ef4444" }}>{formatAmount(summary.totalDue)}</div>
                </div>

                <PaymentInfo enabled={onlineEnabled} />
              </>
            )}
          </>
        )}

        {activeTab === "paid" && (
          <>
            {paidFees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--subtext)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}><Glyph e="📋" /></div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>No payment history</div>
              </div>
            ) : (
              paidFees.map(f => (
                <div key={f._id} style={{ background: "var(--card)", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: "4px solid #22c55e" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{f.feeType}</div>
                      {f.academicYear && <div style={{ fontSize: 12, color: "var(--subtext)", marginTop: 3 }}>{f.academicYear}</div>}
                      {f.paidDate && <div style={{ fontSize: 12, color: "#22c55e", marginTop: 2 }}>Last paid on {formatDate(f.paidDate)}</div>}
                      <ReceiptLinks fee={f} />
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{formatAmount(f.paidAmount)}</div>
                      {f.status !== "Paid" && <div style={{ fontSize: 11, color: "var(--subtext)" }}>of {formatAmount(f.amount)}</div>}
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "#dcfce7", padding: "3px 10px", borderRadius: 20, marginTop: 4 }}>{f.status === "Paid" ? "PAID" : "PART PAID"}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <BottomNav role="student" />
    </div>
  );
}