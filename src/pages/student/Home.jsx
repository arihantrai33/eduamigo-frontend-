import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function getGreeting() {
const h = new Date().getHours();
if (h < 12) return "Good Morning ☀️";
if (h < 17) return "Good Afternoon 🌤️";
return "Good Evening 🌙";
}
function getInitials(name = "") {
return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
export default function StudentHome() {
const navigate = useNavigate();
const { user } = useAuth();
const [profile,      setProfile]      = useState(null);
const [attendance,   setAttendance]   = useState(null);
const [results,      setResults]      = useState(null);
const [avgMarks,     setAvgMarks]     = useState(null);
const [overallGrade, setOverallGrade] = useState(null);
const [timetable,    setTimetable]    = useState([]);
const [notices,      setNotices]      = useState([]);
const [feeStatus,    setFeeStatus]    = useState(null);
const [loading,      setLoading]      = useState(true);
useEffect(() => { fetchAll(); }, []);
const fetchAll = async () => {
try {
const [profileRes, attendanceRes, noticesRes] = await Promise.allSettled([
axios.get(`${API}/students/my-profile`,   authHeader()),
axios.get(`${API}/attendance/my-summary`, authHeader()),
axios.get(`${API}/notifications/my`,      authHeader()),
      ]);
if (profileRes.status === "fulfilled" && profileRes.value.data.success) {
const s = profileRes.value.data.data;
setProfile(s);
setFeeStatus(s.feeStatus);
      }
if (attendanceRes.status === "fulfilled" && attendanceRes.value.data.success) {
setAttendance(attendanceRes.value.data.data);
      }
if (noticesRes.status === "fulfilled" && noticesRes.value.data.success) {
setNotices(noticesRes.value.data.data?.slice(0, 3) || []);
      }
const jsDay = new Date().getDay();
      const today = jsDay === 0 ? "Mon" : days[jsDay - 1] ?? "Mon";
try {
const ttRes = await axios.get(`${API}/timetable/my?day=${today}`, authHeader());
if (ttRes.data.success) setTimetable(ttRes.data.data || []);
      } catch (_) {}
try {
const resRes = await axios.get(`${API}/exams/my-results`, authHeader());
if (resRes.data.success) {
setResults(resRes.data.data?.[0] || null);
setAvgMarks(resRes.data.averagePercentage);
setOverallGrade(resRes.data.overallGrade);
        }
      } catch (_) {}
    } catch (err) {
console.error(err);
    } finally {
setLoading(false);
    }
  };
const attendancePct = attendance?.percentage ? `${attendance.percentage}%` : "—";
const grade         = overallGrade ?? "—";
const marks         = avgMarks     ? `${avgMarks}%` : "—";
const quickTiles = [
    {
icon: "🚌", label: "Live Bus",
sub: profile?.bus ? "Track your bus" : "Not assigned",
path: "/student/bus",
    },
    {
icon: "📅", label: "Timetable",
sub: timetable.length ? `${timetable.length} classes today` : "View schedule",
path: "/student/timetable",
    },
    {
icon: "📊", label: "Results",
sub: results ? `${results.subject} • ${results.percentage ?? "—"}%` : "View results",
path: "/student/result",
    },
    {
icon: "📚", label: "Notes",
sub: "Study material",
path: "/student/notes",
    },
    {
icon: "💳", label: "Fee Status",
sub: feeStatus ?? "Check status",
path: "/student/fee",
    },
    {
icon: "🗓️", label: "Apply Leave",
sub: "Request leave",
path: "/student/apply-leave",
    },
  ];
if (loading) {
return (
<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6fa" }}>
<div style={{ fontSize: 14, color: "#888" }}>Loading...</div>
</div>
    );
  }
return (
<div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "Inter, sans-serif" }}>
{/* ── Header ── */}
<div style={{ background: "linear-gradient(135deg, #1a73e8 0%, #6c63ff 100%)", padding: "48px 20px 20px", flexShrink: 0 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
<div>
<div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, marginBottom: 2 }}>
{getGreeting().toUpperCase()}
</div>
<div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
{profile?.name ?? user?.name ?? "Student"}
</div>
</div>
<div style={{ display: "flex", gap: 8 }}>
<button
onClick={() => navigate("/student/notifications")}
style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", fontSize: 16, position: "relative" }}>
              🔔
{notices.length > 0 && (
<div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#FF5252", borderRadius: "50%", border: "2px solid white" }} />
              )}
</button>
<div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 13 }}>
{getInitials(profile?.name ?? user?.name)}
</div>
</div>
</div>
{/* Student ID Card */}
<div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 16, backdropFilter: "blur(10px)" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<div>
<div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>STUDENT ID</div>
<div style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "2px 0" }}>
{profile?.name ?? "—"}
</div>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Class {profile?.class ?? "—"}-{profile?.section ?? "—"} • Roll #{profile?.rollNumber ?? "—"}
</div>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
{profile?.email ?? "—"}
</div>
</div>
<div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16 }}>
{getInitials(profile?.name ?? user?.name)}
</div>
</div>
{/* Stats Row */}
<div style={{ display: "flex", gap: 8, marginTop: 14 }}>
{[
              { val: attendancePct,    label: "Attendance", path: "/student/attendance" },
              { val: grade,            label: "Grade",      path: null },
              { val: marks,            label: "Marks",      path: null },
              { val: feeStatus ?? "—", label: "Fee",        path: "/student/fee" },
            ].map((stat) => (
<div key={stat.label}
onClick={() => stat.path && navigate(stat.path)}
style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 4px", textAlign: "center", cursor: stat.path ? "pointer" : "default" }}>
<div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{stat.val}</div>
<div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase" }}>{stat.label}</div>
</div>
            ))}
