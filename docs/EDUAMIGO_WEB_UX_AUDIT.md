# EduAmigo web UI/UX audit and transformation log

Living record of the web transformation: every route, what was wrong, what changed, and how it was checked.
Local development only: nothing here is deployed.

## How screens are checked
- Screenshots of every route below at 375 px (phone) and 1440 px (desktop), signed in as the GVPS demo account
  for the route's role (`npm run demo` in the backend). A script records JavaScript errors, elements wider than the
  screen and horizontal page scroll for each screenshot.
- `npm run test:e2e` (Playwright, 42 tests since the owner decisions) after each batch; `npm run build`; ESLint on
  changed lines. Since 95bf32e the tests start their own in-memory demo on port 8100 and Vite on 5174; they never
  touch a demo running on 8000/5173. (Before that they reused whatever answered on 8000: on 2026-10-13 that was the
  owner's in-memory allied demo, so test records — a fee payment, a leave, a notice, chat messages, attendance in
  the GVPS demo school — were written into it. It keeps no data on disk; restarting it clears them.)
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
| `utils/unsavedChanges.js` | `useUnsavedChanges(dirty)`, used by Add Student/Teacher/Parent and by every Dialog holding typed-in changes. Reload, tab close, leaving the site: the browser asks (`beforeunload`). Moving to another screen inside the app (links, sidebar, `navigate()`), and the browser's Back/Forward buttons: the app asks "You have unsaved changes. Leave this page and lose them?". `BrowserRouter` has no `useBlocker`, so the router's navigator (`push`/`replace`) is guarded and a `popstate` listener added before the router (`installBackForwardGuard()` in main.jsx) handles Back/Forward; `confirmLeave()` covers sign-out, which clears the session before it navigates |
| `utils/toast.js` `errorMessage()` | Readable error for every failure: the server's own words (4xx), plain advice for no connection, timeouts, 401/403/404/413/429, and for a server failure the action that failed plus `Reference: <first 8 characters of the request id>` (the same id is in the server log line). Development builds log method, path, status and request id to the console (never bodies, queries or tokens) |
| `.ea-print-doc` (index.css) | Marks a printable document (report card, receipt, transfer certificate): when printing, its wrappers drop their fixed height, scrolling and centring, and nothing else on the page is printed |
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

Recorded at the time and done in the final pass below: the generic "Error" fallbacks and navigation inside the app.
Still not used: per-field inline error text (messages appear as toasts or as a line in the form).

## Final verification and hardening pass (2026-10-13)
No redesign; four fixes, each with regression tests, then a full re-check.

**1. Error feedback (dea2606; console ad35921).** 18 places showed the word "Error" when the server sent no message
(Transport ×4, Bulk operations ×4, Salaries ×2, Communications ×2, Fee structure, HR, Parents, Students, Teachers,
Library) and 18 more showed the raw technical text (`err.message`: "Failed to fetch", "Load failed", "Network Error",
"Request failed with status code 500") on sign-in, school search, password reset, support sign-in, Add Teacher,
the student bus and revision screens and seven teacher screens. All now use `errorMessage()` with a fallback naming
the action ("Could not save the book."). Two terse checks were reworded ("Name, lat, lng required" → "Enter the
stop name, latitude and longitude"; "Teacher and basic salary required" → "Select a teacher and enter the basic
salary"). The backend already hid internals (a 500 says only "Something went wrong" with a request id, and logs the
details with that id); the console now shows the same short reference. Tests: 15 kinds of failure through
`errorMessage()`; a mocked 500 on saving a book shows "Could not save the book. The server had a problem; please try
again in a moment. Reference: 9f8e7d6c" and keeps the dialog open; a lost connection on teacher notifications says
"Can't reach EduAmigo right now…".

**2. Printing (403714f).** Printed to PDF (A4 report card and TC, A5 receipt) with real demo data and with mocked long
documents (93-character school name, long address, 12 and 30 subjects, 12 and 45 class records). Found and fixed:
| Document | Before | After |
|---|---|---|
| Report card | Printed in a 420 px column (half the paper); the last line ("Issued on…") alone on a second page | Full width; one page per student (3 students = 3 pages); 30 subjects = 2 pages, rows never split, table header repeated |
| Fee receipt | The last line ("Due date…") alone on a second page | One A5 page |
| Transfer certificate | Printed the sidebar, the Ask button and the grey canvas; a long one would stop after one page (the admin page scrolls inside a fixed-height box) | Only the certificate; 45 class records = 2 pages; signatures kept together |
Also: remarks being edited are printed (they were left out). Missing data: none of the printed fields is dropped;
empty ones print "—". Data concern found here (the certificate's "Date of admission" was the record's `createdAt`):
resolved by the owner's decision, see "Owner decisions" below.
Tests: three print tests check the printed page count, full width and that no app chrome is printed; with the old
CSS all three fail.

