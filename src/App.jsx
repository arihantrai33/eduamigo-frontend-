import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import Toast from './components/Toast'
import Splash from './pages/Splash'
import Login from './pages/Login'
import StudentHome from './pages/student/Home'
import StudentAttendance from './pages/student/Attendance'
import StudentResult from './pages/student/Result'
import StudentFee from './pages/student/Fee'
import StudentBus from './pages/student/Bus'
import Timetable from './pages/student/Timetable'
import Notes from './pages/student/Notes'
import StudentApplyLeave from './pages/student/ApplyLeave'
import StudentNotifications from './pages/student/Notifications'
import StudentChat from './pages/student/Chat'
import StudentProfile from './pages/student/Profile'
import TeacherHome from './pages/teacher/Home'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherMarks from './pages/teacher/Marks'
import TeacherUpload from './pages/teacher/Upload'
import TeacherTimetable from './pages/teacher/Timetable'
import TeacherLeave from './pages/teacher/Leave'
import TeacherNotifications from './pages/teacher/Notifications'
import TeacherProfile from './pages/teacher/Profile'
import TeacherChat from './pages/teacher/Chat'
import AdminHome from './pages/admin/Home'
import ParentHome from './pages/parent/Home'
import ParentChat from './pages/parent/Chat'
import ParentApplyLeave from './pages/parent/ApplyLeave'
import ParentNotifications from './pages/parent/Notifications'
import ParentAttendance from './pages/parent/Attendance'
import ParentCalendar from './pages/parent/Calendar'
import ParentFee from './pages/parent/Fee'
import ParentResult from './pages/parent/Result'
import ParentBus from './pages/parent/Bus'
import ParentProfile from './pages/parent/Profile'
import DriverHome from './pages/driver/Driver'

