import { createElement } from "react";
import { useLocation } from "react-router-dom";
import {
  BadgeDollarSign, BarChart2, BookOpenCheck, Bell, BookOpen, Briefcase, Bus, CalendarCheck, Clock, CreditCard, FileBadge, FileText, GraduationCap, History,
  KeyRound, Layers, LayoutDashboard, LifeBuoy, MessageCircle, MessageSquareText, Notebook, School, Settings, Shield, TrendingUp, UserCircle, Users,
} from "lucide-react";
import { PORTAL_NAV } from "../../layout/portalNav";

// The screen's own icon for the header chip, taken from the portal's navigation (student, teacher, parent) or, for the school office,
// from a short table of its screens. The longest matching path wins, so /student/homework is Homework, not Home.
const ADMIN = {
  "/admin/academic": GraduationCap, "/admin/year-end": Layers, "/admin/admissions": FileText, "/admin/students": Users, "/admin/teachers": School,
  "/admin/timetable": Clock, "/admin/homework": BookOpenCheck, "/admin/exams": BookOpen, "/admin/results": FileBadge, "/admin/attendance-reports": CalendarCheck, "/admin/attendance": CalendarCheck,
  "/admin/fee-structure": Layers, "/admin/fees": BadgeDollarSign, "/admin/fee-reports": TrendingUp, "/admin/leaves": Notebook, "/admin/hr-management": BadgeDollarSign,
  "/admin/staff": Briefcase, "/admin/parents": UserCircle, "/admin/communications": Bell, "/admin/chat": MessageCircle, "/admin/event-calendar": CalendarCheck,
  "/admin/library": BookOpen, "/admin/transport": Bus, "/admin/id-card-generator": CreditCard, "/admin/bulk-operations": Layers, "/admin/user-management": Shield,
  "/admin/roles": KeyRound, "/admin/reports": BarChart2, "/admin/activity": History, "/admin/ask": MessageSquareText, "/admin/settings": Settings, "/admin/support": LifeBuoy,
};

const table = [
  ...Object.entries(ADMIN),
  ...Object.values(PORTAL_NAV).flatMap((p) => p.sections.flatMap((s) => s.items.map((i) => [i.path, i.icon]))),
].sort((a, b) => b[0].length - a[0].length);

// The icon element for the current screen (or null).
export function usePageIcon(size = 22) {
  const { pathname } = useLocation();
  const hit = table.find(([p]) => pathname === p || pathname.startsWith(`${p}/`));
  const icon = hit ? hit[1] : pathname.startsWith("/admin") ? LayoutDashboard : null;
  return icon ? createElement(icon, { size }) : null;
}
