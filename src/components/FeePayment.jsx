import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { payFee, balanceOf } from "../utils/payments";
import { toast, errorMessage } from "../utils/toast";

const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// "Pay online" for one fee. Shown only when the school has online payments enabled and a balance is due.
export function PayFeeButton({ fee, enabled, onPaid }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const balance = balanceOf(fee);
  if (!enabled || balance <= 0) return null;

  const pay = async () => {
    setBusy(true);
    try {
      const result = await payFee({ feeId: fee._id });
      if (result.status === "cancelled") return;
      if (result.status === "paid") {
        toast.success(`Payment of ${rupees(result.amount)} received`);
        onPaid?.();
        if (result.receiptNo) navigate(`/receipt/${fee._id}/${result.receiptNo}`);
      } else {
        toast.info(result.message || "Payment received. The school office will confirm it shortly.");
        onPaid?.();
      }
    } catch (err) {
      toast.error(errorMessage(err, "Payment could not be completed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={pay} disabled={busy}
      style={{ marginTop: 8, padding: "8px 14px", borderRadius: 10, border: "none", background: "var(--brand-gradient)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "inherit" }}>
      {busy ? "Opening..." : `Pay ${rupees(balance)} online`}
    </button>
  );
}

// Links to the receipt of every payment made against a fee.
export function ReceiptLinks({ fee }) {
  const navigate = useNavigate();
  if (!fee.payments?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {fee.payments.map((p) => (
        <button key={p.receiptNo} onClick={() => navigate(`/receipt/${fee._id}/${p.receiptNo}`)}
          style={{ border: "1px solid var(--brand-soft)", background: "var(--brand-soft)", color: "var(--brand-dark)", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Receipt {rupees(p.amount)}
        </button>
      ))}
    </div>
  );
}

// Explains how fees can be paid at this school.
export function PaymentInfo({ enabled }) {
  return (
    <div style={{ background: "var(--card, #fff)", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ fontSize: 24 }} aria-hidden="true">💳</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text, var(--brand-deep))" }}>{enabled ? "Pay online" : "Paying fees"}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.6 }}>
          {enabled
            ? "Pay securely with UPI, debit or credit card, or net banking. A receipt is issued immediately."
            : "Your school has not enabled online payment yet. Please pay at the school office; the receipt will appear here."}
        </div>
      </div>
    </div>
  );
}