</div>
</div>
</div>
{/* ── Body ── */}
<div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>
{/* Quick Tiles */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
{quickTiles.map((tile) => (
<button key={tile.label} onClick={() => navigate(tile.path)}
style={{ background: "white", borderRadius: 14, padding: 14, border: "none", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
<div style={{ fontSize: 24, marginBottom: 6 }}>{tile.icon}</div>
<div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{tile.label}</div>
<div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{tile.sub}</div>
</button>
          ))}
</div>
{/* Today's Classes */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
<h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>Today's Classes</h3>
<span style={{ fontSize: 13, color: "#1a73e8", cursor: "pointer" }} onClick={() => navigate("/student/timetable")}>
            View all →
</span>
</div>
<div style={{ background: "white", borderRadius: 14, padding: "4px 12px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
{timetable.length === 0 ? (
<div style={{ padding: "16px 0", textAlign: "center", color: "#888", fontSize: 13 }}>
              No classes scheduled for today
</div>
          ) : (
timetable.slice(0, 4).map((c, i) => (
<div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
<div style={{ minWidth: 44, background: "#f5f6fa", borderRadius: 8, padding: 4, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#888" }}>
{c.time ?? "—"}
</div>
<div style={{ flex: 1 }}>
<div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{c.subject}</div>
<div style={{ fontSize: 11, color: "#888" }}>{c.teacher?.name ?? c.teacherName ?? "—"}{c.room ? ` • ${c.room}` : ""}</div>
</div>
</div>
            ))
          )}
</div>
{/* Notices */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
<h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>Notices</h3>
<span style={{ fontSize: 13, color: "#1a73e8", cursor: "pointer" }} onClick={() => navigate("/student/notifications")}>
            View all →
</span>
</div>
<div style={{ background: "white", borderRadius: 14, padding: "4px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
{notices.length === 0 ? (
<div style={{ padding: "16px 0", textAlign: "center", color: "#888", fontSize: 13 }}>
              No notices at the moment
</div>
          ) : (
notices.map((n, i) => (
<div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < notices.length - 1 ? "1px solid #f0f0f0" : "none" }}>
<div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5C6BC0", marginTop: 5, flexShrink: 0 }} />
<div>
<div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{n.title}</div>
<div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
{n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
</div>
</div>
</div>
            ))
          )}
</div>
</div>
{/* ── Bottom Nav ── */}
<div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderTop: `1px solid ${"#f0f0f0"}`, display: "flex", padding: "8px 0 16px", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
{[
          { icon: "🏠", label: "Home",  path: "/student/home",  active: true },
          { icon: "🚌", label: "Bus",   path: "/student/bus" },
          { icon: "📚", label: "Learn", path: "/student/notes" },
          { icon: "💬", label: "Chat",  path: "/student/chat" },
          { icon: "👤", label: "Me",    path: "/student/profile" },
        ].map((tab) => (
<button key={tab.label} onClick={() => navigate(tab.path)}
style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: tab.active ? "#1a73e8" : "#999" }}>
<span style={{ fontSize: 22 }}>{tab.icon}</span>
<span style={{ fontSize: 10, fontWeight: tab.active ? 700 : 500 }}>{tab.label}</span>
</button>
        ))}
</div>
</div>
  );
}