# EduAmigo web UI/UX audit and transformation log

Living record of the web transformation: every route, what was wrong, what changed, and how it was checked.
Local development only: nothing here is deployed.

## How screens are checked
- Screenshots of every route below at 375 px (phone) and 1440 px (desktop), signed in as the GVPS demo account
  for the route's role (`npm run demo` in the backend). A script records JavaScript errors, elements wider than the
  screen and horizontal page scroll for each screenshot.
- `npm run test:e2e` (Playwright, 19 tests) after each batch; `npm run build`; ESLint on changed lines.
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
| CSS: admin tables on phones | A wide table scrolls inside its card and the first column (the name) stays in view |
| Earlier work | Portal shell (sidebar from 1024 px, tab bar below), one shared Dialog, Glyph line icons instead of emoji, safe-area and keyboard handling in the apps |

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
Open: shared page header, desktop layout for home and lists, header that scrolls away on phones (owner decision).

### Teacher portal (10)
`/teacher/home`, `students`, `attendance`, `marks`, `upload`, `timetable`, `leave`, `notifications`, `profile`, `chat`.
Condition: as the student portal. Attendance shows "Select a class to get started" even with one class; the leave
balance "Total" is teal on a teal card (hard to read); notification filter chips overflow the phone width.
Open: shared header; auto-select a single class; contrast; desktop layout.

### Parent portal (10)
`/parent/home`, `chat`, `apply-leave`, `notifications`, `attendance`, `calendar`, `fee`, `result`, `bus`, `profile`.
Condition: as the student portal; fee overview and calendar are the strongest screens.
Open: shared header; desktop layout; Ask button overlapping amounts on phones.

### School admin (35 routes under `/admin`)
| Route | Purpose | Condition (baseline) | Done |
|---|---|---|---|
| `/admin` | Dashboard | Reference design | (earlier, 19995f1) |
| `/admin/students` | Student list | Teal banner, colour-bordered stats, table 818 px on phones | b15be6f |
| `/admin/teachers` | Teacher list | Green banner, colour stats | b15be6f |
| `/admin/parents` | Parent list | Orange banner | b15be6f |
| `/admin/attendance-reports` | Attendance analytics | Pink banner, filter labels not linked | b15be6f |
| `/admin/exams` | Exam schedule | Orange/red banner | b15be6f |
| `/admin/fees` | Fee collection | Green banner; "Fully paid" card had no icon; table 939 px on phones | b15be6f |
| `/admin/fee-reports` | Fee analytics | Brand banner, filter labels not linked | b15be6f |
| `/admin/fee-structure` | Fee structure | Blue banner, decorative colours | b15be6f |
| `/admin/leaves` | Leave approvals | Orange banner | b15be6f |
| `/admin/library` | Library | Banner with floating book icons | b15be6f |
| `/admin/communications` | Announcements, circulars, notifications | Brand banner | b15be6f |
| `/admin/reports` | School reports | Blue banner | b15be6f |
| `/admin/results` | Results and grades | Brand banner | b15be6f |
| `/admin/salaries` | Salaries | Green/cyan banner | b15be6f |
| `/admin/timetable` | Class timetables | Brand banner | b15be6f |
| `/admin/transport` | Buses and routes | Orange banner; **2.8 s full-screen bus animation** before the page opened | b15be6f (animation removed) |
| `/admin/academic` | School setup checklist, sessions, classes | White header (own style) | |
| `/admin/activity` | Activity log | White header | |
| `/admin/admissions` | Admissions pipeline | White header; table 1008 px on phones | |
| `/admin/ask` | EduAmigo Ask insights | White header; page scrolls sideways on phones (45 px) | |
| `/admin/bulk-operations` | Bulk attendance, promotion, CSV | White header | |
| `/admin/chat` | Messages | One pane on phones (earlier) | |
| `/admin/event-calendar` | Events | Purple calendar card | |
| `/admin/hr-management` | HR & payroll | White header, colour stats | |
| `/admin/id-card-generator` | ID cards | Page scrolls sideways on phones (fixed print size) | |
| `/admin/settings` | School settings | Plain | |
| `/admin/user-management` | Staff accounts | White header, colour stats | |
| `/admin/year-end` | Year end and TC | White header | |
| `/admin/students/add`, `/teachers/add`, `/parents/add` | Add forms | Plain headers | |
| `/admin/students/:id`, `/teachers/:id` | Profiles | Plain headers; teacher profile overflows on phones | |
| `/admin/tc/:id` | Transfer certificate | Shows a clear message for active students | |
| `/admin/marks`, `/admin/notice-board`, `/admin/admissions/*` | Old links | Redirect to Results, Communications, Admissions | |

Unrouted page files (not reachable): `admin/AskKnowledge.jsx`, `admin/Attendance.jsx`, `admin/NoticeBoard.jsx`,
`admin/Notifications.jsx`, `parent/ParentRoutes.jsx`.

### Platform (super admin)
The owner console is a separate application (`eduamigo-console`), not part of this repository's routes. Not yet
reviewed in this pass.

## Known defects and open items
1. Remaining admin screens with their own white-header style (list above) → PageHeader.
2. Student, teacher and parent portals: one page header; desktop layouts; phone header that scrolls away (owner
   decision); teacher attendance single-class auto-select; leave balance contrast; Ask button overlap on phones.
3. Admissions, Ask insights, ID card generator: phone width issues.
4. Owner decision: student results tab bar (Result vs Chat).
5. Owner console not reviewed.

## Verification log
| Date | Batch | Checks |
|---|---|---|
| 2026-10-13 | Baseline sweep | 150 screenshots (75 routes × 375/1440 px), 0 JavaScript errors |
| 2026-10-13 | Batch 1, admin headers and stats (b15be6f) | 32 screenshots reviewed (16 screens × 2 widths), 0 JS errors, 0 page-level sideways scroll; Playwright 19/19; build ok; 0 new lint messages |
