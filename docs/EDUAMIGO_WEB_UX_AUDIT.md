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
