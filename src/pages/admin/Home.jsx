import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Users, School, UserCircle, Bus,
  CalendarCheck, FileBadge, Clock, Notebook, BadgeDollarSign, Layers,
  Bell, MessageCircle, BarChart2, Settings as SettingsIcon, Menu, X,
  AlertCircle, CheckCircle, BookOpen, LogOut, TrendingUp, Award
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
import ParentsList from "./ParentsList";
import Circulars from "./Circulars";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const NAV = [
  { label: "Dashboard",      icon: LayoutDashboard,  path: "/admin" },
  { section: "Management" },
  { label: "Students",       icon: Users,            path: "/admin/students" },
  { label: "Teachers",       icon: School,           path: "/admin/teachers" },
  { label: "Parents",        icon: UserCircle,       path: "/admin/parents" },
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
  { label: "Circulars",      icon: Bell,             path: "/admin/circulars" },
  { section: "System" },
  { label: "Reports",        icon: BarChart2,        path: "/admin/reports" },
  { label: "Settings",       icon: SettingsIcon,     path: "/admin/settings" },
];

const MODULES = [
  { icon: "🎒", name: "Students",       path: "/admin/students",    grad: "linear-gradient(135deg,#6366F1,#8B5CF6)" },
  { icon: "👩‍🏫", name: "Teachers",       path: "/admin/teachers",    grad: "linear-gradient(135deg,#10B981,#059669)" },
  { icon: "��‍👩‍👧", name: "Parents",       path: "/admin/parents",     grad: "linear-gradient(135deg,#F59E0B,#EF4444)" },
  { icon: "💳", name: "Fee Mgmt",       path: "/admin/fees",         grad: "linear-gradient(135deg,#06B6D4,#3B82F6)" },
  { icon: "📋", name: "Attendance",     path: "/admin/attendance",  grad: "linear-gradient(135deg,#EC4899,#F43F5E)" },
  { icon: "📝", name: "Exams",          path: "/admin/exams",       grad: "linear-gradient(135deg,#F97316,#EF4444)" },
  { icon: "🕐", name: "Timetable",      path: "/admin/timetable",   grad: "linear-gradient(135deg,#3B82F6,#6366F1)" },
  { icon: "🏖️", name: "Leaves",         path: "/admin/leaves",      grad: "linear-gradient(135deg,#8B5CF6,#A855F7)" },
  { icon: "🚌", name: "Transport",      path: "/admin/transport",   grad: "linear-gradient(135deg,#0EA5E9,#06B6D4)" },
];

// Counter animation hook
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

function StatCard({ icon, value, label, sub, grad, delay = 0 }) {
  const count = useCounter(value);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      background: grad, borderRadius: 20, padding: "22px 24px", position: "relative", overflow: "hidden",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "all 0.5s ease", cursor: "default",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"; }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
      <div style={{ position: "absolute", bottom: -30, left: -10, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "white", lineHeight: 1, letterSpacing: "-1px" }}>{count}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)", marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function PageWrapper({ children }) {
  const [show, setShow] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setShow(true)); }, []);
  return (
    <div style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(16px)", transition: "all 0.35s ease" }}>
      {children}
    </div>
  );
}

