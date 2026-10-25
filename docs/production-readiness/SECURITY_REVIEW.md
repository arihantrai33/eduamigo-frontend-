# Security review

Scope: both repositories as they stand on 2026-10-23, reviewed by reading code and running tests and probes with synthetic data in
in-memory databases. No production system, real data or external service was touched. This is a practical review, not a penetration test
and not a certification; nothing here means the product is "fully secure".

Earlier detailed audit: `docs/audit/SECURITY_AUDIT.md` (S1 to S5 fixed, O1 to O8 open). This file adds what the access-control program found
and changed, and states what is still open.

## Confirmed findings fixed in this program (each has a test that failed before the fix)
| # | Sev. | Finding | Fix | Test |
|---|---|---|---|---|
| A1 | Medium | A teacher received school-wide student lists (class distribution, recent enrolments with fee status) and a school-wide pending-leave count from the dashboard endpoint | `services/dashboard.js` uses scope | `tests/dashboard.test.js` |
| A2 | Medium | A parent or student could read the timetable of any class | `assertMayViewClass` in `timetableController` | `tests/auth-boundaries.test.js` |
| A3 | Medium | The office had no way to see safety (SOS) notifications | Admin inbox | `e2e/dashboards.spec.js` |
| A4 | Medium | User management alone could create an administrator, a route to a bigger role than your own | Creating an admin needs full administrator rights | `tests/school-roles.test.js` |
| A5 | Medium | The only active administrator could be deactivated, locking the school out | 409 on deactivating the last one | `tests/school-roles.test.js` |
| A6 | Low | A teacher without a teacher profile saw all pending student leaves | Fail closed: covers nothing | `tests/scope.test.js` |
| A7 | Medium | A teacher with several classes and several subjects could act on every class-subject combination (marks) | Teaching assignments; migration reports who was over-granted | `tests/teaching-assignments.test.js` |
| A8 | Low | The web app acted on saved permissions before the server confirmed them at start | App waits for the profile answer | `e2e/roles.spec.js` |
| A9 | Low | New `staff` account type looped between `/staff/home` and `/` | Home/next/change-password map staff to the office portal | `e2e/roles.spec.js` |

## New access-control design: what was verified
- One decision point (`services/authorization.js`) with parity to the original table, deny by default, plan cap: `tests/authorization.test.js`; static tests fail if code reads roles directly.
- Roles are data and resolved per request; a revoked or switched-off role stops working on the next request; roles of another school give nothing: `tests/school-roles.test.js` (cross-tenant, revocation, deactivated role cases).
- Delegation: a person cannot give permissions or wider scopes than they hold, cannot change or assign their own roles, cannot hand out the administrator role, cannot change a role they hold; built-in roles are immutable; every change is audited.
- Every new route is in the route x account-type matrix and the isolation sweep.
- The AI assistant does not widen for custom roles or staff accounts (`tests/assistant-roles.test.js`).

## Open (not fixed here)
| # | Sev. | Item | Note |
|---|---|---|---|
| O1 | Medium | No Content-Security-Policy; token in `localStorage` | Needs production origins; see SECURITY_AUDIT.md |
| O2 | Medium | Demo-request data has no retention rule; a TTL index was not added because deleting real data needs an owner decision | decide period and who reads rows |
| O3 | Low-Med | Driver secret is in the URL path | by design today |
| O4-O5, O7, O8 | Low | Live stream outlives the session; SOS double notify race; bus number uniqueness by check; four hand-built auth headers | see SECURITY_AUDIT.md |
| N1 | Medium | No MFA for the platform owner console | the console is a separate app, not reviewed here |
| N2 | Info | Assistant authorisation is by account type, not effective permissions; custom roles do not give it more | safe (under-grant); a later step could map domains to permissions |
| N3 | Low | `Salary` and `StaffLeave` are tied to teachers; office staff have no payroll | documented limitation |
| N4 | Info | Dependency audit: backend 8 moderate (`firebase-admin` / Google Cloud chain), frontend 5 high (`firebase` / `@capacitor-firebase/messaging` chain). npm's suggested fix downgrades packages and was not applied | needs its own bus-tracking test |
| N5 | Medium | Privacy policy and terms of use are not written: a plain "Privacy and data handling" page exists and says it is not the formal policy | needs legal text and company details |

## Not verified
Deployed configuration (secrets, `CORS_ORIGINS`, Atlas network rules, Firebase rules), live payment, email and AI providers, behaviour behind
the real CDN, and a running-deployment penetration test (needs the owner's authorisation).
