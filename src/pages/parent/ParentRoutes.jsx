// src/pages/parent/ParentRoutes.jsx

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import ParentHome          from "../pages/parent/Home";
import ParentChat          from "../pages/parent/Chat";
import ParentAttendance    from "../pages/parent/Attendance";
import ParentCalendar      from "../pages/parent/Calendar";
import ParentNotifications from "../pages/parent/Notifications";
import ParentProfile       from "../pages/parent/Profile";

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
        <Route path="calendar"      element={<ParentCalendar />} />
        <Route path="notifications" element={<ParentNotifications />} />
        <Route path="profile"       element={<ParentProfile />} />
        <Route path="*"             element={<Navigate to="home" replace />} />
      </Routes>
    </ParentGuard>
  );
}

// App.jsx mein add karo:
// import ParentRoutes from "./routes/ParentRoutes";
// <Route path="/parent/*" element={<ParentRoutes />} />