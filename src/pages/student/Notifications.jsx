import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import EmptyState from "../../components/ui/EmptyState";
import { Bell } from "lucide-react";

import Glyph from "../../components/Glyph";
import PortalHeader from "../../components/ui/PortalHeader";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
const icons = {
  fee: <Glyph e="💰" />, attendance: <Glyph e="📋" />, result: <Glyph e="📊" />,
  leave: <Glyph e="📝" />, bus: <Glyph e="🚌" />, general: <Glyph e="📢" />
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { darkMode: dm } = useTheme();
  const navigate = useNavigate();

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`${API}/notifications/${id}/read`, {}, authHeader());
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (_) {}
  };

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="ea-card" style={{ width: "calc(100% - 32px)", maxWidth: 520, padding: 16, margin: "0 auto" }}><Skeleton rows={5} label="Loading" /></div>
    </div>
  );

  return (
    <div className="ea-pd-narrow" style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "80px" }}>
      <PortalHeader title="Notifications" onBack={() => navigate(-1)} />
      <div className="ea-pd-body" style={{ padding: "16px" }}>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" text="Notices and alerts from your school will appear here." />
        ) : (
          notifications.map(n => (
            <div key={n._id} onClick={() => markRead(n._id)}
              style={{ background: dm ? (n.read ? "#1e293b" : "#1e3a5f") : (n.read ? "white" : "#eff6ff"), borderRadius: "12px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: n.read ? "none" : "3px solid var(--brand)", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>{icons[n.type] || <Glyph e="📢" />}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.read ? "500" : "700", fontSize: "14px", color: "var(--text)" }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--subtext2)", marginTop: "4px" }}>{n.message}</div>
                  <div style={{ fontSize: "11px", color: "#aaa", marginTop: "6px" }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
                {!n.read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand)", marginTop: "4px" }} />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
