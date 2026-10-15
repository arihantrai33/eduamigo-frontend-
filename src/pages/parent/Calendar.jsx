import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { errorMessage } from "../../utils/toast";
import { childQuery } from "../../utils/selectedChild";

import Glyph from "../../components/Glyph";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const EVENT_STYLE = {
  holiday: { icon: <Glyph e="🏖" />, bg: "#fce4ec", color: "#c2185b" },
  exam:    { icon: <Glyph e="📝" />, bg: "#fff9c4", color: "#f57f17" },
  ptm:     { icon: <Glyph e="👨‍👩‍👧" />, bg: "#e8f5e9", color: "#2e7d32" },
  sports:  { icon: <Glyph e="🏃" />, bg: "#e8f5e9", color: "#2e7d32" },
  event:   { icon: "", bg: "#ede9fe", color: "#6d28d9" },
  other:   { icon: <Glyph e="📌" />, bg: "#f1f5f9", color: "#475569" },
  fee:     { icon: <Glyph e="💳" />, bg: "#ffebee", color: "#ef4444" },
};

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const fmt = (d, opts = { day: "numeric", month: "long", year: "numeric" }) => new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC", ...opts });
const badge = (d) => new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" });

// Upcoming school events, the child's exam schedule and fee due dates, in date order.
export default function ParentCalendar() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [ev, ex, fees] = await Promise.allSettled([
          axios.get(`${API}/events`, auth()),
          axios.get(`${API}/exams${childQuery()}`, auth()),
          axios.get(`${API}/fees/my${childQuery()}`, auth()),
        ]);
        if (ev.status === "rejected" && ex.status === "rejected") throw ev.reason;
        const from = today();
        const events = (ev.status === "fulfilled" ? ev.value.data.data : [])
          .filter((e) => new Date(e.endDate || e.date) >= from)
          .map((e) => ({ key: e._id, date: e.date, title: e.title, sub: `${fmt(e.date)}${e.description ? ` • ${e.description}` : ""}`, style: EVENT_STYLE[e.type] || EVENT_STYLE.other }));
        const dues = (fees.status === "fulfilled" ? fees.value.data.data : [])
          .filter((f) => f.status !== "Paid" && new Date(f.dueDate) >= from)
          .map((f) => ({ key: f._id, date: f.dueDate, title: `${f.feeType} due`, sub: `${fmt(f.dueDate)} • Balance Rs ${(f.amount - (f.paidAmount || 0)).toLocaleString("en-IN")}`, style: EVENT_STYLE.fee }));
        setItems([...events, ...dues].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setExams((ex.status === "fulfilled" ? ex.value.data.data : []).filter((e) => new Date(e.date) >= from));
      } catch (err) {
        setError(errorMessage(err, "Could not load the calendar"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const card = { background: "var(--card)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" };
  const heading = { padding: "16px 16px 8px", fontWeight: "700", fontSize: "14px", color: "#444" };
  const empty = (text) => <div style={{ padding: "8px 16px 18px", fontSize: 13, color: "var(--subtext)" }}>{text}</div>;

  return (
    <div className="ea-pd-narrow" style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "inherit", paddingBottom: "30px" }}>
      <div className="ea-pd-band" style={{ background: "var(--brand-gradient)", padding: "48px 16px 40px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} aria-label="Back" style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}><Glyph e="←" /></button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>School Calendar</h2>
        </div>
      </div>

      <div className="ea-pd-body" style={{ padding: "16px", marginTop: "-20px" }}>
        {loading && <div style={{ ...card, padding: 16, fontSize: 13, color: "var(--subtext)" }}>Loading calendar...</div>}
        {!loading && error && <div style={{ ...card, padding: 16, fontSize: 13, color: "#B91C1C" }}>{error}</div>}

        {!loading && !error && (
          <>
            <div style={card}>
              <div style={heading}>Upcoming Events</div>
              {items.length === 0 ? empty("No upcoming events.") : items.map((e, i) => (
                <div key={e.key} style={{ padding: "12px 16px", borderBottom: i < items.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: e.style.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }} aria-hidden="true">{e.style.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{e.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "2px" }}>{e.sub}</div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: e.style.color, background: e.style.bg, padding: "4px 10px", borderRadius: "20px", flexShrink: 0 }}>{badge(e.date)}</span>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={heading}>Exam Schedule</div>
              {exams.length === 0 ? empty("No upcoming exams.") : exams.map((e, i) => (
                <div key={e._id} style={{ padding: "12px 16px", borderBottom: i < exams.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{e.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "2px" }}>
                      {e.subject} • {fmt(e.date)}{e.startTime ? ` • ${e.startTime}${e.endTime ? `–${e.endTime}` : ""}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#1565c0", background: "#e3f2fd", padding: "4px 10px", borderRadius: "20px", flexShrink: 0 }}>{e.examType}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