function DashboardContent({ isMobile, navigate, isTransport, setIsTransport, user }) {
  const [stats, setStats] = useState({ students: 0, teachers: 0, buses: 0, parents: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [classDist, setClassDist] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [studentsRes, teachersRes, busesRes, leavesRes] = await Promise.allSettled([
        axios.get(`${API}/students`, authHeader()),
        axios.get(`${API}/teachers`, authHeader()),
        axios.get(`${API}/transport`, authHeader()),
        axios.get(`${API}/leaves/pending`, authHeader()),
      ]);
      const students = studentsRes.status === "fulfilled" ? (studentsRes.value.data.data || []) : [];
      const teachers = teachersRes.status === "fulfilled" ? (teachersRes.value.data.data || []) : [];
      const busData  = busesRes.status === "fulfilled"   ? (busesRes.value.data.data   || []) : [];
      const leaves   = leavesRes.status === "fulfilled"  ? (leavesRes.value.data.data  || []) : [];
      setStats({ students: students.length, teachers: teachers.length, buses: busData.length, parents: students.filter(s => s.parentId).length });
      setRecentStudents(students.slice(-5).reverse());
      setBuses(busData.slice(0, 3));
      setPendingLeaves(leaves.length);
      setRecentActivity(students.slice(-5).reverse().map(s => ({
        ic: "🎒", text: `${s.name} added to class ${s.class}-${s.section}`,
        time: new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      })));
      const classMap = {};
      students.forEach(s => { const key = `${s.class}-${s.section}`; classMap[key] = (classMap[key] || 0) + 1; });
      const total = students.length || 1;
      const colors = ["#6366F1","#10B981","#F59E0B","#EC4899","#3B82F6"];
      setClassDist(Object.entries(classMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cls,count],i)=>({
        cls, count, pct: Math.round((count/total)*100), color: colors[i%colors.length]
      })));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const greetEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  const statCards = [
    { icon: "🎒", value: stats.students, label: "Total Students",  sub: "Enrolled this year",   grad: "linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)", delay: 0 },
    { icon: "👩‍🏫", value: stats.teachers, label: "Total Teachers",  sub: "Active staff members", grad: "linear-gradient(135deg,#10B981 0%,#059669 100%)", delay: 100 },
    { icon: "👨‍👩‍👧", value: stats.parents,  label: "Linked Parents",  sub: "Connected families",   grad: "linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)", delay: 200 },
    { icon: "🚌", value: stats.buses,    label: "Total Buses",     sub: "Active fleet",          grad: "linear-gradient(135deg,#0EA5E9 0%,#3B82F6 100%)", delay: 300 },
  ];

  return (
    <PageWrapper>
      {/* Top Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.75rem" }}>
        <div>
          <div style={{ fontSize: isMobile?18:26, fontWeight:800, color:"#0F172A", letterSpacing:"-0.5px" }}>Dashboard</div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:3 }}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {pendingLeaves > 0 && (
            <div onClick={() => navigate("/admin/leaves")}
              style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, background:"linear-gradient(135deg,#FEF3C7,#FDE68A)", color:"#92400E", padding:"6px 14px", borderRadius:20, cursor:"pointer", fontWeight:700, border:"1px solid #FCD34D", boxShadow:"0 2px 8px rgba(245,158,11,0.25)" }}>
              <AlertCircle size={12} />
              {pendingLeaves} leave{pendingLeaves>1?"s":""} pending
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1px solid #E2E8F0", borderRadius:24, padding:"5px 14px 5px 5px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"white", boxShadow:"0 2px 8px rgba(99,102,241,0.4)" }}>
              {user?.name?.[0]?.toUpperCase()||"A"}
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{user?.name||"Admin"}</span>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div style={{ background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 40%,#4338CA 70%,#6366F1 100%)", borderRadius:24, padding:isMobile?"22px 20px":"28px 36px", marginBottom:"1.75rem", position:"relative", overflow:"hidden", boxShadow:"0 12px 40px rgba(99,102,241,0.35)" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", top:20, right:140, width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.4)" }} />
        <div style={{ position:"absolute", top:60, right:200, width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,0.3)" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"3px 10px", fontSize:11, color:"rgba(255,255,255,0.9)", fontWeight:600, backdropFilter:"blur(8px)" }}>
              🏫 {user?.school||"EduAmigo School"}
            </div>
          </div>
          <div style={{ fontSize:isMobile?20:26, fontWeight:800, color:"white", marginBottom:8, letterSpacing:"-0.3px" }}>
            {greeting}, {user?.name||"Admin"} {greetEmoji}
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>
            You have <span style={{ color:"#A5B4FC", fontWeight:700 }}>{stats.students} students</span> and <span style={{ color:"#6EE7B7", fontWeight:700 }}>{stats.teachers} teachers</span> enrolled.
            {pendingLeaves>0 && <span style={{ color:"#FCD34D", fontWeight:700 }}> · {pendingLeaves} leave request{pendingLeaves>1?"s":""} awaiting approval.</span>}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:16, marginBottom:"2rem" }}>
        {statCards.map((s,i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Quick Access */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", letterSpacing:"-0.2px" }}>Quick Access</div>
        <div style={{ fontSize:11, color:"#94A3B8", fontWeight:500 }}>All modules →</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(9,1fr)", gap:10, marginBottom:"2rem" }}>
        {MODULES.map((m,i) => (
          <div key={i} onClick={() => navigate(m.path)}
            style={{ background:m.grad, borderRadius:16, padding:"16px 10px", cursor:"pointer", textAlign:"center", transition:"all 0.2s", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px) scale(1.05)"; e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0) scale(1)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.1)"; }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{m.icon}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"white", lineHeight:1.3, textShadow:"0 1px 3px rgba(0,0,0,0.2)" }}>{m.name}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Class Distribution */}
        <div style={{ background:"white", borderRadius:20, padding:"22px 26px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", border:"1px solid #F1F5F9" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Students by Class</div>
              <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Distribution across grades</div>
            </div>
            <span onClick={() => navigate("/admin/students")}
              style={{ fontSize:11, color:"#6366F1", cursor:"pointer", fontWeight:700, background:"#EEF2FF", padding:"5px 12px", borderRadius:20, border:"1px solid #C7D2FE" }}>
              View all
            </span>
          </div>
          {loading ? (
            <div style={{ color:"#94A3B8", fontSize:13, textAlign:"center", padding:"20px 0" }}>Loading...</div>
          ) : classDist.length === 0 ? (
            <div style={{ color:"#CBD5E1", fontSize:13, textAlign:"center", padding:"20px 0" }}>No students yet</div>
          ) : classDist.map((a,i) => (
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Class {a.cls}</span>
                <span style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.count} students ({a.pct}%)</span>
              </div>
              <div style={{ height:8, background:"#F1F5F9", borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${a.pct}%`, height:"100%", background:`linear-gradient(90deg,${a.color},${a.color}99)`, borderRadius:4, transition:"width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{ background:"white", borderRadius:20, padding:"22px 26px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", border:"1px solid #F1F5F9" }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Recent Activity</div>
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Latest updates</div>
          </div>
          {loading ? (
            <div style={{ color:"#94A3B8", fontSize:13, textAlign:"center", padding:"20px 0" }}>Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div style={{ color:"#CBD5E1", fontSize:13, textAlign:"center", padding:"20px 0" }}>No activity yet</div>
          ) : recentActivity.map((a,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<recentActivity.length-1?"1px solid #F8FAFC":"none" }}>
              <div style={{ width:36, height:36, borderRadius:12, background:"linear-gradient(135deg,#EEF2FF,#C7D2FE)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{a.ic}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:"#1E293B", fontWeight:600, lineHeight:1.4 }}>{a.text}</div>
                <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{a.time}</div>
              </div>
              <div style={{ width:24, height:24, borderRadius:"50%", background:"#F0FDF4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <CheckCircle size={13} color="#16A34A" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:40 }}>
        {/* Recently Added Students */}
        <div style={{ background:"white", borderRadius:20, padding:"22px 26px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", border:"1px solid #F1F5F9" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Recently Added</div>
              <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>New student enrollments</div>
            </div>
            <span onClick={() => navigate("/admin/students")}
              style={{ fontSize:11, color:"#6366F1", cursor:"pointer", fontWeight:700, background:"#EEF2FF", padding:"5px 12px", borderRadius:20, border:"1px solid #C7D2FE" }}>
              View all
            </span>
          </div>
          {loading ? (
            <div style={{ color:"#94A3B8", fontSize:13, textAlign:"center", padding:"20px 0" }}>Loading...</div>
          ) : recentStudents.length === 0 ? (
            <div style={{ color:"#CBD5E1", fontSize:13, textAlign:"center", padding:"20px 0" }}>No students yet</div>
          ) : recentStudents.map((s,i) => (
            <div key={i} onClick={() => navigate(`/admin/students/${s._id}`)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<recentStudents.length-1?"1px solid #F8FAFC":"none", cursor:"pointer", borderRadius:8, transition:"background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ width:38, height:38, borderRadius:12, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0, boxShadow:"0 2px 8px rgba(99,102,241,0.3)" }}>
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{s.name}</div>
                <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>Class {s.class}-{s.section} · Roll {s.rollNumber}</div>
              </div>
              <span style={{ fontSize:10, padding:"4px 10px", borderRadius:20, fontWeight:700,
                background:s.feeStatus==="Paid"?"#F0FDF4":"#FFF7ED",
                color:s.feeStatus==="Paid"?"#16A34A":"#EA580C",
                border:`1px solid ${s.feeStatus==="Paid"?"#BBF7D0":"#FED7AA"}` }}>
                {s.feeStatus||"Pending"}
              </span>
            </div>
          ))}
        </div>

        {/* Fleet Status */}
        <div style={{ background:"white", borderRadius:20, padding:"22px 26px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", border:"1px solid #F1F5F9" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Fleet Status</div>
              <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Active bus routes</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:"#64748B", fontWeight:500 }}>Show buses</span>
              <div onClick={() => setIsTransport(!isTransport)}
                style={{ width:40, height:22, borderRadius:11, cursor:"pointer", position:"relative", transition:"background 0.25s", background:isTransport?"linear-gradient(135deg,#6366F1,#8B5CF6)":"#CBD5E1", boxShadow:isTransport?"0 2px 8px rgba(99,102,241,0.4)":"none" }}>
                <div style={{ position:"absolute", top:3, left:isTransport?20:3, width:16, height:16, borderRadius:"50%", background:"white", transition:"left 0.25s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          </div>
          {isTransport ? (
            loading ? (
              <div style={{ color:"#94A3B8", fontSize:13, textAlign:"center", padding:"20px 0" }}>Loading...</div>
            ) : buses.length === 0 ? (
              <div style={{ color:"#CBD5E1", fontSize:13, textAlign:"center", padding:"20px 0" }}>No buses added yet</div>
            ) : buses.map((b,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<buses.length-1?"1px solid #F8FAFC":"none" }}>
                <div style={{ width:38, height:38, borderRadius:12, background:"linear-gradient(135deg,#E0F2FE,#BAE6FD)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🚌</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.busNumber} — {b.driverName}</div>
                  <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>{b.routeName} · {b.stops?.length||0} stops · {b.assignedStudents?.length||0} students</div>
                </div>
                <span style={{ fontSize:10, padding:"4px 10px", borderRadius:20, fontWeight:700, flexShrink:0,
                  background:b.busStatus==="On Route"?"#F0FDF4":"#F8FAFC",
                  color:b.busStatus==="On Route"?"#16A34A":"#64748B",
                  border:`1px solid ${b.busStatus==="On Route"?"#BBF7D0":"#E2E8F0"}` }}>
                  {b.busStatus||"Idle"}
                </span>
              </div>
            ))
          ) : (
            <div style={{ background:"linear-gradient(135deg,#F8FAFC,#EEF2FF)", borderRadius:14, padding:"32px 20px", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🚌</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:4 }}>Fleet Hidden</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Toggle above to show bus status</div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState("/admin");
  const [isTransport, setIsTransport] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const path = "/" + location.pathname.split("/").slice(1,3).join("/");
    setActiveNav(path);
  }, [location]);

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Logo */}
      <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(99,102,241,0.5)" }}>
              <BookOpen size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"white", letterSpacing:"-0.2px" }}>{user?.school||"EduAmigo"}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:1, textTransform:"capitalize" }}>{user?.role||"admin"} Portal</div>
            </div>
          </div>
          {isMobile && <div onClick={() => setSidebarOpen(false)} style={{ cursor:"pointer", color:"rgba(255,255,255,0.5)", padding:4 }}><X size={18} /></div>}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ overflowY:"auto", flex:1, padding:"8px 0 16px" }}>
        {NAV.map((item,i) => {
          if (item.section) return (
            <div key={i} style={{ fontSize:9, color:"rgba(255,255,255,0.3)", padding:"14px 20px 5px", letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700 }}>
              {item.section}
            </div>
          );
          const Icon = item.icon;
          const isActive = activeNav === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
          return (
            <div key={i}
              onClick={() => { setActiveNav(item.path); navigate(item.path); if(isMobile) setSidebarOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", margin:"1px 10px", fontSize:13, cursor:"pointer",
                color: isActive ? "white" : "rgba(255,255,255,0.5)",
                background: isActive ? "linear-gradient(135deg,rgba(99,102,241,0.8),rgba(139,92,246,0.6))" : "transparent",
                fontWeight: isActive ? 700 : 400, borderRadius:12,
                transition:"all 0.15s",
                boxShadow: isActive ? "0 4px 12px rgba(99,102,241,0.3)" : "none" }}
              onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.color="rgba(255,255,255,0.85)"; } }}
              onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.5)"; } }}>
              <Icon size={15} />
              {item.label}
              {isActive && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.8)" }} />}
            </div>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding:"12px 10px 16px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:12, background:"rgba(255,255,255,0.05)", marginBottom:6 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"white" }}>
            {user?.name?.[0]?.toUpperCase()||"A"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"white", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.name||"Admin"}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Administrator</div>
          </div>
        </div>
        <div onClick={() => { logout(); navigate("/login"); }}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:12, cursor:"pointer", color:"rgba(239,68,68,0.8)", fontSize:13, fontWeight:600, transition:"all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.1)"; e.currentTarget.style.color="#EF4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(239,68,68,0.8)"; }}>
          <LogOut size={15} />
          Log Out
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", width:"100vw", minHeight:"100vh", background:"#F1F5F9", fontFamily:"'Inter',sans-serif", position:"fixed", top:0, left:0, overflow:"hidden" }}>
      {/* Sidebar Desktop */}
      {!isMobile && (
        <aside style={{ width:230, flexShrink:0, background:"linear-gradient(180deg,#0F172A 0%,#1E1B4B 100%)", display:"flex", flexDirection:"column", height:"100vh", overflowY:"auto", boxShadow:"4px 0 24px rgba(0,0,0,0.15)" }}>
          <SidebarContent />
        </aside>
      )}

      {/* Sidebar Mobile */}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", zIndex:40, backdropFilter:"blur(4px)" }} />
          <aside style={{ position:"fixed", top:0, left:0, bottom:0, width:230, background:"linear-gradient(180deg,#0F172A 0%,#1E1B4B 100%)", zIndex:50, display:"flex", flexDirection:"column", boxShadow:"8px 0 32px rgba(0,0,0,0.3)" }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <main style={{ flex:1, padding:isMobile?"1rem":"1.75rem 2.5rem", overflowY:"auto", height:"100vh", minWidth:0 }}>
        {isMobile && (
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1rem" }}>
            <div onClick={() => setSidebarOpen(true)} style={{ width:38, height:38, borderRadius:12, background:"white", border:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
              <Menu size={16} color="#64748B" />
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>{user?.school||"EduAmigo"}</div>
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
          <Route path="parents"           element={<ParentsList />} />
          <Route path="circulars"         element={<Circulars />} />
        </Routes>
      </main>
    </div>
  );
}
