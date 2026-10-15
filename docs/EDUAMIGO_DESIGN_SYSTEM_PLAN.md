# EduAmigo — Unified Visual Design System and Redesign Plan (Phase 1)

Status: plan only. No application code was changed for this document.
Baseline: branch `feature/responsive-product`, code `8de6770`, audit doc `8d50a0f`.
Audience: the engineer (Claude Sonnet) who will implement it in small batches, and the product owner who reviews each batch.

---

## 0. How this audit was done

- **Screens.** The responsive sweep was run on 8de6770 (`SWEEP_WIDTHS=390,768,1024,1280`, isolated ports 8130/5194). It took one screenshot per route per width: 78 routes × 4 widths = 312 screenshots.
- **Review.** I built contact sheets from them (four screens per sheet) and looked at every route at 1280. At 390 I looked at 8 of the 20 phone sheets: 32 routes covering every role (public; admin dashboard, setup, activity, admissions, chat, communications, calendar, exams, fees, fee reports, fee structure, HR; student home, learn, notes, notifications, report card, change password, leave; parent chat, fee, home, notifications; teacher attendance, chat, home, leave). The other phone screens are covered only by the sweep's automated checks (0 findings), and the first batch that touches them must review them.
- **Earlier reviews.** Dark mode, the AI Tutor states, dialogs and empty states were reviewed in earlier passes (see `EDUAMIGO_WEB_UX_AUDIT.md`, Phase 3).
- **Code.** I also read the tokens and components in `src/index.css`, `src/components/ui/*` (PageHeader, PortalHeader, StatCard, EmptyState, FieldError, tone.js), `src/layout/*`, `components/Dialog.jsx` and the routing in `App.jsx`.
- **Size of the style debt.** The pages carry about 3,050 inline `style={{…}}` objects, 2,700 hard-coded hex colours and 120 `linear-gradient`s. That is why this plan works through **shared components and tokens first**, and only then page by page.
- **Regenerating the screenshots.** The screenshots are not committed. Regenerate them with the command in §7.4. The contact-sheet script is in Appendix A.

---

## 1. Visual audit summary

### 1.1 What is already good

1. **The benchmark: school sign-in.** This covers `/login`, `/s/:code` and `/forgot-password`.
   - It is a split layout with a branded hero panel (school logo, name, city chip) and a calm white form panel.
   - It has one clear call to action, readable labels, and it is the right size at 390 and 1280.
2. **Admin information architecture.** Most admin pages already follow one pattern:
   - `PageHeader` (title, subtitle, actions on the right);
   - a `StatGrid` of `StatCard`s;
   - a toolbar (search + selects + record count);
   - a table card;
   - an `EmptyState`.
   33 pages use `PageHeader` and 20 use `StatCard`.
3. **Tokens exist.** `--brand*` comes from the school's branding (`<BrandTheme/>`). The neutral `--ea-*` tokens cover canvas, surface, line, ink, body, muted, faint and status colours. A dark theme works in the student and parent portals.
4. **Shared states.** `EmptyState` covers 39 places, `FieldError` all admin forms, and `Dialog` is an accessible modal. The confirm dialog and toasts are shared.

### 1.2 What makes the product feel like several products (cross-cutting findings)

Evidence names refer to the sweep files `<width>_<role>_<route>.png`.