**3. Console Void (ad35921).** The console got Playwright tests against an in-memory mock of the platform API (the
dev proxy points at a closed port, so nothing can reach a backend; no invoices are created anywhere). Void asks
"Void EA/2026-27/0001? A voided invoice cannot be issued or paid again."; Cancel sends nothing; OK sends one
`PATCH {action: "void"}` and shows "EA/2026-27/0001 voided."; with the confirmation removed the test fails. Also
covered: Mark paid (cancelling the reference question sends nothing), Issue, turning a school off (Cancel sends
nothing), a server failure's reference, phone layout.

**4. Unsaved changes (7091a85).** Covered separately:
| Case | Covered | How |
|---|---|---|
| Reload, close the tab, leave the site | Yes: full-page add forms and any dialog with typed-in changes | Browser's own question (`beforeunload`; browsers only ask after the person has interacted with the page) |
| Another screen inside the app: links, sidebar, buttons calling `navigate()` | Yes | App's question; Cancel keeps the form, Leave moves on and lifts the guard |
| Sign out | Yes | Asked before the session is cleared |
| Browser Back/Forward buttons, app back buttons (`navigate(-1)`) | Yes, since 3ff48d3 (see "Owner decisions") | App's question; Cancel keeps the page and the address, Leave repeats the move |
| Session expiry while a form is dirty | Partly | The browser asks before going to sign-in; staying keeps the typed text on screen, but the session is already gone, so saving says "Your session has ended. Please sign in again." |
The admin sidebar's highlight now follows the address only (it used to light up the clicked entry before the move,
and showed Dashboard plus the current entry on a direct load).

## Owner decisions carried out (2026-10-13)

**A. Date of admission (backend 6ea4038, frontend 16f3531).**
- `Student.admittedOn` (calendar day; `null` = not recorded). It is set by: Add Student, the student edit form, a
  bulk upload column (`admissionDate` or `admittedOn`), and admitting an Admissions application (that day). It is
  checked: a real date, not in the future, not before the date of birth (also when the date of birth changes later).
  It is never filled in from `createdAt`.
- Transfer certificate: the API returns `admittedOn` as recorded plus `missing: ["admittedOn", "dateOfBirth"]` for
  facts not recorded. The certificate prints "Not recorded" for them. On screen only (never printed), a warning asks
  for the real date "from the school's admission register… do not guess" and saves it to the student.
- Migration `npm run migrate:admission-dates` (dry run unless `--apply`, safe to repeat). It is backward compatible:
  the field is optional. It fills a date only where a real one is on record: students admitted through Admissions
  get the day of the "Admitted" step. Existing dates, imported students and legacy records are left alone. **It has
  not been run against any real database**, only in tests; running it on production needs the owner's go-ahead and a
  backup first.
- Tests: backend `tests/admission-date.test.js` covers form input, refusals, record-later/clear, a legacy record
  inserted without the field, bulk import with and without the column, Admissions admit, and the migration (dry run,
  apply, existing dates kept, other school skipped, second run). The legacy test fails when the certificate is
  pointed back at `createdAt`. Frontend `e2e/admission-date.spec.js` covers "Not recorded" with the screen-only
  warning, recording the date there, and the edit form saving both dates.
- Found on the way: the student edit form's "Date of birth" used a `dob` key the server ignores, so it was never
  shown or saved (fixed). The certificate overflowed a 375 px phone by 331 px, because the admin phone table rule made
  it 640 px wide (fixed: 0 px). Its on-screen parts used the certificate's serif font (fixed).

**B. Back/Forward protection (3ff48d3), no router migration.** In React Router 7.18.4, `useBlocker` (and `usePrompt`)
call `useDataRouterContext`, so they need a data router (checked in the installed source). `BrowserRouter` hears
Back/Forward through a plain `popstate` listener on `window`. Testing showed that Chrome runs listeners on `window` in
the order they were added (a capturing listener added later still ran second). So the guard's listener is added from
`main.jsx` before the app starts. While a form is dirty, it stops the event before the router sees it, puts the
address back with `history.go(delta)` (each BrowserRouter entry stores its position `idx`), asks, and on "Leave"
lifts the guard and repeats the move. The app's own back buttons (`navigate(-1)`) take the same path.
- Tests: Back (Cancel keeps the address and the typed text; Leave goes back; afterwards nothing is guarded), Forward,
  and Back without changes. 8 unsaved-changes tests repeated 4 times: 32/32.
