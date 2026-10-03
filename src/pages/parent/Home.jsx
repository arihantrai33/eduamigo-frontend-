import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { visibleFor } from "../../utils/features";
import { userTheme, brandLook } from "../../utils/theme";
import SchoolStrip from "../../components/SchoolStrip";
import axios from "axios";
import { pickChild, childQuery } from "../../utils/selectedChild";
import ChildSwitcher from "../../components/ChildSwitcher";
import UpcomingExams from "../../components/UpcomingExams";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning ☀️";
  if (h < 17) return "Good Afternoon 🌤️";
  return "Good Evening 🌙";
}

export default function ParentHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // School branding, in the same style (light or bold) as the school's sign-in page.
  const theme = userTheme(user);
  const look = brandLook(theme);
  const location = useLocation();
  const [child,      setChild]      = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [results,    setResults]    = useState(null);
  const [notices,    setNotices]    = useState([]);
  const [busInfo,    setBusInfo]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [children,   setChildren]   = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [childRes, noticesRes] = await Promise.allSettled([
        axios.get(`${API}/parents/my-child`, authHeader()),
        axios.get(`${API}/notifications/my`, authHeader()),
      ]);

      if (childRes.status === "fulfilled" && childRes.value.data.success) {
        const kids = childRes.value.data.data.children || [];
        const s = pickChild(kids);
        setChildren(kids);
        setChild(s);

        if (s?._id) {
          const [attRes, resRes, busRes] = await Promise.allSettled([
            axios.get(`${API}/attendance/student/${s._id}/summary`, authHeader()),
            axios.get(`${API}/exams/student/${s._id}/results`,      authHeader()),
            axios.get(`${API}/transport/my-child-bus${childQuery()}`, authHeader()),
          ]);
          if (attRes.status === "fulfilled" && attRes.value.data.success) {
            const summary = attRes.value.data.summary || {};
            // Percentage is only meaningful once at least one school day has been marked.
            setAttendance(summary.total ? { ...summary, percentage: parseFloat(summary.percentage) } : null);
          }
          if (resRes.status === "fulfilled" && resRes.value.data.success)
            setResults(resRes.value.data.data?.[0] ?? null);
          if (busRes.status === "fulfilled" && busRes.value.data.success)
            setBusInfo(busRes.value.data.data);
        }
      }

      if (noticesRes.status === "fulfilled" && noticesRes.value.data.success)
        setNotices(noticesRes.value.data.data?.slice(0, 3) ?? []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tiles = [
    { icon: "💬", label: "Chat Teachers", sub: "Message directly",                                                          path: "/parent/chat"          },
    { icon: "💳", label: "Fee Status",    sub: child?.feeStatus ?? "Check status",                                          path: "/parent/fee"           },
    { icon: "📊", label: "Results",       sub: results ? `${results.examName} • ${results.percentage ?? "—"}%` : "View results", path: "/parent/result"   },
    { icon: "🚌", label: "Track Bus",     sub: busInfo ? `${busInfo.busNumber} • ${busInfo.status ?? "Active"}` : "Not assigned", path: "/parent/bus"     },
    { icon: "✅", label: "Attendance",    sub: attendance ? `${attendance.percentage}% present` : "View attendance", path: "/parent/attendance" },
    { icon: "📅", label: "School Calendar", sub: "Upcoming events",                                                         path: "/parent/calendar"      },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div style={{ background: look.header, padding: "20px 20px 20px", flexShrink: 0 }}>
        <SchoolStrip user={user} theme={theme} look={look} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: look.muted, fontWeight: 700 }}>
              {getGreeting().toUpperCase()} — PARENT PORTAL
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: look.text }}>
              {user?.name ?? "Parent"} 👩‍👧
            </div>
          </div>
          <button
            onClick={() => navigate("/parent/notifications")}
            style={{ width: 38, height: 38, borderRadius: "50%", background: look.glass, border: look.border, cursor: "pointer", fontSize: 16, position: "relative" }}>
            🔔
            {notices.length > 0 && (
              <div style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, background: "#FF5252", borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", padding: "0 4px" }}>{notices.length}</div>
            )}
          </button>
        </div>

        <ChildSwitcher children={children} current={child} theme={theme} onChange={() => { setLoading(true); fetchAll(); }} />

        {/* Child Card */}
        <div style={{ background: look.glass, border: look.border, borderRadius: 16, padding: 16, marginTop: 16, backdropFilter: "blur(10px)" }}>
          <div style={{ fontSize: 11, color: look.muted, marginBottom: 4 }}>Monitoring</div>

          {loading ? (
            <div style={{ fontSize: 16, color: look.muted }}>Loading...</div>
          ) : child ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: look.text }}>{child.name}</div>
                  <div style={{ fontSize: 12, color: look.muted, marginTop: 2 }}>
                    Class {child.class}-{child.section} • Roll #{child.rollNumber}
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: look.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 15 }}>
                  {getInitials(child.name)}
                </div>
              </div>

              {/* Clickable Stats */}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                {[
                  { val: attendance ? `${attendance.percentage}%` : "—", label: "Attendance", path: "/parent/attendance" },
                  { val: results?.percentage    ? `${results.percentage}%`    : "—", label: "Marks",      path: "/parent/result"     },
                  { val: results?.grade         ?? "—",                               label: "Grade",      path: "/parent/result"     },
                  { val: child.feeStatus        ?? "—",                               label: "Fee",        path: "/parent/fee"        },
                ].filter(visibleFor(user)).map((s) => (
                  <div
                    key={s.label}
                    onClick={() => navigate(s.path)}
                    style={{
                      flex: 1, background: look.tile, border: look.border, borderRadius: 12,
                      padding: "10px 6px", textAlign: "center", cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 900, color: look.value }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: look.muted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: look.muted }}>
              No child linked to this account
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

        {/* Quick Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {tiles.filter(visibleFor(user)).map((t) => (
            <button key={t.label} onClick={() => navigate(t.path)}
              style={{ background: "var(--card)", borderRadius: 14, padding: 14, border: "none", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "var(--subtext)", marginTop: 2 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Upcoming Exams for the selected child */}
        {child && <UpcomingExams query={childQuery()} reloadKey={child._id} />}

        {/* Notices */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>🔔 Notices</h3>
          <span onClick={() => navigate("/parent/notifications")}
            style={{ fontSize: 13, color: theme.primary, fontWeight: 700, cursor: "pointer" }}>View all →</span>
        </div>

        <div style={{ background: "var(--card)", borderRadius: 14, padding: "4px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {notices.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: "var(--subtext)", fontSize: 13 }}>
              No notices at the moment
            </div>
          ) : (
            notices.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < notices.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.primary, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--subtext)", marginTop: 2 }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "var(--card)", borderTop: "1px solid var(--border)", display: "flex", padding: "8px 0 16px", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "🏠", label: "Home",     path: "/parent/home",          },
          { icon: "💬", label: "Teachers", path: "/parent/chat"                        },
          { icon: "💳", label: "Fees",     path: "/parent/fee"                         },
          { icon: "🔔", label: "Alerts",   path: "/parent/notifications"               },
          { icon: "👤", label: "Me",       path: "/parent/profile"                     },
        ].filter(visibleFor(user)).map((tab) => (
          <button key={tab.label} onClick={() => navigate(tab.path)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: location.pathname === tab.path ? theme.primary : "#999" }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: location.pathname === tab.path ? 700 : 500 }}>{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}