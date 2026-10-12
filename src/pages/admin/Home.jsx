import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Users, School, UserCircle, Bus,
  CalendarCheck, CreditCard, FileBadge, Clock, Notebook, BadgeDollarSign, Layers,
  Bell, MessageCircle, BarChart2, Settings as SettingsIcon, Menu, X,
  BookOpen, LogOut, TrendingUp,
  Shield, FileText, GraduationCap, History, CalendarRange,
  MessageSquareText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Dashboard from "./Dashboard";
import { can, ROLE_LABELS } from "../../utils/permissions";
import SubscriptionBanner from "../../components/SubscriptionBanner";
import { userTheme } from "../../utils/theme";

// Sidebar colours from the school theme: white with a brand-colour active item for light schools,
// a deep brand-colour sidebar for bold ones.
function sidebarLook(theme) {
  if (theme.isLight) {
    return { bg: "#FFFFFF", edge: "1px solid #EEF0F4", text: "#0F172A", muted: "#64748B", faint: "#94A3B8", divider: "#F1F5F9",
      hoverBg: theme.soft, hoverText: theme.deep, activeBg: theme.button, activeText: "#fff", activeShadow: `0 4px 12px ${theme.glow}`, card: theme.mist };
  }
  return { bg: `linear-gradient(180deg, ${theme.deep} 0%, ${theme.dark} 100%)`, edge: "none", text: "#fff", muted: "rgba(255,255,255,0.55)", faint: "rgba(255,255,255,0.32)", divider: "rgba(255,255,255,0.08)",
    hoverBg: "rgba(255,255,255,0.08)", hoverText: "rgba(255,255,255,0.9)", activeBg: "rgba(255,255,255,0.16)", activeText: "#fff", activeShadow: `inset 3px 0 0 ${theme.accent}`, card: "rgba(255,255,255,0.06)" };
}
import Students from "./Students";
import AddStudent from "./AddStudent";
import AddParent from "./AddParent";
import Teachers from "./Teachers";
import AddTeacher from "./AddTeacher";
import AttendanceReport from "./AttendanceReport";
import Chat from "./Chat";
import ExamSchedule from "./ExamSchedule";
import FeeCollection from "./FeeCollection";
import FeeReports from "./FeeReports";
import FeeStructure from "./FeeStructure";
import LeaveRequests from "./LeaveRequests";
import Library from "./Library";
import Communications from "./Communications";
import Reports from "./Reports";
import Results from "./Results";
import SalaryManagement from "./SalaryManagement";
import Settings from "./Settings";
import AcademicSetup from "./AcademicSetup";
import ActivityLog from "./ActivityLog";
import YearEnd from "./YearEnd";
import TransferCertificate from "./TransferCertificate";
import StudentProfile from "./StudentProfile";
import TeacherProfile from "./TeacherProfile";
import Timetable from "./Timetable";
import Transport from "./Transport";
import UserManagement from "./UserManagement";
import ParentsList from "./ParentsList";
import EventCalendar from "./EventCalendar";
import IDCardGenerator from "./IDCardGenerator";
import BulkOperations from "./BulkOperations";
import HRManagement from "./HRManagement";
import Admissions from "./Admissions";
import AskInsights from "./AskInsights";

