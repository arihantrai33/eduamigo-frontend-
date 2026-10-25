# Architecture: current state and target

## 1. Current state (verified in code)
| Layer | Evidence |
|---|---|
| Stack | React 19 + Vite PWA + Capacitor shells; Node/Express 5 + Mongoose 9 + MongoDB; modular monolith (33 route files, 29 controllers, 31 services, 51 models) |
| Tenancy | Shared collections; `school` on every tenant model; `protect` derives `req.schoolId` from the DB user; `config/tenantGuard.js` rejects unscoped queries; tests `isolation-sweep`, `tenant-guard`, `tenant-delete-paths`, `auth-boundaries` |
| Identity | `User`: one account = one school + one `role` (`superadmin admin accountant teacher student parent driver`); `tokenVersion` revocation; school-less mobile sign-in with a ticket for several schools (`login-school-choice`) |
| Platform | separate `superadmin` account type, `/api/platform`, token scope `platform`, separate `eduamigo-console` app; audit log of privileged actions |
| Authorization | `config/permissions.js`: 31 permission keys and a static `ROLE_PERMISSIONS` map; `requirePermission` on 121 routes; 5 direct `hasPermission(role, …)` calls; plan gating `requireFeature` + `PERMISSION_FEATURE` |
| Record scope | `utils/classes.js: teacherCoversClass`, `services/directory.js: canAccessStudent`, `childrenForParent`, `studentForUser`; ~42 `role ===` branches in controllers/services; `'admin'` literal in `eventController`, `noteController`, `reportCardController`, `directory.js` |
| Staff model | `Teacher` (subjects[], assignedClasses[], salary); `Salary` and `StaffLeave` reference only `Teacher`; admin and accountant have no employee record |
| School structure | `SchoolClass` (sections, classTeacher, subjects), `AcademicSession`, `StudentEnrollment`; `academic.setupStatus` checklist; no size or staffing profile on `School` |
| AI | `assistant/*` (EduAmigo Ask, role-keyed domains, ticket-only write), `learning/*` (tutor, practice, planner) |
| Frontend | four portals (`PortalShell` + `portalNav`), admin shell with permission-filtered `NAV`, shared dashboard components `src/components/dash`, website and auth screens, 85 routes (`ROUTE_INVENTORY.md`) |

## 2. Target (adapted to the stack; decisions in `DECISIONS.md`)
1. **Authorization core:** `effectivePermissions(user, entitlements)` is the only place permissions are resolved; every check goes through it. Scope is derived from trusted records by one scope service, not per controller.
2. **Roles:** tenant-scoped `SchoolRole` documents seeded from templates. System roles `admin accountant teacher` are seeded with exactly today's permissions (parity test). `User.role` stays as the account type and portal.
3. **Multiple responsibilities:** `User.extraRoles` (staff accounts only): effective permissions = base role ∪ extra roles, capped by plan entitlements.
4. **Assignments:** structured `TeachingAssignment` (class, section, subject, class-teacher flag), migrated from `assignedClasses × subjects` with a comparison report.
5. **School profile and onboarding:** `School.profile` (size band, structure) drives recommended templates and checklist steps, always editable.
6. **Staff:** `StaffProfile` for non-teaching staff; payroll and leave later made polymorphic.
7. **Safeguards:** no self-promotion, no delegating what the actor lacks, last-admin protection, audit events, token revocation on any role change.
