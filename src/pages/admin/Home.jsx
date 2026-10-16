import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useStackedTables } from "../../utils/stackTables";
import { confirmLeave } from "../../utils/unsavedChanges";
import { useNavigate, Routes, Route, useLocation, Navigate, Link } from "react-router-dom";
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

// Screens load when first opened, so a parent does not download the admin screens (and so on).
const Students = lazy(() => import('./Students'))
const AddStudent = lazy(() => import('./AddStudent'))
const AddParent = lazy(() => import('./AddParent'))
const Teachers = lazy(() => import('./Teachers'))
const AddTeacher = lazy(() => import('./AddTeacher'))
const AttendanceReport = lazy(() => import('./AttendanceReport'))
const Chat = lazy(() => import('./Chat'))
const ExamSchedule = lazy(() => import('./ExamSchedule'))
const FeeCollection = lazy(() => import('./FeeCollection'))
const FeeReports = lazy(() => import('./FeeReports'))
const FeeStructure = lazy(() => import('./FeeStructure'))
const LeaveRequests = lazy(() => import('./LeaveRequests'))
const Library = lazy(() => import('./Library'))
const Communications = lazy(() => import('./Communications'))
const Reports = lazy(() => import('./Reports'))
const Results = lazy(() => import('./Results'))
const SalaryManagement = lazy(() => import('./SalaryManagement'))
const Settings = lazy(() => import('./Settings'))
const AcademicSetup = lazy(() => import('./AcademicSetup'))
const ActivityLog = lazy(() => import('./ActivityLog'))
const YearEnd = lazy(() => import('./YearEnd'))
const TransferCertificate = lazy(() => import('./TransferCertificate'))
const StudentProfile = lazy(() => import('./StudentProfile'))
const TeacherProfile = lazy(() => import('./TeacherProfile'))
const Timetable = lazy(() => import('./Timetable'))
const Transport = lazy(() => import('./Transport'))
const UserManagement = lazy(() => import('./UserManagement'))
const ParentsList = lazy(() => import('./ParentsList'))
const EventCalendar = lazy(() => import('./EventCalendar'))
const IDCardGenerator = lazy(() => import('./IDCardGenerator'))
const BulkOperations = lazy(() => import('./BulkOperations'))
const HRManagement = lazy(() => import('./HRManagement'))
const Admissions = lazy(() => import('./Admissions'))
const AskInsights = lazy(() => import('./AskInsights'))


