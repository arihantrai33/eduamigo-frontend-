import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import SupportContent from "../../components/SupportContent";
import { signOutEverywhere, resetStudentPassword } from "../../utils/account";
import { showCredentials, toast } from "../../utils/toast";

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

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
  const [showHelp,   setShowHelp]   = useState(false);
  const [children,   setChildren]   = useState([]);
  const [showReset,  setShowReset]  = useState(false);


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
    axios.get(`${API}/students/my-child`, authHeader())
      .then((r) => setChildren(r.data.children || []))
      .catch(() => {});
  }, []);

  // Students usually have no email, so the parent gives them a new temporary password here.
  const resetChild = async (child) => {
    const credentials = await resetStudentPassword(child);
    if (!credentials) return;
    showCredentials([{ label: child.name, ...credentials }], "New password for your child");
    toast.success(`${child.name} must set a new password after logging in`);
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "P";


  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const menu = [
    { icon: <Glyph e="🔔" />, label: "Notifications",   bg: "#E8F5E9", action: () => navigate("/parent/notifications") },
    { icon: <Glyph e="🔒" />, label: "Change Password", bg: "#FFF9C4", action: () => navigate("/change-password") },
    ...(children.length ? [{ icon: <Glyph e="🔑" />, label: "Reset child's password", bg: "#EDE7F6", action: () => setShowReset((v) => !v) }] : []),
    { icon: <Glyph e="❓" />, label: "Help & Support",  bg: "#E3F2FD", action: () => setShowHelp(true) },
    { icon: <Glyph e="📵" />, label: "Sign out on all devices", bg: "#FFF7ED", action: () => signOutEverywhere(logout, navigate) },
    { icon: <Glyph e="🚪" />, label: "Logout",          bg: "#FFEBEE", action: handleLogout, danger: true                             },
  ];

  if (showHelp) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "inherit" }}>
      <div style={{ background: "var(--brand-gradient)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => setShowHelp(false)} aria-label="Back" style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}><Glyph e="←" /></button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Help & Support</h2>
      </div>
      <div style={{ padding: "16px" }}>
        <SupportContent role="parent" />
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>

      {/* Toast */}

      {/* Top Bar */}
      <PortalHeader title="My Profile" onBack={() => navigate(-1)} />

      <div style={s.scroll}>

        {/* Hero */}
        <div style={s.hero}>
          <div style={s.avatar}>{initials}</div>
          <div style={s.name}>{user?.name || "Parent"}</div>
          <div style={s.sub}>
            {parentData?.occupation ? parentData.occupation : "Parent"}
            {parentData?.address ? ` • ${parentData.address}` : ""}
          </div>
          <span style={s.badge}><Glyph e="👨‍👩‍👧" /> Parent</span>
        </div>

        {/* Info Card */}
        <div style={s.infoCard}>
          <InfoRow label="Email"      value={parentData?.email      || user?.email || "—"} />
          <InfoRow label="Phone"      value={parentData?.phone      || "—"               } />
          <InfoRow label="Gender"     value={parentData?.gender     || "—"               } />
          <InfoRow label="Occupation" value={parentData?.occupation || "—"               } />
          <InfoRow label="Address"    value={parentData?.address    || "—"               } last />
        </div>

        {showReset && (
          <div style={{ ...s.infoCard, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: "#7B8099", marginBottom: 8, lineHeight: 1.5 }}>
              Your child logs in with the school code and their admission number. Choose a child to give them a new temporary password.
            </div>
            {children.map((c) => (
              <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text, #1C2033)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#7B8099" }}>Class {c.class}-{c.section}{c.admissionNo ? ` · Admission No ${c.admissionNo}` : ""}</div>
                </div>
                <button onClick={() => resetChild(c)} style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: "var(--brand)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reset password</button>
              </div>
            ))}
          </div>
        )}

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

      <BottomNav role="parent" />
    </div>
  );
}

const s = {
  wrap:     { minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", fontFamily: "inherit" },
  topBar:   { background: "var(--card)", padding: "48px 20px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #E8EAF0" },
  backBtn:  { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#1C2033", fontWeight: 700 },
  title:    { fontSize: 17, fontWeight: 700, color: "#1C2033" },
  scroll:   { flex: 1, overflowY: "auto", padding: "16px 16px 80px", display: "flex", flexDirection: "column", gap: 14 },
  hero:     { background: "var(--card)", borderRadius: 20, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 2px 12px color-mix(in srgb, var(--brand) 8%, transparent)" },
  avatar:   { width: 72, height: 72, borderRadius: 24, background: "var(--brand-gradient)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, marginBottom: 4 },
  name:     { fontSize: 20, fontWeight: 800, color: "#1C2033" },
  sub:      { fontSize: 13, color: "#7B8099" },
  badge:    { fontSize: 12, fontWeight: 700, background: "#E3F2FD", color: "#1565C0", padding: "4px 12px", borderRadius: 20, marginTop: 4 },
  infoCard: { background: "var(--card)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 12px color-mix(in srgb, var(--brand) 8%, transparent)" },
  menuCard: { background: "var(--card)", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px color-mix(in srgb, var(--brand) 8%, transparent)" },
  menuRow:  { width: "100%", background: "none", border: "none", borderBottom: "1px solid #F0F2F8", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" },
  menuIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  version:  { textAlign: "center", fontSize: 11, color: "#B0B8CC", paddingBottom: 8 },
};