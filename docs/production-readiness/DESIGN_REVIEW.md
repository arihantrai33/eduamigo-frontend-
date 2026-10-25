# Design review and whole-product visual pass

Status labels: COMPLETE_VERIFIED, PARTIAL, BLOCKED, UNVERIFIED. Updated 2026-10-23.

## Scope and inventory
- **Inventory source:** `ROUTE_INVENTORY.md` (88 routes, generated from `src/App.jsx` and `src/pages/admin/Home.jsx`), plus the separate owner console (`../eduamigo-console`, 8 pages).
- **Visual tour:** a script visits **78 distinct screens** (public 7, student 14, parent 10, teacher 10, admin 37) signed in as the right role, at **1440, 768 and 390 px**, and saves a screenshot and metrics (horizontal overflow, title position). Before: `screens/tour/` (156 shots, 1440 and 390). After: `screens/after/` (234 shots, three widths). Console: `screens/console-after/` (8 screens x desktop and phone). Redirect-only and alias routes were not shot separately.
- **Result of the metrics:** 0 of 234 after-shots have horizontal overflow.
- **Redesigned/implemented screens:** the visual language (tokens, cards, stat cards, chips, segmented control, tables) already existed and was consistent on arrival; this pass fixed the defects found screen by screen and re-aligned the screens that still used an older frame. Screens changed are listed below (about 22 app screens, the console's 8, and shared styles).

## Individually inspected (rendered screenshot looked at, not just measured)
| Area | Inspected at desktop | Not individually inspected |
|---|---|---|
| Admin (37) | 35 (dashboard, students, add student, student profile, TC, parents, add parent, teachers, add teacher, fees, fee structure, fee reports, leaves, library, admissions, communications, reports, results, salaries, settings, school setup, activity, ask, year end, timetable, transport, user management, office staff, roles, event calendar, id cards, bulk, inbox, HR, attendance reports, chat, exams) | `/admin/teachers/:id` profile page (reviewed in the previous program), `/admin/inbox` after change was viewed |
| Student (14) | 12 | live bus (owner's work, left alone), report card print view |
| Parent (10) | 8 | notifications, live bus |
| Teacher (10) | 8 (home, students, attendance, marks, upload, timetable, leave, profile) | notifications, chat |
| Public (7) | 6 (website, find school, sign-in, support, driver, privacy) | forgot password |
| Console (8) | 8 (sign-in, dashboard, schools, school, add school, plans; invoices and activity shot, not inspected) | invoices, activity |
| Phone (390) and tablet (768) | about 20 shots inspected (dashboards, lists, forms, Learning AI, roles, change password, console) | the rest were measured (no overflow) but not looked at one by one |
So: **about 70 of 78 app screens looked at on desktop; about 20 on phone/tablet; all 234 measured.** The rest are PARTIAL (measured, not inspected).

## Defects found by looking, and what was done
| Where | Problem | Fix |
|---|---|---|
| Admin sidebar | Eight groups did not fit: the last entries sat under the footer | Rows 34 px (was 40) and tighter group headings on desktop only (`styles/polish.css`); phone drawer keeps 44 px targets |
| Admin notifications (`/admin/inbox`) | No page title; a top bar duplicated the heading and wasted 60 px | Uses the shared page header; panel spaced |
| Year End | Unstyled controls, default blue link, misaligned labels | Aligned fields, brand link |
| EduAmigo Ask (admin) | Period selector and Refresh stacked in a column | One row |
| Exam schedule | Cards of different heights, fixed 3 columns | Equal height, buttons pinned to the bottom, responsive grid |
| ID card generator | A four-step progress strip and hint chips repeated what the screen shows | Removed |
| User Management | Six summary cards left one alone on a second row | Accountant and staff share one card (five cards) |
| Roles and Office staff | First card touched the subtitle; "Try again" button prop wrong | Spacing, prop fixed |
| Segmented controls | Stretched across the page on some screens | `width: fit-content` |
| Profile (teacher) | Three summary cards as two plus one | One row of three |
| Support, Driver sign-in, Change password | Older split with a different layout from sign-in | Moved onto the shared sign-in frame (`AuthShell`) in the school's colours |
| Parent fee | Dates like `3/11/2026` (ambiguous) | `3 Nov 2026` |
| Parent calendar | `Rs` next to `₹` elsewhere | `₹` |
| Student fee | "Payment Due" shown for a date already past | "Payment overdue since" |
| Chat lists (student, parent, teacher) | Bright red avatar for the school office | School colour |
| Teacher attendance and marks | Full-width date field and button | Sized to content |
| Timetable (admin) | "6 timetable entries in database" | "6 periods saved"; also event and activity-log wording |
| Website hero | 96 px of empty space under the buttons | Shorter bottom padding |
| Owner console | Blue-grey tool look, different from the product; four tall stat cards on phones; uneven form rows | EduAmigo indigo tokens, logo mark, split sign-in, accent stat cards, two across on phones, aligned rows (`../eduamigo-console/src/index.css`, `Login.jsx`) |
| `/student/learn` layout checks | Failed because the test measured the icon beside the title, not the header panel | Test now measures the header panel like the dashboards' welcome card; no assertion removed |

## Shared design system touched
`src/styles/polish.css` (new; sidebar density, segmented width, profile row, hero spacing; kept separate so the owner's in-progress `src/index.css` bus styles were not edited), `AuthShell` reused by four more screens, `PageHeader` by the admin inbox, `EmptyState` props corrected. Tokens, colours, radii and shadows were not changed in the app (they were already one system); the console was brought onto the same indigo identity.

## Whitespace
Fixed where it was waste (sidebar rows, duplicate inbox header, unused stepper and chips, hero bottom gap, stretched controls, stacked header actions, orphan stat cards, console phone cards). Not changed: large empty areas under short lists in the demo (3 students, 1 teacher) are the data, not the layout; the dashboard panels and tables already fill the frame to 1280 px.

## Tests and results
- `npm run build`: passes. Lint: 153 problems, unchanged from the start (none in new or edited files except pre-existing ones).
- Full browser suite (Playwright, Chrome): **308 passed, 19 skipped (existing), 0 failed** (31 min), including all 30 `layout-alignment` tests. After the final edits (change password, driver, support, profile, fee wording) a targeted re-run of 118 related tests: **118 passed**. The console's 6 tests: 6 passed; its build passes.
- The previously failing `/student/learn` frame checks and the never-finishing layout tests are resolved (see TEST_RESULTS.md for the earlier cause).

## Limits (honest)
- Chrome on macOS only; no Safari, Firefox, physical iPhone or Android; no screen-reader pass; contrast was not re-measured for every school colour.
- Screens not individually inspected are listed above; the live-bus screens belong to the owner's work in progress and were not touched.
- The design reference image for the dashboard redesign was never received; this pass used the product's own system.
- Dark mode was not re-toured in this pass (covered by the existing dark-mode specs only).

## Next actions
Inspect the remaining phone screenshots one by one; review dark mode per portal; unify the older admin tables (inline styles) into shared table classes; decide on a Safari/Firefox pass.


---
# Completion pass (2026-10-24)

## Remaining screens (priority 1)
| Screen | Result |
|---|---|
| Forgot password | Inspected at 1440/768/390 in Chrome, Firefox and WebKit: on the shared sign-in frame, clear hierarchy. No change needed. COMPLETE_VERIFIED |
| Parent notifications | Inspected. Empty state is the real state (no notices in the demo data); layout fine. No change. COMPLETE_VERIFIED |
| Teacher notifications | Inspected. Same. COMPLETE_VERIFIED |
| Teacher chat | Inspected. Header badge said only "5": now "5 contacts". COMPLETE_VERIFIED |
| Live bus (student, parent, driver, tracker) | Inspected at three widths. Map pages are sound. Fixed: driver trip screen had a black bus icon on a dark tile and 25 to 40 percent white small text (unreadable); now white icon and 70 to 75 percent text. Bus stop markers had no accessible name (axe `aria-command-name`): added title/alt "Stop n: name" in `BusTracker.jsx` (a one-line change in the owner's file). WebKit logs a cross-origin fetch warning for the live-bus request on the student timetable and parent profile pages (a stream request from the app shell); it does not change what the page shows, and was not investigated further. COMPLETE_VERIFIED for layout, PARTIAL for the WebKit warning |

## Phone and tablet (priority 3): visually reviewed, not only measured
Contact sheets of all 78 screens at 390 px (10 sheets) and sixteen sheets at 768 px were generated from the fresh screenshots; I looked at 7 of the 10 phone sheets (admin, parent, student, teacher and public screens) and 3 tablet sheets (admin lists, parent screens, student screens). Findings: no overlapping text, clipped dialogs or unusable tables; tables become stacked cards; summary cards scroll sideways by design when there are five or more; the floating "Ask" button overlaps the last row of a few lists at the very bottom of the scroll (it can be scrolled clear; not changed); on phones short pages end early because the demo data is small (see below). Phone sheets not looked at: 3 of 10; tablet: 13 of 16 (measured only).

## Dark mode (priority 4)
- **Supported only partly.** The switch is in the student portal (Profile > Settings > Dark mode). It stores `darkMode` on the device; no other portal has a switch.
- **Student portal:** captured all 14 screens at 1440 and 390 in dark and looked at 9 of them (home, fee, notes, timetable, results, learn on phone and others in contact sheets); the other five are covered by axe in dark only. One defect: the "now" period row on the home screen kept a light orange tint, so its time text washed out. Fixed (`styles/polish.css`).
- **Parent portal:** the pages are dark-ready (home looked correct; the notification spec checks contrast in dark; fees and other parent pages were captured but not individually inspected in dark) but nothing in the app switches it on.
- **Teacher and school-office portals are not dark-ready** (for example the teacher attendance card went dark with invisible labels beside white cards). Because the saved choice is per device, a student switching dark mode on a shared device would have made the teacher or admin pages half dark. Fixed: the dark theme is now applied only on student and parent pages (`ThemeContext.jsx`, `App.jsx`). No new theme feature was added.
- Status: student dark PARTIAL (9 of 14 screens inspected, axe 0 in dark); parent dark PARTIAL (no switch); teacher/admin/console dark: not supported (documented, not implemented).

## Browsers and accessibility (priority 5)
- **Firefox and WebKit** (Playwright builds; WebKit is the Safari engine, **not Safari itself**, which was not run): all 78 screens captured at 1440 and 390 in each, 0 overflow, visually consistent (looked at admin dashboard in WebKit, parent home and login in Firefox, a student phone screen in WebKit). Functional smoke of auth, roles, landing and parent dashboard specs (140 tests per run of both): **138 passed, 2 failed**: (1) Firefox landing check at 768 px reports an SVG `path` of the decorative map mock whose box extends past the viewport; the page itself does not scroll (scroll width 0), so no visible defect; (2) WebKit "Tab reaches the Show password button" fails because Safari engines do not Tab onto buttons unless full keyboard access is on (platform behaviour, not an app defect). Neither test was changed.
- **axe-core 4.10 (WCAG 2 A and AA)** on 92 page loads (78 screens in light plus the 14 student screens in dark) in Chrome: first run 7 violations, after fixes **0**. Fixed: warning-note title contrast (darker amber `--ea-on-card-warning`, 3 screens), learn alert text, admin chat filter button (white on 85 percent brand at 10 px, now solid at 11.5 px), bus stop marker names.
- **Existing keyboard and accessible-name specs** (admin-keyboard, accessible-names, auth keyboard test, dashboard menu tests) pass in Chrome. Screen readers (VoiceOver, NVDA), physical devices, real Safari and Edge: **UNVERIFIED**.

## Demo data versus layout (priority 6)
Large blank areas below content on Students, Teachers, Attendance, Notifications, Messages, Parent profile, Year End and similar pages are the data: 3 students, 1 teacher, no notices, no staff. The frames, cards and tables themselves fill the width (verified by the layout suite). Real defects that looked like empty space and were fixed earlier: stacked header actions, stretched controls, orphan stat cards, unused progress strips. Empty states already carry an explanation and, where useful, an action (Office staff: how to add a person; Notifications: what appears there; Year End: create next year's session). No filler data was added.

## Files changed in this pass
`src/styles/polish.css`, `src/context/ThemeContext.jsx`, `src/App.jsx`, `src/pages/driver/Driver.jsx`, `src/pages/bus/BusTracker.jsx` (marker names), `src/pages/admin/Chat.jsx`, `src/pages/teacher/Chat.jsx`, `playwright.cross-browser.config.js` (new), plus screenshots under `screens/{after,dark,firefox,webkit}`.

## Tests (this pass)
- Full Playwright suite (Chrome) before the last two small edits: 307 passed, 19 skipped, 1 failed (`notice-theme: parent notifications dark`, caused by my first version of the dark-mode gate; the gate now includes parent pages and the 4 notice-theme tests pass).
- Cross-browser smoke: 138 of 140 as above.
- Build passes; lint (`src` and `e2e`): 148 problems, all older code.
- The full suite was **not** re-run after the last gate change and the config file; the notice-theme, auth and roles specs were re-run.

## Screenshots
`screens/after` 234 + 2 driver (Chrome, light), `screens/dark` 156, `screens/firefox` 156, `screens/webkit` 156 (all 1440 and 390), `screens/tour` (earlier "before"), `screens/console-after` 16.


---
# Closing pass (2026-10-24, later)

## Contact sheets: all looked at now
Phone (390 px) sheets 1 to 10 (all 78 screens): the 3 previously unseen sheets covered parent screens, the student screens and the teacher screens (marks, notifications, profile, students, timetable, upload) and the driver sign-in: no defects. Tablet (768 px) sheets 1 to 16: the 13 previously unseen sheets were viewed (admin lists, forms, settings, user management, parent and student screens, driver, notifications). **One genuine defect class found:** on tablet widths the data tables in Students, Salaries, Teachers, HR and Fee Collection were wider than their card, which cut off the right-hand columns (Actions, Status) with no way to reach them. Fix (`styles/polish.css`, 641 to 1180 px only): the card scrolls sideways, and cell padding is 10 px instead of 18. Re-checked by fresh screenshots: Students (Actions column with View, Edit, Delete) and Fee Collection (class chips no longer wrap as "9-" and "A", `whiteSpace: nowrap` in `FeeCollection.jsx`) now fit at 768 px; Salaries, Teachers and HR were re-shot and fit or scroll inside the card.
Not seen at full size: the tablet and phone sheets are contact sheets (about one third scale); small-print details were judged on the individual shots where something looked doubtful.

## Browser exceptions: evidence
1. **Firefox landing check at 768 px.** Probe: the only element outside the viewport is an SVG `path` whose nearest ancestor with `overflow` other than visible is the decorative `svg` (`overflow: hidden`); page scroll width is 0. It is clipped and invisible, so the page is fine. Chrome and WebKit do not flag it because they do not report clipped children the same way. Genuine browser difference, no product defect. The test was not changed.
2. **WebKit "Tab reaches Show password".** Probe: in WebKit, plain Tab skips the Show and Sign-in buttons; Alt+Tab (the Safari "all controls" key) reaches Show password, Forgot password and Sign in in order. All controls are keyboard-reachable; the difference is the engine's default. Test not changed. Real Safari was not run.

## Results of this pass
- **Full Chrome Playwright suite, run on the final code: 308 passed, 19 skipped, 0 failed (31.2 min).** (An earlier run was stopped by me to change CSS; it is not counted.)
- **axe-core 4.10 (WCAG 2 A/AA), re-run on the final code: 0 violations** over the same 92 page loads (78 screens light, 14 student screens dark): contrast fixes and bus-marker names confirmed.
- **Cross-browser smoke (Firefox, WebKit; auth, roles, landing, parent dashboard): 138 passed, 2 failed**, the two exceptions above (same result as before).
- Build passes. Backend tests were not re-run (no backend code changed in this pass).
- **Fresh screenshots** from the final code: `screens/after` (234 at 1440, 768, 390 with 0 horizontal overflow, plus 2 driver trip screens), compared with `screens/tour` (earlier, 156) and the earlier tablet contact sheets: tablet tables and the fee class chip visibly changed as described; other screens unchanged apart from the earlier fixes.

## Dark mode claims (accurate)
Student portal: switch exists and is supported (14 screens captured, 9 individually inspected, axe 0). Parent pages: no theme switch; the dark theme is applied to them only if a saved choice exists on the device. Teacher, school-office and owner console: dark mode is not supported. Full-product dark-mode completion is **not** claimed.

## Status
| Item | Status |
|---|---|
| Full Chrome regression run | COMPLETE_VERIFIED (308 / 19 skipped / 0 failed) |
| Phone and tablet contact sheets (all 26 viewed) | COMPLETE_VERIFIED at contact-sheet scale; defects fixed |
| Accessibility (axe, Chrome) after latest edits | COMPLETE_VERIFIED (0) |
| Firefox / WebKit smoke | COMPLETE_VERIFIED for the engines; the 2 exceptions explained with evidence |
| Real Safari, Edge | UNVERIFIED |
| Screen readers, physical devices | UNVERIFIED |
| Dark mode, whole product | PARTIAL (student only) |
| Keyboard check in Firefox beyond the smoke specs | UNVERIFIED |
