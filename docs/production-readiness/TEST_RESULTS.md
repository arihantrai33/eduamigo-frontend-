# Test results

All runs on this machine (macOS, Chrome via Playwright `channel: 'chrome'`), 2026-10-23, in-memory MongoDB, synthetic data, AI providers off.
Nothing was run against a deployed environment.

## Backend: `npx jest --runInBand`
**58 suites, 1182 tests passed, 0 failed, 0 skipped** (186 s). Growth during the program: 979 (baseline) -> 1005 (scope) -> 1133 (roles) -> 1182.
New suites: `authorization`, `scope`, `school-roles` (38), `teaching-assignments` (8), `staff-profiles` (2), `assistant-roles` (4), plus
additions to `migration`, `access-matrix` (now includes staff, roles, assignments and staff routes), `dashboard`, `auth-boundaries`.

## Frontend build and lint
- `npm run build`: passes. Main chunk 397 kB (128 kB gzip); the live-bus map chunk 365 kB and Learn 210 kB load only on their screens.
- `npm run lint`: 153 problems (134 errors, 19 warnings), the same count as the baseline and fewer than the 160 at the start of the dashboard
  work. None are in the new `Roles`, `OfficeStaff`, `TeachingAssignments` or `Privacy` files; remaining errors are older code
  (setState in effects, fast-refresh exports).

## Browser suite (Playwright)
The suite was run in parts because 20 older layout tests never finish (known, see below):
| Part | Result |
|---|---|
| First 185 tests in file order (auth ... landing), with the new roles code | 184 passed, 1 failed (`dashboards: student sweep 320-1920`, timed out at 45 s; **passed on rerun**) |
| Remaining files except `layout-alignment` (126 tests) | 109 passed, 15 skipped, 2 failed (`landing: signed-in person opening "/"`, `learning-completion: AI allowance`), both timed out at 45 s on the first try and **passed on rerun**; cause of the one-off timeouts not established (slow start of the dev server is the likely reason) |
| `roles.spec.js` (4 tests, new) | 4 passed |
| Re-run of specs for screens changed late (accessible-names, dead-click-crawl, controls, interactions, admin-keyboard, functional-fixes, error-feedback) | 56 passed, 4 skipped, 0 failed |

**`layout-alignment.spec.js`** (30 tests): the older "never finishing" tests were caused by `waitForLoadState('networkidle')` on the live-bus page, whose
stream keeps the network busy; the test now waits for the bus header card on that page (test-infrastructure fix, no assertion weakened).
Result: **25 passed, 5 failed**. All five failures are the same single page, `/student/learn` (title at x=383 where the shared frame expects 292; title
top 31 where 28 is expected): the Learning AI header sits differently from every other page. This predates the access-control work (the Learning AI
screen was changed in commit c3961b9) and was not fixed here.
Skipped tests are skips already in the suite (device-specific); none were added or weakened by this work.

## Assistant routing evaluation (`npm run assistant:eval`, keywords only, no model)
Overall 276 questions: routing 93.5%, action 92.8%, both 89.1%. Development set 99.4%, holdout 100%, unseen 90.2%, **fresh 66.7%** (mostly
Hinglish phrasing the keyword router misses; the model-assisted path was not run here because no provider key is configured). Answered
without asking: 226 questions, 95.1% right. These numbers describe routing only, not answer quality with a live model.

## Not run / could not run
Live Razorpay, email, Cloudinary, Firebase and AI providers; real GPS; physical iPhone/Android; Safari, Firefox, Edge; screen readers;
load test; any run against staging or production.

## Visual pass (later run, same day)
Full Playwright suite after the visual changes: **308 passed, 19 skipped, 0 failed** (including all 30 `layout-alignment` tests: the five `/student/learn` failures were a measurement issue in the test, fixed by measuring the header panel). Targeted re-run after the last edits (auth, interactions, accessible-names, screens, bus-live, navigation, ux-regressions, workflows, unsaved changes, controls): 118 passed. Owner console: 6 passed, build passes. Frontend build passes; lint 153 problems (unchanged).

## Completion pass (2026-10-24)
Full Chrome suite: 307 passed, 19 skipped, 1 failed (parent notifications in dark mode, from my first dark-mode gate); fixed by including parent pages; `notice-theme` 4 of 4 pass. Cross-browser smoke (Firefox and WebKit, `playwright.cross-browser.config.js`; auth, roles, landing, dashboard-parent): 138 passed, 2 failed (Firefox: decorative SVG measured outside the viewport at 768 px with no page scroll; WebKit: Tab does not focus buttons, a Safari-engine default). axe-core 4.10 WCAG 2 A/AA over 92 page loads: 7 violations first, 0 after fixes. Build passes. Lint (src and e2e): 148 problems (older code). Not run: real Safari, screen readers, physical devices; full suite after the last edits.