- Limits: an entry without `idx` (not made by the app) is let through. Verified in Chrome only. A move to a different
  site via Back is a page unload and gets the browser's own question instead.
- A data-router migration (`createBrowserRouter`) is **not needed** for this. It stays a possible future change:
  about 75 routes, the nested admin `<Routes>`, and every `navigate()` would need checking.

**C. Admin menu with the keyboard (7ed0f18).**
- Menu entries were clickable `div`s (no Tab stop, no Enter). They are now links with `aria-current="page"`.
- Log Out, the phone menu button ("Open menu", `aria-expanded`) and its close button are buttons with names.
- The menu was a component created during render (the two lint errors in this file), so it was rebuilt on every
  render and keyboard focus was lost after each move. It is now rendered in place, and focus stays on the entry used.
- A focus ring (`currentColor`) shows on the dark and the light menus.
- "Skip to main content" is the first Tab stop.
- On phones the menu is a dialog: focus moves in, Tab and Shift+Tab stay inside, Escape closes it and focus returns
  to the menu button.
- Tests: `e2e/admin-keyboard.spec.js` (desktop and phone, keyboard only). Both fail against the old menu.

**D. Printing across browsers.**
| Browser | Status |
|---|---|
| Chrome (desktop, current) | **Verified**: 8 PDFs (A4 report cards 1/3/2 pages, A5 receipts 1 page, A4 certificates 1/2 pages) and 3 automated print tests |
| Brave | Installed; same Chromium print engine as Chrome; not tested separately |
| Safari 26.5.2 | Installed but **not verified**. Automation is off: `safaridriver` refuses until "Allow remote automation" is turned on in Safari ▸ Settings ▸ Developer (the owner's setting, not changed). It has no print-to-PDF command either, so a check means printing by hand |
| Firefox | **Not installed; not verified** (nothing was downloaded) |

Manual check for Safari/Firefox: open a fee receipt (Fee Collection ▸ a paid row ▸ receipt), a report card (Results ▸
report card) and a transfer certificate (Year End & TC ▸ a former student), press ⌘P, and check: one page for a
receipt and a one-student report card; no sidebar, Ask button or grey band; the table header repeats on a second
page.

Found while re-checking Chrome: a **grey band under the printed certificate**. There were two causes: the app's global
0.15 s colour transitions were still running when the printout was taken, and `body.admin-body` (later in the CSS,
same specificity) kept the body grey. Fixed in 7cae7d3. The print tests now read every wrapper's background at the
moment print media applies, and fail on the old rule.

## Known defects and open items
1. Admin screens on the old look but working: Reports-type pages keep their own chart colours; Settings and the
   portal heroes (Results, Profile) keep their own design.
2. Forms: no per-field inline error text.
3. Printing not verified in Safari or Firefox (see D).
4. Back/Forward guard verified in Chrome only; the admission-date migration has not been run on real data.
5. Owner console: tests run locally (`npm run test:e2e`); its CI workflow still runs lint and build only.
6. Portal (student/teacher/parent) navigation was not part of the keyboard pass; only the admin menu was.

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
| 2026-10-13 | Final pass (frontend dea2606, 95bf32e, 403714f, 7091a85; console ad35921) | Frontend Playwright **35/35, twice in a row**, on its own servers (8100/5174); 11 new tests (3 error feedback, 3 print, 5 unsaved changes). Console Playwright **6/6**, lint clean, build ok. Backend **727/727** (38 suites). Frontend build ok; ESLint on every file changed since 81a572b: 70 messages before, 64 after, none added. Responsive sweep on the isolated servers: **150 screenshots (75 routes × 375/1440 px), 0 JavaScript errors, 0 routes with page-level sideways scroll**. Print: 8 PDFs reviewed (real and long mocked documents). The owner's demo on 8000 was not used by any of these |
| 2026-10-13 | Owner decisions (backend 6ea4038; frontend 16f3531, 3ff48d3, 7ed0f18, 7cae7d3) | Backend **733/733** (39 suites; 6 new admission-date tests). Frontend Playwright **42/42** on fresh test servers, after the last change; 7 new tests (2 admission date, 3 Back/Forward, 2 keyboard); unsaved-changes spec 8 × 4 repeats 32/32. Each new test checked against the old code (fails there). Build ok; 0 lint messages on changed lines; admin Home.jsx lint errors 2 → 0. Sweep on the test servers: **150 screenshots, 0 JS errors, 0 page-level sideways scroll**. Chrome print: 8 PDFs reviewed, no grey band. Safari/Firefox printing not verified (see D) |