// Shown when a staff member opens a screen their role does not include.
function Gate({ user, perm, children }) {
  if (can(user, perm)) return children;
  return (
    <div style={{ padding: 48, textAlign: "center", fontFamily: "inherit" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>No access</div>
      <div style={{ fontSize: 13, color: "var(--ea-muted)", marginTop: 6 }}>Your role does not include this section. Ask your school administrator if you need it.</div>
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
  const mainRef = useRef(null);
  useStackedTables(mainRef);   // record tables become cards on phones (utils/stackTables.js)
  // Permissions, plan and billing state are refreshed from the server by AuthContext on app start.

  // Menu filtered by permission; section headings without any visible entries are dropped.
  const visibleNav = NAV.filter((item, i) => {
    if (!item.section) return can(user, item.perm);
    for (let j = i + 1; j < NAV.length && !NAV[j].section; j += 1) if (can(user, NAV[j].perm)) return true;
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const wasOpen = useRef(false);
  const closeMenu = () => setSidebarOpen(false);

  // Phone menu: focus goes to its first control when it opens and back to the menu button when it closes.
  useEffect(() => {
    if (sidebarOpen) drawerRef.current?.querySelector("a, button")?.focus();
    else if (wasOpen.current) menuButtonRef.current?.focus();
    wasOpen.current = sidebarOpen;
  }, [sidebarOpen]);

  // Escape closes the phone menu; Tab and Shift+Tab stay inside it while it is open.
  const onDrawerKey = (e) => {
    if (e.key === "Escape") { e.stopPropagation(); closeMenu(); return; }
    if (e.key !== "Tab") return;
    const items = [...drawerRef.current.querySelectorAll("a[href], button:not([disabled])")];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // A render helper called as a function, not a component defined during render: a component made here would be new on
  // every render, so the menu would be rebuilt and keyboard focus lost each time (e.g. right after pressing Enter).
  const sidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="ea-sidebar__brand" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {user?.branding?.logoUrl
            ? <img src={user.branding.logoUrl} alt="" className="ea-sidebar__logo" />
            : <span className="ea-sidebar__logo ea-sidebar__logo--initial" aria-hidden="true">{(user?.branding?.appName || user?.school || "E")[0].toUpperCase()}</span>}
          <span className="ea-sidebar__school">
            <strong>{user?.branding?.appName || user?.school || "EduAmigo"}</strong>
            <small style={{ textTransform: "capitalize" }}>{user?.role || "admin"} Portal</small>
          </span>
        </div>
        {isMobile && <button type="button" className="ea-side-btn" aria-label="Close menu" onClick={closeMenu} style={{ color: "var(--ea-muted)", padding: 4, borderRadius: 8 }}><X size={18} aria-hidden="true" /></button>}
      </div>
      <nav aria-label="Admin menu" className="ea-sidebar__nav">
        {visibleNav.map((item, i) => {
          if (item.section) return <div key={i} className="ea-sidebar__heading" style={{ marginTop: i ? 10 : 0 }}>{item.section}</div>;
          const Icon = item.icon;
          // From the address only: a move that waits for "Leave unsaved changes?" must not light up the new entry early.
          const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
          // A real link: Tab reaches it, Enter opens it, it can open in a new tab, and screen readers hear "current page".
          return (
            <Link key={i} to={item.path} className={`ea-sidebar__link ea-side-link${isActive ? " is-active" : ""}`} aria-current={isActive ? "page" : undefined}
              onClick={() => { if (isMobile) closeMenu(); }}>
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="ea-sidebar__footer">
        <div className="ea-sidebar__user">
          <span className="ea-avatar" aria-hidden="true">{user?.name?.[0]?.toUpperCase() || "A"}</span>
          <span className="ea-sidebar__user-text">
            <strong>{user?.name || "Admin"}</strong>
            <small>{ROLE_LABELS[user?.role] || "Staff"}</small>
          </span>
        </div>
        <button type="button" className="ea-sidebar__signout" onClick={async () => { if (!(await confirmLeave())) return; logout(); navigate("/login"); }}>
          <LogOut size={16} aria-hidden="true" />Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="ea-admin-shell" style={{ display: "flex", width: "100vw", minHeight: "100vh", background: "var(--ea-canvas)", fontFamily: "inherit", position: "fixed", top: 0, left: 0, overflow: "hidden" }}>
      {/* First Tab stop: jumps past the menu to the page. Hidden until it has keyboard focus. */}
      <a href="#admin-main" className="ea-skip-link" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to main content</a>
      {!isMobile && (
        <aside style={{ width: 260, flexShrink: 0, background: "var(--ea-surface)", borderRight: "1px solid var(--ea-line)", display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
          {sidebarContent()}
        </aside>
      )}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={closeMenu} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }} />
          {/* The phone menu is a dialog: focus moves into it, Tab stays inside, Escape closes it and focus returns to the menu button. */}
          <aside ref={drawerRef} id="admin-menu" role="dialog" aria-modal="true" aria-label="Menu" onKeyDown={onDrawerKey}
            style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, maxWidth: "85vw", background: "var(--ea-surface)", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "var(--ea-shadow-e3, 0 12px 32px rgba(15,23,42,0.18))" }}>
            {sidebarContent()}
          </aside>
        </>
      )}
      <main ref={mainRef} id="admin-main" tabIndex={-1} className="ea-admin-main" style={{ flex: 1, padding: "var(--ea-page-top) var(--ea-gutter)", overflowY: "auto", height: "100vh", minWidth: 0, outline: "none" }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <button type="button" ref={menuButtonRef} className="ea-side-btn" aria-label="Open menu" aria-expanded={sidebarOpen} aria-controls="admin-menu" onClick={() => setSidebarOpen(true)}
              style={{ width: 38, height: 38, borderRadius: 12, background: "white", border: "1px solid var(--ea-edge)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Menu size={16} color="#64748B" aria-hidden="true" />
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{user?.school || "EduAmigo"}</div>
          </div>
        )}
        <SubscriptionBanner user={user} />
        <Suspense fallback={<div role="status" aria-label="Loading" style={{ display: "grid", placeItems: "center", minHeight: "40vh" }}><span className="ea-spinner" /></div>}>
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
        </Suspense>
      </main>
    </div>
  );
}
