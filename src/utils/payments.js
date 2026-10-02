import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let checkoutPromise = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!checkoutPromise) {
    checkoutPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SRC;
      script.async = true;
      script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Payment window could not load")));
      script.onerror = () => { checkoutPromise = null; reject(new Error("Payment window could not load. Check your internet connection.")); };
      document.body.appendChild(script);
    });
  }
  return checkoutPromise;
}

export async function getPaymentConfig() {
  try {
    const res = await axios.get(`${API}/payments/config`, auth());
    return res.data.data;
  } catch {
    return { enabled: false };
  }
}

// Opens Razorpay Checkout for one fee and resolves with { status, receiptNo } once the server confirms.
// Resolves with { status: "cancelled" } if the payer closes the window.
export async function payFee({ feeId, amount }) {
  const { data } = await axios.post(`${API}/payments/orders`, { feeId, ...(amount ? { amount } : {}) }, auth());
  const order = data.data;
  const Razorpay = await loadCheckout();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      prefill: order.prefill,
      theme: { color: "#4f46e5" },
      handler: async (result) => {
        try {
          const res = await axios.post(`${API}/payments/verify`, result, auth());
          resolve({ ...res.data.data, message: res.data.message });
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => resolve({ status: "cancelled" }) },
    });
    rzp.on("payment.failed", (resp) => reject(new Error(resp?.error?.description || "Payment failed. No money was taken; please try again.")));
    rzp.open();
  });
}

// Outstanding amount on a fee, rounded to paise.
export const balanceOf = (fee) => Math.max(0, Math.round(((fee.amount || 0) - (fee.paidAmount || 0)) * 100) / 100);
