import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("studentId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const icons = {
    fee: "💰", attendance: "📋", result: "📊",
    leave: "📝", bus: "🚌", general: "📢"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "20px 16px 40px", color: "white" }}>
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
            <div key={n.id} onClick={() => markRead(n.id)}
              style={{ background: n.read ? "white" : "#eff6ff", borderRadius: "12px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: n.read ? "none" : "3px solid #4f46e5", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>{icons[n.type] || "📢"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.read ? "500" : "700", fontSize: "14px", color: "#111" }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{n.message}</div>
                  <div style={{ fontSize: "11px", color: "#aaa", marginTop: "6px" }}>
                    {n.createdAt?.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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