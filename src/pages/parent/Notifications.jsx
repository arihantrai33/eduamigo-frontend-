import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
const icons = {
  fee: <Glyph e="💰" />, attendance: <Glyph e="📋" />, result: <Glyph e="📊" />,
  leave: <Glyph e="📝" />, bus: <Glyph e="🚌" />, general: <Glyph e="📢" />,
};

export default function ParentNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds while the page is open and visible.
    const timer = setInterval(() => { if (!document.hidden) fetchNotifications(); }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications/my`, authHeader());
      if (res.data.success) setNotifications(res.data.data || []);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`${API}/notifications/${id}/read`, {}, authHeader());
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch { }
  };

  return (
    <div className="ea-pd-narrow" style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "inherit", paddingBottom: 80 }}>
      <div className="ea-pd-band" style={{ background: "var(--brand-gradient)", padding: "48px 16px 40px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" aria-label="Back" onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer", fontSize: 16 }}>
            <Glyph e="←" />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}><Glyph e="🔔" /> Notifications</h2>
        </div>
      </div>
      <div className="ea-pd-body" style={{ padding: 16, marginTop: -20 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--subtext)", fontSize: 14 }}>
            Loading notifications...
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: 40, color: "#ef4444", fontSize: 14 }}>
            {error}
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--subtext)" }}>
            <div style={{ fontSize: 48 }}><Glyph e="🔔" /></div>
            <p style={{ fontSize: 14, marginTop: 12 }}>No notifications yet</p>
          </div>
        )}
        {!loading && notifications.map((n) => {
          const isRead = n.isRead ?? false;
          return (
            <div key={n._id}
              onClick={() => !isRead && markRead(n._id)}
              style={{
                background:  isRead ? "white" : "#eff6ff",
                borderRadius: 12, padding: 14, marginBottom: 10,
                boxShadow:   "0 1px 4px rgba(0,0,0,0.08)",
                borderLeft:  isRead ? "3px solid transparent" : "3px solid var(--brand)",
                cursor:      isRead ? "default" : "pointer",
              }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24 }}>{icons[n.type] ?? <Glyph e="📢" />}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isRead ? 500 : 700, fontSize: 14, color: "var(--text)" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--subtext2)", marginTop: 4 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
                {!isRead && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", marginTop: 4, flexShrink: 0 }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
