# Route and workflow audit

Inventory: `ROUTE_INVENTORY.md` (88 routes, generated from the source). This file states the audited status by group. "Verified" = a browser
or API test exercised it in the runs listed in TEST_RESULTS.md.

| Group | Routes | Status | Evidence | Open |
|---|---|---|---|---|
| Public website (`/welcome`, `/`, `/privacy`) | 3 | COMPLETE_VERIFIED | landing.spec (incl. privacy), axe, 320-1920 px | terms of use missing (legal text) |
| Sign-in, school selection, forgot/reset/change password | 6 | COMPLETE_VERIFIED | auth.spec, auth-and-navigation | |
| Student portal (13) | 13 | PARTIAL | dashboards.spec, workflows, interactions, responsive sweep; `/student/learn` layout failures predate this work | Learn page layout tests |
| Parent portal | ~12 | COMPLETE_VERIFIED (functional) | dashboard-parent.spec, workflows | real payment UNVERIFIED |
| Teacher portal | 10 | COMPLETE_VERIFIED (functional) | dashboards.spec, workflows; marks scope in backend tests | |
| Admin portal screens | ~45 | PARTIAL | generic sweeps (dead-click crawl, responsive, keyboard, accessible names), plus targeted specs for dashboard, roles, staff, assignments | most admin screens had no new per-screen visual review in this program |
| `/admin/roles`, `/admin/user-management` (roles), `/admin/staff`, teacher profile assignments | 4 | COMPLETE_VERIFIED | roles.spec (4), screenshots in `screens/` | |
| Driver screen | 1 | COMPLETE_VERIFIED (simulated GPS) | bus-live.spec | real device UNVERIFIED |
| Platform owner console | separate app | UNVERIFIED here | not in this repository | |

Role access to portals: student/parent/teacher stay in their portals; admin, accountant and staff use `/admin`; a teacher with extra
duties can also open `/admin` (menus follow permissions) and returns via "Teacher portal"; verified in `roles.spec.js`. Opening another
role's portal redirects to the person's own.

## Update 2026-10-24
All listed routes now have a screenshot at 1440, 768 and 390 in Chrome; 1440 and 390 in Firefox and WebKit; the student pages also in dark. Individually inspected: every screen named in DESIGN_REVIEW.md plus forgot password, parent and teacher notifications, teacher chat and the live-bus screens. axe 0 violations (WCAG 2 A/AA) on all of them. Open: phone sheets 3 of 10 and tablet sheets 13 of 16 not looked at one by one; real Safari, screen readers and devices UNVERIFIED.

## Closing update 2026-10-24
Every route screenshot (1440, 768, 390) was viewed at contact-sheet scale; tablet table clipping fixed on Students, Salaries, Teachers, HR and Fee Collection. Full Chrome suite 308 passed, 0 failed; axe 0 violations.
