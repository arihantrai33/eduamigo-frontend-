import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmptyState from "../../components/ui/EmptyState";
import { Bell } from "lucide-react";

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
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
      <PortalHeader title="Notifications" onBack={() => navigate(-1)} />
      <div className="ea-pd-body" style={{ padding: 16 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--subtext)", fontSize: 14 }}>
            Loading notifications...
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--ea-on-card-danger)", fontSize: 14 }}>
            {error}
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <EmptyState icon={Bell} title="No notifications yet" text="Notices and alerts about your child will appear here." />
        )}
        {!loading && notifications.map((n) => {
          const isRead = n.isRead ?? false;
          return (
            <div key={n._id}
              onClick={() => !isRead && markRead(n._id)}
              style={{
                // Theme tokens, so the card and its text also read in dark mode; unread carries a light brand tint.
                background:  isRead ? "var(--ea-surface)" : "color-mix(in srgb, var(--brand) 6%, var(--ea-surface))",
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
                  <div style={{ fontSize: 11, color: "var(--ea-muted)", marginTop: 6 }}>
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
