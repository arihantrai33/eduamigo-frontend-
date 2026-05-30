import { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Users, School, UserCircle, Bus,
  CalendarCheck, FileBadge, Clock, Notebook, BadgeDollarSign, Layers,
  Bell, MessageCircle, BarChart2, Settings as SettingsIcon, Menu, X,
  AlertCircle, CheckCircle, BookOpen, LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Students from "./Students";
import AddStudent from "./AddStudent";
import AddParent from "./AddParent";
import Teachers from "./Teachers";
import AddTeacher from "./AddTeacher";
import Attendance from "./Attendance";
import AttendanceReport from "./AttendanceReport";
import Chat from "./Chat";
import ExamSchedule from "./ExamSchedule";
import FeeCollection from "./FeeCollection";
import FeeReports from "./FeeReports";
import FeeStructure from "./FeeStructure";
import LeaveRequests from "./LeaveRequests";
import Library from "./Library";
import Marks from "./Marks";
import Notifications from "./Notifications";
import Reports from "./Reports";
import Results from "./Results";
import Settings from "./Settings";
import StudentProfile from "./StudentProfile";
import TeacherProfile from "./TeacherProfile";
import Timetable from "./Timetable";
import Transport from "./Transport";
import UserManagement from "./UserManagement";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

const NAV = [
  { label: "Dashboard",      icon: LayoutDashboard,  path: "/admin" },
  { section: "Management" },
  { label: "Students",       icon: Users,            path: "/admin/students" },
  { label: "Teachers",       icon: School,           path: "/admin/teachers" },
  { label: "Parents",        icon: UserCircle,       path: "/admin/parents/add" },
  { label: "Transport",      icon: Bus,              path: "/admin/transport" },
  { section: "Academics" },
  { label: "Attendance",     icon: CalendarCheck,    path: "/admin/attendance" },
  { label: "Exams & Results",icon: FileBadge,        path: "/admin/exams" },
  { label: "Timetable",      icon: Clock,            path: "/admin/timetable" },
  { label: "Leave Requests", icon: Notebook,         path: "/admin/leaves" },
  { section: "Finance" },
  { label: "Fee Structure",  icon: Layers,           path: "/admin/fee-structure" },
  { label: "Fee Collection", icon: BadgeDollarSign,  path: "/admin/fees" },
  { section: "Communication" },
  { label: "Notifications",  icon: Bell,             path: "/admin/notifications" },
  { label: "Chat",           icon: MessageCircle,    path: "/admin/chat" },
  { section: "System" },
  { label: "Reports",        icon: BarChart2,        path: "/admin/reports" },
  { label: "Settings",       icon: SettingsIcon,     path: "/admin/settings" },
];

const MODULES = [
  { icon: "🎒", name: "Students",       path: "/admin/students",    color: "#EEF2FF", accent: "#4F46E5" },
  { icon: "👩‍🏫", name: "Teachers",       path: "/admin/teachers",    color: "#F0FDF4", accent: "#16A34A" },
  { icon: "👨‍👩‍👧", name: "Add Parent",     path: "/admin/parents/add", color: "#FFF7ED", accent: "#EA580C" },
  { icon: "💳", name: "Fee Management", path: "/admin/fees",         color: "#F0FDFA", accent: "#0D9488" },
  { icon: "📋", name: "Attendance",     path: "/admin/attendance",  color: "#FFF1F2", accent: "#E11D48" },
  { icon: "📝", name: "Exams",          path: "/admin/exams",       color: "#FFFBEB", accent: "#D97706" },
  { icon: "🕐", name: "Timetable",      path: "/admin/timetable",   color: "#EFF6FF", accent: "#2563EB" },
  { icon: "🏖️", name: "Leave Requests", path: "/admin/leaves",      color: "#FDF4FF", accent: "#9333EA" },
  { icon: "🚌", name: "Transport",      path: "/admin/transport",   color: "#F0F9FF", accent: "#0284C7" },
];

function DashboardContent({ isMobile, navigate, isTransport, setIsTransport, user }) {
  const [stats, setStats]               = useState({ students: 0, teachers: 0, buses: 0, parents: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [buses, setBuses]               = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [classDist, setClassDist]       = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [studentsRes, teachersRes, busesRes, leavesRes] = await Promise.allSettled([
        axios.get(`${API}/students`,       authHeader()),
        axios.get(`${API}/teachers`,       authHeader()),
        axios.get(`${API}/transport`,      authHeader()),
        axios.get(`${API}/leaves/pending`, authHeader()),
      ]);
      const students = studentsRes.status === "fulfilled" ? (studentsRes.value.data.data || []) : [];
      const teachers = teachersRes.status === "fulfilled" ? (teachersRes.value.data.data || []) : [];
      const busData  = busesRes.status  === "fulfilled"   ? (busesRes.value.data.data   || []) : [];
      const leaves   = leavesRes.status === "fulfilled"   ? (leavesRes.value.data.data  || []) : [];

      setStats({ students: students.length, teachers: teachers.length, buses: busData.length, parents: students.filter(s => s.parentId).length });
      setRecentStudents(students.slice(-5).reverse());
      setBuses(busData.slice(0, 3));
      setPendingLeaves(leaves.length);
      setRecentActivity(students.slice(-5).reverse().map(s => ({
        ic: "🎒", bg: "#EEF2FF",
        text: `${s.name} added to class ${s.class}-${s.section}`,
        time: new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      })));
      const classMap = {};
      students.forEach(s => { const key = `${s.class}-${s.section}`; classMap[key] = (classMap[key] || 0) + 1; });
      const total  = students.length || 1;
      const colors = ["#4F46E5", "#16A34A", "#0284C7", "#D97706", "#E11D48"];
      setClassDist(Object.entries(classMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cls, count], i) => ({
        cls, count, pct: Math.round((count / total) * 100), color: colors[i % colors.length]
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const statCards = [
    { icon: "🎒", value: stats.students, label: "Total Students",  sub: "Enrolled this year",   color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
    { icon: "👩‍🏫", value: stats.teachers, label: "Total Teachers",  sub: "Active staff members", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
    { icon: "👨‍👩‍👧", value: stats.parents,  label: "Linked Parents",  sub: "Connected families",   color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
    { icon: "🚌", value: stats.buses,    label: "Total Buses",     sub: "Active fleet",          color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Dashboard</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pendingLeaves > 0 && (
            <div onClick={() => navigate("/admin/leaves")}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, background: "#FEF3C7", color: "#92400E", padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontWeight: 600, border: "1px solid #FDE68A" }}>
              <AlertCircle size={12} />
              {pendingLeaves} leave{pendingLeaves > 1 ? "s" : ""} pending
            </div>
          )}
          <div style={{ position: "relative", width: 38, height: 38, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Bell size={16} color="#64748B" />
          </div>
          {/* Avatar — real user name from DB */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 24, padding: "5px 14px 5px 5px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{user?.name || "..."}</span>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A855F7 100%)", borderRadius: 20, padding: isMobile ? "20px 18px" : "24px 32px", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BookOpen size={16} color="rgba(255,255,255,0.8)" />
            {/* School name from DB */}
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              {user?.school || "School Management"}
            </span>
          </div>
          {/* Greeting with real name */}
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "white", marginBottom: 6 }}>
            {greeting}, {user?.name || "..."} 👋
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            You have {stats.students} students and {stats.teachers} teachers enrolled.
            {pendingLeaves > 0 && ` ${pendingLeaves} leave request${pendingLeaves > 1 ? "s" : ""} need your attention.`}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 14, marginBottom: "1.75rem" }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${s.border}`, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: s.bg, opacity: 0.8 }} />
            <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: loading ? 14 : 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {loading ? "Loading..." : s.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 6 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Quick Access</div>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>All modules</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(9,1fr)", gap: 10, marginBottom: "1.75rem" }}>
        {MODULES.map((m, i) => (
          <div key={i} onClick={() => navigate(m.path)}
            style={{ background: m.color, border: `1px solid ${m.color}33`, borderRadius: 14, padding: "14px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${m.accent}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: m.accent, lineHeight: 1.3 }}>{m.name}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Students by Class</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Distribution across grades</div>
            </div>
            <span onClick={() => navigate("/admin/students")}
              style={{ fontSize: 11, color: "#4F46E5", cursor: "pointer", fontWeight: 600, background: "#EEF2FF", padding: "4px 10px", borderRadius: 20 }}>
              View all
            </span>
          </div>
          {loading ? (
            <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : classDist.length === 0 ? (
            <div style={{ color: "#CBD5E1", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No students yet</div>
          ) : classDist.map((a, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Class {a.cls}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.count} students ({a.pct}%)</span>
              </div>
              <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${a.pct}%`, height: "100%", background: `linear-gradient(90deg, ${a.color}, ${a.color}99)`, borderRadius: 4, transition: "width 0.6s ease" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Recent Activity</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Latest updates</div>
          </div>
          {loading ? (
            <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div style={{ color: "#CBD5E1", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No activity yet</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: i < recentActivity.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{a.ic}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.4, fontWeight: 500 }}>{a.text}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{a.time}</div>
              </div>
              <CheckCircle size={14} color="#BBF7D0" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Recently Added</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>New student enrollments</div>
            </div>
            <span onClick={() => navigate("/admin/students")}
              style={{ fontSize: 11, color: "#4F46E5", cursor: "pointer", fontWeight: 600, background: "#EEF2FF", padding: "4px 10px", borderRadius: 20 }}>
              View all
            </span>
          </div>
          {loading ? (
            <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : recentStudents.length === 0 ? (
            <div style={{ color: "#CBD5E1", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No students yet</div>
          ) : recentStudents.map((s, i) => (
            <div key={i} onClick={() => navigate(`/admin/students/${s._id}`)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < recentStudents.length - 1 ? "1px solid #F1F5F9" : "none", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>Class {s.class}-{s.section} · Roll {s.rollNumber}</div>
              </div>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                background: s.feeStatus === "Paid" ? "#F0FDF4" : "#FFF7ED",
                color: s.feeStatus === "Paid" ? "#16A34A" : "#EA580C",
                border: `1px solid ${s.feeStatus === "Paid" ? "#BBF7D0" : "#FED7AA"}` }}>
                {s.feeStatus || "Pending"}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Fleet Status</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Active bus routes</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#64748B" }}>Show buses</span>
              <div onClick={() => setIsTransport(!isTransport)}
                style={{ width: 36, height: 20, borderRadius: 10, cursor: "pointer", position: "relative", transition: "background 0.2s", background: isTransport ? "#4F46E5" : "#CBD5E1" }}>
                <div style={{ position: "absolute", top: 2, left: isTransport ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          </div>
          {isTransport ? (
            loading ? (
              <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
            ) : buses.length === 0 ? (
              <div style={{ color: "#CBD5E1", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No buses added yet</div>
            ) : buses.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < buses.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#F0F9FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🚌</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.busNumber} — {b.driverName}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                    {b.routeName} · {b.stops?.length || 0} stops · {b.assignedStudents?.length || 0} students
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 600, flexShrink: 0,
                  background: b.busStatus === "On Route" ? "#F0FDF4" : "#F8FAFC",
                  color: b.busStatus === "On Route" ? "#16A34A" : "#64748B",
                  border: `1px solid ${b.busStatus === "On Route" ? "#BBF7D0" : "#E2E8F0"}` }}>
                  {b.busStatus || "Idle"}
                </span>
              </div>
            ))
          ) : (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚌</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Fleet Hidden</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Toggle above to show bus status</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav]     = useState("/admin");
  const [isTransport, setIsTransport] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const SidebarContent = () => (
    <>
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={16} color="white" />
          </div>
          <div>
            {/* School name from DB */}
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{user?.school || "..."}</div>
            {/* Role from DB */}
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1, textTransform: "capitalize" }}>{user?.role || "..."} Portal</div>
          </div>
        </div>
        {isMobile && (
          <div onClick={() => setSidebarOpen(false)} style={{ cursor: "pointer", padding: 4 }}>
            <X size={18} color="#64748B" />
          </div>
        )}
      </div>
      <nav style={{ overflowY: "auto", flex: 1, padding: "10px 0 16px" }}>
        {NAV.map((item, i) => {
          if (item.section) return (
            <div key={i} style={{ fontSize: 9, color: "#94A3B8", padding: "12px 18px 4px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
              {item.section}
            </div>
          );
          const Icon = item.icon;
          const isActive = activeNav === item.path;
          return (
            <div key={i}
              onClick={() => { setActiveNav(item.path); navigate(item.path); if (isMobile) setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", margin: "1px 8px", fontSize: 13, cursor: "pointer", color: isActive ? "#4F46E5" : "#64748B", background: isActive ? "#EEF2FF" : "transparent", fontWeight: isActive ? 600 : 400, borderRadius: 10, transition: "all 0.12s" }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#0F172A"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; } }}>
              <Icon size={15} />
              {item.label}
            </div>
          );
        })}
      </nav>
      {/* Logout */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid #F1F5F9" }}>
        <div
          onClick={() => { logout(); navigate("/login"); }}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 10, cursor: "pointer", color: "#EF4444", fontSize: 13, fontWeight: 500, transition: "all 0.12s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <LogOut size={15} />
          Log Out
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif", position: "fixed", top: 0, left: 0, overflow: "hidden" }}>
      {!isMobile && (
        <aside style={{ width: 224, flexShrink: 0, background: "#fff", borderRight: "1px solid #F1F5F9", display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
          <SidebarContent />
        </aside>
      )}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 40, backdropFilter: "blur(2px)" }} />
          <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 224, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.12)" }}>
            <SidebarContent />
          </aside>
        </>
      )}
      <main style={{ flex: 1, padding: isMobile ? "1rem" : "1.75rem 2.5rem", overflowY: "auto", height: "100vh", minWidth: 0 }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <div onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <Menu size={16} color="#64748B" />
            </div>
            {/* School name from DB in mobile header */}
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{user?.school || "..."}</div>
          </div>
        )}
        <Routes>
          <Route path=""                  element={<DashboardContent isMobile={isMobile} navigate={navigate} isTransport={isTransport} setIsTransport={setIsTransport} user={user} />} />
          <Route path="students"          element={<Students />} />
          <Route path="students/add"      element={<AddStudent />} />
          <Route path="students/:id"      element={<StudentProfile />} />
          <Route path="parents/add"       element={<AddParent />} />
          <Route path="teachers"          element={<Teachers />} />
          <Route path="teachers/add"      element={<AddTeacher />} />
          <Route path="teachers/:id"      element={<TeacherProfile />} />
          <Route path="attendance"        element={<Attendance />} />
          <Route path="attendance/report" element={<AttendanceReport />} />
          <Route path="chat"              element={<Chat />} />
          <Route path="exams"             element={<ExamSchedule />} />
          <Route path="fees"              element={<FeeCollection />} />
          <Route path="fee-reports"       element={<FeeReports />} />
          <Route path="fee-structure"     element={<FeeStructure />} />
          <Route path="leaves"            element={<LeaveRequests />} />
          <Route path="library"           element={<Library />} />
          <Route path="marks"             element={<Marks />} />
          <Route path="notifications"     element={<Notifications />} />
          <Route path="reports"           element={<Reports />} />
          <Route path="results"           element={<Results />} />
          <Route path="settings"          element={<Settings />} />
          <Route path="timetable"         element={<Timetable />} />
          <Route path="transport"         element={<Transport />} />
          <Route path="user-management"   element={<UserManagement />} />
        </Routes>
      </main>
    </div>
  );
}