# EduAmigo web UI/UX audit and transformation log

Living record of the web transformation: every route, what was wrong, what changed, and how it was checked.
Local development only: nothing here is deployed.

## How screens are checked
- Screenshots of every route below at 375 px (phone) and 1440 px (desktop), signed in as the GVPS demo account
  for the route's role (`npm run demo` in the backend). A script records JavaScript errors, elements wider than the
  screen and horizontal page scroll for each screenshot.
- `npm run test:e2e` (Playwright, 24 tests since batch 7) after each batch; `npm run build`; ESLint on changed lines.
- Baseline sweep (2026-10-13, before the transformation): 150 screenshots, **no JavaScript errors on any route**.

## Design system (src/components/ui, src/index.css)
The admin dashboard was the reference look: plain header on the page background, neutral cards with a thin border,
the school's brand colour for actions and icon chips, and colour only where it means something (paid, pending,
overdue).

| Piece | What it is |
|---|---|
| `PageHeader` | Title, optional subtitle, optional back button, actions on the right. Replaces coloured banners |
| `StatCard` / `StatGrid` | Summary numbers: neutral card, icon chip, caption over the value. Tones: brand, success, warning, danger, info, neutral. Four across on wide screens, two on phones with the icon above the caption |
| `tone.js` | `toneOf(colour)` maps the raw colours older screens passed to a tone |
| CSS: `.ea-toolbar`, `.ea-search`, `.ea-input`, `.ea-select` | Search and filter rows that wrap on phones, with a visible focus ring |
| CSS: `.ea-btn--primary`, `--ghost`, `--danger`, `.ea-back`, `.ea-badge--*`, `.ea-icon-chip--*` | Buttons, back button, status badges and icon chips |
| CSS: admin tables on phones | Record lists (`<table data-stack>`) become one card per row below 768 px, each value labelled with its column heading (`utils/stackTables.js` copies the headings into `data-label`). Report and matrix tables keep scrolling inside their card with the first column fixed |
| `PortalHeader` | Header of the portal screens (back button, title, subtitle, actions) |
| `Dialog` | The one dialog: dialog role, Escape, focus kept inside. Since batch 7 it asks "Discard the changes you have made?" when something was typed and Escape or the close button is used (Cancel and a successful save close it directly). The floating Ask button is hidden while a dialog is open |
| `utils/unsavedChanges.js` | `useUnsavedChanges(dirty)`: the browser asks before a full-page form with entries is closed or reloaded. Moving to another screen inside the app is not blocked: the app uses `BrowserRouter`, which cannot block navigation (needs a data router; not changed) |
| Earlier work | Portal shell (sidebar from 1024 px, tab bar below), Glyph line icons instead of emoji, safe-area and keyboard handling in the apps |

## Route inventory
Condition: what the baseline sweep showed. Done: changes made so far (commit). Open: what is still to do.

### Sign-in and shared pages
| Route | Role | Purpose | Condition (baseline) | Done | Open |
|---|---|---|---|---|---|
| `/` | all | Splash, then school search | Fine | | |
| `/select-school` | all | Find the school by code or name | Clean; navy hero | | |
| `/s/:code` | all | School link (QR) | Redirects to sign-in | | |
| `/login` | all | Sign in per role (Student, Parent, Teacher, Admin tabs) | Clean; school-branded hero; on iPhone the ID field capitalised the first letter | e3116a3: no auto-capitalise or autocorrect | |
| `/forgot-password` | all | Reset code by email/SMS, new password | Plain form | e3116a3 (ID field) | Same visual language as sign-in |
| `/support` | support staff | Support sign-in | Plain | | Review |
| `/change-password` | signed in | Change password | Plain card | | Review |
| `/report-card` | admin, teacher, student, parent | Printable report card | Document layout | | Print check |
| `/receipt/:feeId/:receiptNo` | admin, parent | Printable fee receipt | Document layout | | Print check |
| `/driver` | bus driver | Share live location with a driver token | Dark full-screen | | Review |