## Closing pass (2026-10-24, final code)
Chrome Playwright full suite: **308 passed, 19 skipped, 0 failed** (31.2 min). axe-core WCAG 2 A/AA over 92 page loads: **0 violations**. Firefox and WebKit smoke: 138 passed, 2 failed (both investigated: a clipped decorative SVG in Firefox, and Tab not focusing buttons in the Safari engine, where Alt+Tab reaches them). Build passes. Backend suite not re-run (no backend change in this pass; last run 58 suites, 1182 tests passed). Unverified: real Safari and Edge, screen readers, physical devices.

## Owner console and integrations (2026-10-24)
Backend `npx jest --runInBand`: **59 suites, 1201 tests passed** (19 new in `tests/integrations.test.js`: local SMTP server, mocked SMS providers, test-mode OTP). Console Playwright (mocked platform API): **13 passed** (7 new). Console lint and build: clean. Manual run against the real demo backend with a local SMTP sink: connection check, test message acceptance and OTP request all worked. **Not run:** any real mail provider, any real SMS provider, axe or Firefox/WebKit on the console, the console in dark mode (not supported).

## Integration security review (2026-10-24)
Backend full suite: **59 suites, 1210 tests passed** (9 more integration tests: address-spelling guard, key rotation, production key requirement, masking, test-mode safety, explicit real-send, simultaneous code requests, rate limit, SMTP failure path). Password-reset and authentication suites are part of that run and passed. Console: lint clean, build passes, **15 Chrome tests passed; 30 passed in Firefox and WebKit** (the same 15 each). axe-core WCAG 2 A/AA on the console over 10 pages at desktop and phone width: 12 findings first (nav group label contrast, three scrolling tables not keyboard-focusable), **0 after fixes**. Not done: real provider calls, a live DNS-rebinding test, real Safari.

## Owner console redesign and operations (2026-10-24)
Backend `npx jest --runInBand`: **60 suites, 1221 passed** (11 new in `tests/platform-ops.test.js`). Console: lint clean, build passes, **22 Chrome tests passed, 44 passed in Firefox and WebKit** (mocked platform API). axe-core WCAG 2 A/AA, 16 pages at 1280 and 390 px, first run 17 findings (phone icon buttons without a name, links in text distinguished by colour only), **0 after fixes**. School app, real demo backend: `e2e/support.spec.js` (3), `roles.spec.js` (4), `dashboards.spec.js` (14): 24 passed; frontend build passes, lint 148 problems (older code). Screenshots: `screens/console-v3` (15 pages x 1440, 768, 390). Not run: the full school-app browser suite after these changes, a real mail or SMS provider, Safari, dark mode (the console has none).


## 25 October 2026 run (this programme's last pass)
| Suite | Result |
|---|---|
| Backend (`npx jest --runInBand`) | 65 suites, **1284 tests passed**, 0 failed (was 1221 before the programme; new: avatars 8, homework 9, chat-inbox 8, otp-login 7, bus +2) |
| Frontend end-to-end (Chrome, own servers on fresh ports) | 336 tests: **316 passed, 20 skipped** (the same 20 as before), 0 failed |
| Owner console end-to-end | 24 of 24 passed |
| Lint | Console clean; frontend: no errors in the files of this programme (the repository still has older errors elsewhere); builds of both pass |
| Accessibility (axe, WCAG 2 A and AA) | No violations on the student, parent, teacher and admin screens touched (homework, chat, bus, profile, home, settings) at 1280 and 390 px, after fixing the phone header subtitle contrast. The sign-in screens show contrast flags only while their entrance animation is mid-fade; at rest there are none |

Tests changed because the screens changed on purpose: `bus-layout` (now the title card and resting panel), `bus-live` (the route stays on the map and the pill says "not on route"), the student and parent chat tests, the forgot-password wording, the title-height constant (22 px under the new header), and `new-features` (added).

Run against servers started by hand without the e2e settings (`BUS_STALE_MS`, `VITE_TENANT_ROUTING`, `ROUTING_URL=off`), eight bus and tenant tests fail for that reason only; use the Playwright-started servers (leave `E2E_API_PORT` and `E2E_WEB_PORT` unset or use unused ports).

Not run: Firefox, WebKit, Edge, real phones, a screen reader, real SMS or email delivery.
