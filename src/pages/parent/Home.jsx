import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export default function ParentHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [child, setChild] = useState(null);
  const [busInfo, setBusInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const busRes = await axios.get(`${API}/transport/my-child-bus`, authHeader());
        if (busRes.data.success) {
          const bus = busRes.data.data;
          setChild({
            name:   bus.studentName  || "Your Child",
            class:  bus.studentClass || "—",
            roll:   "—",
            school: "Your School",
          });
          setBusInfo({
            busNumber: bus.busNumber,
            status:    bus.busStatus,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tiles = [
    { icon: "💬", label: "Chat Teachers", sub: "No PTM needed!",     path: "/parent/chat" },
    { icon: "💳", label: "Fee Status",    sub: "Tap to check",        path: "/parent/fee" },
    { icon: "📊", label: "Results",       sub: "Tap to check",        path: "/parent/result" },
    { icon: "🚌", label: "Track Bus",     sub: busInfo ? `${busInfo.busNumber} • ${busInfo.status}` : "Loading...", path: "/parent/bus" },
    { icon: "✅", label: "Attendance",    sub: "Tap to check",        path: "/parent/attendance" },
    { icon: "📅", label: "School Calendar", sub: "Upcoming events",   path: "/parent/calendar" },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 20px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "700" }}>PARENT PORTAL</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#fff" }}>{user?.name || "Parent"} 👩‍👧</div>
          </div>
          <button onClick={() => navigate("/parent/notifications")}
            style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", fontSize: "16px", position: "relative" }}>
            🔔
            <div style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", background: "#FF5252", borderRadius: "50%", border: "2px solid white" }} />
          </button>
        </div>

        {/* Child Card */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "16px", padding: "16px", marginTop: "16px", backdropFilter: "blur(10px)" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", marginBottom: "4px" }}>Monitoring</div>
          {loading ? (
            <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)" }}>Loading...</div>
          ) : child ? (
            <>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff" }}>{child.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>
                {child.class} • {child.school}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                {[
                  { val: "—", label: "Attendance" },
                  { val: "—", label: "Marks" },
                  { val: "—", label: "Grade" },
                  { val: "—", label: "Rank" },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: "900", color: "#fff" }}>{s.val}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>No child linked to this account</div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>
        {/* Quick Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {tiles.map(t => (
            <button key={t.label} onClick={() => navigate(t.path)}
              style={{ background: "white", borderRadius: "14px", padding: "14px", border: "none", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>{t.icon}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#111" }}>{t.label}</div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Recent Alerts */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#111" }}>🔔 Recent Alerts</h3>
          <span onClick={() => navigate("/parent/notifications")} style={{ fontSize: "13px", color: "#4f46e5", cursor: "pointer" }}>All →</span>
        </div>
        <div style={{ background: "white", borderRadius: "14px", padding: "4px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "16px 0", textAlign: "center", color: "#999", fontSize: "13px" }}>
            No alerts yet
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", background: "white", borderTop: "1px solid #eee", display: "flex", padding: "8px 0 16px", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "🏠", label: "Home",     path: "/parent/home",          active: true },
          { icon: "💬", label: "Teachers", path: "/parent/chat" },
          { icon: "💳", label: "Fees",     path: "/parent/fee" },
          { icon: "🔔", label: "Alerts",   path: "/parent/notifications" },
          { icon: "👤", label: "Me",       path: "/parent/profile" },
        ].map(tab => (
          <button key={tab.label} onClick={() => navigate(tab.path)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", color: tab.active ? "#4f46e5" : "#999" }}>
            <span style={{ fontSize: "22px" }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: tab.active ? "700" : "500" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}