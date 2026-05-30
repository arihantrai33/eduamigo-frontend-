import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function Profile() {
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();

  const [profile,      setProfile]      = useState(null);
  const [attendance,   setAttendance]   = useState(null);
  const [avgMarks,     setAvgMarks]     = useState(null);
  const [overallGrade, setOverallGrade] = useState(null);
  const [loading,      setLoading]      = useState(true);

  const [showProfile,  setShowProfile]  = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp,     setShowHelp]     = useState(false);
  const [showIdCard,   setShowIdCard]   = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [language,      setLanguage]      = useState("English");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [profileRes, attendanceRes, resultsRes] = await Promise.allSettled([
        axios.get(`${API}/students/my-profile`,   authHeader()),
        axios.get(`${API}/attendance/my-summary`, authHeader()),
        axios.get(`${API}/exams/my-results`,      authHeader()),
      ]);
      if (profileRes.status === "fulfilled" && profileRes.value.data.success)
        setProfile(profileRes.value.data.data);
      if (attendanceRes.status === "fulfilled" && attendanceRes.value.data.success)
        setAttendance(attendanceRes.value.data.data);
      if (resultsRes.status === "fulfilled" && resultsRes.value.data.success) {
        setAvgMarks(resultsRes.value.data.averagePercentage);
        setOverallGrade(resultsRes.value.data.overallGrade);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const getInitial = () => (profile?.name || user?.name || "S")[0].toUpperCase();

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: darkMode ? "#1a1a2e" : "#f5f6fa" }}>
      <div style={{ fontSize: 14, color: "var(--subtext)" }}>Loading...</div>
    </div>
  );

  // ── View Profile ──
  if (showProfile) return (
    <div style={{ position: "absolute", inset: 0, background: darkMode ? "#1a1a2e" : "#f5f6fa", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowProfile(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>My Information</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "32px", fontWeight: "700", color: "white", border: "3px solid #e5e7eb" }}>
            {getInitial()}
          </div>
          <div style={{ fontSize: "12px", color: darkMode ? "#aaa" : "#888", marginTop: "8px" }}>Profile photo is managed by school admin</div>
        </div>
        {[
          { label: "Full Name",    value: profile?.name        || "—" },
          { label: "Email",        value: profile?.email       || "—" },
          { label: "Class",        value: profile?.class ? `${profile.class}-${profile.section}` : "—" },
          { label: "Roll Number",  value: profile?.rollNumber  || "—" },
          { label: "Phone",        value: profile?.phone       || "—" },
          { label: "Parent Name",  value: profile?.parentName  || "—" },
          { label: "Address",      value: profile?.address     || "—" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: darkMode ? "#aaa" : "#888", textTransform: "uppercase", letterSpacing: "1px" }}>{f.label}</label>
            <div style={{ padding: "13px 15px", borderRadius: "12px", background: darkMode ? "#1a1a2e" : "#f5f6fa", border: "1.5px solid var(--border)", fontSize: "14px", marginTop: "6px", color: darkMode ? "#ccc" : "#444" }}>{f.value}</div>
          </div>
        ))}
        <div style={{ background: "#FFF9C4", borderRadius: "12px", padding: "12px 16px", marginTop: "8px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <div style={{ fontSize: "13px", color: "#F57F17", fontWeight: "600", lineHeight: 1.5 }}>
            Profile details can only be changed by school admin. Contact your class teacher for any corrections.
          </div>
        </div>
      </div>
    </div>
  );

  // ── Settings ──
  if (showSettings) return (
    <div style={{ position: "absolute", inset: 0, background: darkMode ? "#1a1a2e" : "#f5f6fa", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowSettings(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Settings</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ background: darkMode ? "#16213e" : "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          {[
            { label: "Push Notifications", sub: "Get alerts for fees, results and notices", value: notifications, setter: setNotifications },
            { label: "Dark Mode",           sub: "Switch to dark theme",                     value: darkMode,       setter: setDarkMode       },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: "16px", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{s.label}</div>
                <div style={{ fontSize: "12px", color: darkMode ? "#aaa" : "#888", marginTop: "2px" }}>{s.sub}</div>
              </div>
              <div onClick={() => s.setter(!s.value)} style={{ width: "46px", height: "26px", borderRadius: "13px", background: s.value ? "#4f46e5" : "#e5e7eb", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: "3px", left: s.value ? "23px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: darkMode ? "#16213e" : "white", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          ))}
          <div style={{ padding: "16px" }}>
            <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>Language</div>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "14px", outline: "none", fontFamily: "Inter, sans-serif" }}>
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>
        <div style={{ background: darkMode ? "#16213e" : "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginTop: "12px" }}>
          <div style={{ fontWeight: "700", fontSize: "13px", color: darkMode ? "#aaa" : "#888", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Account</div>
          {["Change Password", "Privacy Policy", "Terms of Service"].map((item, i, arr) => (
            <div key={item} style={{ padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>{item}</span>
              <span style={{ color: "#ccc" }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── ID Card ──
  if (showIdCard) return (
    <div style={{ position: "absolute", inset: 0, background: darkMode ? "#1a1a2e" : "#f5f6fa", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowIdCard(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Student ID Card</h2>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "320px", background: darkMode ? "#16213e" : "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
          <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "20px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "2px", opacity: .8 }}>
              {profile?.school || "SCHOOL"}
            </div>
            <div style={{ fontSize: "11px", opacity: .7 }}>Student Identity Card 2025-26</div>
          </div>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "28px", fontWeight: "700", color: "white", border: "3px solid #e5e7eb" }}>
              {getInitial()}
            </div>
            <div style={{ fontWeight: "800", fontSize: "18px", color: darkMode ? "#f1f1f1" : "#111" }}>{profile?.name || "—"}</div>
            <div style={{ fontSize: "13px", color: darkMode ? "#bbb" : "#666", marginTop: "4px" }}>
              Class {profile?.class || "—"}-{profile?.section || "—"} • Roll #{profile?.rollNumber || "—"}
            </div>
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: "left" }}>
              {[
                ["Student ID",  profile?._id?.slice(-8).toUpperCase() || "—"],
                ["Email",       profile?.email    || "—"],
                ["Blood Group", profile?.bloodGroup || "—"],
                ["Session",     "2025-26"],
              ].map(([l, v]) => (
                <div key={l} style={{ background: darkMode ? "#1a1a2e" : "#f5f6fa", borderRadius: "10px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: darkMode ? "#aaa" : "#888", fontWeight: "700", textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: darkMode ? "#f1f1f1" : "#111", marginTop: "2px" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: darkMode ? "#1a1a2e" : "#f5f6fa", padding: "12px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: darkMode ? "#aaa" : "#888" }}>If found, please return to school administration</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Help ──
  if (showHelp) return (
    <div style={{ position: "absolute", inset: 0, background: darkMode ? "#1a1a2e" : "#f5f6fa", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowHelp(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Help & Support</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {[
          { q: "How do I pay my fees online?",       a: "Go to Fee Status, tap Pay Now and choose your preferred payment method." },
          { q: "How do I apply for leave?",           a: "Go to Apply Leave, fill in the form and submit. Your parent will be notified." },
          { q: "How do I download notes?",            a: "Go to Notes, tap any note and then tap the download button." },
          { q: "Bus tracker is not working?",         a: "Ensure location permissions are enabled. Try refreshing the page." },
          { q: "How do I change my password?",        a: "Go to Profile, then Settings, then Change Password." },
          { q: "How do I contact my teacher?",        a: "Go to Chat and select your subject teacher to send a message." },
        ].map((faq, i) => (
          <div key={i} style={{ background: darkMode ? "#16213e" : "white", borderRadius: "14px", padding: "16px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: "700", fontSize: "14px", color: darkMode ? "#f1f1f1" : "#111", marginBottom: "6px" }}>❓ {faq.q}</div>
            <div style={{ fontSize: "13px", color: darkMode ? "#bbb" : "#666", lineHeight: 1.6 }}>💡 {faq.a}</div>
          </div>
        ))}
        <div style={{ background: darkMode ? "#16213e" : "white", borderRadius: "14px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Still need help?</div>
          <div style={{ fontSize: "13px", color: darkMode ? "#aaa" : "#888", marginBottom: "12px" }}>Contact school administration</div>
          <button style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
            📞 Call School
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main Profile ──
  const menuItems = [
    { icon: "👤", label: "View Profile",     sub: "Your school information",      action: () => setShowProfile(true)  },
    { icon: "🔔", label: "Notifications",    sub: "View all notifications",       action: () => navigate("/student/notifications") },
    { icon: "⚙️", label: "Settings",         sub: "App preferences",              action: () => setShowSettings(true) },
    { icon: "🪪", label: "Student ID Card",  sub: "View your school ID",          action: () => setShowIdCard(true)   },
    { icon: "🤝", label: "Help & Support",   sub: "FAQs and contact",             action: () => setShowHelp(true)     },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: darkMode ? "#1a1a2e" : "#f5f6fa", fontFamily: "Inter, sans-serif", overflowY: "auto", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 40px", color: "white", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>My Profile</h2>
          <div style={{ width: "36px" }} />
        </div>
        <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700", border: "3px solid rgba(255,255,255,0.5)", margin: "0 auto 12px" }}>
          {getInitial()}
        </div>
        <div style={{ fontWeight: "700", fontSize: "22px" }}>{profile?.name || user?.name || "—"}</div>
        <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>
          Class {profile?.class || "—"}-{profile?.section || "—"} • {profile?.email || "—"}
        </div>
        <div style={{ marginTop: "10px" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>🎒 Student</span>
        </div>
      </div>

      <div style={{ padding: "16px", marginTop: "-20px" }}>
        {/* Stats */}
        <div style={{ background: darkMode ? "#16213e" : "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
            {[
              { label: "ATTENDANCE", value: attendance?.percentage ? `${attendance.percentage}%` : "—" },
              { label: "MARKS",      value: avgMarks ? `${avgMarks}%` : "—" },
              { label: "GRADE",      value: overallGrade || "—" },
              { label: "ROLL",       value: profile?.rollNumber || "—" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontWeight: "700", fontSize: "18px", color: "#4f46e5" }}>{s.value}</div>
                <div style={{ fontSize: "9px", color: darkMode ? "#aaa" : "#888", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ background: darkMode ? "#16213e" : "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          {menuItems.map((item, i) => (
            <div key={item.label} onClick={item.action}
              style={{ padding: "16px", borderBottom: i < menuItems.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f5f6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: darkMode ? "#f1f1f1" : "#111" }}>{item.label}</div>
                <div style={{ fontSize: "12px", color: darkMode ? "#aaa" : "#888", marginTop: "2px" }}>{item.sub}</div>
              </div>
              <div style={{ color: "#ccc", fontSize: "18px" }}>›</div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div onClick={handleLogout} style={{ background: darkMode ? "#16213e" : "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🚪</div>
          <div style={{ flex: 1, fontWeight: "600", fontSize: "14px", color: "#ef4444" }}>Logout</div>
          <div style={{ color: "#ef4444", fontSize: "18px" }}>›</div>
        </div>
      </div>
    </div>
  );
}