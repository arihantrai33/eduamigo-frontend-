import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ParentHome          from "./Home";
import ParentChat          from "./Chat";
import ParentAttendance    from "./Attendance";
import ParentResult        from "./Result";
import ParentFee           from "./Fee";
import ParentBus           from "./Bus";
import ParentCalendar      from "./Calendar";
import ParentNotifications from "./Notifications";
import ParentProfile       from "./Profile";
import ParentApplyLeave    from "./ApplyLeave";

function ParentGuard({ children }) {
  const { user } = useAuth();
  if (!user)                  return <Navigate to="/login" replace />;
  if (user.role !== "parent") return <Navigate to="/login" replace />;
  return children;
}

export default function ParentRoutes() {
  return (
    <ParentGuard>
      <Routes>
        <Route path="home"          element={<ParentHome />} />
        <Route path="chat"          element={<ParentChat />} />
        <Route path="attendance"    element={<ParentAttendance />} />
        <Route path="result"        element={<ParentResult />} />
        <Route path="fee"           element={<ParentFee />} />
        <Route path="bus"           element={<ParentBus />} />
        <Route path="calendar"      element={<ParentCalendar />} />
        <Route path="notifications" element={<ParentNotifications />} />
        <Route path="profile"       element={<ParentProfile />} />
        <Route path="apply-leave"   element={<ParentApplyLeave />} />
        <Route path="*"             element={<Navigate to="home" replace />} />
      </Routes>
    </ParentGuard>
  );
}