### Student portal (12)
`/student/home`, `attendance`, `result`, `fee`, `bus`, `timetable`, `notes`, `revise`, `apply-leave`, `notifications`,
`chat`, `profile`.
Condition: consistent brand colour; three different header styles (brand gradient hero, centred title hero, white
header); on desktop content stretches across the width with large empty areas; home header pinned (about half the
phone screen does not scroll). `result` had its own tab bar (shown on desktop too: fixed bfe7c4f) with "Result"
instead of "Chat" (owner decision pending). Back/send buttons used text arrows (fixed 837b4d7).
Done: Notes and Timetable use the shared PortalHeader like the other screens (960f901); on wide screens the portal
sits in a centred 1080 px column instead of stretching (a1af197); the end of each page clears the Ask button.
Owner decisions applied (2ab6301): on phones the home header scrolls away with the content (desktop unchanged);
Results now shows the shared tab bar (Home, Bus, Learn, Chat, Me) with Learn marked as the current tab, because
Results is reached from Learn. No label was renamed: the page-specific bar with "Result" in place of "Chat" was
removed, and "Results" stays the page title.
Open: the centred-title heroes (Results, Profile) keep their own design.

### Teacher portal (10)
`/teacher/home`, `students`, `attendance`, `marks`, `upload`, `timetable`, `leave`, `notifications`, `profile`, `chat`.
Condition: as the student portal. Attendance showed "Select a class to get started" even with one class; the leave
balance "Total" was teal on a teal card (hard to read). Notification filter chips scroll sideways inside their row
(intended).
Done (960f901): single class preselected; leave balance numbers white on the brand card; Enter Marks uses
PortalHeader; filter chips report their pressed state.

### Parent portal (10)
`/parent/home`, `chat`, `apply-leave`, `notifications`, `attendance`, `calendar`, `fee`, `result`, `bus`, `profile`.
Condition: as the student portal; fee overview and calendar are the strongest screens.
Done: My Profile uses PortalHeader (960f901); the Ask button no longer covers the last amounts (page end clears it).

### School admin (35 routes under `/admin`)
| Route | Purpose | Condition (baseline) | Done |
|---|---|---|---|
| `/admin` | Dashboard | Reference design | (earlier, 19995f1) |
| `/admin/students` | Student list | Teal banner, colour-bordered stats, table 818 px on phones | b15be6f; 4a07f74 (cards on phones); 2fb3287 (delete feedback) |
| `/admin/teachers` | Teacher list | Green banner, colour stats | b15be6f; 4a07f74; 2fb3287 |
| `/admin/parents` | Parent list | Orange banner | b15be6f; 4a07f74 |
| `/admin/attendance-reports` | Attendance analytics | Pink banner, filter labels not linked | b15be6f |
| `/admin/exams` | Exam schedule | Orange/red banner | b15be6f |
| `/admin/fees` | Fee collection | Green banner; "Fully paid" card had no icon; table 939 px on phones | b15be6f; 4a07f74 |
| `/admin/fee-reports` | Fee analytics | Brand banner, filter labels not linked | b15be6f (report table keeps scrolling) |
| `/admin/fee-structure` | Fee structure | Blue banner, decorative colours | b15be6f; 4a07f74 |
| `/admin/leaves` | Leave approvals | Orange banner; approve/reject gave no feedback and could be pressed twice | b15be6f; 2fb3287 (message, buttons disabled while saving) |
| `/admin/library` | Library | Banner with floating book icons | b15be6f; 4a07f74; 2fb3287 |
| `/admin/communications` | Announcements, circulars, notifications | Brand banner; pin/delete failed silently | b15be6f; 2fb3287 |
| `/admin/reports` | School reports | Blue banner | b15be6f |
| `/admin/results` | Results and grades | Brand banner | b15be6f; 4a07f74 |
| `/admin/salaries` | Salaries | Green/cyan banner; "mark paid" failed silently | b15be6f; 4a07f74; 2fb3287 |
| `/admin/timetable` | Class timetables | Brand banner | b15be6f |
| `/admin/transport` | Buses and routes | Orange banner; **2.8 s full-screen bus animation** before the page opened | b15be6f (animation removed) |
| `/admin/academic` | School setup checklist, sessions, classes | White header (own style) | ee52fbc |
| `/admin/activity` | Activity log | White header | ee52fbc |
| `/admin/admissions` | Admissions pipeline | White header; table 1008 px on phones | ee52fbc; 4a07f74 (cards on phones) |
| `/admin/ask` | EduAmigo Ask insights | White header; page scrolls sideways on phones (45 px) | c87c491 (no sideways scroll); 409af42 (PageHeader) |
| `/admin/bulk-operations` | Bulk attendance, promotion, CSV | White header | ee52fbc |
| `/admin/chat` | Messages | One pane on phones (earlier); own colours | 409af42 (design tokens, labelled refresh, pressed filters) |
| `/admin/event-calendar` | Events | Calendar colour changed every month; hand-rolled event dialogs (close was a div) | ee52fbc (school colour); ab8a986 (shared dialog) |
| `/admin/hr-management` | HR & payroll | White header, colour stats; hand-rolled dialog; saved without checks and showed "Error" | ee52fbc; 4a07f74; 2fb3287; ab8a986 (shared dialog, required-field checks, saved message) |
| `/admin/id-card-generator` | ID cards | Page scrolled 372 px sideways on phones | c87c491 (fits); 409af42 (PageHeader, print action) |
| `/admin/settings` | School settings | Plain | 73b6faf |
| `/admin/user-management` | Staff accounts | Role cards were clickable divs (no keyboard); hand-rolled dialog | ee52fbc (buttons, pressed state); ab8a986 (shared dialog) |
| `/admin/year-end` | Year end and TC | White header | ee52fbc |
| `/admin/students/add`, `/teachers/add`, `/parents/add` | Add forms | Plain headers; nothing warned before a half-filled form was lost | 73b6faf; 2fb3287 (browser asks before closing or reloading) |
| `/admin/students/:id` | Student profile | Plain header, text back button | 73b6faf |
| `/admin/teachers/:id` | Teacher profile | Overflowed on phones; **"Edit Profile" opened a route that does not exist (blank page)** | c87c491 (one column on phones); 409af42 (PageHeader; Edit Profile opens the edit dialog on Teachers) |
| `/admin/tc/:id` | Transfer certificate | Shows a clear message for active students | 409af42 (PageHeader with back and print, alert style) |
| `/admin/marks`, `/admin/notice-board`, `/admin/admissions/*` | Old links | Redirect to Results, Communications, Admissions | |

