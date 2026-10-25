# Requirements matrix

Statuses: COMPLETE_VERIFIED, PARTIAL, MISSING, BLOCKED, UNVERIFIED (definitions in the program brief). "Verified" means an automated test
or a recorded run backs it; it does not mean it was tried on real data, real phones or a production deployment. Updated 2026-10-23.

| ID | Requirement | Pri. | Status | Evidence | Limits / remaining |
|---|---|---|---|---|---|
| A1 | Architecture understood and documented | P1 | COMPLETE_VERIFIED | ARCHITECTURE.md, DECISIONS.md, TENANT_ISOLATION.md | |
| A2 | Tenant isolation on every route | P0 | COMPLETE_VERIFIED (automated) | isolation sweep, tenant guard, access matrix, new-suite cross-school cases | wildcard tenant hosts need DNS (not set up); background jobs and platform routes scope themselves |
| B1 | One central source of effective permissions | P0 | COMPLETE_VERIFIED | `services/authorization.js`; `tests/authorization.test.js` incl. static guards | |
| B2 | Roles as data, templates, create/edit/deactivate/assign, preview | P0 | COMPLETE_VERIFIED | `tests/school-roles.test.js` (38), `e2e/roles.spec.js` | |
| B3 | No privilege escalation (delegation, self-assignment, admin role, last admin) | P0 | COMPLETE_VERIFIED | same suite | |
| B4 | Immediate revocation | P0 | COMPLETE_VERIFIED | per-request resolution; revocation test | cost: one indexed query per staff request (skipped for students/parents) |
| B5 | Multiple responsibilities per person | P1 | COMPLETE_VERIFIED | extra roles on teacher/accountant/staff; widest scope wins; fail closed | administrators cannot hold extra roles (they hold everything) |
| B6 | Class/subject scope without cross-product | P0 | PARTIAL | `TeachingAssignment`; marks entry and marking list enforced; migration + report | other actions (attendance, notes) are class-level; the class-teacher flag is informational |
| B7 | AI assistant authorisation | P0 | PARTIAL | `tests/assistant-roles.test.js`; security tests | decides by account type; custom roles do not widen it (safe); not mapped to permissions |
| C1 | Guided onboarding by school size | P1 | PARTIAL | `School.profile.size`, recommendations endpoint and banner, optional setup step, tests | no new multi-step wizard; existing School Setup checklist reused; readiness steps do not verify module configuration beyond counts |
| C2 | Non-teaching staff records | P1 | PARTIAL | `StaffProfile`, `/api/staff`, Office staff screen, tests | payroll and staff leave still teacher-only |
| D1 | Public site, sign-in, recovery, dashboards redesign | P1 | COMPLETE_VERIFIED | e2e landing/auth/dashboards; axe on dashboards | reference design image never received |
| D2 | Privacy and terms | P1 | PARTIAL | plain "Privacy and data handling" page, honest banner | formal policy and terms of use need legal text: BLOCKED on the owner |
| E1 | Fees: structures, collection, receipts, idempotency | P0 | COMPLETE_VERIFIED (test mode) | fee tests, `e2e/fee-idempotency.spec.js` | live Razorpay never exercised: UNVERIFIED |
| E2 | Attendance, marks, exams, report cards, leave | P0 | COMPLETE_VERIFIED (API level) | module suites; scope tests | |
| E3 | Live bus tracking | P1 | COMPLETE_VERIFIED (simulated GPS) | `e2e/bus-live.spec.js` | real phone GPS and Firebase rules UNVERIFIED |
| E4 | Library, inventory, other modules | P2 | PARTIAL | library exists and is tested; inventory/counsellor/nurse modules do not exist | not built |
| F1 | Every route inventoried and audited | P1 | PARTIAL | ROUTE_INVENTORY.md (88 routes); ROUTE_AUDIT.md; DESIGN_REVIEW.md (78 screens toured at 3 widths, about 70 inspected on desktop) | about 20 phone/tablet shots and a few desktop screens not individually inspected |
| F2 | No dead buttons | P1 | PARTIAL | `e2e/dead-click-crawl.spec.js`, interaction specs | not every dialog of every screen exercised |
| G2 | Dark mode | P2 | PARTIAL | student portal switch; student and parent pages verified; teacher and admin not dark-ready (not supported, no longer leaked into) | no switch outside student |
| G3 | Cross-browser | P2 | PARTIAL | Firefox and WebKit tours; smoke 138/140 with both exceptions explained by probes; full Chrome suite 308/0 failed | real Safari and Edge UNVERIFIED |
| G1 | Responsive and accessible UI | P1 | PARTIAL | all 26 phone/tablet contact sheets viewed, tablet table clipping fixed, 234 screenshots, 0 axe violations, full suite 308/0 failed | no screen-reader pass, no real devices |
| H1 | Performance | P2 | PARTIAL | build sizes recorded (main chunk 397 kB / 128 kB gzip) | no new load test run; `loadtests/` exists |
| H2 | Observability | P2 | PARTIAL | health, request ids, audit log | no monitor, alerting or error tracker configured: BLOCKED on hosting decisions |
| I1 | Content-Security-Policy, MFA for platform owner | P1 | MISSING | SECURITY_REVIEW.md O1, N1 | needs production origins and the console app |
| I2 | Dependency vulnerabilities | P2 | PARTIAL | `npm audit` recorded; fix not applied (downgrade) | |
| J1 | Production deployment | P0 | BLOCKED | DEPLOYMENT_RUNBOOK.md | not authorised and not performed; infrastructure not inspected |
