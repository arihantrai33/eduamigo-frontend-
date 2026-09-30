// Mirrors the backend policy (src/config/permissions.js) for showing or hiding screens.
// The server is always the real gatekeeper; this only keeps the UI honest.
const ADMIN = "*";
const FALLBACK = {
  admin: ADMIN,
  accountant: ["students.read", "parents.read", "fees.read", "fees.collect", "fees.structure"],
};

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

export const ROLE_LABELS = {
  admin: "Administrator",
  accountant: "Accountant",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};