// Shown when a staff member opens a screen their role does not include.
function Gate({ user, perm, children }) {
  if (can(user, perm)) return children;
  return (
    <div style={{ padding: 48, textAlign: "center", fontFamily: "inherit" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>No access</div>
      <div style={{ fontSize: 13, color: "#64748B", marginTop: 6 }}>Your role does not include this section. Ask your school administrator if you need it.</div>
    </div>
  );
}

// First menu entry the user is allowed to open (used as the landing page for limited roles).
function firstAllowedPath(user) {
  if (can(user, "fees.collect")) return "/admin/fees";
  const item = NAV.find((n) => n.path && can(user, n.perm));
  return item ? item.path : "/admin/fees";
}

const NAV = [
  { label: "Dashboard",          icon: LayoutDashboard, path: "/admin", perm: "attendance.reports" },

  { section: "ACADEMIC MANAGEMENT" },
  { label: "School Setup",       icon: GraduationCap,   path: "/admin/academic", perm: "academics.manage" },
  { label: "Year End & TC",      icon: CalendarRange,   path: "/admin/year-end", perm: "academics.manage" },
  { label: "Admissions",         icon: FileText,        path: "/admin/admissions", perm: "admissions.manage" },
  { label: "All Students",       icon: Users,           path: "/admin/students", perm: "students.read" },
  { label: "All Teachers",       icon: School,          path: "/admin/teachers", perm: "teachers.manage" },
  { label: "Timetable",          icon: Clock,           path: "/admin/timetable", perm: "timetable.manage" },
  { label: "Exam Schedule",      icon: BookOpen,        path: "/admin/exams", perm: "exams.manage" },
  { label: "Results",            icon: FileBadge,       path: "/admin/results", perm: "results.read" },
  { label: "Attendance Reports", icon: CalendarCheck,   path: "/admin/attendance-reports", perm: "attendance.reports" },


  { section: "FINANCE" },
  { label: "Fee Structure",      icon: Layers,          path: "/admin/fee-structure", perm: "fees.structure" },
  { label: "Fee Collection",     icon: BadgeDollarSign, path: "/admin/fees", perm: "fees.collect" },
  { label: "Fee Reports",        icon: TrendingUp,      path: "/admin/fee-reports", perm: "fees.read" },

  { section: "HR & STAFF" },
  { label: "Leave Management",   icon: Notebook,        path: "/admin/leaves", perm: "leaves.all" },
  { label: "HR & Payroll",       icon: BadgeDollarSign, path: "/admin/hr-management", perm: "hr.manage" },

  { section: "PARENTS" },
  { label: "All Parents",        icon: UserCircle,      path: "/admin/parents", perm: "parents.read" },

  { section: "COMMUNICATION" },
  { label: "Communications",     icon: Bell,            path: "/admin/communications", perm: "communication.manage" },
  { label: "Chat",               icon: MessageCircle,   path: "/admin/chat", perm: "chat.directory" },
  { label: "Event Calendar",     icon: CalendarCheck,   path: "/admin/event-calendar", perm: "communication.manage" },

  { section: "OPERATIONS" },
  { label: "Library",            icon: BookOpen,        path: "/admin/library", perm: "library.manage" },
  { label: "Transport",          icon: Bus,             path: "/admin/transport", perm: "transport.manage" },
  { label: "ID Card Generator",  icon: CreditCard,      path: "/admin/id-card-generator", perm: "students.manage" },
  { label: "Bulk Operations",    icon: Layers,          path: "/admin/bulk-operations", perm: "bulk.manage" },

  { section: "SYSTEM" },
  { label: "User Management",    icon: Shield,          path: "/admin/user-management", perm: "users.manage" },
  { label: "Reports",            icon: BarChart2,       path: "/admin/reports", perm: "attendance.reports" },
  { label: "Activity Log",       icon: History,         path: "/admin/activity", perm: "audit.read" },
  { label: "EduAmigo Ask",       icon: MessageSquareText, path: "/admin/ask", perm: "assistant.insights" },
  { label: "Settings",           icon: SettingsIcon,    path: "/admin/settings", perm: "settings.manage" },
];

export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = userTheme(user);
  const sb = sidebarLook(theme);
  const [activeNav, setActiveNav] = useState("/admin");
  // Permissions, plan and billing state are refreshed from the server by AuthContext on app start.

  // Menu filtered by permission; section headings without any visible entries are dropped.
  const visibleNav = NAV.filter((item, i) => {
    if (!item.section) return can(user, item.perm);
    for (let j = i + 1; j < NAV.length && !NAV[j].section; j += 1) if (can(user, NAV[j].perm)) return true;
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const p = "/" + location.pathname.split("/").slice(1, 3).join("/");
    setActiveNav(p);
  }, [location]);

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "22px 18px 18px", borderBottom: `1px solid ${sb.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user?.branding?.logoUrl ? (
              <img src={user.branding.logoUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", background: "#fff", objectFit: "contain", border: `2px solid ${theme.accent}`, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.button, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${theme.glow}`, flexShrink: 0 }}>
                <BookOpen size={18} color="white" />
              </div>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: sb.text, letterSpacing: "-0.2px" }}>{user?.branding?.appName || user?.school || "EduAmigo"}</div>
              <div style={{ fontSize: 10, color: sb.muted, marginTop: 1, textTransform: "capitalize" }}>{user?.role || "admin"} Portal</div>
            </div>
          </div>
          {isMobile && <div onClick={() => setSidebarOpen(false)} style={{ cursor: "pointer", color: sb.muted, padding: 4 }}><X size={18} /></div>}
        </div>
      </div>
      <nav style={{ overflowY: "auto", flex: 1, padding: "8px 0 16px" }}>
        {visibleNav.map((item, i) => {
          if (item.section) return <div key={i} style={{ fontSize: 9, color: sb.faint, padding: "14px 20px 5px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>{item.section}</div>;
          const Icon = item.icon;
          const isActive = activeNav === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
          return (
            <div key={i} onClick={() => { setActiveNav(item.path); navigate(item.path); if (isMobile) setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", margin: "1px 10px", fontSize: 13, cursor: "pointer", color: isActive ? sb.activeText : sb.muted, background: isActive ? sb.activeBg : "transparent", fontWeight: isActive ? 700 : 500, borderRadius: 12, transition: "all 0.15s", boxShadow: isActive ? sb.activeShadow : "none" }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = sb.hoverBg; e.currentTarget.style.color = sb.hoverText; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = sb.muted; } }}>
              <Icon size={15} />
              {item.label}
              {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: theme.isLight ? "#fff" : theme.accent }} />}
            </div>
          );
        })}
      </nav>
      <div style={{ padding: "12px 10px 16px", borderTop: `1px solid ${sb.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, background: sb.card, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: theme.button, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sb.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Admin"}</div>
            <div style={{ fontSize: 10, color: sb.muted }}>{ROLE_LABELS[user?.role] || "Staff"}</div>
          </div>
        </div>
        <div onClick={() => { logout(); navigate("/login"); }}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, cursor: "pointer", color: "rgba(239,68,68,0.8)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.8)"; }}>
          <LogOut size={15} /> Log Out
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", background: "#E8ECF4", fontFamily: "inherit", position: "fixed", top: 0, left: 0, overflow: "hidden" }}>
      {!isMobile && (
        <aside style={{ width: 230, flexShrink: 0, background: sb.bg, borderRight: sb.edge, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", boxShadow: "4px 0 24px rgba(0,0,0,0.15)" }}>
          <SidebarContent />
        </aside>
      )}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }} />
          <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 230, background: sb.bg, zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "8px 0 32px rgba(0,0,0,0.3)" }}>
            <SidebarContent />
          </aside>
        </>
      )}
      <main style={{ flex: 1, padding: isMobile ? "1rem" : "1.75rem 2.5rem", overflowY: "auto", height: "100vh", minWidth: 0 }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <div onClick={() => setSidebarOpen(true)} style={{ width: 38, height: 38, borderRadius: 12, background: "white", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Menu size={16} color="#64748B" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{user?.school || "EduAmigo"}</div>
          </div>
        )}
        <SubscriptionBanner user={user} />
        <Routes>
          <Route path="" element={can(user, "attendance.reports") ? <Dashboard navigate={navigate} user={user} /> : <Navigate to={firstAllowedPath(user)} replace />} />
          <Route path="students" element={<Gate user={user} perm="students.read"><Students /></Gate>} />
          <Route path="students/add" element={<Gate user={user} perm="students.manage"><AddStudent /></Gate>} />
          <Route path="students/:id" element={<Gate user={user} perm="students.read"><StudentProfile /></Gate>} />
          <Route path="parents/add" element={<Gate user={user} perm="parents.manage"><AddParent /></Gate>} />
          <Route path="teachers" element={<Gate user={user} perm="teachers.manage"><Teachers /></Gate>} />
          <Route path="teachers/add" element={<Gate user={user} perm="teachers.manage"><AddTeacher /></Gate>} />
          <Route path="teachers/:id" element={<Gate user={user} perm="teachers.manage"><TeacherProfile /></Gate>} />
          <Route path="attendance-reports" element={<Gate user={user} perm="attendance.reports"><AttendanceReport /></Gate>} />
          <Route path="attendance/report" element={<Gate user={user} perm="attendance.reports"><AttendanceReport /></Gate>} />
          <Route path="chat" element={<Gate user={user} perm="chat.directory"><Chat /></Gate>} />
          <Route path="exams" element={<Gate user={user} perm="exams.manage"><ExamSchedule /></Gate>} />
          <Route path="fees" element={<Gate user={user} perm="fees.collect"><FeeCollection /></Gate>} />
          <Route path="fee-reports" element={<Gate user={user} perm="fees.read"><FeeReports /></Gate>} />
          <Route path="fee-structure" element={<Gate user={user} perm="fees.structure"><FeeStructure /></Gate>} />
          <Route path="leaves" element={<Gate user={user} perm="leaves.all"><LeaveRequests /></Gate>} />
          <Route path="library" element={<Gate user={user} perm="library.manage"><Library /></Gate>} />
          <Route path="marks" element={<Navigate to="/admin/results" replace />} />
          {/* Announcements live under Communications; old links to the notice board land there. */}
          <Route path="notice-board" element={<Navigate to="/admin/communications" replace />} />
          <Route path="admissions" element={<Gate user={user} perm="admissions.manage"><Admissions /></Gate>} />
          <Route path="admissions/*" element={<Navigate to="/admin/admissions" replace />} />
          <Route path="communications" element={<Gate user={user} perm="communication.manage"><Communications /></Gate>} />
          <Route path="reports" element={<Gate user={user} perm="attendance.reports"><Reports /></Gate>} />
          <Route path="results" element={<Gate user={user} perm="results.read"><Results /></Gate>} />
          <Route path="salaries" element={<Gate user={user} perm="hr.manage"><SalaryManagement /></Gate>} />
          <Route path="settings" element={<Gate user={user} perm="settings.manage"><Settings /></Gate>} />
          <Route path="academic" element={<Gate user={user} perm="academics.manage"><AcademicSetup /></Gate>} />
          <Route path="activity" element={<Gate user={user} perm="audit.read"><ActivityLog /></Gate>} />
          <Route path="ask" element={<Gate user={user} perm="assistant.insights"><AskInsights /></Gate>} />
          <Route path="year-end" element={<Gate user={user} perm="academics.manage"><YearEnd /></Gate>} />
          <Route path="tc/:id" element={<Gate user={user} perm="students.manage"><TransferCertificate /></Gate>} />
          <Route path="timetable" element={<Gate user={user} perm="timetable.manage"><Timetable /></Gate>} />
          <Route path="transport" element={<Gate user={user} perm="transport.manage"><Transport /></Gate>} />
          <Route path="user-management" element={<Gate user={user} perm="users.manage"><UserManagement /></Gate>} />
          <Route path="parents" element={<Gate user={user} perm="parents.read"><ParentsList /></Gate>} />
          <Route path="event-calendar" element={<Gate user={user} perm="communication.manage"><EventCalendar /></Gate>} />
          <Route path="id-card-generator" element={<Gate user={user} perm="students.manage"><IDCardGenerator /></Gate>} />
          <Route path="bulk-operations" element={<Gate user={user} perm="bulk.manage"><BulkOperations /></Gate>} />
          <Route path="hr-management" element={<Gate user={user} perm="hr.manage"><HRManagement /></Gate>} />
        </Routes>
      </main>
    </div>
  );
}
