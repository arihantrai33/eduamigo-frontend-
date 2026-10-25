# Tenant isolation

How one school is kept apart from another, where that is enforced, and how it is tested. Reviewed against the code on 2026-10-23.

## Model
Shared database, shared collections, a `school` field on every tenant record. A person belongs to exactly one school (`User.school`). The
school of a request comes from the verified user (`protect` loads the user from the database and sets `req.schoolId`); nothing the
client sends (body, query, header) chooses it. Platform-owner routes (`/api/platform`) and driver tokens are separate and cannot be
used on school routes (`protect` rejects tokens that carry a `scope`).

## Layers
| Layer | Where | What it stops |
|---|---|---|
| Identity | `middleware/authMiddleware.js` `protect` | Unknown, inactive, revoked (`tokenVersion`) or foreign-scope tokens; suspended schools |
| Query guard | `config/tenantGuard.js` (enforce) | Any query on a tenant model without exactly the request's school id throws. See backend `docs/TENANT_GUARD.md` |
| Permission | `services/authorization.js`, `requirePermission` | Actions the person's roles do not include |
| Scope | `services/scope.js`, `services/teaching.js`, `services/directory.js` | Records outside the person's classes, children or own work |
| Roles as data | `models/SchoolRole.js`, `services/roles.js` | A role id from another school cannot be assigned or edited: every lookup includes `school` |
| Tests | below | Regressions |

## New in this release (all tenant-scoped)
- `SchoolRole`: unique `{school,key}` and `{school,name}`; every service call takes the school from the request.
- `User.extraRoles`: ids are validated against the same school before they are stored; a role of another school returns 400.
- `TeachingAssignment`: `{school, teacher, class, section, subject}`; the teacher is looked up with the school first (404 across schools).
- `StaffProfile`: `{school, user}`; the user must be an office account of the same school.
- New routes `/api/roles`, `/api/staff`, `/api/teachers/:id/assignments`, `PUT /api/users/:id/roles` are in `tests/access-matrix.test.js`
  (every route x every account type) and exercised by the isolation sweep.

## Tests that prove it
`tests/tenant-guard.test.js`, `tests/tenant-delete-paths.test.js`, `tests/isolation-sweep.test.js` (walks the route table with a second school's
ids), `tests/auth-boundaries.test.js`, `tests/access-matrix.test.js`, and the cross-school cases in `tests/school-roles.test.js`,
`tests/teaching-assignments.test.js`, `tests/staff-profiles.test.js`. The whole suite runs with the guard in `enforce`.

## Not covered by the guard (known, documented)
`populate`, inserts (`school` is `required` on the models), `$lookup`, background jobs, scripts and the platform routes: those scope
themselves and have their own tests. A cross-school DNS/tenant-host scheme exists (`PLATFORM_BASE_DOMAIN`) but wildcard DNS has not been
set up; schools reach the app through the school-code screen until it is.
