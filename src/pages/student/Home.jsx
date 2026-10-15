import { useState, useEffect } from "react";
import UpcomingExams from "../../components/UpcomingExams";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { visibleFor } from "../../utils/features";
import { userTheme, brandLook } from "../../utils/theme";
import SchoolStrip from "../../components/SchoolStrip";
import axios from "axios";
import Glyph from "../../components/Glyph";
import HeroStat from "../../components/HeroStat";
import BottomNav from "../../layout/BottomNav";
import { plural } from "../../utils/plural";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function getGreeting() {
const h = new Date().getHours();
if (h < 12) return "Good Morning";
if (h < 17) return "Good Afternoon";
return "Good Evening";
}
function getInitials(name = "") {
return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
export default function StudentHome() {
const navigate = useNavigate();
const { user } = useAuth();
// School branding, in the same style (light or bold) as the school's sign-in page.
const theme = userTheme(user);
const look = brandLook(theme);
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
      // Sunday has no classes; other days use the same full day names as the timetable.
      if (jsDay !== 0) {
        try {
          const ttRes = await axios.get(`${API}/timetable/my?day=${FULL_DAYS[jsDay - 1]}`, authHeader());
          if (ttRes.data.success) setTimetable(ttRes.data.data || []);
        } catch { /* the section shows its empty state */ }
      }
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
icon: <Glyph e="🚌" />, label: "Live Bus",
sub: profile?.bus ? "Track your bus" : "Not assigned",
path: "/student/bus",
    },
    {
icon: <Glyph e="📅" />, label: "Timetable",
sub: timetable.length ? `${plural(timetable.length, "class", "classes")} today` : "View schedule",
path: "/student/timetable",
    },
    {
icon: <Glyph e="📊" />, label: "Results",
sub: results ? `${results.subject} • ${results.percentage ?? "—"}%` : "View results",
path: "/student/result",
    },
    {
icon: <Glyph e="📚" />, label: "Notes",
sub: "Study material",
path: "/student/notes",
    },
    {
icon: <Glyph e="💳" />, label: "Fee Status",
sub: feeStatus ?? "Check status",
path: "/student/fee",
    },
    {
icon: <Glyph e="🗓" />, label: "Apply Leave",
sub: "Request leave",
path: "/student/apply-leave",
    },
  ];
if (loading) {
return (
<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
<div style={{ fontSize: 14, color: "var(--subtext)" }}>Loading...</div>
</div>
    );
  }
