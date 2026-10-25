// Mirrors the backend policy (src/config/permissions.js) for showing or hiding screens.
// The server is always the real gatekeeper; this only keeps the UI honest.
const ADMIN = "*";
const FALLBACK = {
  admin: ADMIN,
  accountant: ["students.read", "parents.read", "fees.read", "fees.collect", "fees.structure"],
  staff: [],
};

// What every teacher has from the teacher role itself. A teacher whose permissions go beyond this was given extra duties
// (for example fee collection or admissions) and also gets the school office screens for them.
const TEACHER_BASE = ["students.read", "teachers.read", "attendance.mark", "marks.enter", "results.read", "leaves.review", "notes.upload"];

export function permissionsOf(user) {
  if (!user) return [];
  if (Array.isArray(user.permissions)) return user.permissions;
  return FALLBACK[user.role] || [];
}

export function can(user, permission) {
  if (!permission) return true;
  const perms = permissionsOf(user);
  return perms === ADMIN || perms.includes(permission);
}

// Whether the person uses the school office (admin) portal: office roles always do, a teacher only when given extra duties.
export function usesOfficePortal(user) {
  if (!user) return false;
  if (["admin", "accountant", "staff"].includes(user.role)) return true;
  if (user.role !== "teacher") return false;
  const perms = permissionsOf(user);
  return perms === ADMIN || perms.some((p) => !TEACHER_BASE.includes(p));
}

export const ROLE_LABELS = {
  staff: "School staff",
  admin: "Administrator",
  accountant: "Accountant",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};