function LoadingScreen() {
  return (
    <div style={{
      height: "100vh",
      background: "linear-gradient(135deg, #0A0E27 0%, #0D1F5C 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "0px", position: "relative", overflow: "hidden", fontFamily: "Georgia, serif",
    }}>
      <div style={{ position: "absolute", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,111,232,0.25) 0%, transparent 70%)", top: "15%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(108,59,232,0.18) 0%, transparent 70%)", bottom: "20%", right: "-10%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "280px", height: "280px", borderRadius: "50%", border: "0.5px solid rgba(79,142,247,0.2)", top: "50%", left: "50%", transform: "translate(-50%, -62%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", border: "0.5px solid rgba(123,92,240,0.15)", top: "50%", left: "50%", transform: "translate(-50%, -62%)", pointerEvents: "none" }} />
      {[{ top: "12%", left: "15%", size: 3 }, { top: "18%", left: "78%", size: 2 }, { top: "8%", left: "55%", size: 2 }, { top: "75%", left: "12%", size: 2 }, { top: "80%", left: "85%", size: 3 }].map((s, i) => (
        <div key={i} style={{ position: "absolute", top: s.top, left: s.left, width: s.size, height: s.size, borderRadius: "50%", background: "rgba(255,255,255,0.35)", animation: `twinkle 2s ease-in-out ${i * 0.4}s infinite` }} />
      ))}
      <div style={{ width: "88px", height: "88px", borderRadius: "22px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", marginBottom: "28px", boxShadow: "0 0 0 8px rgba(79,142,247,0.1), 0 0 0 16px rgba(79,142,247,0.05)" }}>🎓</div>
      <h1 style={{ color: "white", fontSize: "34px", fontWeight: "700", margin: "0 0 8px 0", letterSpacing: "2px" }}>EduAmigo</h1>
      <p style={{ color: "#8BA4D4", fontSize: "11px", letterSpacing: "4px", margin: "0 0 20px 0", fontWeight: "400" }}>YOUR SCHOOL COMPANION</p>
      <div style={{ width: "60px", height: "0.5px", background: "linear-gradient(90deg, transparent, #4F8EF7, transparent)", marginBottom: "28px" }} />
      <div style={{ display: "flex", gap: "8px" }}>
        {["rgba(79,142,247,0.9)", "rgba(255,255,255,0.3)", "rgba(123,92,240,0.7)"].map((color, i) => (
          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <p style={{ position: "absolute", bottom: "28px", color: "#1E3A6E", fontSize: "10px", letterSpacing: "3px", margin: 0 }}>POWERED BY EDUAMIGO</p>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  )
}

function Protected({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  return (
    <div style={{ position: 'relative', width: '100%', ...(isAdmin ? { minHeight: '100vh' } : { height: '100%' }) }}>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />

        {/* Student */}
        <Route path="/student/home"          element={<Protected role="student"><StudentHome /></Protected>} />
        <Route path="/student/attendance"    element={<Protected role="student"><StudentAttendance /></Protected>} />
        <Route path="/student/result"        element={<Protected role="student"><StudentResult /></Protected>} />
        <Route path="/student/fee"           element={<Protected role="student"><StudentFee /></Protected>} />
        <Route path="/student/bus"           element={<Protected role="student"><StudentBus /></Protected>} />
        <Route path="/student/timetable"     element={<Protected role="student"><Timetable /></Protected>} />
        <Route path="/student/notes"         element={<Protected role="student"><Notes /></Protected>} />
        <Route path="/student/apply-leave"   element={<Protected role="student"><StudentApplyLeave /></Protected>} />
        <Route path="/student/notifications" element={<Protected role="student"><StudentNotifications /></Protected>} />
        <Route path="/student/chat"          element={<Protected role="student"><StudentChat /></Protected>} />
        <Route path="/student/profile"       element={<Protected role="student"><StudentProfile /></Protected>} />

        {/* Teacher */}
        <Route path="/teacher/home"          element={<Protected role="teacher"><TeacherHome /></Protected>} />
        <Route path="/teacher/attendance"    element={<Protected role="teacher"><TeacherAttendance /></Protected>} />
        <Route path="/teacher/marks"         element={<Protected role="teacher"><TeacherMarks /></Protected>} />
        <Route path="/teacher/upload"        element={<Protected role="teacher"><TeacherUpload /></Protected>} />
        <Route path="/teacher/timetable"     element={<Protected role="teacher"><TeacherTimetable /></Protected>} />
        <Route path="/teacher/leave"         element={<Protected role="teacher"><TeacherLeave /></Protected>} />
        <Route path="/teacher/notifications" element={<Protected role="teacher"><TeacherNotifications /></Protected>} />
        <Route path="/teacher/profile"       element={<Protected role="teacher"><TeacherProfile /></Protected>} />
        <Route path="/teacher/chat"          element={<Protected role="teacher"><TeacherChat /></Protected>} />

        {/* Admin */}
        <Route path="/admin/home/*"          element={<Protected role="admin"><AdminHome /></Protected>} />
        <Route path="/admin/*"               element={<Protected role="admin"><AdminHome /></Protected>} />

        {/* Parent */}
        <Route path="/parent/home"           element={<Protected role="parent"><ParentHome /></Protected>} />
        <Route path="/parent/chat"           element={<Protected role="parent"><ParentChat /></Protected>} />
        <Route path="/parent/apply-leave"    element={<Protected role="parent"><ParentApplyLeave /></Protected>} />
        <Route path="/parent/notifications"  element={<Protected role="parent"><ParentNotifications /></Protected>} />
        <Route path="/parent/attendance"     element={<Protected role="parent"><ParentAttendance /></Protected>} />
        <Route path="/parent/calendar"       element={<Protected role="parent"><ParentCalendar /></Protected>} />
        <Route path="/parent/fee"            element={<Protected role="parent"><ParentFee /></Protected>} />
        <Route path="/parent/result"         element={<Protected role="parent"><ParentResult /></Protected>} />
        <Route path="/parent/bus"            element={<Protected role="parent"><ParentBus /></Protected>} />
        <Route path="/parent/profile"        element={<Protected role="parent"><ParentProfile /></Protected>} />

        {/* Driver */}
        <Route path="/driver" element={<DriverHome />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  const { colors } = useTheme()
  const isAdmin = location.pathname.startsWith('/admin')
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: colors.bg }}>
        <AppRoutes />
      </div>
    )
  }
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 390, height: '100vh', maxHeight: 844, position: 'relative', overflow: 'hidden', background: colors.bg, boxShadow: '0 40px 100px rgba(0,0,0,.6)', borderRadius: 40 }}>
        <AppRoutes />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}