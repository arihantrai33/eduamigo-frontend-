import { useState } from "react";
import { toast, errorMessage } from "../utils/toast";

const API = import.meta.env.VITE_API_URL;

// Emergency alert: notifies every administrator of the school through the API.
// Success is shown only after the server confirms delivery; otherwise the user is told to call.
export default function SosModal({ onClose, studentName, studentId, location, driverPhone }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);

  const send = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API}/transport/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ studentId, lat: location?.lat, lng: location?.lng }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Alert could not be sent");
      setSent(data);
      toast.success("Alert sent to the school administration");
    } catch (err) {
      toast.error(`${errorMessage(err)} Please call the school directly.`);
    } finally {
      setSending(false);
    }
  };

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
  const card = { background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360, textAlign: "center", fontFamily: "Inter, system-ui, sans-serif" };
  const btn = { flex: 1, padding: "12px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="sos-title">
      <div style={card}>
        <div style={{ fontSize: 44, marginBottom: 8 }} aria-hidden="true">🆘</div>
        <p id="sos-title" style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
          {sent ? "Alert sent" : "Send an emergency alert?"}
        </p>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
          {sent
            ? `${sent.notified} school administrator(s) have been notified${studentName ? ` about ${studentName}` : ""}. If this is urgent, also call directly.`
            : `This immediately notifies your school's administrators${studentName ? ` about ${studentName}` : ""} with the bus details${location ? " and current location" : ""}.`}
        </p>

        {!sent && (
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button onClick={onClose} disabled={sending} style={{ ...btn, background: "#F1F5F9", color: "#334155", border: "none" }}>Cancel</button>
            <button onClick={send} disabled={sending} style={{ ...btn, background: "#DC2626", color: "#fff", border: "none", opacity: sending ? 0.7 : 1 }}>
              {sending ? "Sending..." : "Send alert"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {sent?.schoolPhone && <a href={`tel:${sent.schoolPhone}`} style={{ ...btn, background: "#EEF2FF", color: "#4338CA" }}>Call school</a>}
          {driverPhone && <a href={`tel:${driverPhone}`} style={{ ...btn, background: "#ECFDF5", color: "#047857" }}>Call driver</a>}
          <a href="tel:112" style={{ ...btn, background: "#FEF2F2", color: "#B91C1C" }}>Call 112</a>
        </div>

        {sent && <button onClick={onClose} style={{ ...btn, width: "100%", marginTop: 10, background: "#0F172A", color: "#fff", border: "none" }}>Close</button>}
      </div>
    </div>
  );
}
