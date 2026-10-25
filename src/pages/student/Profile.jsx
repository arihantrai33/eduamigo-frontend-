import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
import { currentAcademicYear } from "../../utils/academicYear";
import SupportContent from "../../components/SupportContent";
import { signOutEverywhere } from "../../utils/account";
import { User, Bell, Settings, IdCard, LifeBuoy, Moon, KeyRound, MonitorOff, LogOut } from "lucide-react";
import PortalHeader from "../../components/ui/PortalHeader";
import { ProfileCard, InfoList, MenuList } from "../../components/ui/Profile";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import BottomNav from "../../layout/BottomNav";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Student profile: a profile card, the school record and a menu (design plan §2.6, B12). Its sub-views (details,
// settings, ID card, help) open in place with a back button.
export default function Profile() {
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();

  const [profile,      setProfile]      = useState(null);
  const [attendance,   setAttendance]   = useState(null);
  const [avgMarks,     setAvgMarks]     = useState(null);
  const [overallGrade, setOverallGrade] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [view,         setView]         = useState(null); // null | "profile" | "settings" | "idcard" | "help"

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
  const name = profile?.name || user?.name || "Student";
  const classText = profile?.class ? `Class ${profile.class}-${profile.section}` : null;

  const page = (title, children) => (
    <div className="ea-pd-read" style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)", fontFamily: "inherit", paddingBottom: 80 }}>
      <PortalHeader detail title={title} onBack={() => setView(null)} />
      <div className="ea-pd-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
      <BottomNav role="student" />
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)" }}>
      <PortalHeader title="My Profile" onBack={() => navigate(-1)} />
      <Skeleton rows={3} label="Loading" />
    </div>
  );

  if (view === "profile") return page("My Information", <>
    <InfoList title="School record" rows={[
      { label: "Full name",   value: profile?.name },
      { label: "Email",       value: profile?.email },
      { label: "Class",       value: profile?.class ? `${profile.class}-${profile.section}` : null },
      { label: "Roll number", value: profile?.rollNumber },
      { label: "Phone",       value: profile?.phone },
      { label: "Parent name", value: profile?.parentName },
      { label: "Address",     value: profile?.address },
    ]} />
    <div className="ea-note">Only the school office can change these details. Ask your class teacher if something is wrong.</div>
  </>);

  if (view === "settings") return page("Settings", <>
    <MenuList label="Appearance" items={[
      { icon: <Moon size={18} />, label: "Dark mode", sub: "Switch to the dark theme", pressed: !!darkMode, onClick: () => setDarkMode(!darkMode),
        right: <span className={`ea-switch${darkMode ? " is-on" : ""}`} aria-hidden="true" /> },
    ]} />
    <MenuList label="Account" items={[
      { icon: <KeyRound size={18} />, label: "Change Password", sub: "Choose a new password", onClick: () => navigate("/change-password") },
    ]} />
  </>);

  if (view === "idcard") return page("Student ID Card", (
    <div className="ea-card ea-idcard">
      <div className="ea-idcard__head">
        <div className="ea-idcard__school">{user?.branding?.appName || user?.school || profile?.school || "School"}</div>
        <div className="ea-idcard__year">Student identity card · {currentAcademicYear()}</div>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <ProfileCard name={name} photo={profile?.photo} meta={`${classText || "Class —"} • Roll #${profile?.rollNumber || "—"}`} />
        <dl className="ea-idcard__grid">
          {[
            ["Student ID",  profile?._id?.slice(-8).toUpperCase()],
            ["Email",       profile?.email],
            ["Blood group", profile?.bloodGroup],
            ["Session",     currentAcademicYear()],
          ].map(([l, v]) => (
            <div key={l}><dt>{l}</dt><dd>{v || "—"}</dd></div>
          ))}
        </dl>
      </div>
      <div className="ea-idcard__foot">If found, please return to the school office.</div>
    </div>
  ));

  if (view === "help") return page("Help & Support", <SupportContent role="student" dark={darkMode} />);

  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)", fontFamily: "inherit", paddingBottom: 80 }}>
      <PortalHeader title="My Profile" onBack={() => navigate(-1)} />
      <div className="ea-pd-body" style={{ padding: 16 }}>
        <div className="ea-profile"><div className="ea-profile__aside">
        <ProfileCard name={name} photo={profile?.photo} editablePhoto meta={[classText, profile?.email].filter(Boolean).join(" • ")} role="Student" />
        <StatGrid label="My figures">
          <StatCard label="Attendance" value={attendance?.percentage ? `${attendance.percentage}%` : "—"} />
          <StatCard label="Marks" value={avgMarks ? `${avgMarks}%` : "—"} />
          <StatCard label="Grade" value={overallGrade || "—"} />
          <StatCard label="Roll" value={profile?.rollNumber || "—"} />
        </StatGrid>
        </div><div className="ea-profile__main">
        <MenuList label="Profile" items={[
          { icon: <User size={18} />,     label: "View Profile",    sub: "Your school information", onClick: () => setView("profile") },
          { icon: <Bell size={18} />,     label: "Notifications",   sub: "View all notifications",  onClick: () => navigate("/student/notifications") },
          { icon: <Settings size={18} />, label: "Settings",        sub: "App preferences",         onClick: () => setView("settings") },
          { icon: <IdCard size={18} />,   label: "Student ID Card", sub: "View your school ID",     onClick: () => setView("idcard") },
          { icon: <LifeBuoy size={18} />, label: "Help & Support",  sub: "FAQs and contact",        onClick: () => setView("help") },
        ]} />
        <MenuList label="Sign out" items={[
          { icon: <MonitorOff size={18} />, label: "Sign out on all devices", danger: true, onClick: () => signOutEverywhere(logout, navigate) },
          { icon: <LogOut size={18} />,     label: "Logout", danger: true, onClick: handleLogout },
        ]} />
        </div></div>
      </div>
      <BottomNav role="student" />
    </div>
  );
}
