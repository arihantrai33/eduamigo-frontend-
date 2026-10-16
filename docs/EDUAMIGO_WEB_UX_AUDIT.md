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
(2026-10-14: `revise` became `learn`, the Learning AI screen: AI Tutor with Guided Learning and Voice Learning, Practice &
Assessment, Revision Planner, Learning Progress, as tabs; `/student/revise` opens it. Design, tests and limits:
backend `docs/EDUAMIGO_LEARNING_AI.md`.)
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
1. Admin screens on the old look but working: Reports-type pages keep their own chart colours; the portal heroes
   (Results, Profile) keep their own design. Settings and Results had their visible defects fixed (da0f251); on
   desktop the student/teacher/parent screens are the phone layouts at full width (consistent, but wide lists).
2. Forms: field-level messages (`utils/fieldErrors.js`, `components/ui/FieldError.jsx`) on sign-in, select school,
   forgot and change password, both Apply Leave screens and Add Student/Teacher/Parent. The dialog forms (HR,
   Salaries, Transport, Library, Exams, Fee Structure, Events, Users, Timetable) still name a missing field in one
   toast; their fields are labelled now, so moving them to `useFieldErrors` is the next step.
3. Printing not verified in Safari or Firefox (see D).
4. Back/Forward guard verified in Chrome only; the admission-date migration has not been run on real data.
5. Owner console: tests run locally (`npm run test:e2e`); its CI workflow still runs lint and build only.
6. Portal navigation by keyboard: tested on a phone (Tab reaches the tab bar, Enter opens the screen, the current
   tab is announced, visible focus ring) and on a desktop (sidebar link by Enter, current page marked) in
   `e2e/interactions.spec.js`. Not covered: a full Tab-order review of every portal screen.
7. Voice Learning: real microphone, Hindi/Hinglish recognition and phones are untested (scripted speech only). The admin AI usage page was checked with mocked data and a real local backend, not on a phone.
8. Accessible names: `e2e/accessible-names.spec.js` holds all 65 portal screens, the sign-in, password and driver
   pages and 10 admin dialogs (Library, Exams, Fee Structure, Transport, Salaries, HR, Events, Users, Admissions,
   Communications) to the rule. Not covered: the Timetable period dialog (needs a class chosen first), the
   Transport stops dialog, row edit dialogs.
9. **Stale test servers (owner decision).** `node src/scripts/demo.js` started 2026-10-14 04:48 still listens on
   8100 (pid 55014), plus leftovers on 5174, 8110 and 5184. `reuseExistingServer: true` makes every
   `npm run test:e2e` reuse that old backend: it answers with an older tutor message, so the AI-off end-to-end
   test failed (the 79/80 of edcdb89 was this test, earlier misread as the "lost connection" one), and test records
   pile up between runs. On fresh servers (`E2E_API_PORT=8130 E2E_WEB_PORT=5194 npm run test:e2e`) the suite is
   **80/80**. Stop the stale processes, or run with fresh ports until then.

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
| 2026-10-14 | Learning AI (frontend f5f5cfe; backend 47e82ab, 9823698, 80ec694) | Frontend Playwright **55/55** (13 new: tutor answer rendering without raw HTML, sources, checks, reliability, diagram; guided mode and follow-ups; refused requests; Ask hand-over; tabs by keyboard; voice with a scripted speech stand-in: privacy notice, spoken question, read-aloud text, permission denied, silence, mute, stop, unsupported browser; practice and planner screens; one end-to-end run on the test backend with AI off). Phone and desktop screenshots of the four tabs reviewed; fixed: tall selects in column forms, reliability line wrapping, oversized diagrams on desktop. Sweep: **150 screenshots, 0 JS errors, 0 sideways scroll** (with `/student/learn`). The test backend now runs with `ASSISTANT_AI=off` (no paid provider calls in routine tests) |
| 2026-10-14 | Learning AI completion and usage control (frontend d5fe97e, 7e3ee69, 15a0310; backend 90d6b6b, 1340dbb, 415735f, 856090c) | Frontend Playwright **68/68** on its own servers (8110/5184, AI off, mocked answers); 13 new tests: practice button from a revision request (no ticket), duplicate Enter sends once, Escape stops speech, `?voicedebug=1` shows the measured delay only when asked, AI-off banner (and no server setting name), two-line graph with legend, concept map, long cycle steps, re-teach after a hard set (question typed, not sent), admin "AI usage and cost" tab (calls, tokens, "not priced", limits, no student content, zero-use message). Backend 804/804. Real local Chrome against the real local AI (not a routine test): `/student/learn` context 200, tutor input shown, typed answer and a graph rendered with no raw HTML or code fences; voice used a scripted speech stand-in only (no microphone, no phone). |
| 2026-10-15 | AI failure messages | The tutor error now names the reason (temporary network problem, took too long, service busy, not available, AI limit reached) with an icon, and offers Try again only when it can help; 5 new e2e tests incl. a lost connection and a wrong-setup server. Frontend Playwright **76/76**, build ok. |
| 2026-10-15 | Accessible names and last emoji | New `e2e/accessible-names.spec.js` (4 tests, one per portal, 65 screens). Before: about 100 unnamed controls on 25 screens; after: 50 on the 14 screens listed in open item 8 (teacher portal fully clean). Fixed: notification bells on all three portal homes (name includes the unread count), admin Notifications refresh, Communications pin/edit/delete, Add Student/Teacher/Parent fields (wrapping `<label>`), Apply Leave fields, 8 search boxes, parent Bus alert settings; raw ℹ️ in the billing banner and ↗ on teacher Upload now line icons. Frontend Playwright **79/80** (the one failure was later traced to a stale backend on the test port, see item 9; not flakiness); build ok; 0 lint messages on changed lines; Add Student screenshot at 1280 px unchanged in layout. |
| 2026-10-15 | Accessible names, remaining 14 screens; e2e failure root cause (21aac87, 62f067e) | Delete/edit row buttons name their record, filter selects and Bulk Operations fields labelled, bus map and calendar buttons named; `PENDING` emptied: accessible-names spec 4/4 strict. My Delete label "Delete Edit Me" broke a `/Edit/` regex in admission-date.spec.js (fixed: exact match). Full run on the stale 8100 backend: 78/80 (that test + the AI-off test, see item 9). Full run on fresh servers 8130/5194: **80/80**. Build ok. |
| 2026-10-15 | Older screens, first visual fixes (da0f251) | Screenshots of admin Settings (1280, 390) and student Results (1280, 390) and Profile (390) reviewed: 0 sideways scroll. Fixed: Results grade chips coloured CBSE A1/A2 in the fail red (colour now by grade band, null-safe); Settings school information left a third of a row empty next to Address (now name, principal, email, phone in one row on desktop, address full width). Full Playwright on fresh servers 8130/5194: **80/80**; build ok; 0 lint messages on changed lines. |
| 2026-10-15 | Responsive sweep 390/768/1280, interactions, field-level messages, dialog labels (second pass) | Sweep before: 234 screens (78 routes x 3 widths), 0 sideways scroll, 0 cut off, 0 JS errors, 0 server errors, 10 controls covered by the Ask button; all 234 screenshots seen on 12 contact sheets; found also: 140 px tall fields on phone forms, the user list broken below 1024 px, 22 touch targets under 24 px. Sweep after: **234 screens, 0 hard findings**; touch targets under 24 px down from 22 to 14, of which the account switch, the admin receipt links and the parent fee breakdown toggle were enlarged after the sweep (not swept again) and 2 are search fields inside a larger box (one sign-in in the sweep failed once with the school field empty after typing, before any click had an effect; it passed when run again; not reproduced, noted as a possible start-up race). New `e2e/interactions.spec.js` (12 tests; 3 failed on the old code: student "View" link, switch focus, and a test-timing issue fixed in the test) and 2 new accessible-name tests (sign-in pages, 10 dialogs; found the driver token field and 58 dialog fields unlabelled, all fixed). Targeted runs: 39/39. Full Playwright on fresh servers 8130/5194 after the last change: **94 passed, 0 failed** (19 opt-in sweep/crawl tests skipped). Before/after screenshots: Add Parent at 390, user management at 768, sign-in and Add Student error states, parent profile end. Build ok; 0 lint messages on changed lines. |

## Handoff (2026-10-15, second pass): status of the full-frontend request
Status words: **implemented** (code changed), **automated** (an e2e test covers it), **seen** (screenshot reviewed), **pending**.

Tools added (both opt-in, they take minutes):
- `SWEEP_DIR=<dir> npx playwright test e2e/responsive-sweep.spec.js`: 78 routes x 390/768/1280 px. Fails on sideways
  scroll, an element cut off at the screen edge, a control left under the tab bar or Ask button at the end of the
  page, a JavaScript error. Writes screenshots and `report-<role>-<width>.json` (also tiny targets, clipped text, gaps).
- `CRAWL_DIR=<dir> npx playwright test e2e/dead-click-crawl.spec.js` (about 6 minutes): clicks up to 12
  non-destructive buttons per screen at 1280 px and lists clicks after which nothing changed (saved per screen).
  It does not see scrolling, so a same-page jump shows up as "no effect".

Done in this pass:
- Responsive sweep, all 78 routes at 390, 768 and 1280 (234 screens): automated checks and every screenshot seen on
  contact sheets. Before: 0 sideways scroll, 0 cut off, 0 JS errors, 10 controls covered by the Ask button.
- Ask button covering the end of pages (admin at 768/1280, portals on desktop, parent profile on phones):
  implemented in shared CSS (index.css), seen. Cause and limits: see the comments at `.ea-scroll` in index.css.
- Form fields 140 px tall on phones wherever a label sits above its field in a flex column (Add Parent, Add
  Teacher, Add Student ...): implemented (one CSS rule), seen.
- User management below 1024 px: the list stacked its column headings; now one card per user. The account switch
  was a clickable div: now a real switch (keyboard, announced state) that keeps focus while the list refreshes.
  Implemented, automated.
- Students list: "View" and the student name opened `/admin/student-profile/:id`, a route that does not exist
  (empty screen). Now `/admin/students/:id`. Implemented, automated. Static check of every literal navigation
  target against the routes: no other dead link.
- Touch targets under 24 px (receipt chips and links, "View all", sign-in small buttons, "View File", the account
  switch, the fee breakdown toggle): implemented; the last three not swept again.
- Library "Add Book" category list showed "[object Object] Textbook" (an icon inside `<option>`): fixed.
- Field-level messages (item 2), sign-in keyboard (show-password button reachable, Enter in the ID field), labels
  on Forgot password, the driver token field and 10 admin dialogs: implemented, automated.
- Dead-click crawl, all four roles: 63 screens, 233 clicks, 0 errors, **0 dead buttons**. The 21 clicks without a
  visible effect were all on the option already chosen (an "All" filter, the current tab, today's day, the class
  already selected, a student already marked Present) and one School Setup "Go" that scrolls to its section.

Pending:
- Dialog forms to `useFieldErrors` (item 2); Timetable period, Transport stops and row edit dialogs not in the
  dialog check (item 8).
