import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showEdit, setShowEdit]         = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp]         = useState(false);
  const [showIdCard, setShowIdCard]     = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode]         = useState(false);
  const [language, setLanguage]         = useState("English");

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── View Profile (Read Only) ──
  if (showEdit) return (
    <div style={{ position: "absolute", inset: 0, background: "#f5f6fa", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowEdit(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>👤 My Information</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>

        {/* Avatar — no upload */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "32px", fontWeight: "700", color: "white", border: "3px solid #e5e7eb" }}>
            {(user?.name || "S")[0].toUpperCase()}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>Profile photo is managed by school admin</div>
        </div>

        {/* All fields read-only */}
        {[
          { label: "Full Name",    value: user?.name   || "Rahul Kumar"  },
          { label: "Phone Number", value: user?.phone  || "Not updated"  },
          { label: "Class",        value: user?.class  || "X-A"          },
          { label: "Roll Number",  value: user?.roll   || "14"           },
          { label: "School",       value: user?.school || "DPS Noida"    },
          { label: "Student ID",   value: user?.id     || "STU2024001"   },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>{f.label}</label>
            <div style={{ padding: "13px 15px", borderRadius: "12px", background: "#f5f6fa", border: "1.5px solid #e5e7eb", fontSize: "14px", marginTop: "6px", color: "#444" }}>{f.value}</div>
          </div>
        ))}

        {/* Info note */}
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
    <div style={{ position: "absolute", inset: 0, background: "#f5f6fa", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowSettings(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>⚙️ Settings</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          {[
            { label: "Push Notifications", sub: "Get alerts for fees, results, notices", value: notifications, setter: setNotifications },
            { label: "Dark Mode",           sub: "Switch to dark theme",                  value: darkMode,       setter: setDarkMode       },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: "16px", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{s.label}</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{s.sub}</div>
              </div>
              <div onClick={() => s.setter(!s.value)} style={{ width: "46px", height: "26px", borderRadius: "13px", background: s.value ? "#4f46e5" : "#e5e7eb", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: "3px", left: s.value ? "23px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "white", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          ))}
          <div style={{ padding: "16px" }}>
            <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>Language</div>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none", fontFamily: "sans-serif" }}>
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginTop: "12px" }}>
          <div style={{ fontWeight: "700", fontSize: "13px", color: "#888", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Account</div>
          {["Change Password", "Privacy Policy", "Terms of Service"].map((item, i, arr) => (
            <div key={item} onClick={() => alert(`Opening ${item}...`)}
              style={{ padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
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
    <div style={{ position: "absolute", inset: 0, background: "#f5f6fa", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowIdCard(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🪪 Student ID Card</h2>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "320px", background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
          <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "20px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "2px", opacity: .8 }}>DPS NOIDA</div>
            <div style={{ fontSize: "11px", opacity: .7 }}>Student Identity Card 2025-26</div>
          </div>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "28px", fontWeight: "700", color: "white", border: "3px solid #e5e7eb" }}>
              {(user?.name || "S")[0].toUpperCase()}
            </div>
            <div style={{ fontWeight: "800", fontSize: "18px", color: "#111" }}>{user?.name || "Rahul Kumar"}</div>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>Class {user?.class || "X-A"} • Roll #{user?.roll || "14"}</div>
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: "left" }}>
              {[
                ["Student ID",  user?.id     || "STU2024001" ],
                ["Bus Route",   "Bus #42 • Sector 62"        ],
                ["Blood Group", "B+"                         ],
                ["Session",     "2025-26"                    ],
              ].map(([l, v]) => (
                <div key={l} style={{ background: "#f5f6fa", borderRadius: "10px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#111", marginTop: "2px" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#f5f6fa", padding: "12px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888" }}>If found, please return to DPS Noida</div>
            <div style={{ fontSize: "11px", color: "#888" }}>📞 0120-XXXXXXX</div>
          </div>
        </div>
        <button onClick={() => alert("📥 ID Card saved to gallery!")}
          style={{ marginTop: "20px", width: "100%", maxWidth: "320px", padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
          📥 Download ID Card
        </button>
      </div>
    </div>
  );

  // ── Help ──
  if (showHelp) return (
    <div style={{ position: "absolute", inset: 0, background: "#f5f6fa", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setShowHelp(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🤝 Help & Support</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {[
          { q: "How to pay fee online?",        a: "Go to Fee Status → tap Pay Now → choose UPI/Net Banking."             },
          { q: "How to apply for leave?",        a: "Go to Apply Leave → fill form → submit. Parent gets notified."        },
          { q: "How to download notes?",         a: "Go to Notes → tap any note → tap download button."                    },
          { q: "Bus tracker not working?",       a: "Make sure location is on. Try refreshing the page."                   },
          { q: "How to change password?",        a: "Go to Profile → Settings → Change Password."                          },
          { q: "How to contact my teacher?",     a: "Go to Chat → select subject teacher → send message."                  },
        ].map((faq, i) => (
          <div key={i} style={{ background: "white", borderRadius: "14px", padding: "16px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: "700", fontSize: "14px", color: "#111", marginBottom: "6px" }}>❓ {faq.q}</div>
            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.6 }}>💡 {faq.a}</div>
          </div>
        ))}
        <div style={{ background: "white", borderRadius: "14px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Still need help?</div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>Contact school administration</div>
          <button onClick={() => alert("📞 Calling school support...")}
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
            📞 Call School
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main Profile ──
  const menuItems = [
    { icon: "👤", label: "View Profile",    sub: "Your school information",   action: () => setShowEdit(true)     },
    { icon: "🔔", label: "Notifications",   sub: "3 unread alerts",           action: () => navigate("/student/notifications") },
    { icon: "⚙️", label: "Settings",        sub: "App preferences",           action: () => setShowSettings(true) },
    { icon: "🪪", label: "Download ID Card",sub: "Get your school ID",        action: () => setShowIdCard(true)   },
    { icon: "🤝", label: "Help & Support",  sub: "FAQs and contact us",       action: () => setShowHelp(true)     },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "#f5f6fa", fontFamily: "sans-serif", overflowY: "auto", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 40px", color: "white", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>My Profile</h2>
          <div style={{ width: "36px" }} />
        </div>
        <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700", border: "3px solid rgba(255,255,255,0.5)", margin: "0 auto 12px" }}>
          {(user?.name || "S")[0].toUpperCase()}
        </div>
        <div style={{ fontWeight: "700", fontSize: "22px" }}>{user?.name}</div>
        <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>
          {user?.class} • {user?.school || "DPS Noida"}
        </div>
        <div style={{ marginTop: "10px" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>🎒 Student</span>
        </div>
      </div>

      <div style={{ padding: "16px", marginTop: "-20px" }}>
        {/* Stats */}
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
            {[
              { label: "ATTEND", value: "87%"  },
              { label: "MARKS%", value: "87.4" },
              { label: "RANK",   value: "4th"  },
              { label: "GRADE",  value: "A+"   },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontWeight: "700", fontSize: "20px", color: "#4f46e5" }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          {menuItems.map((item, i) => (
            <div key={item.label} onClick={item.action}
              style={{ padding: "16px", borderBottom: i < menuItems.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f5f6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#111" }}>{item.label}</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{item.sub}</div>
              </div>
              <div style={{ color: "#ccc", fontSize: "18px" }}>›</div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div onClick={handleLogout} style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🚪</div>
          <div style={{ flex: 1, fontWeight: "600", fontSize: "14px", color: "#ef4444" }}>Logout</div>
          <div style={{ color: "#ef4444", fontSize: "18px" }}>›</div>
        </div>
      </div>
    </div>
  );
}