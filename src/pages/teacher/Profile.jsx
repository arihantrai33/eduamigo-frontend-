import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { currentAcademicYear } from "../../utils/academicYear";
import SupportContent from "../../components/SupportContent";
import { signOutEverywhere } from "../../utils/account";
import { User, Bell, Settings, IdCard, LifeBuoy, KeyRound, MonitorOff, LogOut } from "lucide-react";
import PortalHeader from "../../components/ui/PortalHeader";
import { ProfileCard, InfoList, MenuList } from "../../components/ui/Profile";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import BottomNav from "../../layout/BottomNav";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
const longDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : null);

// Teacher profile: a profile card, the staff record and a menu (design plan §2.6, B12). Its sub-views (details,
// settings, ID card, help) open in place with a back button.
export default function TeacherProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null); // null | "profile" | "settings" | "idcard" | "help"

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/teachers/me`, authHeader());
      if (res.data.success) setTeacher(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const name = teacher?.name || "Teacher";

  const page = (title, children) => (
    <div className="ea-pd-read" style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)", fontFamily: "inherit", paddingBottom: 80 }}>
      <PortalHeader detail title={title} onBack={() => setView(null)} />
      <div className="ea-pd-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
      <BottomNav role="teacher" />
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)" }}>
      <PortalHeader title="My Profile" onBack={() => navigate(-1)} />
      <Skeleton rows={3} label="Loading" />
    </div>
  );

  if (view === "profile") return page("My Information", <>
    <InfoList title="Staff record" rows={[
      { label: "Full name",     value: teacher?.name },
      { label: "Email",         value: teacher?.email },
      { label: "Employee ID",   value: teacher?.employeeId },
      { label: "Mobile",        value: teacher?.phone },
      { label: "Gender",        value: teacher?.gender },
      { label: "Date of birth", value: longDate(teacher?.dateOfBirth) },
      { label: "Joining date",  value: longDate(teacher?.joiningDate) },
      { label: "Address",       value: teacher?.address },
    ]} />
    <div className="ea-note">Only the school office can change these details.</div>
  </>);

  if (view === "settings") return page("Settings", (
    <MenuList label="Account" items={[
      { icon: <KeyRound size={18} />, label: "Change Password", sub: "Choose a new password", onClick: () => navigate("/change-password") },
    ]} />
  ));

  if (view === "idcard") return page("Teacher ID Card", (
    <div className="ea-card ea-idcard">
      <div className="ea-idcard__head">
        <div className="ea-idcard__school">{user?.branding?.appName || user?.school || "School"}</div>
        <div className="ea-idcard__year">Faculty identity card · {currentAcademicYear()}</div>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <ProfileCard name={name} photo={teacher?.photo} meta={teacher?.subjects?.join(" • ") || null} />
        <dl className="ea-idcard__grid">
          {[
            ["Employee ID", teacher?.employeeId],
            ["Email",       teacher?.email],
            ["Classes",     teacher?.assignedClasses?.join(", ")],
            ["Session",     currentAcademicYear()],
          ].map(([l, v]) => (
            <div key={l}><dt>{l}</dt><dd>{v || "—"}</dd></div>
          ))}
        </dl>
      </div>
      <div className="ea-idcard__foot">If found, please return to the school office.</div>
    </div>
  ));

  if (view === "help") return page("Help & Support", <SupportContent role="teacher" />);

  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)", fontFamily: "inherit", paddingBottom: 80 }}>
      <PortalHeader title="My Profile" onBack={() => navigate(-1)} />
      <div className="ea-pd-body" style={{ padding: 16 }}>
        <div className="ea-profile"><div className="ea-profile__aside">
        <ProfileCard name={name} photo={teacher?.photo} meta={[teacher?.subjects?.join(" • "), teacher?.email].filter(Boolean).join(" • ")} role="Faculty" />
        <StatGrid columns={3} label="My figures">
          <StatCard label="Classes" value={teacher?.assignedClasses?.length || "—"} />
          <StatCard label="Subjects" value={teacher?.subjects?.length || "—"} />
          <StatCard label="Experience" value={teacher?.experience ? `${teacher.experience} yrs` : "—"} />
        </StatGrid>
        </div><div className="ea-profile__main">
        <MenuList label="Profile" items={[
          { icon: <User size={18} />,     label: "View Profile",    sub: "Your school information", onClick: () => setView("profile") },
          { icon: <Bell size={18} />,     label: "Notifications",   sub: "View all notifications",  onClick: () => navigate("/teacher/notifications") },
          { icon: <Settings size={18} />, label: "Settings",        sub: "Password and account",    onClick: () => setView("settings") },
          { icon: <IdCard size={18} />,   label: "Teacher ID Card", sub: "View your faculty ID",    onClick: () => setView("idcard") },
          { icon: <LifeBuoy size={18} />, label: "Help & Support",  sub: "FAQs and contact",        onClick: () => setView("help") },
        ]} />
        <MenuList label="Sign out" items={[
          { icon: <MonitorOff size={18} />, label: "Sign out on all devices", danger: true, onClick: () => signOutEverywhere(logout, navigate) },
          { icon: <LogOut size={18} />,     label: "Log Out", danger: true, onClick: handleLogout },
        ]} />
        </div></div>
      </div>
      <BottomNav role="teacher" />
    </div>
  );
}