return (
<div className="ea-home" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", fontFamily: "inherit" }}>
{/* ── Header ── */}
<div className="ea-pd-band" style={{ background: look.header, padding: "20px 20px 20px", flexShrink: 0 }}>
<SchoolStrip user={user} theme={theme} look={look} />
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
<div>
<div style={{ fontSize: 12, color: look.muted, fontWeight: 600, marginBottom: 2 }}>
{getGreeting()}
</div>
<div style={{ fontSize: 20, fontWeight: 800, color: look.text }}>
{profile?.name ?? user?.name ?? "Student"}
</div>
</div>
<div style={{ display: "flex", gap: 8 }}>
<button type="button" aria-label={notices.length > 0 ? `Notifications, ${notices.length} new` : "Notifications"}
onClick={() => navigate("/student/notifications")}
style={{ width: 38, height: 38, borderRadius: "50%", background: look.glass, border: look.border, cursor: "pointer", fontSize: 16, position: "relative" }}>
              <Glyph e="🔔" />
{notices.length > 0 && (
<div style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, background: "#FF5252", borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", padding: "0 4px" }}>{notices.length}</div>
              )}
</button>
<div style={{ width: 38, height: 38, borderRadius: "50%", background: look.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 13, overflow: "hidden" }}>
{profile?.photo ? (
<img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
) : (
getInitials(profile?.name ?? user?.name)
)}
</div>
</div>
</div>
{/* Student ID Card */}
<div className="ea-pd-idcard" style={{ background: look.glass, border: look.border, borderRadius: 16, padding: 14, backdropFilter: "blur(10px)" }}>
{/* The name and photo are in the header above; the card carries the school record. */}
<div style={{ fontSize: 13, color: look.text, fontWeight: 600 }}>
                Class {profile?.class ?? "—"}-{profile?.section ?? "—"} • Roll #{profile?.rollNumber ?? "—"}
{profile?.admissionNo ? ` • Admission No ${profile.admissionNo}` : ""}
</div>
{/* Stats Row */}
<div className="ea-pd-idstats" style={{ display: "flex", gap: 8, marginTop: 12 }}>
{[
              { val: attendancePct,    label: "Attendance", path: "/student/attendance" },
              { val: grade,            label: "Grade",      path: null, feature: "exams" },
              { val: marks,            label: "Marks",      path: null, feature: "exams" },
              { val: feeStatus ?? "—", label: "Fee",        path: "/student/fee" },
            ].filter(visibleFor(user)).map((stat) => (
<HeroStat key={stat.label} value={stat.val} label={stat.label} look={look} onClick={stat.path ? () => navigate(stat.path) : undefined} />
            ))}
</div>
</div>
</div>
{/* ── Body ── */}
<div className="ea-home__body ea-pd-body ea-pd-dash" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>
{/* Quick Tiles */}
<div className="ea-tile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
{quickTiles.filter(visibleFor(user)).map((tile) => (
<button key={tile.label} onClick={() => navigate(tile.path)}
style={{ background: "var(--card)", borderRadius: 14, padding: 14, border: "none", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
<div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--brand-soft)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 10 }}>{tile.icon}</div>
<div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{tile.label}</div>
<div style={{ fontSize: 11, color: "var(--subtext)", marginTop: 2 }}>{tile.sub}</div>
</button>
          ))}
</div>
{/* Today's Classes (desktop: the main column) */}
<section className="ea-pd-main">
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
<h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Today's Classes</h3>
<span style={{ fontSize: 13, color: theme.primary, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/student/timetable")}>
            View all →
</span>
</div>
<div style={{ background: "var(--card)", borderRadius: 14, padding: "4px 12px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
{timetable.length === 0 ? (
<div style={{ padding: "16px 0", textAlign: "center", color: "var(--subtext)", fontSize: 13 }}>
              No classes scheduled for today
</div>
          ) : (
timetable.slice(0, 4).map((c, i) => (
<div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 3 ? "1px solid var(--ea-line)" : "none" }}>
<div style={{ minWidth: 44, background: "var(--bg)", borderRadius: 8, padding: 4, textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--subtext)" }}>
{c.time ?? "—"}
</div>
<div style={{ flex: 1 }}>
<div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{c.subject}</div>
<div style={{ fontSize: 11, color: "var(--subtext)" }}>{c.teacher?.name ?? c.teacherName ?? "—"}{c.room ? ` • ${c.room}` : ""}</div>
</div>
</div>
            ))
          )}
</div>
</section>
{/* Upcoming Exams and Notices (desktop: the side column) */}
<section className="ea-pd-side">
<UpcomingExams />
</section>
<section className="ea-pd-side">
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
<h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Notices</h3>
<span style={{ fontSize: 13, color: theme.primary, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/student/notifications")}>
            View all →
</span>
</div>
<div style={{ background: "var(--card)", borderRadius: 14, padding: "4px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
{notices.length === 0 ? (
<div style={{ padding: "16px 0", textAlign: "center", color: "var(--subtext)", fontSize: 13 }}>
              No notices at the moment
</div>
          ) : (
notices.map((n, i) => (
<div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < notices.length - 1 ? "1px solid var(--ea-line)" : "none" }}>
<div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", marginTop: 5, flexShrink: 0 }} />
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
</section>
</div>
<BottomNav role="student" />
</div>
  );
}