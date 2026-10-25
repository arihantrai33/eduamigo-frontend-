# Implementation plan

Status key: done / in progress / planned / blocked. Updated in `PROGRESS.md`.

| Phase | Work | Depends on | Status |
|---|---|---|---|
| 0 | Baseline, route inventory, architecture and plan | none | done |
| 1 | `effectivePermissions` seam; tests for parity, unknown role, inactive user, plan cap; use it in middleware and the five direct callers | 0 | done |
| 2 | Scope service; replace `'admin'` literals and `role ===` branches resource by resource (events, notes, report cards, directory, students, leaves, attendance, marks, exams) | 1 | done |
| 3 | `SchoolRole` model, seeding migration, DB-backed resolver, role templates (guide section 5), role admin API and UI, safeguards, audit | 1, 2 | done (backend + UI + e2e); docs pending |
| 4 | `User.extraRoles` (done in 3), revocation (done), `TeachingAssignment` + migration + comparison report | 3 | done |
| 5 | `School.profile`, guided onboarding, template recommendations | 3 | partial (size setting, suggestions, optional step; no new wizard) |
| 6 | `StaffProfile`, HR/leave generalisation; review of transport, library, finance, communication workflows | 4 | partial (StaffProfile done; payroll/leave and the workflow review not done) |
| 7 | AI authorization review per effective permissions; performance profiling; operations docs | 3 | partial (assistant verified fail-closed; docs written; no profiling run) |
| 8 | Visual consistency pass over every route family, screenshots, accessibility | parallel | partial (new screens, dashboards, auth, landing) |
| 9 | Full regression, deployment and operations runbooks, release readiness | all | done for local/test; staging and production not done |

Rule for every task: tests first (or with), smallest change, targeted tests, related suites, diff review, docs.
