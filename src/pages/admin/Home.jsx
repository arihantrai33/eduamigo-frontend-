import { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Users, School, UserCircle, Bus,
  CalendarCheck, FileBadge, Clock, Notebook, BadgeDollarSign,
  Bell, MessageCircle, BarChart2, Settings as SettingsIcon, Menu, X
} from "lucide-react";
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
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { section: "Management" },
  { label: "Students",      icon: Users,            path: "/admin/students" },
  { label: "Teachers",      icon: School,           path: "/admin/teachers" },
  { label: "Parents",       icon: UserCircle,       path: "/admin/parents/add" },
  { label: "Transport",     icon: Bus,              path: "/admin/transport" },
  { section: "Academics" },
  { label: "Attendance",    icon: CalendarCheck,    path: "/admin/attendance" },
  { label: "Exams & Results", icon: FileBadge,      path: "/admin/exams" },
  { label: "Timetable",     icon: Clock,            path: "/admin/timetable" },
  { label: "Leave Requests", icon: Notebook,        path: "/admin/leaves" },
  { section: "Finance" },
  { label: "Fee Management", icon: BadgeDollarSign, path: "/admin/fees" },
  { section: "Communication" },
  { label: "Notifications", icon: Bell,             path: "/admin/notifications" },
  { label: "Chat",          icon: MessageCircle,    path: "/admin/chat" },
  { section: "System" },
  { label: "Reports",       icon: BarChart2,        path: "/admin/reports" },
  { label: "Settings",      icon: SettingsIcon,     path: "/admin/settings" },
];

const MODULES = [
  { emoji: "🎒", name: "Students",       desc: "Add, edit, view profiles",  path: "/admin/students" },
  { emoji: "👩‍🏫", name: "Teachers",       desc: "Staff records & subjects",  path: "/admin/teachers" },
  { emoji: "👨‍👩‍👧", name: "Add Parent",     desc: "Link parent to student",    path: "/admin/parents/add" },
  { emoji: "💳", name: "Fee Management", desc: "Collect & track payments",  path: "/admin/fees" },
  { emoji: "📋", name: "Attendance",     desc: "Daily class-wise entry",    path: "/admin/attendance" },
  { emoji: "📝", name: "Exams",          desc: "Schedule & upload results", path: "/admin/exams" },
  { emoji: "🕐", name: "Timetable",      desc: "Manage class schedule",     path: "/admin/timetable" },
  { emoji: "🏖️", name: "Leave Requests", desc: "Approve / reject leaves",   path: "/admin/leaves" },
  { emoji: "🚌", name: "Transport",      desc: "Manage buses & routes",     path: "/admin/transport" },
];

function StatCard({ emoji, value, label, sub, subColor }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, marginTop: 5, color: subColor || "#999" }}>{sub}</div>
    </div>
  );
}