Unrouted page files (not reachable): `admin/Attendance.jsx`, `admin/NoticeBoard.jsx`, `admin/Notifications.jsx`,
`parent/ParentRoutes.jsx`. (Correction: `admin/AskKnowledge.jsx` is not unrouted; it is a section shown inside
`/admin/ask`.)

### Platform (super admin)
The owner console is a separate application (`eduamigo-console`), not part of this repository's routes.

Scope (recorded before the review, 2026-10-13): available locally at `~/Downloads/eduamigo-console`, branch `main`,
2 commits (6406919, d8e444b), clean working tree, never pushed by this work. React 19 + Vite, no UI library,
about 1,050 lines in 8 screens plus one stylesheet (69 lines). Used only by the platform owner (superadmin), signs in
at `/api/platform/login`, token in sessionStorage (closing the tab signs out, 12 h expiry). Runs on port 5180 against
the same backend (`npm run demo` has `owner@eduamigo.demo`). Desktop tool: phones are a secondary target.

| Route | Purpose |
|---|---|
| `/login` | Owner sign-in |
| `/` | Dashboard: schools by status, active students, logins, invoice totals |
| `/schools` | School list with search, status filter and usage |
| `/schools/new` | New school and its first admin (shows the one-time password and school code) |
| `/schools/:id` | School page: branding with live preview, plan, add-ons, modules, limits, dates, invoices, support sign-in, switch off/on (361 lines, the largest screen) |
| `/plans` | Plans and prices, add-on prices |
| `/invoices` | Invoices across schools |
| `/activity` | Platform activity log |

Review rules: same checks as the school app (screens at 375 and 1440 px, JS errors, sideways scroll, form feedback),
no change to the platform API or to permissions; the console's own `npm run lint` and `npm run build`.

Review result (console commit 8b35e3a, local only):
- Desktop: clean and consistent already (dark sidebar, neutral cards, status pills); no change.
- Phones: the 220 px sidebar never collapsed, so every screen scrolled sideways (57–137 px) and tables were cut off.
  Now a top bar (name, Sign out, sections in one row that scrolls sideways, current section kept in view); school
  page tabs scroll in their row. Sweep after: 8 routes × 375/1440 px, **0 sideways scroll, 0 JavaScript errors**.
  The add-on price table on Plans keeps scrolling inside its card (data-heavy).
- Navigation: "Schools" was highlighted together with "Add a school"; now only the current entry (checked in the
  browser on both pages).