- Tab and filter groups do not say which option is chosen (no `aria-selected` / `aria-pressed`), found by the
  crawl on about 15 screens (fee and notice filters, day tabs, class chips, attendance status buttons, the HR, ID
  card and Bulk Operations tabs). A screen reader user cannot tell the current filter.
- Full Tab-order review of every screen; 375 and 1440 px were not swept again in this pass (earlier sweeps).
- Unverified: real phones and tablets (all checks are Chrome with phone-sized windows), Safari/Firefox printing,
  real microphone and voice.
- Owner decisions: stale test servers (item 9); the account switch deactivates a user with one click and no
  confirmation (a confirmation would change behaviour, so it was not added).

## Phase 2 (2026-10-15): desktop redesign of the portals and sign-in
Commits 9304ac9, 6de1ed1, 27fc4a6, 6cfbc1f (local).

Design system addition, `index.css` (from 1024 px only, phone and tablet layouts unchanged):
| Class | Use |
|---|---|
| `.ea-pd-band` | The page's coloured header becomes a rounded header card lined up with the content (also applied to the shared `PortalHeader`) |
| `.ea-pd-body` | Page body: desktop padding, centred on the content column |
| `.ea-pd-narrow` (page root) | Content column of 820 px for lists and forms (`--pd-w`); without it the column is the whole 1080 px stage |
| `.ea-pd-bar` / `.ea-pd-row` | Tabs, search, alerts and filter rows between header and body, lined up with the column |
| `.ea-pd-dash` | Home dashboards: tiles in one row, a main column and a side column |
| `.ea-pd-cols` + `.ea-pd-main` / `.ea-pd-side` / `.ea-pd-tall` | Two-column pages |
| `.ea-pd-idcard`, `.ea-pd-childcard`, `.ea-pd-idstats` | Home identity cards put their numbers beside the name |
| `.ea-auth`, `.ea-school-hero` | Sign-in and forgot password: brand panel beside the form |

