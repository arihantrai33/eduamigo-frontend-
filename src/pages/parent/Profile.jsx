import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

function BottomNav({ active }) {
  const navigate = useNavigate();
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "var(--card)", borderTop: "1px solid var(--border)", display: "flex", padding: "8px 0 16px", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
      {[
        { icon: "🏠", label: "Home",     path: "/parent/home"          },
        { icon: "💬", label: "Teachers", path: "/parent/chat"          },
        { icon: "💳", label: "Fees",     path: "/parent/fee"           },
        { icon: "🔔", label: "Alerts",   path: "/parent/notifications" },
        { icon: "👤", label: "Me",       path: "/parent/profile"       },
      ].map(tab => (
        <button key={tab.label} onClick={() => navigate(tab.path)}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: active === tab.label.toLowerCase() ? "#4f46e5" : "#999" }}>
          <span style={{ fontSize: 22 }}>{tab.icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === tab.label.toLowerCase() ? "700" : "500" }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: last ? 0 : 12, marginBottom: last ? 0 : 12, borderBottom: last ? "none" : "1px solid #F0F2F8" }}>
      <span style={{ fontSize: 12, color: "#7B8099" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1C2033" }}>{value}</span>
    </div>
  );
}

export default function ParentProfile() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();
  const [parentData, setParentData] = useState(null);
  const [toast,      setToast]      = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const res = await axios.get(`${API}/parents/my-child`, authHeader());
        if (res.data.success) setParentData(res.data.data.parent);
      } catch {
        // silent fail — fallback to user object
      }
    };
    fetchParent();
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "P";

  const children = parentData ? [] : [];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const menu = [
    { icon: "🔔", label: "Notifications",   bg: "#E8F5E9", action: () => navigate("/parent/notifications") },
    { icon: "🔒", label: "Change Password", bg: "#FFF9C4", action: () => showToast("Change password feature coming soon") },
    { icon: "❓", label: "Help & Support",  bg: "#E3F2FD", action: () => showToast("Help & support coming soon")          },
    { icon: "🚪", label: "Logout",          bg: "#FFEBEE", action: handleLogout, danger: true                             },
  ];

  return (
    <div style={s.wrap}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#1C2033", color: "#fff", padding: "10px 20px", borderRadius: 30, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Top Bar */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <h2 style={s.title}>My Profile</h2>
      </div>

      <div style={s.scroll}>

        {/* Hero */}
        <div style={s.hero}>
          <div style={s.avatar}>{initials}</div>
          <div style={s.name}>{user?.name || "Parent"}</div>
          <div style={s.sub}>
            {parentData?.occupation ? parentData.occupation : "Parent"}
            {parentData?.address ? ` • ${parentData.address}` : ""}
          </div>
          <span style={s.badge}>👨‍👩‍👧 Parent</span>
        </div>

        {/* Info Card */}
        <div style={s.infoCard}>
          <InfoRow label="Email"      value={parentData?.email      || user?.email || "—"} />
          <InfoRow label="Phone"      value={parentData?.phone      || "—"               } />
          <InfoRow label="Gender"     value={parentData?.gender     || "—"               } />
          <InfoRow label="Occupation" value={parentData?.occupation || "—"               } />
          <InfoRow label="Address"    value={parentData?.address    || "—"               } last />
        </div>

        {/* Menu */}
        <div style={s.menuCard}>
          {menu.map((item, i) => (
            <button key={i}
              style={{ ...s.menuRow, ...(i === menu.length - 1 ? { borderBottom: "none" } : {}) }}
              onClick={item.action}>
              <div style={{ ...s.menuIcon, background: item.bg }}>{item.icon}</div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: item.danger ? "#EF5350" : "#1C2033" }}>{item.label}</div>
              <span style={{ color: item.danger ? "#EF5350" : "#7B8099", fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <p style={s.version}>EduAmigo v1.0.0</p>
      </div>

      <BottomNav active="me" />
    </div>
  );
}

const s = {
  wrap:     { minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", maxWidth: 430, margin: "0 auto" },
  topBar:   { background: "var(--card)", padding: "48px 20px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #E8EAF0" },
  backBtn:  { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#1C2033", fontWeight: 700 },
  title:    { fontSize: 17, fontWeight: 700, color: "#1C2033" },
  scroll:   { flex: 1, overflowY: "auto", padding: "16px 16px 80px", display: "flex", flexDirection: "column", gap: 14 },
  hero:     { background: "var(--card)", borderRadius: 20, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 2px 12px rgba(92,107,192,0.08)" },
  avatar:   { width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg,#7E57C2,#5C6BC0)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, marginBottom: 4 },
  name:     { fontSize: 20, fontWeight: 800, color: "#1C2033" },
  sub:      { fontSize: 13, color: "#7B8099" },
  badge:    { fontSize: 12, fontWeight: 700, background: "#E3F2FD", color: "#1565C0", padding: "4px 12px", borderRadius: 20, marginTop: 4 },
  infoCard: { background: "var(--card)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 12px rgba(92,107,192,0.08)" },
  menuCard: { background: "var(--card)", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(92,107,192,0.08)" },
  menuRow:  { width: "100%", background: "none", border: "none", borderBottom: "1px solid #F0F2F8", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" },
  menuIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  version:  { textAlign: "center", fontSize: 11, color: "#B0B8CC", paddingBottom: 8 },
};