# Production-readiness report

Date: 2026-10-23. Repos: `eduamigo-frontend` (branch `feature/responsive-product`) and `eduamigo-backend` (branch `hardening/pilot-readiness`).
**Nothing is committed, pushed or deployed.** All work is in the working trees next to the owner's earlier uncommitted work.

## Executive summary
The school-facing product now has a single, tested authorization core, roles that schools can configure (built-in plus custom, from
templates), multiple responsibilities per staff member, a staff account type, exact class-subject teaching assignments for marks, size-based
role suggestions, employee records for non-teaching staff, a redesigned website, sign-in and dashboards, and an honest privacy page.
Backend: 58 suites / 1182 tests pass. Browser: all executed specs pass (a few first-try 45 s timeouts passed on rerun), except five layout checks that all concern one page (`/student/learn`, the Learning AI header position, a pre-existing difference). It is **not** verified on any real deployment, real device, live payment, live AI model or real data.

## Release recommendation
| Environment | Assessment |
|---|---|
| Local development | Ready: demo runs with synthetic data |
| Automated test environment | Ready: suites above |
| Staging | **Conditionally ready**: deploy, run the migration dry run, then the smoke test in DEPLOYMENT_RUNBOOK.md. Not tried here (no access) |
| Production | **Not ready to launch** as a paid multi-school service until: formal privacy policy and terms; CSP; monitoring and alerting; backup restore rehearsed; a staging pass with the real configuration; real-device and Safari/Firefox checks; the live payment and AI paths checked with real test accounts. A single-school pilot with a supervised rollout is reasonable after staging passes. |

## What changed
Backend: `services/authorization.js`, `services/scope.js`, `services/roles.js`, `services/teaching.js`; models `SchoolRole`, `TeachingAssignment`,
`StaffProfile`; `config/roleTemplates.js`, `config/onboardingProfiles.js`; routes `/api/roles`, `/api/staff`, `/api/teachers/:id/assignments`,
`PUT /api/users/:id/roles`; about 20 controllers and services moved from role-name checks to permission + scope; migration additions;
`protect` resolves roles per request. Frontend: `Roles.jsx`, `OfficeStaff.jsx`, `TeachingAssignments.jsx`, `Privacy.jsx`, User Management roles
dialog, portal switching for staff and teachers with extra duties, `AuthContext` waits for the server profile, Settings school size.
Earlier in the program: landing, auth, four dashboards, fee idempotency, driver-token log leak, upload type checks, tenant-host login.

## Decisions (see DECISIONS.md)
Seam first, then scope, then data-backed roles, so every step stayed shippable with parity tests; roles resolved per request instead of
cached; fail closed on scopes; administrators cannot hold extra roles; the assistant is not widened by custom roles; payroll for office
staff deferred rather than a risky schema change.

## Verified (automated)
Authorization parity and static guards; tenant isolation of every route including the new ones; role creation, editing, assignment, revocation,
delegation limits, last-administrator protection, audit; teaching assignments and the migration; assistant does not leak school data to staff
or teachers with custom roles; role UI journeys in the browser; dashboards, auth, landing, controls, accessibility checks on the screens covered.

## Partial, blocked and unverified
See REQUIREMENTS_MATRIX.md. Highlights: PARTIAL: teaching scope beyond marks, onboarding wizard depth, office-staff payroll and leave, assistant by
permission, per-screen design review of older admin pages. BLOCKED: formal legal text, monitoring, deployment. UNVERIFIED: live payments,
real GPS, push, email delivery, live AI quality, devices and other browsers, load.

## Risks and next actions
1. Decide and write the privacy policy and terms; set data-retention for demo requests. 2. Add CSP once the production origins are known.
3. Configure uptime monitoring and alerts on `/api/health`. 4. Run the staging deployment and rehearse backup and restore.
5. Ask schools to narrow teachers flagged by `teaching.cross_product_teachers_to_review`. 6. Map assistant domains to permissions so custom roles can use it.
7. Extend payroll and leave to office staff. 8. Align the Learning AI header with the shared page frame (the only failing layout check). 9. Review remaining admin screens one by one.
10. Plan the Firebase dependency upgrade with a bus-tracking test.

## Git state (at time of writing)
Frontend: 56 changed or new paths on `feature/responsive-product`; backend: 76 on `hardening/pilot-readiness`; no commits made. `_to_delete/`
(backend) and `.sweep.mjs`, `src/index.css`, the bus screens (frontend) are the owner's and were not touched.

## UI/UX completion (2026-10-24)
All routes screenshotted and (almost all) inspected; dark mode status documented and a half-dark leak fixed; Firefox/WebKit smoke 138/140; axe 0 violations. Remaining: real Safari, screen readers, devices; the full browser suite was run before the final two small edits, not after. See DESIGN_REVIEW.md.

Update 2026-10-24 (closing): full Chrome regression 308 passed / 19 skipped / 0 failed on the final code; axe 0 violations; all phone and tablet contact sheets viewed; real Safari/Edge, screen readers and devices remain unverified.