| # | Finding | Evidence | Impact |
|---|---|---|---|
| F1 | **Two page-header languages.** Admin uses a plain header on the canvas. Student, parent and teacher inner pages (25 pages, `ea-pd-band`) open with a full-width teal gradient band, a back arrow and sometimes a "TEACHER PORTAL" eyebrow. This happens even on simple lists such as Notifications, Messages and Calendar, and on desktop, where the sidebar already provides navigation. | 1280_student_student_notifications, 1280_parent_parent_chat, 1280_teacher_teacher_leave vs 1280_admin_admin_students | Largest inconsistency; oversized headers |
| F2 | **Two shells.** Admin has a dark-teal sidebar on a bluish canvas (#E9EDF3-like). Student, parent and teacher have a white sidebar on #F4F6FB. The active-item styles and avatars also differ. | 1280_admin_admin vs 1280_student_student_home | Feels like two apps |
| F3 | **Three platform palettes before sign-in.** These screens don't share the school's palette: the splash is navy with a purple glow; select-school is royal blue with a blue gradient button; the driver screen is slate with a bright blue gradient button. Splash, driver, support and change-password still draw a **phone-shaped card** in the middle of a desktop screen. | 1280_public_root, 1280_public_select-school, 1280_public_driver, 1280_public_support, 1280_student_change-password | First impression inconsistent with the login benchmark |
| F4 | **Primary actions in four colours.** Brand teal (most), filled green (Collect, Mark Paid, Approve), dark navy (`+ Add Salary`, Salary tab) and filled red (Reject). | 1280_admin_admin_fees, 1280_admin_admin_hr-management, 1280_admin_admin_leaves, 1280_admin_admin_salaries | Unclear hierarchy |
| F5 | **Decorative colour noise.** Random avatar colours (pink, yellow, purple, orange); purple top borders on exam cards; multi-coloured icon tiles on the teacher profile; an orange bus tile with a yellow monospace driver-token strip on transport; gradient strength and focus cards on student results; a decorative circle-pattern calendar header. | 1280_admin_admin_students, _exams, _teachers_teacher, _transport, 1280_student_student_result, 1280_admin_admin_event-calendar | Looks unprofessional |
| F6 | **KPI number wrap bug.** "₹31,500" breaks into "₹31,50 / 0" in the five-card row on Fee Collection at 1280, caused by `overflow-wrap: anywhere` on `.ea-stat__number` (`src/index.css:784`). | 1280_admin_admin_fees | Looks broken |
| F7 | **Stat tiles in three styles.** `StatCard` (admin); pastel full-tint tiles (student attendance, teacher attendance, leave balance); glass tiles inside gradient bands (student and parent home, fee, results). | 1280_student_student_attendance, 1280_teacher_teacher_attendance, 1280_teacher_teacher_leave | Inconsistent |
| F8 | **Forms in two styles.** Add Student uses ALL-CAPS labels and borderless grey-filled inputs. Add Parent and Add Teacher use Title Case labels with the same grey fill. Settings uses Title Case, white fields and a teal section title. Leave forms use ALL-CAPS 11 px labels. | 1280_admin_admin_students_add vs _parents_add vs _settings; 1280_student_student_apply-leave | Low affordance; inconsistent |
| F9 | **Tabs in three styles.** Underline tabs (Learning AI); filled-teal pill segments (fee Outstanding/Payments, teacher leave, chat Chats/Broadcasts); dark-navy segments (HR Salary/Staff Leaves). | 1280_student_student_fee, 1280_admin_admin_hr-management, 1280_student_student_learn | Inconsistent |
| F10 | **Mobile density.** Admin KPI cards stack two per row at about 100 px each, so Fee Collection's five KPIs push the table about 330 px down. Admissions filter chips wrap into four rows. Communications filters wrap into three rows. | 390_admin_admin_fees, 390_admin_admin_admissions, 390_admin_admin_communications | Wasted first screen |
| F11 | **Duplicate or redundant content.** The teacher home has a hero with the name, then a second gradient card with "Good Evening" and stats. The teacher timetable stacks two gradient blocks. The admin dashboard Quick Access has 9 tiles in an 8-column grid, leaving "Transport" alone on a second row. | 1280_teacher_teacher_home, _timetable, 1280_admin_admin | Clutter |
| F12 | **Status badges.** Mixed case (UNPAID / Pending / ✓ Pass), mixed shapes (pill / rounded rect) and mixed sizes. | 1280_student_student_fee, 1280_admin_admin_results | Inconsistent |
| F13 | **Remaining hand-made states.** Teacher Notifications has a custom empty state. Activity Log has a plain-text empty line. `/report-card` without `studentId` shows a bare red sentence. | 1280_teacher_teacher_notifications, 1280_admin_admin_activity, 1280_student_report-card | Minor |

### 1.3 Overall verdict per area

| Area | Verdict |
|---|---|
| Sign-in, forgot password | **Redesigned**; this is the benchmark |
| Splash, select school, driver, support, change password | **Mostly unchanged** (old phone-frame era, separate palettes) |
| Admin (36 routes) | **Partially redesigned.** Structure is consistent; colour, buttons, forms, badges, avatars and mobile density are not |
| Student, parent, teacher (35 routes) | **Partially redesigned.** Desktop layout, dark mode and empty states are done; page headers, stat tiles, tabs and the decorative gradients are not |
| Learning AI | **Redesigned** (own component set `ea-learn__*`); small alignment only |

---

## 2. Unified design system specification

Principles: **one product, the school's brand, colour carries meaning, no decoration for its own sake.** Gradients, glows and tinted cards are the exception, not the default.

### 2.1 Brand layers

| Layer | Where | Colours |
|---|---|---|
| **School brand** | Everything after the school is known (`/s/:code`, `/login`, all portals) | `--brand`, `--brand-dark`, `--brand-deep`, `--brand-soft`, `--brand-border`, `--brand-accent`, `--brand-gradient` from `<BrandTheme/>` (teal for the demo school) |
| **Platform brand (EduAmigo)** | Before a school is known: splash `/`, `/select-school`, `/driver`, `/support` | The `:root` defaults (`--brand: #6366F1` indigo family, `--brand-deep: #1E1B4B`). **One** palette for all four screens; no royal blue (#1E40AF-like) and no bright-blue (#3B82F6→#0EA5E9) gradients |

Gradient policy (hard rule):
- `--brand-gradient` is allowed only on: (a) the hero panel of auth and platform screens; (b) **one** home hero per portal (student, parent, teacher home; the admin dashboard greeting).
- Gradients are **not** allowed on inner-page headers, buttons, tabs, KPI cards, list cards, calendar headers or result cards.
- Exception: the existing sign-in CTA keeps its current style because it is the benchmark. Every other primary button is solid `--brand`.

### 2.2 Colour tokens

Neutral (already in `:root`; keep the names):

| Token | Light | Dark (themed portals only) | Use |
|---|---|---|---|
| `--ea-canvas` | #EEF1F6 | #0F172A | page background, **all portals and admin** (replaces #F4F6FB, #E9EDF3, #F5F6FA literals) |
| `--ea-surface` | #FFFFFF | #1E293B | cards, sidebar, dialogs, inputs |
| `--ea-hover` | #F3F5F9 | #26354B | row hover, quiet fills |
| `--ea-line` | #E3E7EE | #2D3F55 | borders, dividers |
| `--ea-ink` | #0F172A | #F1F5F9 | headings, primary text |
| `--ea-body` | #334155 | #CBD5E1 | body text |
| `--ea-muted` | #64748B | #94A3B8 | secondary text, captions (4.8:1) |
| `--ea-faint` | #68778C | #8B9AB0 | overlines, table headers (4.5:1) |

Semantic (status only; never decoration). Text tokens are the 700 tones, so they reach at least 4.5:1 on white and on their tint:

| Tone | Text / icon | Tint bg | Border | Dark text on card |
|---|---|---|---|---|
| success | #15803D | #F0FDF4 | #BBF7D0 | #4ADE80 (`--ea-on-card-success`) |
| warning | #B45309 | #FFFBEB | #FDE68A | #FBBF24 |
| danger | #B91C1C | #FEF2F2 | #FECACA | #FCA5A5 |
| info | #1D4ED8 | #EFF6FF | #BFDBFE | #93C5FD |
| neutral | #475569 | #F1F5F9 | #E2E8F0 | #CBD5E1 |
| brand | `--brand-dark` | `--brand-soft` | `--brand-border` | `--brand-light` |

**Categorical palette** (new; only for *categories*: calendar event types, library genres, subject chips, notice types):

`--ea-cat-1` teal #0F766E · `--ea-cat-2` indigo #4338CA · `--ea-cat-3` amber #A14608 (B0: #B45309 reached only 4.39:1 on its tint) · `--ea-cat-4` rose #BE123C · `--ea-cat-5` sky #0369A1 · `--ea-cat-6` slate #475569.

Each is used as text on a 10% tint of itself. These are the only "extra" hues allowed. No purple card borders and no random avatar colours.

### 2.3 Typography

Font: `--ea-font` (Inter Variable). Numbers in KPIs and tables use `font-variant-numeric: tabular-nums`.

| Role | Size/line | Weight | Token (new) | Notes |
|---|---|---|---|---|
| Display (hero number, e.g. 90.7%) | 32/40 (phone 28/36) | 750 | `--ea-text-display` | max one per screen |
| Page title (h1) | 24/32 (phone 20/28) | 700 | `--ea-text-h1` | `PageHeader`, `PortalHeader` |
| Section title (h2) | 17/24 | 650 | `--ea-text-h2` | card titles |
| Sub-section (h3) | 15/22 | 650 | `--ea-text-h3` | form sections |
| Body | 14/22 | 400 | `--ea-text-body` | default |
| Small | 13/20 | 400–500 | `--ea-text-sm` | table cells, helper text |
| Caption | 12/16 | 500 | `--ea-text-xs` | meta lines |
| Overline | 11/16, +0.06em, uppercase | 650 | `--ea-text-overline` | **only** table headers and sidebar section labels |

Labels are **sentence case** ("Full name", not "FULL NAME"). Status badges are sentence case ("Unpaid", not "UNPAID").

### 2.4 Spacing, width, radius, elevation

- **Spacing scale** (4-pt; extend the existing `--ea-space-*`): 4, 8, 12, 16, 20, 24, 32, 40, 48.
- **Page padding:** desktop 32 px · tablet 24 · phone 16.
- **Gaps:** 24 px between page sections, 12–16 px between cards in a grid.
- **Card padding:** 20 (desktop) / 16 (phone).

**Content widths:**
- Admin main area: fluid, max 1280 px.
- Portal stage: max 1080 (existing `.ea-stage`).
- Reading/list column: 820 (`.ea-pd-narrow`).
- Forms: 760.
- Dialogs: sm 420 · md 560 · lg 720.

**Radius:**
- `--ea-radius-sm` 8 (badges, small buttons)
- `--ea-radius` 12 (inputs, buttons, list rows)
- `--ea-radius-lg` 16 (cards)
- `--ea-radius-xl` 20 (home hero, auth panels only)
- pill 999 (chips)

**Elevation:**
- e0 = border only (`1px var(--ea-line)`)
- e1 = `--ea-shadow` (cards)
- e2 = `0 8px 24px rgba(15,23,42,.10)` (menus, popovers, the stops panel)
- e3 = `0 24px 64px rgba(15,23,42,.24)` (dialogs)
- No coloured glows (remove `0 4px 24px <brand>` shadows on buttons and cards).

### 2.5 Layout and navigation

**One shell for every role, including admin** (owner decision **D1**, recommended):
- **Sidebar:** white `--ea-surface` with a `--ea-line` right border, 260 px wide. School logo and name at the top. Section overlines. The active item uses `--brand-soft` with `--brand-dark` text and a 3 px brand bar on the left. User card and Log out at the bottom. Admin's dark-teal sidebar adopts this.
- **Canvas:** `--ea-canvas` for all roles.

Breakpoints:

| Width | Navigation | Header | Grid |
|---|---|---|---|
| ≥1280 | sidebar | `PageHeader` | 12-col, cards up to 4 across |
| 1024–1279 | sidebar | `PageHeader` | cards up to 3 across |
| 768–1023 | admin: off-canvas drawer; portals: bottom nav | compact app bar | 2 across |
| <768 | admin: drawer; portals: bottom nav | compact app bar | 1 across (KPIs 2 compact) |

**Page header patterns (replaces F1):**
1. **Home hero** (one per portal): brand-gradient panel, radius 20, max height 220 at desktop and 260 at phone. It holds the greeting, identity and at most four glass stats. No second greeting card anywhere else.
2. **Inner page, desktop (≥1024):** `PageHeader`, the same as admin. It sits on the canvas with a 24 px title, a muted subtitle and actions on the right. There is no back arrow (the sidebar navigates) except on detail pages (student profile, teacher profile, TC, report card), which show a back button labelled with the destination.
3. **Inner page, phone (<1024):** `PortalHeader` as a **compact app bar**: 56 px tall, solid `--brand` (not a gradient), a back button, the title (17/24) and up to two icon actions. No eyebrow ("TEACHER PORTAL") and no stats inside it.
4. **Summary content** that today lives inside gradient bands (fee totals, attendance %, leave balance, results %) moves into a **Summary card**: a white card with an h2, a display number and `StatCard`s. One summary card per page at most.

### 2.6 Components

The component name is the target; a ✓ means it already exists.

| Component | Spec |
|---|---|
| **Button** (`.ea-btn` ✓) | Sizes sm 32 / md 40 / lg 48 (phone primary CTA). **primary** solid `--brand`, white, hover `--brand-dark`. **secondary** surface + `--ea-line` border + ink. **tertiary** text-only brand. **danger** solid `--ea-danger`, *only inside a confirm dialog*. In tables use **danger-ghost** (danger text, no fill; Delete, Reject). Positive workflow actions (Collect, Approve, Mark paid, Generate) are **primary**, never green. One primary per view region. Focus ring 2 px brand, offset 2. |
| **Icon button** | 36×36 (40 on touch), `--ea-radius`, ghost; `aria-label` required |
| **Badge** (`.ea-badge` ✓) | Height 22, padding 0 8, radius 999, 12/16 600, sentence case, tone tint + tone text (+ optional 6 px dot). No ALL-CAPS, no outline-only variants |
| **Avatar** | Circle 32/40/72. Initials on `--brand-soft` with `--brand-dark` text for everyone. Role is shown by a badge, not by colour. Photos when available |
| **Card** (`.ea-card` ✓) | Surface, e1, radius 16, padding 20/16; optional header row (h2 + actions) with a `--ea-line` divider |
| **StatCard** (✓) | The only KPI style. Icon chip (tone), caption 12, value 24/20 (phone) **nowrap**, tabular numbers. **Compact variant** for phones: icon inline, value 20, 64 px tall; KPI rows of 5+ become a horizontal scroller on phones |
| **Summary card** (new) | See §2.5.4 |
| **Toolbar** (`.ea-toolbar` ✓) | Search (flex 1, min 240) + selects + record count, on one line at desktop. On phones: search full width, selects in a 2-col grid, count below |
| **Filter chips** (new `.ea-chips`) | Pills 32 high, secondary style; selected = `--brand-soft` + `--brand-dark` + brand border, `aria-pressed`. **One line, horizontally scrollable on phones** (no wrapping) |
| **Tabs** (two kinds only) | **Page tabs**: underline, as in Learning AI (`role=tablist`), for switching sections of a page. **Segmented control** (new `.ea-seg`): surface track with a `--ea-hover` background and 4 px padding; selected segment = surface + e1 + ink text. Used for 2–4 views inside a card. Replaces the filled-teal and navy segments |
| **Table** | Header row: overline style, `--ea-hover` bg, 44 high. Rows 52 high, `--ea-line` dividers, hover `--ea-hover`, numbers right-aligned and tabular. Row actions are tertiary/ghost buttons, right-aligned. Phones: stacked cards (existing `data-stack`), label column muted |
| **List row** | 64 high, avatar/icon 40, title 14/600, meta 12 muted, chevron `--ea-muted`; whole row pressable (`pressable()` ✓) |
| **Form field** | Label 13/600 `--ea-ink` sentence case above; input 40 high, white `--ea-surface`, 1 px `--ea-line`, radius 12; focus = brand border + 3 px `--brand-soft` ring; helper 12 muted; error via `FieldError` ✓. Required = " *" in muted |
| **Form layout** | Max 760; sections = h3 + 1 px divider; 2-col ≥768; actions bar at the end (secondary left of primary, right-aligned; sticky at the bottom on phones for long forms) |
| **Dialog** (✓) | Widths per §2.4; title 18/26; body 14; footer right-aligned [Cancel (secondary)] [Primary]; bottom sheet on phones (<600): full width, top radius 16 |
| **Empty state** (✓ `EmptyState`, `plain`) | Already specified; use everywhere (F13 leftovers) |
| **Error state** | `EmptyState` with a danger icon chip, a plain-language message and **Try again** (secondary) |
| **Loading** | Lists/tables: skeleton rows (new `.ea-skeleton`, 3–5 rows, shimmer off under `prefers-reduced-motion`). Buttons: inline spinner + disabled. No full-page "Loading…" text |
| **Success** | Toast (✓); inline confirmation only for multi-step flows |
| **Alerts/banners** | Tone tint + tone border-left 3 px, icon, title 14/600, text 13 |
| **Progress bar** | 6 high, `--ea-hover` track, brand fill (or a status tone when it means status), radius 999 |

### 2.7 Themes

- Light: all portals and admin.
- Dark: **student and parent only** (existing `.ea-shell--themed`). Every new component must read its colours from the `--ea-*` / `--ea-on-card-*` / `--brand*` tokens so dark mode keeps working without page edits. Teacher and admin stay light-only, with no switch.

### 2.8 Accessibility floor (applies to every batch)

- Text contrast ≥4.5:1 (≥3:1 only for ≥18.66 px bold or ≥24 px).
- Touch targets ≥24 px (44 px recommended for primary actions on phones).
- Visible focus.
- Sentence-case labels tied to their fields.
- Status never shown by colour alone (badge text).
- Motion respects `prefers-reduced-motion`.

---

## 3. Route-by-route classification

Status: **R** redesigned (matches §2 apart from trivia) · **P** partial · **U** mostly unchanged.
Priority: **P0** first-impression or broken-looking, **P1** consistency, **P2** polish.
Risk: effect on behaviour or tests if done as specified (L low / M medium / H high).

### 3.1 Public and auth (7 routes + change password)

| Route | Status | Problems seen | Required improvements | Shared components | Pri | Risk |
|---|---|---|---|---|---|---|
| `/` splash | U | Navy + purple glow, phone-frame card on desktop, faint "Powered by" | Platform-brand full-viewport splash (no phone frame), same logo treatment as select-school | AuthLayout (platform) | P0 | L |
| `/select-school` | P | Royal-blue hero + blue gradient button; does not match the login split | Login-style split with platform palette; solid primary button | AuthLayout, Button | P0 | L |
| `/s/:code`, `/login` | R | Benchmark | none (keep) | — | — | — |
| `/forgot-password` | R | Matches login | none | — | — | — |
| `/support` | U | Phone-frame card on desktop; error is red text only | Platform layout; error via the Error state | AuthLayout, EmptyState | P2 | L |
| `/driver` | U | Phone frame, slate + bright-blue gradient | Platform layout and palette; driver map pages keep their map | AuthLayout | P1 | M (driver flow) |
| `/change-password` | U | Card inside a phone frame on desktop | Auth split (school brand) like forgot-password | AuthLayout, form field | P1 | L |

### 3.2 Admin (36 routes)

| Route | Status | Problems seen | Required improvements | Shared | Pri | Risk |
|---|---|---|---|---|---|---|
| `/admin/` dashboard | P | 9 quick-access tiles orphan "Transport"; gradient greeting OK; KPI icon tiles large | Quick access as a 3×3/auto grid without orphans; keep one hero; KPI → StatCard | Home hero, StatCard | P1 | L |
| `/admin/students` | P | Random avatar colours; purple class chip | Avatar spec; class chip = neutral badge | Avatar, Badge, Table | P1 | L |
| `/admin/students/add` | P | ALL-CAPS labels; grey borderless inputs | Form field + form layout spec | FormField | P1 | M (tests use labels: keep accessible names) |
| `/admin/students/:id` | P | Dense, fine structure; small tinted section titles | Card headers per spec | Card | P2 | L |
| `/admin/parents` | R | — | Avatar spec only | Avatar | P2 | L |
| `/admin/parents/add` | P | Grey inputs; child picker list | Form spec | FormField | P1 | M |
| `/admin/teachers` | P | Avatar green; subject chips multi-colour | Avatar; subject chips = categorical | Avatar, Badge | P1 | L |
| `/admin/teachers/add` | P | Grey inputs; subject chips | Form spec; chips = filter chips | FormField, Chips | P1 | M |
| `/admin/teachers/:id` | P | Multi-coloured icon tiles (purple, orange, green) | Neutral icon chips; detail-page header with back | Card, PageHeader | P1 | L |
| `/admin/attendance-reports` and `/admin/attendance/report` | R | Same page on two routes (fine) | Toolbar spec | Toolbar | P2 | L |
| `/admin/chat` | P | Coloured avatars (purple/green/orange); "Welcome" tiles tinted | Avatar spec; neutral welcome | Avatar | P1 | L |
| `/admin/exams` | P | Purple top border and purple "Unit Test" chip | Card without coloured border; type = categorical badge | Card, Badge | P1 | L |
| `/admin/fees` | P | **KPI wrap bug (F6)**; green "Collect" buttons; 5 KPIs | nowrap KPI; Collect = primary sm; Receipt = tertiary | StatCard, Button | **P0** | L |
| `/admin/fee-reports` | R | Orange→red gradient progress | Progress = brand or status tone, no gradient | Progress | P2 | L |
| `/admin/fee-structure` | R | — | — | — | — | — |
| `/admin/leaves` | P | Filled green Approve / red Reject; orange avatars | Approve = primary sm, Reject = danger-ghost; avatar spec | Button, Avatar | P0 | M (tests click by name: keep names) |
| `/admin/library` | P | Genre chips multi-colour; availability bars | Categorical palette | Badge, Chips | P2 | L |
| `/admin/admissions` | P | Filter chips wrap to 4 rows on phone | Scrollable chips; stage badges per tone | Chips, Badge | P1 | L |
| `/admin/communications` | P | Orange/green left borders; 3 rows of filters on phone | Priority = badge; filters → chips (scroll) + segmented | Chips, Seg, Badge | P1 | L |
| `/admin/reports` | P | Tinted mini-tiles in 4 colours; dense | Summary cards per spec; progress tones | Summary card | P2 | L |
| `/admin/results` | P | Grade chips purple-blue; "Report Cards" teal button inside toolbar | Grade badge tones; button in header actions | Badge, Toolbar | P2 | L |
| `/admin/salaries` | P | Green "Mark Paid" | Primary sm | Button | P1 | L |
| `/admin/settings` | P | Fine; section titles teal | Form spec; section h3 | FormField | P2 | L |
| `/admin/academic` (School setup) | P | Own card borders (#E8E8E5); fine otherwise | Card tokens; checklist rows as list rows | Card | P1 | L |
| `/admin/activity` | P | Plain-text empty line (F13) | EmptyState plain | EmptyState | P2 | L |
| `/admin/ask` | R | Dense tables (appropriate) | Table spec | Table | P2 | L |
| `/admin/year-end` | R | Sparse but correct | — | — | P2 | L |
| `/admin/tc/:student` | R | — | — | — | — | — |
| `/admin/timetable` | R | Fixed in 8de6770 (keyboard, contrast) | Day picker → segmented | Seg | P2 | L |
| `/admin/transport` | P | Orange bus tiles; yellow monospace token strip | Neutral icon chip; token row as a code field with Copy | Card | P1 | L |
| `/admin/user-management` | P | Role pills multi-colour; green switches | Role = neutral/brand badge; switch = brand | Badge, Switch | P2 | L |
| `/admin/event-calendar` | P | Decorative calendar header (gradient + circles); purple/green date tiles | Plain calendar card; event types = categorical | Card, Badge | P1 | L |
| `/admin/id-card-generator` | R | Stepper OK | Seg for Students/Faculty | Seg | P2 | L |
| `/admin/bulk-operations` | R | Tabs style | Page tabs | Tabs | P2 | L |
| `/admin/hr-management` | P | Navy Salary segment and navy "+ Add Salary" | Seg + primary | Seg, Button | P0 | L |

### 3.3 Student (15 routes)

| Route | Status | Problems seen | Required improvements | Shared | Pri | Risk |
|---|---|---|---|---|---|---|
| `/student/home` | P | Hero OK; tile grid OK; class rows with separators | Keep the hero (cap height); KPIs in the hero stay glass | Home hero | P2 | L |
| `/student/attendance` | P | Gradient band with a ring; pastel tiles | PageHeader/app bar + Summary card (ring + StatCards) | Header, Summary, StatCard | P1 | L |
| `/student/result` | P | Dark gradient hero with segment inside; gradient strength/focus cards | Summary card; segmented outside; strength/focus = plain cards with tone chips | Summary, Seg | P1 | L |
| `/student/fee` | P | Gradient band with totals; filled segmented | Summary card; Seg | Summary, Seg | P1 | M (fee e2e) |
| `/student/bus` | P | Full-bleed band with metrics (map page) | Keep map layout; band → compact header + metrics bar (surface) | Header | P2 | M |
| `/student/timetable` | P | Band + week view (good) | Header swap only | Header | P1 | L |
| `/student/notes` | P | Band with actions | Header swap; chips | Header, Chips | P1 | L |
| `/student/learn`, `/student/revise` | R | Band header; tabs underline (good) | Header swap only | Header | P1 | L |
| `/student/apply-leave` | P | Band with balance tiles; ALL-CAPS labels | Header + Summary; form spec | Header, FormField | P1 | M |
| `/student/notifications` | P | Band header | Header swap | Header | P1 | L |
| `/student/chat` | P | Band; filled tabs | Header; page tabs | Header, Tabs | P1 | L |
| `/student/profile` | P | Big gradient profile hero | Profile header card (avatar 72, name, badges) on surface | Profile card | P1 | L |
| `/report-card` | P | Document view OK; missing-param error is bare red text | Error state | EmptyState | P2 | L |

### 3.4 Parent (10 routes)

| Route | Status | Problems seen | Required improvements | Shared | Pri | Risk |
|---|---|---|---|---|---|---|
| `/parent/home` | P | Hero with child switcher (good) | Cap hero; keep | Home hero | P2 | L |
| `/parent/attendance` | P | Band with a big % | Header + Summary card; calendar card | Header, Summary | P1 | L |
| `/parent/result` | P | Band with stats | Header + Summary | Header, Summary | P1 | L |
| `/parent/fee` | P | Gradient overview card inside a band; filled tabs | Header + Summary; Seg | Header, Summary, Seg | P1 | M |
| `/parent/bus` | P | As student bus | As student bus | Header | P2 | M |
| `/parent/calendar` | P | Band; coloured icon tiles | Header; categorical | Header, Badge | P1 | L |
| `/parent/chat` | P | Band; red admin avatar | Header; avatar spec | Header, Avatar | P1 | L |
| `/parent/apply-leave` | P | Band + balance tiles | As student | Header, FormField | P1 | M |
| `/parent/notifications` | P | Band | Header swap | Header | P1 | L |
| `/parent/profile` | P | Band; info rows OK | Profile card | Profile card | P1 | L |

### 3.5 Teacher (10 routes)

| Route | Status | Problems seen | Required improvements | Shared | Pri | Risk |
|---|---|---|---|---|---|---|
| `/teacher/home` | P | Hero + duplicate "Good Evening" gradient card (F11) | One hero; schedule card + stat row | Home hero, StatCard | P1 | L |
| `/teacher/attendance` | P | Band with eyebrow; pastel tiles; large per-student cards | Header; StatCards; roster as a compact list (Present/Absent/Late segmented per row) | Header, StatCard, Seg | P1 | **H** (core workflow, many tests) |
| `/teacher/marks` | P | Band; class chip | Header; list rows | Header | P1 | M |
| `/teacher/upload` | P | Band with badge count; filled tabs | Header; Seg | Header, Seg | P1 | M |
| `/teacher/timetable` | P | Two stacked gradient blocks (F11) | Header + one stat row + week view | Header, StatCard | P1 | L |
| `/teacher/leave` | P | Band + gradient balance card + filled tabs | Header + Summary + Seg | Header, Summary, Seg | P1 | M |
| `/teacher/students` | P | Band | Header; list rows | Header | P1 | L |
| `/teacher/notifications` | P | Band; custom empty state (F13); chips | Header; EmptyState; chips | Header, EmptyState, Chips | P1 | L |
| `/teacher/chat` | P | Band; tinted icon tiles | Header; avatar spec | Header, Avatar | P1 | L |
| `/teacher/profile` | P | Big gradient profile hero | Profile card | Profile card | P1 | L |

### 3.6 Not reachable by URL (dialogs, sub-views, states)

| Item | Status | Required | Pri |
|---|---|---|---|
| All admin dialogs (period, bus, stops, fee, exam, library, HR, salary, user, event) | R (field errors done) | Dialog widths and footer order; bottom sheet on phones | P2 |
| Confirm dialog (`utils/toast.js` confirmAction) | R | Danger button only here | — |
| Profile sub-views (View profile, Settings, Help, ID card) | P | Same header pattern as inner pages | P1 |
| Toasts | R | — | — |
| Loading states | U | Skeleton rows replace "Loading…" text (about 30 places) | P2 |
| Bus full-screen map | R | — | — |

---

## 4. Prioritised implementation batches

Rules for every batch:
- Only the listed files.
- Use tokens and components from §2.
- **Don't change visible labels, accessible names, roles or routes**; tests use 335 role/text locators.
- Keep the class names tests rely on: `.ea-ask-fab`, `.ea-spinner`, `.ea-bottom-nav`, `.ea-week`, `.ea-um-row`, `.ea-um-head`, `.ea-stage`, `.ea-skip-link`, `.ea-sidebar`, `.ea-scroll`, `.ea-home`, `.ea-diagram__legend`.
- Take before/after screenshots (§7.4).
- Run the listed specs.
- Commit once per batch.

### B0 — Foundations (tokens and the visible bug) · P0 · risk L
- **Scope:** `src/index.css` only.
- **Tokens:** add the type scale, radius-xl, elevation e2/e3, categorical palette, `--ea-info` tints and `--ea-on-card-info`.
- **Bug fix:** `.ea-stat__number`: replace `overflow-wrap:anywhere` with `white-space:nowrap`, adding `font-size: clamp(18px, 2vw, 24px)` and tabular numbers.
- **Acceptance:** the Fee Collection KPIs show "₹31,500" on one line at 1024, 1280 and 390; nothing else changes visually (compare 10 random sweep screens).
- **Checks:** build, `screens`, `ux-regressions`.

### B1 — Primitives (no page adoption yet except one pilot each) · P0 · risk L
- **Scope:** `src/index.css`, new `src/components/ui/Segmented.jsx`, `Chips.jsx`, `Avatar.jsx`, `Badge.jsx` (thin wrappers over CSS), `Skeleton.jsx`.
- **Pilots:**
  - Segmented in HR (Salary/Staff Leaves);
  - Chips in Admissions;
  - Avatar in Students;
  - Badge in Fee Collection.
- **Acceptance:**
  - Segmented has no filled navy and keeps `aria-pressed`.
  - Admissions chips stay on one line and scroll at 390.
  - Avatars are brand-soft.
  - Badges are sentence case. Some source strings are written in capitals ("UNPAID", "PART PAID" on student fee); change those strings to sentence case. Others are capitalised by CSS: 43 `text-transform: uppercase` uses in `index.css` and the pages. Keep those only for overlines (§2.3).
  - No UI test reads these strings: as of 8de6770 the only "Pending" match in `e2e/` is an API status check, `workflows.spec.js:85`. Re-check with `grep -rn "UNPAID\|PARTIAL" e2e` before changing a string.
- **Checks:** `interactions`, `accessible-names`, `admin-keyboard`, `workflows`.

### B2 — Buttons and actions across admin · P0 · risk M
- **Scope:** fees, leaves, salaries, hr-management, results, transport and user-management pages.
- **Changes:**
  - Green or navy primary actions become `ea-btn--primary` (sm in tables).
  - Reject and Delete become danger-ghost.
- **Acceptance:** at most one filled colour (brand) for actions per screen, and danger fill only in the confirm dialog. Same accessible names.
- **Checks:** `workflows`, `interactions`, `ux-regressions`, `admin-keyboard`.

### B3 — Portal page header (desktop PageHeader, phone compact app bar) · P0 · risk M
- **Scope:** `PortalHeader.jsx` (responsive: ≥1024 renders the `PageHeader` layout; <1024 a 56 px solid-brand app bar); CSS for `.ea-portal-head`.
- **Migration:** the **student** inner pages listed in §3.3 that use `ea-pd-band`. Only the header block changes; any stats inside the band move into a Summary card, using existing values and the same text.
- **Acceptance:**
  - No gradient on any student inner page.
  - Titles are 24 px on the canvas at 1280 and a 56 px app bar at 390.
  - Back navigation still works on phones.
  - The dark theme still passes the contrast probe (§7.5).
- **Checks:** `screens`, `scroll`, `auth-and-navigation`, `learning*`, `print`; sweep at 390/1280 for student.

### B4 — Same as B3 for **parent** · P1 · risk M
Checks as in B3, plus the parent workflows.

### B5 — Same as B3 for **teacher** (excluding attendance roster) · P1 · risk M
- Also remove the "TEACHER PORTAL" eyebrows and the duplicate gradient blocks (home, timetable, leave).
- **Checks:** as B3 plus `workflows`.

### B6 — Stat tiles and Summary card · P1 · risk L
- **Scope:** a new `SummaryCard`; adoption on student/teacher attendance, leave balances (student, parent, teacher), student/parent results and fee.
- **Change:** pastel tiles become StatCard; the phone compact StatCard variant and the KPI horizontal scroller for rows of 5+.
- **Acceptance:** one KPI style product-wide; on admin Fee Collection at 390 the table starts within the first 600 px.

### B7 — Forms · P1 · risk M
- **Scope:** Add Student/Parent/Teacher, Settings, School setup forms, leave forms (student/parent/teacher), change password.
- **Change:** CSS for field, label and section only; keep `id`, `htmlFor`, `aria-*` and the label text strings (sentence case through CSS `text-transform: none` where the source text is already sentence case; where the source string itself is ALL CAPS, change the string and update any test that reads it in the same commit, if one exists).
- **Acceptance:** white inputs with borders, 40 px height, 13 px sentence-case labels, two columns ≥768, the action bar at the end.
- **Checks:** `interactions` (field errors), `workflows`, `unsaved-changes`, `admission-date`, `error-feedback`.

### B8 — Tables, lists, filters and badges across admin · P1 · risk L
- **Scope:** every admin list page (§3.2): table spec, toolbar spec, chips, badges, categorical palette (exams, library, calendar, communications, teachers' subjects).
- **Acceptance:**
  - No purple borders, no random colours.
  - Category colours come only from `--ea-cat-*`.
  - Phone filters stay on one scrollable line.

### B9 — Homes · P1 · risk L
- **Scope:** admin dashboard quick access (no orphan tile); hero height caps; teacher home de-duplication; student/parent tile grids aligned to the card spec.
- **Checks:** `screens`, `scroll`, `ux-regressions`.

### B10 — Platform and auth screens · P0 (splash, select-school) / P1 (driver, change password, support) · risk L–M
- **Scope:** `/`, `/select-school`, `/driver` (entry only), `/support`, `/change-password`.
- **Change:** share the login split layout (`.ea-auth`, `.ea-school-hero`), with platform tokens before a school is known and school tokens after.
- **Acceptance:** no phone frame on desktop; one platform palette; the same typography as login.
- **Checks:** `auth-and-navigation`, sweep for public.

### B11 — Shell unification (needs owner decision D1) · P1 · risk M
- **Scope:** the admin layout in `App.jsx` (`.ea-admin-frame`, admin sidebar) adopts the portal sidebar spec; canvas token for all.
- **Acceptance:** admin and portal sidebars are indistinguishable apart from their items; the drawer still works at <1024; `.ea-sidebar` is kept.
- **Checks:** `auth-and-navigation`, `admin-keyboard`, `screens`, full sweep.

### B12 — Profiles and sub-views · P1 · risk L
- **Scope:** student/teacher/parent profile pages and their sub-views.
- **Change:** a profile header card on the surface (no gradient hero) and list rows.

### B13 — States · P2 · risk L
- **Scope:** skeleton rows replace "Loading…" text; error states (report card missing param, support link); the last empty states (teacher notifications, activity log).

### B14 — Teacher attendance roster · P1 · risk **H**
- **Scope:** `teacher/Attendance.jsx` layout only: a compact roster list with a per-row segmented Present/Absent/Late/Holiday control. Keep the button names (e.g. "Present: Riya Sharma") and `aria-pressed`.
- **Checks:** every spec touching attendance; manual run-through of marking and saving on 8130 only.

### B15 — Final verification · required
- Full suite, sweep at 4 widths, crawl, contrast probe (light and dark), contact-sheet review of all 78 routes at 1280 and 390, audit doc update.

Order: **B0 → B1 → B2 → B3 → B10 → B6 → B4 → B5 → B7 → B8 → B9 → B12 → B11 (after D1) → B13 → B14 → B15.**
P0 work (B0–B3, B10 core) gives the biggest visible gain first.

---

## 5. Expected shared component changes

| File | Change |
|---|---|
| `src/index.css` | New tokens (§2.2–2.4); `.ea-seg`, `.ea-chips`, `.ea-avatar` sizes, `.ea-badge` sentence case, `.ea-skeleton`, `.ea-summary`, table/toolbar/form refinements; `.ea-portal-head` responsive; `.ea-stat__number` nowrap; admin sidebar rules (B11). Remove orphaned rules only after a grep shows they are unused |
| `components/ui/PortalHeader.jsx` | Responsive: PageHeader layout ≥1024, compact solid app bar <1024; optional `summary` slot is **not** added (Summary card is separate) |
| `components/ui/PageHeader.jsx` | Detail-page back label (e.g. "Back to students") |
| `components/ui/StatCard.jsx` | `compact` prop; tabular numbers |
| new `components/ui/SummaryCard.jsx` | Title, display value, optional ring/progress, StatGrid children |
| new `Segmented.jsx`, `Chips.jsx`, `Avatar.jsx`, `Badge.jsx`, `Skeleton.jsx` | Thin, accessible wrappers (aria-pressed, roles) |
| `components/Dialog.jsx` | `size` prop (sm/md/lg) mapped to widths; bottom-sheet CSS <600 |
| `App.jsx` admin layout | B11 only |
| `layout/PortalShell.jsx` | No change expected (already the reference shell) |
| Pages | Replace hand-drawn bands, tiles, buttons and chips with the components above; delete the now-unused inline style objects in the touched blocks only |

---

## 6. Risk and regression strategy

1. **Locators.** Tests use role/text locators (335) and 12 class selectors (listed in §4). Keep every accessible name, role, `aria-pressed`/`aria-selected`, label text and route. If a visible string must change (ALL-CAPS source strings in B7), change it and the test that reads it in the same commit, and say so in the commit message.
2. **Isolation.** Always run tests with `E2E_API_PORT=8130 E2E_WEB_PORT=5194`. Never 8000/5173 (owner demo), and never the stale 8100/5174/8110/5184 servers. Set the variables on the `npx` command itself, not on a preceding command. Don't edit source while a run is in progress (Vite hot reload).
3. **Per batch:** build; the listed specs; a sweep of the touched role at 390 and 1280; before/after contact sheets for the touched routes; for student/parent batches the dark-mode contrast probe (§7.5). Commit only when all are green.
4. **Visual diff discipline.** Compare the after sheets with the before sheets for **untouched** routes in the same role. Any unintended change means the batch leaked into a shared class; fix it before committing.
5. **Behavioural risk hotspots:**
   - teacher attendance (B14);
   - fee collection and receipts (B2, B6);
   - forms with field errors (B7);
   - the admin shell drawer (B11);
   - the driver flow (B10).
   For these, also click through the flow manually on 8130 and capture screenshots of each step.
6. **Rollback.** One batch per commit, so any batch can be reverted alone.
7. **No scope creep.** No new features, routes or data changes; no backend edits.

---

## 7. Handoff instructions for Claude Sonnet

### 7.1 Before you start
- Repo: `~/Downloads/eduamigo-frontend`, branch `feature/responsive-product`; work on top of `8d50a0f` or later. `git status` must be clean apart from the untracked `.sweep.mjs` (not yours; never modify or commit it).
- Don't push, deploy, migrate or delete data. Don't edit `docs/UNIFIEDAI_ARCHITECTURE_GUIDE.md`. Don't stop running processes or touch ports 8000/5173.
- Read §2 (system) and the batch you are doing in §4. Do **one batch per session**, in the order given. B11 needs the owner's answer to D1 first.

### 7.2 For each batch
1. Capture the "before" sweep for the affected role(s) (§7.4) and build contact sheets (Appendix A).
2. Implement only the batch scope. Prefer CSS and shared components over per-page inline styles. Read colours only from tokens.
3. Run `npm run build` and ESLint on changed lines (ESLint 10: `npx eslint -f json <files>`, then filter to changed lines; the repo has older lint findings on untouched lines).
4. Run the batch's specs, then a sweep of the touched role at 390 and 1280, then the contrast probe if a themed portal was touched.
5. Build the "after" contact sheets; review touched and untouched routes side by side.
6. Append a short entry to `docs/EDUAMIGO_WEB_UX_AUDIT.md`: batch, files, screenshots reviewed, test counts.
7. Commit (one commit per batch) with a message that states what changed visually.

### 7.3 Owner decisions (all approved by the owner on 2026-10-15)
- **D1 approved:** admin uses the same white-sidebar design system as the other portals and keeps its own role-specific navigation (B11).
- **D2 approved:** the screens before a school is chosen use EduAmigo indigo (B10).
- **D3 approved:** the sign-in button is the only gradient button; the home hero gradients allowed in §2.1 stay.

The original questions, for reference:
- **D1** — one shell for admin too (white sidebar, as in the portals)? Recommended: yes. If no, skip B11 and keep the admin sidebar, but still apply the canvas token.
- **D2** — platform palette before school selection: indigo family (current defaults, recommended) or neutral slate?
- **D3** — keep the sign-in CTA gradient as the only gradient button (recommended), or make it solid like the rest?

### 7.4 Commands
```bash
cd ~/Downloads/eduamigo-frontend
# targeted specs
E2E_API_PORT=8130 E2E_WEB_PORT=5194 npx playwright test e2e/<spec>.spec.js --reporter=line
# sweep (opt-in; ~6 min for 4 widths)
SWEEP_DIR=<dir> SWEEP_WIDTHS=390,1280 E2E_API_PORT=8130 E2E_WEB_PORT=5194 npx playwright test e2e/responsive-sweep.spec.js
# dead-click crawl (opt-in; ~6 min)
CRAWL_DIR=<dir> E2E_API_PORT=8130 E2E_WEB_PORT=5194 npx playwright test e2e/dead-click-crawl.spec.js
# full suite (~6 min; 102 passed, 19 skipped at 8de6770)
E2E_API_PORT=8130 E2E_WEB_PORT=5194 npx playwright test --reporter=line
```
Wrap long runs in a time limit (`perl -e 'alarm 1500; exec @ARGV' npx playwright test …`). If a run hangs, read its log rather than waiting.

### 7.5 Contrast probe
A temporary spec (not committed) signs in as student and parent with `localStorage` `themeVer=2` and `darkMode=true|false`, visits every route, and for every visible element with its own text computes the WCAG ratio against the first opaque ancestor background. Target: 0 elements under 3:1 in dark mode (the state at 8de6770). The light-mode count must not rise above 32, the value at 8de6770 (all outside bus and fee).

### 7.6 Definition of done for the redesign
- Every route in §3 is R.
- No gradient outside the places allowed in §2.1.
- One button, badge, tab, KPI, avatar and form style.
- The full suite, sweep (4 widths, 0 findings), crawl and contrast probe are all green.
- Contact sheets of all 78 routes at 1280 and 390 have been reviewed and recorded in the audit doc.

---

## Appendix A — contact-sheet script (dev aid, not committed to the app)

Save outside `src/` (for example in a scratch folder) and run with `node sheets.cjs <sweepDir> <outDir> <width> [perSheet] [cols] [tileW] [tileH]`, e.g. `node sheets.cjs ./sweep ./sheets 1280 4 2 640 430` or `… 390 4 4 390 760`.

```js
const fs = require('fs'); const path = require('path');
const { chromium } = require(path.resolve('node_modules/playwright'));
const [SRC, OUT, WIDTH, PER = 4, COLS = 2, TW = 640, TH = 430] = process.argv.slice(2);
const files = fs.readdirSync(SRC).filter((f) => f.startsWith(WIDTH + '_') && f.endsWith('.png')).sort();
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: COLS * (+TW + 8) + 8, height: 800 } });
  for (let s = 0; s * PER < files.length; s++) {
    const tiles = files.slice(s * PER, s * PER + +PER).map((f) => `<figure><figcaption>${f}</figcaption><div style="width:${TW}px;height:${TH}px;overflow:hidden;background:#fff"><img style="width:${TW}px" src="data:image/png;base64,${fs.readFileSync(path.join(SRC, f)).toString('base64')}"></div></figure>`).join('');
    await p.setContent(`<body style="margin:0;padding:8px;background:#222;font:12px sans-serif;color:#fff"><div style="display:grid;grid-template-columns:repeat(${COLS},${TW}px);gap:8px">${tiles}</div></body>`);
    await p.screenshot({ path: path.join(OUT, `${WIDTH}-sheet-${String(s + 1).padStart(2, '0')}.png`), fullPage: true });
  }
  await b.close();
})();
```
Run it from the frontend repo root so `node_modules/playwright` resolves.