function DashboardContent({ isMobile, navigate, isTransport, setIsTransport }) {
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
        axios.get(`${API}/students`,      authHeader()),
        axios.get(`${API}/teachers`,      authHeader()),
        axios.get(`${API}/transport`,     authHeader()),
        axios.get(`${API}/leaves/pending`, authHeader()),
      ]);

      const students = studentsRes.status === "fulfilled" ? (studentsRes.value.data.data || []) : [];
      const teachers = teachersRes.status === "fulfilled" ? (teachersRes.value.data.data || []) : [];
      const busData  = busesRes.status  === "fulfilled" ? (busesRes.value.data.data  || []) : [];
      const leaves   = leavesRes.status === "fulfilled" ? (leavesRes.value.data.data || []) : [];

      setStats({
        students: students.length,
        teachers: teachers.length,
        buses:    busData.length,
        parents:  students.filter(s => s.parentId).length,
      });

      setRecentStudents(students.slice(-5).reverse());
      setBuses(busData.slice(0, 3));
      setPendingLeaves(leaves.length);

      // Recent activity
      setRecentActivity(
        students.slice(-5).reverse().map(s => ({
          ic: "🎒",
          bg: "#EEEDFE",
          text: `${s.name} added to class ${s.class}-${s.section}`,
          time: new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        }))
      );

      // Class distribution — correct percentage based on class count
      const classMap = {};
      students.forEach(s => {
        const key = `${s.class}-${s.section}`;
        classMap[key] = (classMap[key] || 0) + 1;
      });
      const total = students.length || 1;
      const colors = ["#1D9E75", "#534AB7", "#0EA5E9", "#F59E0B", "#EF4444"];
      setClassDist(
        Object.entries(classMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cls, count], i) => ({
            cls,
            count,
            pct: Math.round((count / total) * 100),
            color: colors[i % colors.length],
          }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 600, color: "#1a1a1a" }}>Dashboard</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pendingLeaves > 0 && (
            <div
              onClick={() => navigate("/admin/leaves")}
              style={{ fontSize: 11, background: "#FFF3CD", color: "#856404", padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontWeight: 500 }}>
              {pendingLeaves} leave{pendingLeaves > 1 ? "s" : ""} pending
            </div>
          )}
          <div style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: "#F5F5F3", border: "0.5px solid #E8E8E5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Bell size={16} color="#666" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F5F5F3", border: "0.5px solid #E8E8E5", borderRadius: 20, padding: "4px 12px 4px 4px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#534AB7" }}>A</div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>Admin</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard emoji="🎒" value={loading ? "..." : stats.students} label="Total Students"  sub="Live from database" subColor="#3B6D11" />
        <StatCard emoji="👩‍🏫" value={loading ? "..." : stats.teachers} label="Total Teachers"  sub="Live from database" subColor="#3B6D11" />
        <StatCard emoji="👨‍👩‍👧" value={loading ? "..." : stats.parents}  label="Linked Parents"  sub="Students with parent" subColor="#534AB7" />
        <StatCard emoji="🚌" value={loading ? "..." : stats.buses}    label="Total Buses"    sub="Live from database" subColor="#3B6D11" />
      </div>

      {/* Quick Access */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "#666", marginBottom: 10 }}>Quick access</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {MODULES.map((m, i) => (
          <div key={i} onClick={() => navigate(m.path)}
            style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem", cursor: "pointer", transition: "border-color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#534AB7"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#E8E8E5"}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{m.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{m.name}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Class Distribution + Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>

        {/* Class Distribution */}
        <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>📊 Students by class</span>
            <span style={{ fontSize: 11, color: "#534AB7", cursor: "pointer" }} onClick={() => navigate("/admin/students")}>View all</span>
          </div>
          {loading ? (
            <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : classDist.length === 0 ? (
            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No students yet</div>
          ) : classDist.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#666", width: 42, flexShrink: 0 }}>{a.cls}</span>
              <div style={{ flex: 1, height: 6, background: "#F0F0EE", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${a.pct}%`, height: "100%", background: a.color, borderRadius: 3, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, width: 52, textAlign: "right", color: a.color }}>
                {a.count} ({a.pct}%)
              </span>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", marginBottom: 12 }}>⚡ Recent activity</div>
          {loading ? (
            <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No activity yet</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < recentActivity.length - 1 ? "0.5px solid #E8E8E5" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{a.ic}</div>
              <div>
                <div style={{ fontSize: 12, color: "#1a1a1a", lineHeight: 1.4 }}>{a.text}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Students + Fleet */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 24 }}>

        {/* Recent Students */}
        <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>🎒 Recently added students</span>
            <span style={{ fontSize: 11, color: "#534AB7", cursor: "pointer" }} onClick={() => navigate("/admin/students")}>View all</span>
          </div>
          {loading ? (
            <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : recentStudents.length === 0 ? (
            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No students yet</div>
          ) : recentStudents.map((s, i) => (
            <div key={i}
              onClick={() => navigate(`/admin/students/${s._id}`)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < recentStudents.length - 1 ? "0.5px solid #E8E8E5" : "none", cursor: "pointer" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#999" }}>Class {s.class}-{s.section} · Roll {s.rollNumber}</div>
              </div>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500, background: s.feeStatus === "Paid" ? "#EAF3DE" : "#FAEEDA", color: s.feeStatus === "Paid" ? "#3B6D11" : "#854F0B" }}>
                {s.feeStatus || "Pending"}
              </span>
            </div>
          ))}
        </div>

        {/* Fleet Status */}
        <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>🚌 Fleet status</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#999" }}>Show buses</span>
              <div onClick={() => setIsTransport(!isTransport)}
                style={{ width: 32, height: 18, borderRadius: 9, cursor: "pointer", position: "relative", transition: "background 0.2s", background: isTransport ? "#1D9E75" : "#B4B2A9" }}>
                <div style={{ position: "absolute", top: 2, left: isTransport ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </div>
            </div>
          </div>
          {isTransport ? (
            loading ? (
              <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
            ) : buses.length === 0 ? (
              <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No buses added yet</div>
            ) : buses.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < buses.length - 1 ? "0.5px solid #E8E8E5" : "none" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🚌</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.busNumber} — {b.driverName}
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>
                    {b.routeName} · {b.stops?.length || 0} stops · {b.assignedStudents?.length || 0} students
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500, flexShrink: 0, background: b.busStatus === "On Route" ? "#EAF3DE" : "#F5F5F3", color: b.busStatus === "On Route" ? "#3B6D11" : "#888" }}>
                  {b.busStatus || "Idle"}
                </span>
              </div>
            ))
          ) : (
            <div style={{ background: "#F5F5F3", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.25rem 1rem", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🚌</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", marginBottom: 4 }}>Fleet hidden</div>
              <div style={{ fontSize: 11, color: "#999" }}>Toggle to show bus status.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();
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
      <div style={{ padding: "1rem 1.1rem 0.9rem", borderBottom: "0.5px solid #E8E8E5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#534AB7" }}>EduAmigo</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 1 }}>Admin Portal</div>
        </div>
        {isMobile && (
          <div onClick={() => setSidebarOpen(false)} style={{ cursor: "pointer", padding: 4 }}>
            <X size={18} color="#666" />
          </div>
        )}
      </div>
      <nav style={{ overflowY: "auto", flex: 1, paddingBottom: 16 }}>
        {NAV.map((item, i) => {
          if (item.section) return (
            <div key={i} style={{ fontSize: 9, color: "#999", padding: "10px 1.1rem 3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {item.section}
            </div>
          );
          const Icon = item.icon;
          const isActive = activeNav === item.path;
          return (
            <div key={i}
              onClick={() => { setActiveNav(item.path); navigate(item.path); if (isMobile) setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 1.1rem", fontSize: 12, cursor: "pointer", color: isActive ? "#534AB7" : "#666", background: isActive ? "#EEEDFE" : "transparent", fontWeight: isActive ? 500 : 400, borderLeft: isActive ? "2px solid #534AB7" : "2px solid transparent", transition: "all 0.12s" }}>
              <Icon size={15} />
              {item.label}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", background: "#F5F5F3", fontFamily: "Inter, sans-serif", position: "fixed", top: 0, left: 0, overflow: "hidden" }}>
      {!isMobile && (
        <aside style={{ width: 220, flexShrink: 0, background: "#fff", borderRight: "0.5px solid #E8E8E5", display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
          <SidebarContent />
        </aside>
      )}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
          <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 220, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "4px 0 20px rgba(0,0,0,0.12)" }}>
            <SidebarContent />
          </aside>
        </>
      )}
      <main style={{ flex: 1, padding: isMobile ? "0.85rem" : "1.5rem 2rem", overflowY: "auto", height: "100vh", minWidth: 0 }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <div onClick={() => setSidebarOpen(true)} style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "0.5px solid #E8E8E5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Menu size={16} color="#666" />
            </div>
          </div>
        )}
        <Routes>
          <Route path=""                  element={<DashboardContent isMobile={isMobile} navigate={navigate} isTransport={isTransport} setIsTransport={setIsTransport} />} />
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