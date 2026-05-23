import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const icons = {
  fee: "💰", attendance: "📋", result: "📊",
  leave: "📝", bus: "🚌", general: "📢"
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchNotifications(); }, []);

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
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6fa" }}>
      <div style={{ fontSize: 14, color: "#999" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 40px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px", color: "white", cursor: "pointer" }}>←</button>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Notifications</h2>
        </div>
      </div>

      <div style={{ padding: "16px", marginTop: "-20px" }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            <div style={{ fontSize: "48px" }}>🔔</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n._id} onClick={() => markRead(n._id)}
              style={{ background: n.read ? "white" : "#eff6ff", borderRadius: "12px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: n.read ? "none" : "3px solid #4f46e5", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>{icons[n.type] || "📢"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.read ? "500" : "700", fontSize: "14px", color: "#111" }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{n.message}</div>
                  <div style={{ fontSize: "11px", color: "#aaa", marginTop: "6px" }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
                {!n.read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4f46e5", marginTop: "4px" }} />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}