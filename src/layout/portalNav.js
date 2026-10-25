import {
  House, Bus, BookOpen, MessageCircle, User, CalendarCheck, BarChart3, CreditCard, CalendarDays,
  Bell, Sparkles, Upload, ClipboardList, GraduationCap, Clock, Users, Calendar, BookOpenCheck,
} from "lucide-react";

// One place for each portal's navigation. The bottom bar (phones and tablets) keeps the five tabs and labels
// the apps have always had; the sidebar (from 1024 px) lists every screen of the portal.
// `feature` hides an item when the school's plan does not include it (see utils/features.js).
export const PORTAL_NAV = {
  student: {
    label: "Student Portal",
    home: "/student/home",
    bottom: [
      { icon: House, label: "Home", path: "/student/home" },
      { icon: Bus, label: "Bus", path: "/student/bus" },
      // Results and Learning AI are part of Learning (see the sidebar), so the Learn tab is the current one on those screens.
      { icon: BookOpen, label: "Learn", path: "/student/notes", also: ["/student/result", "/student/learn", "/student/homework"] },
      { icon: MessageCircle, label: "Chat", path: "/student/chat" },
      { icon: User, label: "Me", path: "/student/profile" },
    ],
    sections: [
      { title: null, items: [
        { icon: House, label: "Home", path: "/student/home" },
        { icon: Bell, label: "Notifications", path: "/student/notifications" },
      ] },
      { title: "Learning", items: [
        { icon: Clock, label: "Timetable", path: "/student/timetable" },
        { icon: BookOpenCheck, label: "Homework", path: "/student/homework" },
        { icon: BookOpen, label: "Notes", path: "/student/notes" },
        { icon: Sparkles, label: "Learning AI", path: "/student/learn" },
        { icon: BarChart3, label: "Results", path: "/student/result" },
        { icon: CalendarCheck, label: "Attendance", path: "/student/attendance" },
      ] },
      { title: "School", items: [
        { icon: CreditCard, label: "Fee Status", path: "/student/fee" },
        { icon: Bus, label: "Live Bus", path: "/student/bus" },
        { icon: CalendarDays, label: "Apply Leave", path: "/student/apply-leave" },
        { icon: MessageCircle, label: "Chat", path: "/student/chat" },
      ] },
      { title: "Account", items: [{ icon: User, label: "My Profile", path: "/student/profile" }] },
    ],
  },
  teacher: {
    label: "Teacher Portal",
    home: "/teacher/home",
    bottom: [
      { icon: House, label: "Home", path: "/teacher/home" },
      { icon: CalendarCheck, label: "Attendance", path: "/teacher/attendance" },
      { icon: Upload, label: "Upload", path: "/teacher/upload" },
      { icon: MessageCircle, label: "Messages", path: "/teacher/chat" },
      { icon: User, label: "Me", path: "/teacher/profile" },
    ],
    sections: [
      { title: null, items: [
        { icon: House, label: "Home", path: "/teacher/home" },
        { icon: Bell, label: "Notifications", path: "/teacher/notifications" },
      ] },
      { title: "Classes", items: [
        { icon: CalendarCheck, label: "Take Attendance", path: "/teacher/attendance" },
        { icon: ClipboardList, label: "Enter Marks", path: "/teacher/marks" },
        { icon: BookOpenCheck, label: "Homework", path: "/teacher/homework" },
        { icon: Upload, label: "Upload Notes", path: "/teacher/upload" },
        { icon: Clock, label: "My Timetable", path: "/teacher/timetable" },
        { icon: GraduationCap, label: "My Students", path: "/teacher/students" },
      ] },
      { title: "Communication", items: [
        { icon: MessageCircle, label: "Parent Messages", path: "/teacher/chat" },
        { icon: CalendarDays, label: "Leave Request", path: "/teacher/leave" },
      ] },
      { title: "Account", items: [{ icon: User, label: "My Profile", path: "/teacher/profile" }] },
    ],
  },
  parent: {
    label: "Parent Portal",
    home: "/parent/home",
    bottom: [
      { icon: House, label: "Home", path: "/parent/home" },
      { icon: MessageCircle, label: "Teachers", path: "/parent/chat" },
      { icon: CreditCard, label: "Fees", path: "/parent/fee" },
      { icon: Bell, label: "Alerts", path: "/parent/notifications" },
      { icon: User, label: "Me", path: "/parent/profile" },
    ],
    sections: [
      { title: null, items: [
        { icon: House, label: "Home", path: "/parent/home" },
        { icon: Bell, label: "Alerts", path: "/parent/notifications" },
      ] },
      { title: "My child", items: [
        { icon: BookOpenCheck, label: "Homework", path: "/parent/homework" },
        { icon: CalendarCheck, label: "Attendance", path: "/parent/attendance" },
        { icon: BarChart3, label: "Results", path: "/parent/result" },
        { icon: CreditCard, label: "Fee Status", path: "/parent/fee" },
        { icon: Bus, label: "Track Bus", path: "/parent/bus" },
        { icon: CalendarDays, label: "Apply Leave", path: "/parent/apply-leave" },
      ] },
      { title: "School", items: [
        { icon: MessageCircle, label: "Chat Teachers", path: "/parent/chat" },
        { icon: Calendar, label: "School Calendar", path: "/parent/calendar" },
      ] },
      { title: "Account", items: [{ icon: Users, label: "My Profile", path: "/parent/profile" }] },
    ],
  },
};

// A tab is active on its own screen and on screens under it (e.g. /parent/fee/...).
export const isActivePath = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

export const portalOf = (pathname) => (pathname.startsWith("/student") ? "student" : pathname.startsWith("/teacher") ? "teacher" : pathname.startsWith("/parent") ? "parent" : null);