Redesigned on desktop (all seen in screenshots at 1280 and 1440):
- Dashboards: student (tiles; today's classes beside upcoming exams and notices), parent (tiles; upcoming exams
  beside notices; child numbers beside the name), teacher (7 tiles in a row; today's schedule beside the summary).
- Two columns: student results (subjects beside strength/focus), both Apply Leave screens (form beside history),
  parent attendance (calendar beside the numbers and absent days).
- Reading column with header card: student attendance, fees, timetable, notes, notifications, profile, chat;
  parent fees, results, calendar, notifications, profile, chat; teacher attendance, marks, students, timetable,
  upload, leave, notifications, profile, chat.
- Sign-in and forgot password: two-panel card.
- Fixes found on the way: timetable and school calendar used the browser's default font; student chat contacts
  could not be opened by keyboard (now the shared `utils/pressable.js`); fee and chat tabs announce the selected
  one; dashboard tile icons line up when a label wraps.

Not changed: admin screens (already on the shared design; reviewed at 1440), Learning AI (own layout), bus
tracking (map), the open chat conversation, select school. The admin sidebar is dark while the portal sidebars are
light: a brand decision, left as it is.

Verification: sweep at 390, 768, 1280 and 1440 (312 screens): **0 hard findings**; tiny targets on phones: only
2 search fields inside a larger box, so the account switch, admin receipt links and fee breakdown toggle from the
previous pass are confirmed at 24 px or more. Before/after screenshots: dashboards, parent attendance, timetable,
sign-in. Full Playwright on fresh servers 8130/5194: **95 passed, 0 failed** (19 opt-in skipped). Build ok; 0 lint messages on lines changed in this phase.

Remaining: per-field messages in admin dialog forms; selected state on the remaining filter groups (admin chat,
library, admissions, communications, user management, teacher attendance class and status chips); a desktop week
grid for timetables (they stay a day list in the reading column); real devices and Safari/Firefox not checked.

## Phase 3 (2026-10-15, in progress): product-wide pass — tracker
Batch 1: 71f005a … 55649f9. Batch 2: 26acc96 … 77c39df. Final verification: 8de6770 and the docs commit after it (all local, not pushed).
| Area | Done (verified by e2e and/or screenshots) | Pending |
|---|---|---|
| Shared confirm dialog | alertdialog, Escape, Cancel focused for destructive, focus return | — |
| Destructive actions | event delete and account deactivation now ask | review every other delete for wording |
| Selected state | aria-pressed on all tab/filter groups; the crawl now skips the already-pressed option of a group (choosing it again rightly does nothing) | — |
| Admin dialogs and forms | field-level messages everywhere: events, users, exams, fees, library, bus, HR, salaries, timetable period, bus stops, settings, bulk operations | — |
| AI Tutor | streamed answer, network error with Try again, voice listening/speaking with Stop speaking, reviewed at 1280 and 390. AI off: no "ask this" starters, the empty chat points at the Revision Planner (e2e). Phone tab row fades at the edge to show it scrolls | real-device voice (see AI docs) |
| Admin reports | `/admin/reports` reviewed at 1280: stat cards and progress bars read clearly; no chart library, nothing broken | real charts would be a product decision |
| Dark mode | student and parent portals: sidebar and the --ea-* tokens follow the theme (only in those portals, `.ea-shell--themed`); text that was dark on dark fixed everywhere. Contrast probe over all 23 student/parent screens in dark mode: 0 text spots under 3:1 (was ~90). Fee amounts use `--ea-on-card-*` tokens; the dark `--ea-danger` override was reverted because the token is also a button fill and sits on pale red | teacher and admin portals are light-only by design (no switch) |
| Contrast (light) | --ea-faint 4.5:1; amber/green/red status text at 700 tones; grade badge colours 4.4:1+; bus and fee captions (stop subtitles, completed stops, chevrons, due dates, "At Home") on --ea-muted or darkened; admin timetable "Add Period", times and dialog labels darkened | light-mode probe still lists 32 spots outside bus/fee: parent attendance unmarked day numbers (#ccc), student profile chevrons, chat section labels (#999), leave-balance "12" green, "Pending" amber on grey, "RECENT NOTES" |
| Empty states | `components/ui/EmptyState` (+ `plain` variant) on 22 admin and 13 student/parent/teacher empty states: notifications (both), notes/tasks/resources, attendance, timetable day, leave history (student, teacher), chat teachers and broadcasts (student, parent), parent results. One frame, icon tile and readable text everywhere (old subtitles were #CBD5E1/#bbb on white, about 1.5:1). The `.ea-empty` name clash that stripped its padding fixed (`.ea-empty-line`). Library and Notes tell "no match for the search" from "nothing yet". Checked at 390 in light and dark | student result "No Results Published" full-page state kept as is (has its own Home button) |
| School setup | checklist "Go" buttons named per step and move focus to the section they scroll to | — |
| Search pills | student notes and teacher messages: 24 px field, visible focus ring (was outline: none) | — |
| Teacher profile | the "Dark Mode" switch only darkened its own help cards; removed. Settings keeps Account › Change password; its menu subtitle now says "Password and account" | — |
| Add teacher/parent | centred 760 px column | — |
| Select school | full-viewport split like sign-in | code-link state still a card |
| Bus tracking | stops panel beside the map on desktop; full-screen map reviewed at 1280 and 390 (student and parent): stays inside the content area beside the sidebar, Exit and Escape both leave it | the live-map state was not seen (no trip running in the demo data) |
| Timetables | week view on desktop (student, teacher); admin editor reviewed at 1280 and 390: period cards were divs with onClick only, now buttons named "Add period N" / "Edit period N: subject", Enter opens the dialog (e2e) | — |

Evidence for batch 2:
- Full e2e suite on isolated ports 8130/5194: 101 passed, 19 skipped (opt-in sweep/crawl and conditional specs), 0 failed, run twice: after 9654743 and again after the last empty-state commit. Targeted re-runs in between: interactions + screens + accessible names 29/29, learning 34/34.
- 1024 px sweep (78 screens, all portals and public pages): no sideways scroll, cut-off, covered or clipped text, page errors or failed API calls; two small touch targets (the search pills), fixed in 29a17eb.
- Dead-click crawl (all four portals, 63 screens, 206 clicks): no failed actions. The only "no change" left is School setup "Go to: Assign class teachers", whose section is already on screen; it moves focus there (checked), which the crawl does not watch. The earlier run also flagged re-choosing an already-selected option (21 of them); the crawl now skips those.
- Build passes; ESLint reports nothing on changed lines (the pages still carry older lint findings on untouched lines).

Final verification (2026-10-15, on 8de6770, isolated ports 8130/5194):
- Targeted specs (accessible names, admin keyboard, auth and navigation, interactions, print, screens, scroll, UX regressions, workflows): 55 passed, 0 failed.
- Responsive sweep, run explicitly at 390, 768, 1024 and 1280: 312 screens (78 routes × 4 widths), 0 findings (no sideways scroll, cut-off, covered or clipped text, small targets, page errors or failed API calls).
- Dead-click crawl, run explicitly: 63 screens, 206 clicks, no failed actions; the one "no change" is School setup "Go to: Assign class teachers" (scrolls to a section already on screen and moves focus there, checked).
- Contrast probe (temporary script, not committed): dark mode 0 spots under 3:1 on 23 student/parent screens; light mode 32, none on bus or fee screens.
- Build passes; ESLint reports nothing on changed lines.
- Full suite on 8de6770: 102 passed, 19 skipped (the opt-in sweep/crawl specs, run separately above, and conditional specs), 0 failed.
- Not covered: real-device voice and the live bus map (no trip in the demo data).


## Next: visual redesign plan (2026-10-15)
The unified design system, the route-by-route classification (78 routes) and the implementation batches B0–B15 are in `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md`. It is based on the 312-screen sweep of 8de6770, reviewed as contact sheets. No application code was changed for it.

### Redesign batch B0: foundations (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B0. The owner approved decisions D1–D3 (recorded in §7.3).

**Changes, in `src/index.css` only:**
- New tokens, not used by any page yet:
  - type scale `--ea-text-display/h1/h2/h3/body/sm/xs/overline` (font shorthand) and `--ea-tracking-overline`, with phone sizes for display and h1 below 768;
  - `--ea-radius-xl`;
  - `--ea-shadow-e2` and `--ea-shadow-e3`;
  - categorical palette `--ea-cat-1…6` with `-bg` tints;
  - `--ea-info-bg`, `--ea-info-border` and `--ea-on-card-info` (light #1D4ED8, dark #93C5FD in the themed portals).
- `.ea-stat__number`: `white-space: nowrap`, `font-size: clamp(18px, 2vw, 24px)` and tabular figures, replacing `overflow-wrap: anywhere`.
- Plan correction: `--ea-cat-3` amber is #A14608, because the planned #B45309 reached only 4.39:1 on its own tint (#A14608 reaches 5.32:1).

**Verification (ports 8130/5194):**
- **Before:** the 8de6770 sweep (no source changes since). **After:** a sweep at 390, 1024 and 1280, 234 screens, 0 findings.
- **KPI measurement** (all 70 numbers on 19 admin pages, at 390, 1024 and 1280):
  - Before: Fee Collection "₹31,500" and "₹27,000" ran to 2 lines at 1280.
  - After: one line at every width.
  - At 1280 those two numbers run 2 px past their text box into the card padding; there is still 17 px to the card edge, and nothing is clipped.
- **Pixel diff of all 234 before/after screenshots:** 64 differ. I checked the cause of each group:
  - At 390 and 1280, only the KPI digits differ (tabular figures).
  - At 1024, KPI numbers are 24 → 20.5 px (the planned clamp), so the cards are about 4 px shorter and the content below moves up.
  - Fee Collection at 1280 is the fix itself.
  - The rest are data and time differences: items with the same date in a new order (parent results, teacher uploads, notices); driver tokens regenerated by the demo seed; the simulated bus trip has progressed; a 1 px composer offset on student revise.
  - There are no unintended visual changes.
- **Tests:** `screens` + `ux-regressions` 9/9 passed. Sweep spec 15/15. Build passes.

**Seen, but outside B0 (left for B8):** at 1024 the admin Students table wraps the "9-A" class chip and the names, and the Actions column runs past the card edge ("Edit" is cut off).

### Redesign batch B1: primitives and pilots (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B1.

**Shared pieces:**
- New in `src/components/ui/`: `Badge.jsx`, `Avatar.jsx`, `Segmented.jsx`, `Chips.jsx`, `Skeleton.jsx`. Skeleton is not used by any page yet; it is adopted in B13.
- CSS in `src/index.css`:
  - `.ea-badge` now follows the spec: 22 px, 12/600, sentence case, warning tone #B45309 on #FFFBEB, a neutral tone, a brand tone and an optional dot;
  - `.ea-avatar--sm/md/lg`;
  - `.ea-seg`: unselected text is `--ea-body`, because `--ea-muted` is 4.36:1 on the track;
  - `.ea-chips`/`.ea-chip`: one line, scrolling sideways below 768;
  - `.ea-skeleton`: the shimmer stops under reduced motion.

**Pilots:**
- **HR:** Salary/Staff Leaves is a Segmented control (the navy filled tab is gone).
- **Admissions:** the status pipeline uses Chips.
- **Students:** the shared Avatar (brand tint; the random gradient colours are gone).
- **Fee Collection:** status uses Badge (Paid success, Pending warning, Overdue danger, Partial info) with a dot.
- The dashboard's "Recently enrolled" badges change too, because they use `.ea-badge`: the orange #C2410C becomes the standard amber warning.

**Acceptance:**
- **Segmented:** no filled navy, and `aria-pressed` is kept. Tab then Space chooses "Staff Leaves", and the focus ring is visible.
- **Admissions chips at 390:** one line (before: 4 rows) and scrollable (831 px in 310). Focusing "Withdrawn" scrolls it into view and Enter selects it. The results start about 125 px higher.
- **Avatars:** brand tint.
- **Badges:** sentence case.

**Review (ports 8130/5194):**
- Before/after captures, each viewed side by side at 390 and 1280:
  - HR (both tabs), Admissions (All and Enquiry selected), Students, Fee Collection;
  - the dashboard badges (before taken with HEAD's `index.css` swapped in);
  - the Planner and student home (no change).
- Pixel diff of the B1 sweep against the B0 sweep (156 screens): only the pilots changed. Library, Reports, Transport, parent results and the splash differ only by data, time or animation.

**Tests:** 53/53 passed: `interactions`, `accessible-names`, `admin-keyboard`, `workflows`, `screens`, `ux-regressions`, `unsaved-changes`, `admission-date`. Sweep at 390/1280: 10/10 passed, 156 screens, 0 findings. Dark-mode contrast probe: 0 text spots under 3:1. Build passes. ESLint counts on the four pages are the same as at HEAD (0/3/9/4); the new components have none.

**Not done in B1 (out of scope):**
- The student fee page still shows "UNPAID" and "PART PAID" in capitals; that page is not a B1 file. It moves to Badge when the student fee page is redesigned (B3/B6).
- The 43 CSS uppercase rules outside badges are untouched; they belong to B7 and B8.
- "+ Add Salary", "+ Add Leave" and "Collect" keep their navy/green fills; buttons are B2.

### Redesign batch B2: buttons and actions across admin (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B2.

**Pages:** fee collection, leave requests, salaries, HR, results, transport, user management.

**Button roles** (plan §2.6):
- Positive workflow actions are **primary** (solid brand, small in rows): Collect, Approve, Mark Paid, + Add Salary, + Add Leave, Report Cards, and the dialogs' Save/Record payment/Generate/Add Bus/+ Add Stop/Assign/Create User.
- Neutral actions are **secondary** (`ea-btn--ghost`): Cancel, Edit, Auto Generate, Reopen, Stops, Students, the expand toggle.
- Receipt is **tertiary**.
- Reject and Delete are **danger-ghost** (red text, no fill).
- Success stays a status, not a button colour: "✓ Done" is now success green (was faint grey, 2.6:1). The badges are unchanged.
- The payment-method picker (green selection, no pressed state) is now the shared Segmented control (`aria-pressed`).

**What was removed:** green, navy, orange and red fills and all gradient buttons on these pages.

**CSS additions** (`src/index.css`; no existing rule changed):
- `--tertiary`, `--danger-ghost`, `--sm` (nowrap), `--icon`;
- a ghost hover;
- a disabled state for `.ea-btn`. A disabled button used to look enabled; the shared rule also fades the AI Tutor's Send button while the box is empty.

**Review (ports 8130/5194):**
- Before/after side by side at 1280 for all 7 pages and 9 dialogs (Collect, Add Salary ×2, Generate Month, Add Leave, New Bus, Stops, Assign students, Add User).
- At 390: Fee Collection, the Collect dialog, Leave Requests, Salaries, HR leaves, Transport, the Stops dialog and the Add User dialog.
- Rest, hover, keyboard focus and disabled captured for primary and danger-ghost.
- Pixel diff of the sweep against the B1 sweep (156 screens): only the B2 pages and the disabled Send changed; the other differences are data or time (library order, the Reports timestamp, bus trip progress, the splash animation).

**Tests:**
- 88/88 passed: `workflows`, `interactions`, `ux-regressions`, `admin-keyboard`, `screens`, `accessible-names`, `unsaved-changes`, `error-feedback` and the three `learning` specs.
- Sweep 390/1280: 10/10 passed, 156 screens, 0 findings.
- Dark-mode contrast probe: 0 spots under 3:1.
- Build passes; ESLint counts on all seven pages are unchanged from HEAD.

**Found, not fixed (outside B2):**
- **HR "Mark Paid" is broken (functional).** On a salary row it calls the leave endpoint (`PUT /hr/leaves/<salary id>`), so it cannot mark a salary paid. This is existing behaviour; the Salaries page has its own working Mark Paid.
- **Phone layout (B8):** on Leave Requests and Transport at 390, the row/meta line is wider than the card. Approve/Reject and the bus actions are reachable and clickable, but only after the card's content scrolls sideways, which hides the name. Same before B2.
- **Still to do in B8:** row hover tints (green/blue gradients), table-header gradients, amounts in green, and the HR/Leave Requests status pills are still per-page styles.

The HR "Mark Paid" defect above is fixed in its own commit (`ad739eb`): the salary row now calls `PUT /hr/salaries/<id>`. A regression test in `e2e/workflows.spec.js` failed on the old code and passes on the fix.

### Redesign batch B3: portal page header (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B3, §2.5.

**Shared header** (`PortalHeader`, used by every student, teacher and parent screen):
- **Below 1024 px:** a 56 px app bar in the solid brand colour: back button, title (one line, ellipsis), optional subtitle and up to two actions (`ea-portal-head__btn`).
- **From 1024 px:** the admin-style page header: the title on the page background in the h1 type style, the subtitle in muted text and secondary-style actions on the right. There is no back button (the sidebar navigates), except on detail views (`detail`), which get a surface-coloured back button.
- The gradient band, the stat chips inside it and the negative overlap of the body are gone.

**New `SummaryCard`** (`components/ui/SummaryCard.jsx`): the single summary at the top of a portal screen. It has a white card, a title, one large value, an optional progress ring, a caption, and optional labelled figures in a row. It is used here and is the base for B6.

**Student pages converted:**
- Attendance: ring summary.
- Apply Leave: leave balance summary; buttons use the primary style.
- Fee: fee summary; the tabs are the shared Segmented control.
- Results: exam-type Segmented control and an overall-result summary; the strength and focus cards are token cards with icon chips; the progress bars are solid brand.
- Chat: list header, plus a detail header in the open conversation; the bubbles and Send button are solid brand.
- Notifications and Notes: header only; the Notes buttons use the primary style.
- Bus: the header band is solid brand instead of a gradient (the live-tracking layout is unchanged).
- Learning AI, Revise and Timetable already used `PortalHeader` and changed with it, as did **parent Profile** and **teacher Marks**.

**Shared CSS fix:** `.ea-pd-cols` now has `align-content: start`. When the body is taller than its content, the grid used to stretch its rows and leave a large gap under the first row (seen on Results at 1280).

**Review (ports 8130/5194):**
- Before/after side by side at 390 and 1280 for all 12 changed screens.
- The open chat conversation at 390, 768, 1024 and 1280, with keyboard focus on the back button.
- Results, Apply Leave and Chat at 768 (app bar) and 1024 (desktop header).
- The pixel diff against the B2 sweep (156 screens) shows only these screens. Two B3 runs also differ from each other on admin Library, Reports, Transport, parent Results and the splash screen, so those differences are row order and time, not B3.

**Tests:**
- 76/76 passed: `screens`, `scroll`, `auth-and-navigation`, the three `learning` specs, `print`, `interactions` and `accessible-names`.
- After the CSS fix: the sweep plus `screens`, `scroll` and `accessible-names` passed 23/23.
- Sweep 390/1280: 156 screens, 0 findings.
- Dark-mode contrast probe (student and parent): 0 spots under 3:1.
- The build passes, and ESLint counts on the changed files match HEAD.

**Scope notes:**
- The student Profile (gradient hero) moves to B12 with the other profiles.
- `SummaryCard` was created here, not in B6, because the B3 pages need it.

**Found, not fixed:**
- **Notes → assignment "Submit" has no handler (functional).** The button is restyled but still does nothing. Same before B3.

### Redesign batch B10: platform and sign-in screens (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B10, §2.1, D2.

**Shared work:**
- **New `PlatformHero`** (`components/PlatformHero.jsx`): the sign-in hero (`SchoolHero`) with the EduAmigo logo instead of the school's. The dots, rings, glow and curved edge are the same. On phones it is a header above the form; from 1024 px it is the left half of the existing `.ea-auth` split. `full` fills the whole screen for the splash.
- **New `.ea-platform`** (`src/index.css`) pins the EduAmigo indigo on these screens, whatever school theme was applied before. The main colour is indigo 600 (#4F46E5): white text on it reads at 6.3:1, while the `:root` #6366F1 reaches 4.5:1 only for large text.
- **`EmptyState`** gets `tone="danger"` (red icon chip) for error states.

**Screens:**
- **Splash `/`:** full window at every width, with no centred phone frame from 768 px; the same logo and type as Find your school. The loading dots are a `role="status"`. "Powered by EduAmigo" is readable (was #1E3A6E on navy).
- **Find your school** (search, results, confirm) and the error state of a bad `/s/<code>` link: indigo split instead of royal blue. Continue, "Yes, this is my school" and "Find my school" are solid primary buttons (were a blue gradient). The confirm card keeps the school's colour as its border.
- **Support `/support`:** platform split; the missing or expired token message is an `EmptyState` error with `role="alert"`.
- **Driver `/driver`** (token entry only; the trip screen is unchanged): platform split, a visible "Driver token" label (was `aria-label` only), the focus ring is no longer removed, and Continue is a primary button (was a bright-blue gradient).
- **Change password:** the school-coloured split like Forgot password (`SchoolHero`). Update password is a solid primary button in the school colour (was the brand gradient); the heading is h2 under the hero's h1, as on Forgot password.
- No visible text was changed except the case of the splash tagline (now "Your school companion").

**Review (ports 8130/5194):**
- 390, 768 and 1280 captured: splash with and without a saved school, Find your school (empty, the empty-submit error, search results, keyboard focus on a result, confirm, button hover), the bad school link, support, driver (empty, invalid token, input focus) and change password.
- Pixel diff of the sweep against B3 (156 screens): only the B10 screens changed. The other differences are row order and activity-log rows written by earlier tests.

**Tests:**
- 49/49 passed: `auth-and-navigation`, `accessible-names` (including sign-in, password and driver pages), `interactions` (including change password field errors), `error-feedback` and `screens`.
- Sweep 390/1280: 156 screens, 0 layout findings. The only "clipped text" entries are the two screen-reader-only labels on Learning AI/Revise, which have been flagged since B2 and are intentional.
- The build passes, and ESLint counts on all changed files match HEAD.

**Not changed (later batches):**
- The inputs on Find your school and Change password still remove the browser focus outline; their field style belongs to B7 (forms).
- The driver trip screen keeps its dark look and green/red trip buttons; it is outside B10.

### Redesign batch B6: stat tiles and summary card (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B6.

**`StatGrid`** (`components/ui/StatCard.jsx`) now counts its cards:
- **Five or more on a phone (<768 px):** one row that scrolls sideways. About two and a half cards show, and the cut card at the edge says there is more. While the row actually overflows, it is a focusable `role="region"` with a label, so it can be scrolled with the arrow keys. From 768 px it is the usual grid, with no extra tab stop.
- **`columns={3}`:** three small cards stay side by side at every width, with the icon above the caption. This avoids an orphan card on a second line, on a phone and in the narrow desktop side column of parent Attendance (seen 2 + 1 in review and fixed).
- **`style`** is passed through, for spacing.

**Pastel tiles replaced by StatCard** (neutral card, toned icon chip; colour for meaning only):
- student Attendance (Total days, Present, Absent);
- parent Attendance (Present, Absent, Leave);
- teacher Attendance (Present, Absent, Late; the counter only, the roster is B14);
- admin Attendance: its own emoji/coloured-border card is gone, and it uses the shared StatCard.

**Now on `StatGrid`, so they get the phone row:** admin Reports (5 cards) and User Management (one card per role). Fee Collection, Leave Requests and the other admin pages already used it.

**Acceptance:** on admin Fee Collection at 390 px, the first fee row now starts at 392 px (was about 600). The five KPI cards take one 110 px row instead of three.

**Scope notes:**
- The `SummaryCard` was built and adopted on the student screens in B3. On the parent screens (leave balance, results, fee) and the teacher leave balance, the summary sits inside the gradient header band, so it moves to a `SummaryCard` together with the header in B4 (parent) and B5 (teacher), as on the student screens.
- The admin dashboard KPI row (large clickable `.ea-stat` cards with a sub-line) stays as it is for B9 (homes), where the plan lists it.

**Review (ports 8130/5194):**
- Before/after at 390 and 1280: student, parent and teacher Attendance (teacher with Class 9-A open), admin Fee Collection, Reports and User Management; parent and student Attendance also at 768.
- Fee Collection keyboard check: Tab reaches the KPI row, the focus ring shows, and the arrow keys scroll it (scrollLeft 122 after three presses). At 768 and 1280 the row has no tabindex or role.
- Pixel diff of the sweep against B10 (156 screens): only the B6 screens changed. The other differences are row order (salaries, communications, library, the student's results) and activity rows written by tests.

**Tests:**
- 59/59 passed: `screens`, `scroll`, `accessible-names`, `workflows` (including the teacher attendance workflow), `interactions`, `ux-regressions`, `admin-keyboard` and the dark-mode contrast probe.
- Sweep 390/1280: 156 screens, 0 layout findings.
- The build passes, and ESLint counts on all changed files match HEAD.

**Found, not fixed (fixed in B4):**
- **Parent Notifications in dark mode:** an unread notice has a hard-coded light-blue background (`#eff6ff`) under light text, about 1:1 contrast. It appeared now because the workflows test left an unread notice. This existed before B6; the page is redone in B4.

### Redesign batch B4: parent page headers (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B4 (as B3, for the parent portal).

**Header:** every parent inner page uses `PortalHeader`: a brand app bar below 1024 px and the admin-style title from 1024 px. The gradient bands, emoji in the titles and the negative body overlap are gone. The pages are Attendance, Results (Report Card is a header action), Fee, Apply Leave, Calendar, Chat (list and the open conversation as a detail header) and Notifications. Bus gets a solid brand header, as on the student Bus.

**Summaries moved out of the bands into `SummaryCard`** (the B6 adoption for the parent screens):
- **Attendance:** ring, percentage, "9 Present • 3 Absent • 1 Late".
- **Results:** percentage, marks and grade; Subjects, Total and Grade as figures.
- **Fee:** academic year, total, Paid/Due figures and the paid progress bar, now solid brand on a neutral track with `role="progressbar"`.
- **Apply Leave:** leave balance (Total, Available, Used).

**Controls:**
- The Fee tabs and the Results exam pills are the shared `Segmented` control (`aria-pressed` kept).
- Apply Leave "Submit Leave Request" and "Go Back" are primary buttons, no longer gradients.
- The chat bubbles and the Send button are solid brand.
- The Bus call/SOS confirm buttons are solid (call: brand; SOS: red). The same two buttons on the student Bus were still gradients after B3 and are fixed here too.

**Fixed:** parent Notifications in dark mode (found in B6). The read and unread cards now use `--ea-surface`, with unread tinted 6% brand; the dates use `--ea-muted` instead of #aaa. The dark-mode contrast probe is back to 0.

**Review (ports 8130/5194):**
- Before/after at 390 and 1280 for the eight pages.
- 390, 768 and 1280 full-page captures of Fee, Results, Apply Leave, Attendance, Notifications and the open conversation with Anita Verma.
- Pixel diff against the B6 sweep: only the parent pages, plus student/teacher Attendance from the B6 three-column fix (made after that sweep).

**Tests:**
- 53/53 passed: `screens`, `scroll`, `accessible-names`, `workflows` (parent leave → office approval → parent sees it; parent ↔ teacher chat; parent notices), `interactions` and the contrast probe.
- Sweep 390/1280: 156 screens, 0 findings.
- Dark-mode contrast (student and parent): 0 spots under 3:1.
- The build passes, and ESLint counts on all changed files match HEAD.

**Not changed:**
- Parent Home (B9) and Profile (B12).
- The Calendar event colours (pink/yellow/green tints) are categories; they move to `--ea-cat-*` with the categorical palette (B8).
- The Bus map keeps its marker and progress-bar gradients.

### Redesign batch B5: teacher page headers (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B5 (as B3, for the teacher portal; attendance roster excluded).

**Header:**
- `PortalHeader` on Attendance, Timetable, Leave, Upload, Notifications, Students and Chat (the list, plus a detail header for the open conversation). Marks already used it.
- The "TEACHER PORTAL" eyebrows are gone from every page, including Home.
- The counts next to the titles (uploads, notifications, contacts) are neutral brand badges in the header actions. They were white on #FF5252 (about 3.3:1, and red reads as an alert).

**Duplicate gradient blocks removed:**
- **Home:** the header band stays as the portal's one home hero. The "Good evening" card below it is now a plain card (subjects, greeting, date, figures on neutral tiles).
- **Timetable:** the gradient summary is a `SummaryCard` (teacher, subjects, Total Periods/Today/Classes).
- **Leave:** the gradient "Annual Leave Balance" is a `SummaryCard` (Total, Used, Available) with the used bar in solid brand on a neutral track (`role="progressbar"`).

**Controls:**
- The Leave tabs (Leave History / + Apply Leave / Students) and the Upload tabs (My Uploads / + New Upload) are the shared `Segmented` control; `aria-pressed` is kept, so the `interactions` tab check still holds.
- Leave "Submit Leave Request", Upload "Upload Material" and Marks "Publish" are primary buttons; Marks "Save Draft" is secondary. All were gradients or a brand tint.
- The chat bubbles and the Send button are solid brand.
- **`SummaryCard`** gets an optional `subtitle` line.

**Review (ports 8130/5194):**
- 390, 768 and 1280 captures of Home, Timetable, Leave (and its Apply tab, full page), Upload, Notifications, Students, Chat, the open conversation with Meera Sharma, Marks and Attendance.
- Pixel diff against the B4 sweep: only teacher pages changed. The others are data (activity log, reports time, transport, result order, splash).

**Tests:**
- 54/54 passed: `screens`, `scroll`, `accessible-names`, `workflows` (teacher attendance → parent notice; parent ↔ teacher chat), `interactions` and `error-feedback` (the teacher notifications offline message).
- Sweep 390/1280: 156 screens, 0 findings.
- The build passes, and ESLint counts on all changed files match HEAD.

**Left for later:**
- The Attendance "Save/Update Attendance" button is still a gradient; it changes with the roster in B14.
- Teacher Profile is B12.

### Redesign batch B7: forms (2026-10-15)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B7.

**Shared form CSS** (`src/index.css`; field, label and section only):
- `.ea-form-section__title`: a 15 px heading with a line under it.
- `.ea-form-grid`: one column on phones, two from 768 px; `.ea-form-full` spans both.
- `.ea-field`: label, input, hint and error stacked.
- `.ea-label`: 13 px, 600 weight, sentence case, no text transform. `.ea-label__req` is the red star, hidden from screen readers; required inputs carry `aria-required` instead.
- `.ea-hint`: 12 px muted.
- `textarea.ea-input`: grows and resizes vertically.
- `.ea-form-actions`: the action bar at the end of the form, with a top line; buttons are full width on phones.
- Inputs and selects use the existing `.ea-input` / `.ea-select` (white, 1 px border, 40 px, brand focus ring). Inside a field the select no longer takes `flex-basis: 170px` (it would have become 170 px tall in a column).

**Forms converted:**
- Admin: Add Student, Add Parent, Add Teacher, Settings and School setup (AcademicSetup).
- Leave forms: student, parent and teacher, plus Upload Materials.
- Change password, and the Find your school field (left over from B10: its focus outline is no longer removed).
- `id`, `htmlFor`, `aria-*` and field names are unchanged. Title Case strings stay as written ("Full Name", "Leave Type"); a test reads "Full Name" by case.
- ALL-CAPS label strings now say the same in sentence case: Leave type, From date, To date, Reason, Attach document (optional), Apply new leave and Leave history, on the student and parent leave forms. Playwright's `getByLabel` matches without case, so the tests that read "FROM DATE", "TO DATE" and "REASON" still pass unchanged.
- **Buttons:** Add/Save are primary, Clear/Cancel/Save keys/Add subject are secondary, and Settings "Turn off" is danger-ghost. They were per-page grey/brand fills.

**Accessibility fixes found while converting:**
- **Add Parent:** the "link children" rows were clickable `div`s a keyboard could not reach. They are now toggle buttons (`aria-pressed`) in brand colours (were sky blue).
- **Add Teacher:** the subject toggles are the shared chip (`aria-pressed`, in a labelled group); before, they had no pressed state.

**Acceptance, measured on Add Student:**
- Input: 40 px, white (rgb 255,255,255), 1 px border (#E3E7EE).
- Label: 13 px, `text-transform: none`.
- Grid: two columns at 768 (335 px + 335 px), one at 390 (308 px).
- The action bar is at the end of Add Student, Add Parent, Add Teacher and Settings, at 390 and 1280.

**Review (ports 8130/5194, from the completed run):**
- Before/after at 390 and 1280: Add Student, Add Parent, Add Teacher, Settings, School setup, student and parent Apply Leave, Change password and Find your school.
- 390/768/1280 captures of every form (teacher Leave with its Apply tab open), Add Student with the empty-submit errors, and keyboard focus.
- The admin pages scroll inside their own panel, so the run's full-page captures stopped before the action bars. One extra screenshot-only capture (no test suite) took the action bars at 390 and 1280, the input and button focus rings, and the measurements above.
- **Pixel diff against the B5 sweep (156 screens):** the B7 forms changed. The other differences are test data written during this run: the specs added students "Edit Me" and "Imported Pupil", which change counts, lists, the class roster, chat contacts, the activity log and the reports. No `ea-label`/`ea-field`/`ea-hint` class existed before; the only similar name is `ea-field-error`, a different class.

**Tests (one run):**
- 65/65 passed, 0 failed, 0 skipped, exit 0. Specs: `interactions` (field errors on Add Student, student Apply Leave, change password and the teacher tabs), `workflows`, `unsaved-changes`, `admission-date`, `error-feedback`, `accessible-names`, `screens`, the sweep and the contrast probe.
- Sweep 390/1280: 156 screens, 0 findings.
- Dark-mode contrast: 0 spots under 3:1 (13 student routes, 10 parent routes).
- The build passes, and ESLint counts on all changed files match HEAD.

**Left for later:**
- The leave forms' attachment drop zone is a clickable `div` with a nested remove button, so it is not reachable by keyboard. This existed before B7; restructuring it is outside a CSS-only batch (candidate for B13).
- Add Student's "Upload Photo" control is a styled `label` around a hidden file input; unchanged.

### Redesign batch B8: admin tables, lists, filters and badges (2026-10-16)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B8, §3.2.

**New shared pieces:**
- **`CategoryBadge`** (`components/ui/Badge.jsx`) and **`catOf(name)`** (`tone.js`): a category (genre, exam type, event type, subject, audience) gets one of the six `--ea-cat-*` colours. Known names have a fixed colour; others are hashed, so the same name always gets the same colour.
- **`.ea-badge--cat1..6`**: text in the category colour on its 10% tint.
- **`.ea-row-wrap`**: a list card's header row moves its status and actions under the title on phones.

**Across the admin pages (scripted, then reviewed):**
- **Table header rows and card header bars:** the grey gradient strip becomes `--ea-hover` (Students, Teachers, Fee Collection, Fee Structure, Library, Parents, Results, Salaries, Fee Reports, Attendance Reports).
- **Row hovers:** no gradient and no sideways slide (Students, Teachers, Results).
- **Status progress fills:** solid success/warning/danger, no green→green or orange→red gradient (Fee Reports, Attendance Reports, Results, Reports).
- **Dialog buttons:** Save/Add/Schedule are `ea-btn--primary`; Delete inside its confirm dialog is `ea-btn--danger`. They were brand, orange, cyan, green and amber gradients (Communications, Exams, Fee Structure, Library, Parents, Students, Teachers, Timetable, Bulk Operations).
- **Initials and icon tiles:** brand tint with brand-dark text for everyone. They were random or per-role colours (Teachers, Chat, Leave Requests, HR, Salaries, Results, Parents, Transport, Teacher Profile).
- **Loading spinners and input focus borders:** brand. They were orange, cyan or pink on some pages.

**Page by page:**
- **Students:** the class chip is a neutral badge (was a random colour per class, e.g. purple for 9).
- **Teachers:** the shared `Avatar`; subjects are category badges.
- **Exams:** cards lose the purple top border; the exam type is a category badge; "Upcoming" is a success badge.
- **Library:**
  - Genres use the category palette (were purple/indigo/orange…).
  - The genre filters are shared chips: one line that scrolls on a phone (was three rows).
- **Admissions:** the "Applied" stage is brand instead of purple.
- **Communications:**
  - The audience is a category colour; priority labels are sentence case ("Important", was "IMPORTANT").
  - Cards lose the coloured left border, since the priority badge says it.
  - The tabs are a segmented control (no gradient) on one scrolling line.
  - Search, Add, the audience chips (scrolling on phones) and priority are laid out as toolbars.
- **Event Calendar:**
  - A plain calendar card: no gradient header or circles; today is solid brand.
  - Event types use the category palette.
  - The list has the shared empty state ("No upcoming events…", was "Add your first event!").
  - Buttons use the shared roles.
  - Fixed a hidden bug: `${c1}55` appended hex alpha to a CSS variable, so that style was invalid.
- **User Management:**
  - Roles are neutral badges (role ≠ status).
  - The on/off switch is brand when on and `--ea-muted` when off (was green / #CBD5E1 at about 1.5:1).
  - Search and role chips form a toolbar; on a phone the chips scroll on one line and the search keeps its width (it shrank to an icon).
- **Leave Requests:**
  - The phone overflow found in B2 is fixed: status, Approve and Reject wrap under the name inside the card.
  - Role badges are neutral; the expanded border is brand (was amber).
- **Transport:**
  - The same phone fix for the bus card header; the meta line wraps.
  - The yellow monospace token strip is a neutral code row with a **Copy** button ("Driver token copied").
  - "Completed" status is neutral (was indigo).
- **Fee Collection, Salaries, HR:**
  - Amounts are ink with Indian digit grouping (were green).
  - Allowances and deductions keep their +/− colour but use the readable on-card success/danger tokens (#10B981 on white was 2.5:1).
  - A partial-fee balance is warning (was blue).
  - Fee Structure shows "₹" (was "Rs.").
- **Timetable:** the day picker no longer gives each day its own colour.
- **Chat:** one avatar colour; neutral role badges; neutral welcome tiles.
- **Teacher Profile:** neutral icon chips (were purple, orange, green, blue); one avatar colour.
- **Bulk Operations:** segmented-style tabs on one scrolling line. All three actions are primary; "Fetch Pending Students" was red, but it is not destructive.

**Acceptance:**
- No purple borders, chips or tiles remain on any routed admin page. The only gradients left are the two loading shimmers (B13) and the ID card print designs (rated R in §3.2).
- Category colours come only from `--ea-cat-*`.
- Phone filters stay on one scrollable line (Library, Communications, User Management, Admissions); select filters use the toolbar's two-column phone grid.

**Unreachable files (not changed further; for the owner to decide):** `pages/admin/Attendance.jsx`, `pages/admin/NoticeBoard.jsx` and `pages/admin/Notifications.jsx` are never imported or routed (`/admin/attendance` renders nothing). The B6 StatCard change to `admin/Attendance.jsx` therefore had no visible effect. Removing these files is a separate decision.

**Review (ports 8130/5194):**
- Before/after at 1280 and 390 for the 19 changed admin routes.
- Extra 390/1280 captures after the last fixes (Library, Communications, User Management, Bulk Operations).
- Pixel diff against the B7 sweep: the admin pages changed as intended. Student, parent and teacher screens also differ, but only by the date (the run crossed into 16 Oct: greeting, today's column, due dates) and seed data. Crops were checked.

**Tests:**
- Main run: 65/65 passed. Specs: `screens`, `accessible-names`, `workflows`, `interactions`, `ux-regressions`, `admin-keyboard`, `error-feedback`, `unsaved-changes` and the sweep.
- After the last fixes: `interactions` + `workflows` 28/28, then `interactions` + `accessible-names` 27/27.
- Sweep 390/1280: 156 screens, 0 findings.
- The build passes, and ESLint counts on all 27 changed files match HEAD.

### Redesign batch B9: homes (2026-10-16)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B9.

**Admin dashboard:**
- **KPIs:** the shared `StatCard` (clickable, the same as every other KPI; a skeleton while loading) instead of the dashboard's own large tiles. On a phone the four KPIs are a compact 2 × 2 and no longer fill the first screen.
- **Quick access:** the column count comes from the number of modules (three columns, or four when that divides better; from 1100 px one row), so no tile sits alone. "Transport" was orphaned on its own row at 1280.
- **Any `StatGrid` with exactly four cards:** 2 × 2 up to 1099 px and one row from 1100 px. At 1024 the shared grid made them 3 + 1 (found in review and fixed).

**Student and parent homes (hero height):**
- **Student:** the ID card in the hero repeated the name and the photo already in the header line above. It now carries one line (Class • Roll • Admission No) and the four figures. The hero at 390 px is about 190 px tall (was about 530 px, 63% of the screen).
- **Parent:**
  - "GOOD EVENING — PARENT PORTAL" is now just the greeting ("Good Morning"), as on the other portals (the eyebrows went in B5).
  - The child card loses its duplicate initials tile and has a smaller name.
  - The hero is about 245 px tall at 390 px.
- **Hero figures:** the attendance/grade/marks/fee figures were clickable `div`s that a keyboard could not reach. They are buttons now (`HeroStat`), with 11 px sentence-case labels (were 9 px capitals) and a focus ring in the hero's text colour (visible on a brand hero; checked).

**Teacher home:** de-duplicated in B5 (the eyebrow and the second gradient card); nothing more needed.

**Review (ports 8130/5194):**
- All four homes at 390, 768, 1024 and 1280.
- Keyboard focus on a hero figure (student, parent).
- After the fixes: the dashboard plus three four-card pages (Teachers, Library, Students) at 768, 1024 and 1280.

**Tests:**
- 40/40 passed: `screens`, `scroll`, `ux-regressions`, `accessible-names`, `auth-and-navigation`, the sweep and the contrast probe.
- After the fixes, the capture plus `screens`: 7/7.
- Sweep 390/1280: 156 screens, 0 findings.
- Dark-mode contrast: 0 spots under 3:1.
- The build passes, and ESLint counts on the changed files match HEAD.

### Redesign batch B12: profiles and sub-views (2026-10-16)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B12.

**New `components/ui/Profile.jsx`** (CSS `.ea-profile-card`, `.ea-info-list`, `.ea-menu-list`, `.ea-switch`, `.ea-note`, `.ea-idcard`):
- **`ProfileCard`:** the header card on the surface (shared `Avatar` lg, name, one meta line, role badge). It replaces the gradient hero.
- **`InfoList`:** label/value rows (`dl`).
- **`MenuList`:** each row is a real button (keyboard and screen reader), with a neutral icon chip and a chevron. Sign-out rows are `danger`; a row can carry `aria-pressed` and a switch.

**Student, teacher and parent profiles now use the same parts:**
- **Main view:**
  - `PortalHeader` "My Profile", then the profile card.
  - The figures as `StatCard`s: student Attendance, Marks, Grade, Roll; teacher Classes, Subjects, Experience. They were 9 px capital labels in a gradient card.
  - The menu, then the sign-out menu.
- **Sub-views** (My Information, Settings, ID card, Help & Support) open with the detail `PortalHeader` and a back button. Each had its own gradient band.
- **Fixed:**
  - Menu rows, "Sign out on all devices", "Logout" and the dark-mode switch were clickable `div`s; they are buttons now. The switch is a pressed button.
  - Random tinted icon tiles (green, yellow, purple, orange) are one neutral brand chip.
  - The gradient avatars are the shared `Avatar`.
  - The ID card header is solid brand (not a gradient).
  - The teacher ID card no longer says the hard-coded "EDUAMIGO SCHOOL"; both ID cards show the school's own name (`branding.appName` / `user.school`, as on the home header).
- **No change to data, routes or actions:** same requests, same targets (notifications, change password, reset child's password, help, sign out everywhere, logout).
- **Copy:**
  - Field labels in sentence case ("Roll number", was "ROLL NUMBER" through CSS).
  - The info note is the alerts style. Its wording is now "Only the school office can change these details. Ask your class teacher if something is wrong.", where it was "…can only be changed by school admin. Contact your class teacher for any corrections."

**Review (ports 8130/5194):**
- Student, teacher and parent: the main view and every sub-view at 390, 768 and 1280.
- Keyboard focus on a menu row (all three).
- Dark mode (student, parent).

**Tests:**
- 34/34 passed: `screens`, `scroll`, `accessible-names`, `auth-and-navigation`, the sweep, the contrast probe and the capture spec, which opens every sub-view through its button and comes back.
- Sweep 390/1280: 156 screens, 0 findings.
- Dark-mode contrast: 0 spots under 3:1.
- The build passes, and ESLint counts match HEAD (one existing fetch-on-mount warning in each of the student and teacher profiles).

### Redesign batch B11: one shell (admin adopts the white sidebar, D1) (2026-10-16)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B11, §2.5; owner decision D1 (approved).

**Admin sidebar** (`pages/admin/Home.jsx`) is built from the same `.ea-sidebar__*` classes as the student, teacher and parent sidebar:
- **Look:** white `--ea-surface`, a `--ea-line` right border and 260 px wide (was 230 px, a deep brand gradient for bold schools and a heavy shadow).
- **Top:** school logo (or the initial on brand) and name, then "Admin Portal" (or the staff role).
- **Menu:** 11 px section overlines; 40 px links, `--ea-body` text, `--ea-hover` on hover, `--brand-soft` / `--brand-dark` when active (no more filled gradient or white dot).
- **Bottom:** the user card (shared avatar) and the Log Out button in the shared sign-out style.
- **Kept as before:** the menu's permission filtering, real links with `aria-current="page"`, the "Leave unsaved changes?" check on Log Out, the skip link, and the phone drawer (a dialog with focus trap, Escape and focus return). The drawer is 280 px (max 85% of the screen) and white.
- **`sidebarLook()` is gone:** no school gets a coloured sidebar any more. School colour shows in the active item, buttons and the home hero.
- **Admin canvas** is `--ea-canvas` (was #E8ECF4), the same as the portals.

**Review (ports 8130/5194):**
- Students page at 1024, 1280 and 1440.
- Keyboard focus on a menu link (ring visible).
- The phone drawer open at 390 and 768.

**Tests:**
- 41/41 passed: `auth-and-navigation` (sign out from the sidebar), `admin-keyboard` (menu links, `aria-current`, the drawer's Tab wrap from Close menu to Log Out), `screens`, `unsaved-changes` (Log Out from the `aside` with unsaved changes), the capture spec and the full sweep.
- The full sweep at four widths (390, 768, 1024, 1280): 312 screens, 0 findings.
- The build passes; ESLint on `admin/Home.jsx` is clean (as at HEAD).

### Redesign batch B13: states (loading, empty, error) (2026-10-16)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B13, §2.6 (Loading, Empty state, Error state).

**Loading:** no more plain "Loading…" lines. Lists, tables and screens show skeleton rows (`Skeleton`). The label is kept as the screen-reader text ("Loading students", "Loading fee records", …).
- **14 admin lists:** the spinner plus "Loading X…" became 4 skeleton rows: Students, Teachers, Parents, Fee Collection, Fee Structure, Fee Reports, Attendance Reports, Results, Salaries, Exams, Library, Leave Requests, Transport, Chat (×2).
- **Whole-screen loading in the student portal:** Home, Attendance, Fee, Notifications, Notes. Skeleton rows in a centred card; checked in light and dark mode.
- **About 35 other one-line loading messages** across admin, student, teacher and parent: Settings (3), HR (2), Marks (3), Admissions, School setup, Year end, Transfer certificate, AI usage, Ask insights and knowledge, User management, ID cards, the profiles, Timetable, Revision Planner, Progress, the chats, Bus, Calendar and others.
- **Kept, on purpose:**
  - The receipt and report card keep their print-styled message.
  - The Reports "Refresh" button keeps its "Loading..." button text (the button's loading state).
  - The parent home hero keeps its text (grey rows would not fit on the brand hero).
- **CSS:** `.ea-skeleton` stretches inside centred containers; in a table cell it keeps a 20 px margin from the card edges.

**Empty and error states (the last ones on the old pattern):**
- **Teacher notifications:**
  - Empty: the shared `EmptyState` ("No notifications found", with the filter-specific line).
  - Error: `EmptyState tone="danger"` with `role="alert"` ("Notifications could not be loaded" plus the message, e.g. "Can't reach EduAmigo right now. Check your internet connection and try again."). The `error-feedback` test reads that message.
- **Activity log:** `EmptyState` "No activity found", with "Nothing matches these filters. Clear them or choose other dates." (was a plain grey line).
- Support's missing-token error became an `EmptyState` error in B10.

**Review (ports 8130/5194):**
- Loading states captured by holding back the API response for 4 s: admin Students at 390 and 1280; student Attendance at 390 in light and dark.
- The Activity log empty state at 390 and 1280.
- Teacher notifications: the error (connection aborted) and the empty state.
- Two fixes from this review:
  - The whole-screen skeleton sat on the page background, too faint, and was off-centre. It is now in a centred card.
  - The table-cell skeleton touched the card edges; it now has a margin.

**Tests:**
- 69/69 passed: `screens`, `scroll`, `accessible-names`, `error-feedback`, `interactions`, `workflows`, `learning`, the sweep and the contrast probe.
- One of my own screenshot specs failed (`route.continue` after `unroute`, a capture-script bug). It was re-run fixed: 2/2.
- After the final fixes, `screens` + `error-feedback`: 7/7.
- Sweep 390/1280: 156 screens, 0 findings.
- Dark-mode contrast: 0 spots under 3:1.
- The build passes, and ESLint counts on all 55 changed files match HEAD.

### Redesign batch B14: teacher attendance roster (2026-10-16)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B14 (risk H). Layout only: the state, the save request and every accessible name are unchanged.

**Roster:**
- It was one large card per student (avatar tile, name, a duplicate status pill, four pastel buttons, a remark box). It is now **one card with a compact row per student**: the shared `Avatar`, name, "Roll N", a four-way status control and the remark field. From 768 px each student is a single line (name | status | remark).
- **Status control:** a segmented track; the chosen status shows its meaning (Present green, Absent red, Late amber, Holiday neutral). Each button keeps its name ("Present: Kabir Sharma") and `aria-pressed`; each group is labelled "Attendance for <name>". An absent student's row has a red edge.
- **Removed:** the duplicate status pill on every card (the control already shows the status).
- **Mark All:** secondary buttons in a labelled group (same names Present/Absent/Late/Holiday), instead of pastel pills.
- **"Attendance already marked":** the note style (warning).
- **Save/Update Attendance:** a primary button, no longer the brand gradient (left over from B5).
- **Found in review and removed:** a sticky Save above the phone tabs was tried. The phone page scrolls inside its own container, so the button floated over the middle of the roster.

**Manual run-through on the 8130 test server** (automated): open Class 9-A; select Absent for Kabir Sharma with the keyboard (Space; Present un-pressed); Late plus a remark for Riya Sharma; Mark All → Present (both pressed); save → "Attendance saved for 3 students". Captured at 390, 768 and 1280, with keyboard focus.

**Tests:**
- 56/56 passed: `workflows` (the teacher marks a student absent and the parent is told once; parent ↔ teacher chat), `interactions`, `accessible-names`, `ux-regressions`, `screens`, `scroll`, the sweep and the run-through.
- After removing the sticky rule: the attendance workflow test again (1/1) and a phone recapture.
- Sweep 390/1280: 156 screens, 0 findings.
- The build passes; ESLint on `teacher/Attendance.jsx` has one fewer error than HEAD (the now-unused `STATUS_COLORS` and an unused index variable are gone).

### Redesign batch B15: final verification (2026-10-16)
Plan: `docs/EDUAMIGO_DESIGN_SYSTEM_PLAN.md` §4 B15. Every batch B0–B14 is committed. This batch fixes what the final review found, then records one definitive run on the finished code.

**Fixed in this batch:**
- **Text contrast (light mode, all roles).** The first light-mode probe across all four roles found faint text on 29 screens. Two kinds:
  - grey text (#94A3B8, #9CA3AF, #999, #ccc, #BDBDBD…), about 1.5–2.9:1;
  - status text in the light 500 shades (#10B981, #F59E0B, #EF4444…), about 2.1–2.5:1.

  A scripted pass changed only the text-colour property (`color:` in style objects, `color=` on icons, `color:` in CSS strings) to the tokens: `--ea-muted` (4.6:1), `--ea-faint` and the `--ea-on-card-success/warning/danger` status tokens. That is 302 changes in 54 files, which also follow dark mode now. Light-on-dark colours and the dark driver screen were left out.
- **Status text set through variables:** HR status badge, parent leave history, parent attendance calendar and list badge.
- **Badges with a hard-coded light fill under a status token:** these would have turned light-on-light in dark mode (parent attendance, parent results grade C, student attendance warning, student fee "Paid"). Their fill is now the status colour mixed into a transparent tint, so it works in both themes.
- **Category colours in dark mode:** `--ea-cat-1..6` and their tints have lighter values under `.ea-shell--themed` dark.
- **Parent School Calendar:** event types use the category palette (B8 had done only the admin calendar); fee due dates stay a status (danger).
- **Five-card KPI rows** (Fee Collection, Reports, User Management) were 4 + 1 at 1280. They are now one row of five from 1100 px; phones keep the sideways row from B6.
- **Report card opened without a student or class** showed "You do not have permission to perform this action":
  - a student now gets their own card (as the Results button does with `studentId=me`);
  - anyone else sees "Choose a student or a class first. Report cards open from the Results screen." and no request is made.
- **Copy:**
  - Exclamation marks removed: "Leave request sent" (was "Leave Applied Successfully!"), "All fees paid" (was "All fees cleared!" and "All fees cleared"), "Copied", "Reached school", "Good standing — keep it up", "No messages yet. Write the first message below." (was "Say hello!").
  - **Bulk Operations → Fee Reminder** said "send reminders via SMS/Email (integration coming soon)". The feature only lists students with pending fees and their parents' contacts, so it now says exactly that. Its error reads "Could not load the students with pending fees" (was "…send the fee reminders").
  - "STUDENTS WITH PENDING FEES" is in sentence case.
  - A scan for developer or placeholder wording ("API", "undefined", "TODO", "Lorem", "click here", "coming soon") found nothing else in visible text.

**Definitive run on the final code (ports 8130/5194):**
- Full Playwright suite with the opt-in sweep and crawl switched on: **133 passed, 0 failed, 0 skipped**.
- **Sweep at four widths** (390, 768, 1024, 1280): 312 screens, **0 findings**. No sideways scroll, no JavaScript errors, nothing cut off or covered by the tab bar.
- **Contrast** (text under 3:1): light mode admin (32 routes), teacher (10), student (13) and parent (10); dark mode student and parent: **0 in all six runs**. The probe was also fixed: it used to misread `color(srgb …)` backgrounds from `color-mix()` as near-black.
- **Dead-click crawl:** 206 clicks across the four roles, 1 flagged: School Setup "Go to: Assign class teachers". A separate check shows it works (the page scrolls 379 px and focus moves to the Classes section). The crawl only compares a DOM snapshot, so it does not see scrolling; a false positive.
- **Build:** passes. **ESLint:** the counts on every changed file match HEAD (one fewer on `teacher/Attendance.jsx`).
- **Contact sheets:** all 78 routes at 1280 and 390 were reviewed from the four-width sweep. One sheet was double-checked against the original screenshot after a misreading of a scaled-down tile.

**Route inventory (78 routes, every one opened and inspected at 390 and 1280; the sweep also covers 768 and 1024):**

| Group | Routes | Status |
|---|---|---|
| Sign-in and platform | `/`, `/select-school`, `/s/:code`, `/login`, `/forgot-password`, `/support`, `/driver` (token entry) | PASS |
| Student (15) | home, attendance, result, fee, bus, timetable, notes, learn, revise, apply-leave, notifications, chat, profile, change-password, report-card | PASS |
| Teacher (10) | home, students, attendance, marks, upload, timetable, leave, notifications, profile, chat | PASS |
| Parent (10) | home, chat, apply-leave, notifications, attendance, calendar, fee, result, bus, profile | PASS |
| Admin (35) | dashboard, students (+add, profile), parents (+add), teachers (+add, profile), attendance reports (both routes), chat, exams, fees, fee reports, fee structure, leaves, library, admissions, communications, reports, results, salaries, settings, academic, activity, ask, year end, TC, timetable, transport, user management, event calendar, bulk operations, HR | PASS |
| Admin, partly | `/admin/id-card-generator` | PARTIAL: the page UI follows the system; the printed ID card designs keep their own colours on purpose |
| Admin, partly | `/admin/teachers/:id` on a phone | PARTIAL: the three header figures stack vertically (readable, but not the StatCard layout) |

**Not a route (outside the 78):**
- The driver trip screen (`/driver` after a valid token) keeps its dark design.
- `pages/admin/Attendance.jsx`, `NoticeBoard.jsx` and `Notifications.jsx` are not imported anywhere, so they are unreachable (see B8). Removing them is the owner's decision.

**Known open items (functional, not redesign):**
- Notes → assignment "Submit" has no handler (since B3).
- Push notifications are stored but not sent.
- The leave forms' attachment drop zone is not keyboard-reachable (nested buttons; needs restructuring).
- The test suite writes records ("Edit Me", "Imported Pupil", activity rows) into the local 8130 test database; the owner's demo on 8000/5173 was never used.

### Functional fixes after the redesign (2026-10-16)

The three open items listed under B15, audited to the root cause. The note there that push notifications are "stored but not sent" was wrong: the backend pushes every in-app notice through Firebase Cloud Messaging, except one path (below).

**1. Notes → assignment "Submit" did nothing.**
- *Root cause:* the button had no handler, and there is nothing for it to call. The backend has no submission record or endpoint. `Note.status` (`Pending`, `Submitted`, `Urgent`) belongs to the assignment as a whole, not to each student.
- *Fix (interim):* the dead button is gone. An open task with a teacher's file shows an **Open** link to it. A done task shows a **Done** status badge (it was a button that looked pressable).
- *Needs the owner's decision:* real submission. This means what a student sends (file, text, or both), where files are stored and who may see them, and how the teacher reviews and returns work. Those choices come before a per-student submission model and endpoints.
- *Related, not changed:* the student **Add a note** sheet always fails. Students have no `notes.upload` permission, and the request sends JSON with no file to an endpoint that requires a PDF. The error is swallowed, so the sheet only shows "Uploading…" and then stops. Remove it, or give students a real upload: owner's decision.

**2. The leave forms' attachment could not be reached with the keyboard.**
- *Root cause:* the drop zone was a click-only `div` that opened a `display: none` file input, which is outside the tab order. The Remove button sat inside that clickable `div`. Remove also left the input's value in place, so the same file could not be chosen again.
- *Fix:* a shared `components/ui/FileAttach.jsx`, used by the student and parent leave forms:
  - The input is visually hidden (`.ea-sr-only`), so Tab still reaches it.
  - Its label is the drop zone, and the zone shows a focus ring.
  - Remove is a separate 44 px button. It clears the input and returns focus to the field.
  - The visible text is unchanged.

**3. Push notifications.**
- *Root cause (code):* exam scheduled, updated and cancelled notices were written with `Notification.insertMany` in `examController.notifyExamAudience`, which bypassed `services/notify`. They reached the in-app inbox but were never pushed. This was the only notification writer outside `services/notify`.
- *Fix (backend `0ba841d`):* those notices are now pushed through a new `push.toUsers`, to the same recipients only.
- *Needs external configuration (not fixed in code):*
  - `android/app/google-services.json` and `ios/App/App/GoogleService-Info.plist` are missing from the app projects, so the native apps cannot get an FCM token.
  - The server needs `FIREBASE_SERVICE_ACCOUNT` (or the key file).
  - The APNs key must be uploaded to Firebase for iOS.
  - Delivery on a real device has not been verified.
  - There is no web or PWA push. Browser users see notices in the app only.

**Tests:**
- `e2e/functional-fixes.spec.js` (new):
  - On the student and parent leave forms, Tab reaches the field and Space opens the picker. Tab and Enter remove the file. The same file can be chosen again. Submit sends `attachmentUrl` and `attachmentName`, with the upload and the apply request answered in the test.
  - The student task list has no Submit button. The Open link points to the teacher's file. Done is not a button.
- Backend `tests/push.test.js`, two new tests:
  - An exam pushes once, to the class's students and parents only. This test fails without the fix (0 pushes).
  - The exam is still saved and announced in the app when FCM fails.

### Cross-portal consistency pass (2026-10-16)

The owner reported that the portals felt like separate screens joined together, not one product. A measurement at 1470 px confirmed it:
- page titles started at x = 325, 353 or 455 depending on the page;
- content was 820, 1024 or 1080 px wide;
- there was a 195 px empty strip beside the sidebar on "narrow" pages.

The per-page checks in B15 (contrast, overflow, dead buttons) never compared pages with each other, so B15 marked these routes PASS.

**Shared causes (before):**
1. `.ea-stage { max-width: 1080px }` and `.ea-main { justify-content: center }`: the portal page floated in a centred stage.
2. The `.ea-pd-*` and `.ea-portal-head` formula `max(28px, (100% − --pd-w)/2)` centred "narrow" pages in a second 820 px column.
3. Admin `<main>` used an inline `1.75rem 2.5rem` (a 40 px gutter). Several admin roots centred themselves at 760, 900, 1000, 1050 or 1200 px.
4. Learning AI's tabs and panel, and the bus header, used their own centring or full-bleed layout.

**The system (index.css):**
- Tokens:
  - `--ea-gutter`: 16 px, or 32 px from 1024 px.
  - `--ea-page-top`: 16 px, or 28 px from 1024 px.
  - Purpose widths: `--ea-w-read` (880 px) and `--ea-w-wide` (1200 px).
  - Admin tables use the whole area.
- Every page starts on the gutter and is left-aligned. Its width depends on its purpose:
  - **read:** forms, lists, profile, messages;
  - **wide:** dashboards, timetables, results, Learning AI;
  - **full:** admin tables;
  - **map:** bus. The map stays full-bleed; its header card and stops panel sit on the frame.
- One heading hierarchy:

  | Level | Style |
  |---|---|
  | Page title | `--ea-text-h1`, the same in admin and the portals |
  | Section and card titles | `--ea-text-h2` (16/700) |
  | Group labels | `.ea-overline` |

  The three home dashboards now have an h1.
- One control for switching views: `Segmented` replaced five other looks. Real tablists keep `role="tab"`. Filters use `Chips`.
- One figure style: `--ea-figure-label` and `--ea-figure-value`. Stat labels are in sentence case.
- One warning note: `.ea-note--row` replaces four inline yellow banners.
- One canvas: `--ea-canvas` for admin and the portals, and page roots no longer paint their own grey.
- The Ask button sits in the same corner in every portal.

**Commits:**

| Commit | Change |
|---|---|
| `3d12457` | Frame |
| `fb755b7` | Headings |
| `b24ef9c` | Tabs |
| `a4f0011` | Figures and notes |
| `5578d12` | Phone gutter, canvas, home tiles |
| `9930b9f` | Fixes from the review |

**Verification:**
- **New check, `e2e/layout-alignment.spec.js` (21 tests):**
  - 4 portals at 1024, 1280 and 1440: the title and content start on the gutter, and the content is no wider than its purpose (27 admin routes).
  - Titles sit at the same height.
  - 390 and 768: content keeps the 16 px gutter.
- **Full suite:** 127 passed, 19 opt-in skipped (sweep and crawl), 0 failed.
- **Build:** passes.
- **ESLint:** no changed file has more findings than at HEAD.
- **Sweep and review:**
  - Before/after sweep at 390, 768, 1024 and 1280: 312 + 312 screenshots.
  - Automated findings are identical before and after:
    - 16 `clippedText`: `.ea-sr-only` labels, a false positive;
    - 8 `tiny`: the visually hidden file input on the leave forms, whose 48 px label is the target.
  - All 78 routes reviewed side by side at 1280. Representative sheets reviewed at 1024, 768 and 390. Spot checks in dark mode.
- **Contrast probe (new, stricter than B15's), light and dark at 1280:** 561 findings, then 336.
  - The pass's own regression is fixed: muted text and group labels on the darker canvas.
  - The remaining 336 are older palette issues, listed below.

**Exceptions (deliberate):**
- Admin dashboard: the "Finish setting up your school" banner sits above the title until setup is complete.
- Admin chat: a two-pane messaging layout, with the title in the list pane.
- Bus: the map fills the area.
- Report card, receipts and sign-in screens: not part of the signed-in frame.

**Open, not changed in this pass:**
1. Contrast, older palette:
   - hard-coded `#888` and `#7B8099` greys on home tiles and parent screens (77);
   - the school's brand teal used as text on the canvas and on brand-soft (70), and in dark mode (33). This needs a darker brand text token derived from the school colour;
   - white-on-glass text in the home hero (about 50).
2. Dark mode: icon chips and empty-state icons use the light `--brand-soft`, so they show as white squares. Changing `--brand-soft` and `--brand-dark` for dark mode affects buttons too, so it needs its own pass.
3. Bus at 1024–1279 px: the stops panel covers part of the "Bus not on route yet" message. This was already so before the pass.
4. 149 inline `#64748B` colours remain in page files. They are fine on white cards. Admin table headings are now covered by a shared rule.

### Layout and appearance fix across all portals (2026-10-16, second pass)

The owner reported two visible problems and asked for every screen to be checked at 390, 768, 1024, 1280 and 1440 px.

**1. Notifications was shifted to one side (and so were 21 other pages).**
- *Cause:* the frame pass made list pages a left-aligned 880 px column. At 1440 px that left a 268 px empty strip on the right against a 32 px gutter on the left.
- *Fix:*
  - List and overview pages now fill the frame (`--ea-w-wide`, 1280 px).
  - The `ea-pd-narrow` class was removed from 22 pages.
  - Forms and detail views keep a reading width through the new `ea-pd-read` class (1040 px, same left edge):
    - the profile sub-views;
    - the teacher upload page;
    - the admin Add forms and School Setup.
  - On a screen wider than the frame, the whole frame is centred (`--ea-pad-l`), so every page of a portal still starts on the same line (checked at 1920 px).
  - Admin uses the same rule.
- *Profile pages* (student, parent, teacher): from 1024 px the identity card and figures sit beside the menu. Before, one narrow column stretched down the page.

**2. Learning AI: background, container, typing box.**
- *Cause:* the typing box followed the last message, so on a wide screen it floated in the middle with half a screen empty below. The conversation log was meant to scroll inside (the code scrolls it), but no CSS made it do so.
- *Fix:*
  - The page is as tall as the screen.
  - The tutor is one card: toolbar on top, a conversation that scrolls inside, and the typing box at the bottom of the card.
  - The three other sections scroll inside their panel.
  - Dark surfaces were added.
  - A test checks the box position at 1440, 1280, 1024, 768 and 390 px.

**3. Dark mode.**
- In the dark portals `--brand-soft`, `--brand-border` and `--brand-dark` now resolve to dark tints and light text. Before, they were the school's near-white tint, which gave white squares behind icons and empty states, and teal text at 2.7:1.
- Status icon chips and alerts use tokens mixed with the surface. Before, the cream warning box and the white "sign out" chip stood out.
- Profile "sign out" chips, the Learning AI warning and the Notes subject icons were checked in dark.

**4. Text contrast (stricter probe, light and dark, 1280 px).**
- Findings fell from 561 to under 100:
  - `--subtext` was `#888888` (3.5:1) and is now `#5B6B80`;
  - brand colour used as text (55 inline uses and 10 CSS rules) now uses `--brand-dark`;
  - 28 grey literals (`#888`, `#7B8099`, `#6b7280`) now use `--ea-muted`;
  - small text in `#64748B`, `#DC2626`, `#16A34A`, `#059669` and `#6366F1` on tinted fills was darkened (169 places);
  - the bus header is a deeper brand with raised text opacity.
- About 90 findings remain: small text on hard-coded tinted fills in scattered places.

**Verification:**
- **Screens:** all 78 routes at 5 widths, 390 + 390 screenshots, before and after (saved in the session scratchpad, `fix2/before` and `fix2/after`, with pair sheets).
- **Build:** passes.
- **ESLint:** no changed file has more findings than at HEAD.
- **Tests:**
  - Layout-alignment spec: 32 tests (1024/1280/1440/1920 px, the phone gutter, and the typing box).
  - Focused suites (layout, three Learning AI specs, screens, accessible names, UX regressions, interactions, workflows, scroll, sign-in): **113 passed**.
- **Sweep:** automated findings are identical before and after (the known hidden-label and hidden-file-input false positives).

**Not done:**
- The remaining contrast findings, and teal text on white cards in the school's brand colour (a deeper per-school text token would be needed for very light brand colours).
- The Bus page at 1024–1279 px: the stops panel overlaps part of the "Bus not on route yet" message (this was already so).

### Final fixes after the layout pass (2026-10-16, third pass)

**1. Bus: the stops panel covered "Bus not on route yet" between 1024 and 1279 px.**
- *Cause:* the message was centred in the whole map area, while the 360 px panel sits on the right. Below about 1280 px the message's right half fell under the panel.
- *Fix:* the empty state (`.ea-bus-empty`, student and parent) is centred in the space left of the panel. The live map still fills the width under it.
- *Also:* the stop connector lines and the number circles use the theme tokens. The parent "SOS" button follows the surface.
- *Test:* `e2e/bus-layout.spec.js`, 8 tests (student and parent at 1024, 1100, 1279 and 1280). The test checks that the text block ends before the panel begins, that the panel and the message stay inside the page area, that "Route Stops" and the call button are visible, and that nothing scrolls sideways. Without the fix, 4 of the 8 fail.

**2. Contrast: 94 findings, now 0 in the probe.**
- *Brand colour as text:*
  - `utils/theme.js` now computes `--brand-text` (darkened until it reaches 4.7:1 on the light canvas) and `--brand-text-dark` (lightened until it reaches 4.7:1 on the dark card and on the brand tint of a pill or an active link).
  - A brand colour that already reads well is kept as it is.
  - All text uses of `--brand` and `--brand-dark` (98 inline, 22 CSS rules) and `theme.primary` (home screens, Login) use these tokens.
  - `e2e/brand-text.spec.js` (23 tests) checks 11 school colours (including light teal, yellow, pale pink, white, light grey and black) in both styles.
- *Other:*
  - Grade badge colours (`utils/grades.js`, student result) now meet AA on their own fills.
  - `--ea-on-card-success` is darker (#166534).
  - Category 1 (teal) as text is darker.
  - About 150 grey and slate text literals use `--ea-muted`.
  - Bus text, the orange "Call School" and the ✓ chip use the status tokens.
  - Chat avatars use `--brand-deep`.
- *Probe:* light and dark, 1280 px, every portal route (student 15, parent 10, teacher 10, admin 29 pages). Limits: it checks text visible in the first 900 px, skips text on gradients, and skips hidden or disabled elements and completed timetable rows.

**3. Notification unread colour.**
- Student notifications used `#eff6ff` and `#1e3a5f` inline. The unread card is now `.ea-notice.is-unread`: a 7% tint of the school colour on the surface, with a brand bar on the left. Student and parent share it.
- `e2e/notice-theme.spec.js` (4 tests: student and parent, light and dark) checks that the bar is the brand colour, that the card is light in light mode and dark in dark mode, that text keeps 4.5:1, that the old blues are not used, and that opening a notice still marks it read.

### Shared form controls (2026-10-16, fourth pass)

**Problem (the Student Notes search box in the owner's screenshot, and the same everywhere).**
- A probe of all 135 text fields, dropdowns, dates and text areas on 78 routes found 37 different looks.
- Their border was `--ea-line`, the colour of card dividers: 1.2:1 against white and 1.0:1 on the Notes search box. That is why they looked invisible.
- Notes and Teacher Chat used a "pill" search with no border, drawn in a grey that matched the page.
- 16 search boxes were built 4 different ways.
- Dark mode used the card colour (1.36:1 edge), and placeholders were 3.6–3.8:1.

**Root cause.** Each page styled its own fields inline, and the shared `.ea-input` used the divider colour.

**Fix (index.css, tokens and one rule set).**
- Tokens: `--ea-control-bg`, `-border` (#8494AA, 3.1:1 on white), `-border-hover`, `-border-soft` (buttons, chips, the segmented track), `-placeholder` (4.7:1), `-disabled-bg`, `-track`, `-h` (40 px) and `-radius` (10 px). The dark portals and sign-in pages get their own values (#162033 fill, #64748B edge, #94A3B8 placeholder).
- `.ea-input` and `.ea-select` use them, with distinct hover, focus (brand ring), disabled and error states.
- One rule set applies the same look to every other field in the portals, admin and dialogs, including the ones styled inline. It leaves alone fields that draw no box of their own (a bare input inside a card), fields in tables and roster rows, and file inputs, checkboxes and radios.
- `ea-btn--ghost`, `ea-chip` and the segmented control use the soft edge. The segmented control sits in a darker track, so the selected option reads as raised. Primary hover is a darkening of the brand (it used `--brand-dark`, which is light in the dark portal).
- The Learning AI typing box, its placeholder and the dark placeholder rule use the same tokens.
- Sign-in, forgot password and school search use the same border and radius (48 px tall, 14 px text).

**Shared component.** New `components/ui/SearchField.jsx`, used by all 16 search boxes (student Notes, teacher Chat and Students, and admin Students, Teachers, Parents, Fees, Results, Leaves, Chat, Library, Users, Communications, Admissions, Add Parent). The two pill styles and the four hand-made variants are gone.

**Still custom:**
- Login's icon-in-field box (a wrapper draws the edge; it uses the same tokens).
- The Learning AI composer (an auto-growing text area inside a card).
- Compact fields in tables and the attendance roster.
- Admin dialogs with their own inline fields (they take the global rule).
- Native date and time fields (they take the same box; the picker icon is the browser's).

**Verification.**
- All routes: the 135 controls were probed again. Looks fell from 37 to 12; the weakest edge is 3.09:1; no placeholder is below 4.5:1.
- New `e2e/controls.spec.js` (16 tests): student and parent in light and dark at 1280, 390 and 768 px; teacher and admin at 1440, 1024 and 390 px. Every control on 19 pages is measured. It also checks the hover, focus and disabled states and that all search fields share one shape. It fails with the old faint border.
- 126 tests passed in the suites that exercise forms, search, accessible names, workflows and the Learning AI.
- Build passes; ESLint is no worse than at HEAD.
