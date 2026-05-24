import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function ParentFee() {
  const navigate = useNavigate();

  const [child,   setChild]   = useState(null);
  const [fees,    setFees]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // Step 1 — get child
      const parentRes = await axios.get(`${API}/parents/my-child`, authHeader());
      if (!parentRes.data.success) { setError("Could not load child info"); setLoading(false); return; }
      const childData = parentRes.data.data.children?.[0];
      if (!childData) { setError("No child linked to this account"); setLoading(false); return; }
      setChild(childData);

      // Step 2 — get fees
      const feeRes = await axios.get(`${API}/fees/student/${childData._id}`, authHeader());
      if (feeRes.data.success) setFees(feeRes.data.data || []);

    } catch {
      setError("Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

  // Summary calculations
  const totalAnnual = fees.reduce((s, f) => s + (f.totalAmount ?? 0), 0);
  const paid        = fees.filter((f) => f.status === "Paid").reduce((s, f) => s + (f.totalAmount ?? 0), 0);
  const due         = fees.filter((f) => f.status !== "Paid").reduce((s, f) => s + (f.totalAmount ?? 0), 0);
  const paidPct     = totalAnnual > 0 ? Math.round((paid / totalAnnual) * 100) : 0;
  const dueFees     = fees.filter((f) => f.status !== "Paid");

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ color: "#999", fontSize: 14 }}>Loading fee details...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "Inter, sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 20px 32px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer", fontSize: 16 }}>
            ←
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>💳 Fee Status</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {child?.name ?? "—"} • Class {child?.class ?? "—"}-{child?.section ?? "—"}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 20, backdropFilter: "blur(10px)" }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Annual Fee 2025–26</div>
          <div style={{ fontSize: 36, fontWeight: 900 }}>
            ₹{totalAnnual.toLocaleString("en-IN")}
          </div>

          {/* Progress Bar */}
          <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, height: 8, marginTop: 16, marginBottom: 8 }}>
            <div style={{ width: `${paidPct}%`, background: "#4ade80", borderRadius: 99, height: 8, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{paidPct}% paid</div>

          {/* Paid / Due */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {[
              { label: "PAID", value: `₹${paid.toLocaleString("en-IN")}`, color: "#4ade80" },
              { label: "DUE",  value: `₹${due.toLocaleString("en-IN")}`,  color: "#f87171" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 16, marginTop: -16, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Due Alert */}
        {dueFees.length > 0 && (
          <div style={{ background: "#fff7ed", borderRadius: 14, padding: "14px 16px", border: "1px solid #fed7aa", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#c2410c" }}>Fee Due</div>
              <div style={{ fontSize: 12, color: "#ea580c", marginTop: 2 }}>
                ₹{due.toLocaleString("en-IN")} pending — please contact school office
              </div>
            </div>
          </div>
        )}

        {/* Fee Records */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 14 }}>FEE RECORDS</div>

          {fees.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: "20px 0", fontSize: 13 }}>
              No fee records found
            </div>
          ) : (
            fees.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < fees.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: f.status === "Paid" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {f.status === "Paid" ? "✅" : "⏳"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
                    {f.feeType ?? f.term ?? "Fee"}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    {f.status === "Paid"
                      ? `Paid on ${f.paidDate ? new Date(f.paidDate).toLocaleDateString("en-IN") : "—"}`
                      : `Due: ${f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: f.status === "Paid" ? "#16a34a" : "#ef4444" }}>
                    ₹{(f.totalAmount ?? 0).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: f.status === "Paid" ? "#16a34a" : "#ef4444", marginTop: 2 }}>
                    {f.status?.toUpperCase() ?? "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fee Structure Toggle */}
        {fees.length > 0 && (
          <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div onClick={() => setShowBreakdown(!showBreakdown)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#999", letterSpacing: 1 }}>FEE BREAKDOWN</div>
              <span style={{ fontSize: 18, color: "#4f46e5", display: "inline-block", transform: showBreakdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>⌄</span>
            </div>

            {showBreakdown && (
              <div style={{ marginTop: 14 }}>
                {fees.map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < fees.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ fontSize: 13, color: "#444" }}>{f.feeType ?? f.term ?? `Record ${i + 1}`}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>₹{(f.totalAmount ?? 0).toLocaleString("en-IN")}</div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "2px solid #f3f4f6" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Total</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#4f46e5" }}>₹{totalAnnual.toLocaleString("en-IN")}</div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}