- Forms: already sound (required fields, busy states, a message after every save, support sign-in needs a reason).
  Added: "Turn school off" asks first (checked in the browser: dismissing sends nothing); "Void" asks first and
  issue, mark paid and void now report the result. Void was not exercised in the browser: the demo plans have no
  price, so no invoice can be created without changing the running demo's prices.

## Forms review (batch 7)
Every screen that writes data was checked for: checks before sending, a visible result (success or a readable
error), double submission, and loss of typed-in work.

| Finding | Screens | Change |
|---|---|---|
| Write failed or succeeded silently (empty `catch`) | Communications (pin, delete ×2), HR (delete, leave decision), Library (delete), Salaries (mark paid), Students (delete), Teachers (delete), Leave approvals | Success message and the server's error message (2fb3287) |
| Approve/Reject could be pressed twice | Leave approvals | Buttons disabled with "Approving…"/"Rejecting…" while saving (2fb3287) |
| Saved without checking required fields; error shown as "Error" | HR salary and leave records | Teacher, basic salary, leave type, both dates and date order checked first; saved message (ab8a986) |
| Hand-rolled dialogs without dialog role, Escape or a real close button | HR, Event calendar (event form, day view), User management | Shared Dialog (ab8a986) |
| Typed-in work lost on Escape or the close button | All 15 screens with the shared Dialog | Asks before discarding (2fb3287) |
| Half-filled full-page form lost on tab close or reload | Add Student, Add Teacher, Add Parent | Browser asks first (2fb3287) |
| Already sound | Enter Marks (range 0–max, at least one mark), Year end (reason for each leaver, confirmation), Bulk operations (required selections, confirmation), Add Student/Parent, Admissions, Exam schedule | No change |

Not changed, recorded: about 15 places fall back to the word "Error" when the server sends no message (only on a
network failure; Transport, Fee structure, Bulk operations, Parents and others); navigation inside the app is not
blocked for unsaved forms (`BrowserRouter`); per-field inline error text is not used (messages appear as toasts).

## Known defects and open items
1. Admin screens on the old look but working: Reports-type pages keep their own chart colours; Settings and the
   portal heroes (Results, Profile) keep their own design.
2. Forms: the generic "Error" fallback above; inline per-field error text if wanted.
3. Owner console: reviewed (see Platform). Open: browser check of Void with a priced plan; the console has no
   automated tests.
4. Print views (report card, receipt, TC) need a print check.

## Verification log
| Date | Batch | Checks |
|---|---|---|
| 2026-10-13 | Baseline sweep | 150 screenshots (75 routes × 375/1440 px), 0 JavaScript errors |
| 2026-10-13 | Batch 1, admin headers and stats (b15be6f) | 32 screenshots reviewed (16 screens × 2 widths), 0 JS errors, 0 page-level sideways scroll; Playwright 19/19; build ok; 0 new lint messages |
| 2026-10-13 | Batches 2-4 and phone fixes (ee52fbc, 73b6faf, 960f901, a1af197, c87c491) | Screens reviewed after each batch; Playwright 19/19; build ok; 0 new lint messages |
| 2026-10-13 | Full sweep after the batches | 150 screenshots (75 routes × 375/1440 px): **0 JavaScript errors, 0 routes with page-level sideways scroll** (baseline had 2: Ask insights 45 px, ID cards 372 px) |
| 2026-10-13 | Batch 5, owner decisions (2ab6301) | Playwright 22/22 incl. 2 new tests (home header scrolls more than 200 px on a 375 px phone; Results shows the shared bar with Learn current) |
| 2026-10-13 | Batch 6, five admin screens and phone table cards (409af42, 4a07f74) | Screens reviewed at 375/1440 px; new test: Edit Profile opens the edit dialog and does not reopen after reload; Playwright 22/22; build ok; 0 new lint messages |
| 2026-10-13 | Batch 7, forms (2fb3287, ab8a986) | Playwright **24/24** incl. new tests: discard question on a dialog with changes (none when empty; Cancel keeps the text); HR checks a missing teacher, the Ask button hides under a dialog, user and event dialogs are real dialogs. Phone screenshots of the HR, event (discard question) and user dialogs reviewed. Build ok; 0 new lint messages |
| 2026-10-13 | Owner console (console 8b35e3a) | Before: all 6 signed-in routes checked at 375 px scrolled sideways 57–137 px (school page 61 px). After: 16 screenshots (8 routes × 375/1440 px), 0 sideways scroll, 0 JS errors; school-off confirmation and nav highlight checked in the browser; console lint and build clean |
