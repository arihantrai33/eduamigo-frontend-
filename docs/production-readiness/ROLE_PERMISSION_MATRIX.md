# Role and permission matrix

Generated from `eduamigo-backend/src/config/permissions.js` and `config/roleTemplates.js` on 2026-10-23. The code is the source of truth; if this file and the code disagree, the code wins (re-generate).

Built-in accounts: **admin** (everything), **accountant**, **teacher**, **staff** (no permission of its own; only what assigned roles give). **student** and **parent** have no staff permissions; they only reach their own / their children's records through relationship checks.

## Built-in account types

| Permission | Meaning | admin | accountant | teacher | staff |
|---|---|:-:|:-:|:-:|:-:|
| `students.read` | View student records | yes | yes | yes |  |
| `students.manage` | Add, edit and deactivate students | yes |  |  |  |
| `teachers.read` | View teacher records | yes |  | yes |  |
| `teachers.manage` | Add, edit and deactivate teachers, assign classes | yes |  |  |  |
| `parents.read` | View parent records | yes | yes |  |  |
| `parents.manage` | Add parents and link children | yes |  |  |  |
| `admissions.manage` | Record enquiries, process applications and admit new students | yes |  |  |  |
| `users.manage` | Create logins, reset passwords, activate or deactivate accounts | yes |  |  |  |
| `attendance.mark` | Mark student attendance | yes |  | yes |  |
| `attendance.reports` | School-wide attendance dashboards and reports | yes |  |  |  |
| `marks.enter` | Enter and publish marks for own classes | yes |  | yes |  |
| `results.read` | View published results | yes |  | yes |  |
| `exams.manage` | Manage the exam schedule | yes |  |  |  |
| `timetable.manage` | Create and edit timetables | yes |  |  |  |
| `fees.read` | View fee records and summaries | yes | yes |  |  |
| `fees.collect` | Record fee payments and issue receipts | yes | yes |  |  |
| `fees.structure` | Create fee structures and bill students | yes | yes |  |  |
| `hr.manage` | Salaries and staff leave | yes |  |  |  |
| `leaves.review` | Review leave requests | yes |  | yes |  |
| `leaves.all` | View and delete every leave request in the school | yes |  |  |  |
| `communication.manage` | Announcements, notifications and calendar events | yes |  |  |  |
| `transport.manage` | Buses, routes, stops and student assignment | yes |  |  |  |
| `library.manage` | Library catalogue | yes |  |  |  |
| `bulk.manage` | Bulk uploads, bulk attendance and class promotion | yes |  |  |  |
| `notes.upload` | Upload study material | yes |  | yes |  |
| `settings.manage` | School settings such as subjects | yes |  |  |  |
| `academics.manage` | Academic sessions, classes, sections, subjects and class teachers | yes |  |  |  |
| `chat.directory` | Message anyone in the school from one inbox | yes |  |  |  |
| `audit.read` | See the school activity log (who changed marks, fees, students, settings) | yes |  |  |  |
| `assistant.knowledge` | EduAmigo Ask: add, update and remove the school documents it answers from | yes |  |  |  |
| `assistant.insights` | EduAmigo Ask: routing accuracy and resolution metrics, and every hand-off ticket in the school | yes |  |  |  |
| `roles.view` | See the school's roles, what each allows, and who holds them | yes |  |  |  |
| `roles.manage` | Create and change roles and give them to staff (only permissions you hold yourself) | yes |  |  |  |

## Scopes (how far a permission reaches)

| Family | Covers | admin | accountant | teacher |
|---|---|:-:|:-:|:-:|
| `students` | Student directory (names, classes, parents) | school | school | assigned |
| `academic` | Attendance, results, marks, report cards and class study material | school | - | assigned |
| `leaves` | Student leave requests | school | - | assigned |
| `notes` | Study material uploaded by staff | school | - | own |

Scope values: **school** (all records), **assigned** (classes the person is assigned to; with teaching assignments, exact class-section-subject), **own** (records the person created), **none**. Where a person holds several roles the widest scope wins; a family with no scope given by any role is **none** (fail closed).

## Templates a school can start a role from

| Template | Permissions | Scopes |
|---|---|---|
| School owner / management | `students.read`, `teachers.read`, `parents.read`, `attendance.reports`, `results.read`, `fees.read`, `audit.read`, `assistant.insights` | students: school, academic: school, leaves: school |
| Principal | `students.read`, `teachers.read`, `parents.read`, `attendance.reports`, `results.read`, `exams.manage`, `timetable.manage`, `fees.read`, `leaves.review`, `leaves.all`, `communication.manage`, `chat.directory`, `audit.read`, `assistant.insights` | students: school, academic: school, leaves: school |
| Vice principal | `students.read`, `teachers.read`, `attendance.reports`, `results.read`, `timetable.manage`, `leaves.review`, `communication.manage`, `chat.directory` | students: school, academic: school, leaves: school |
| Office manager | `students.read`, `students.manage`, `parents.read`, `parents.manage`, `teachers.read`, `admissions.manage`, `communication.manage`, `bulk.manage` | students: school, academic: school, leaves: school |
| Receptionist / front desk | `students.read`, `parents.read`, `admissions.manage` | students: school |
| Admission officer | `students.read`, `students.manage`, `parents.read`, `parents.manage`, `admissions.manage` | students: school |
| Fee collector / cashier | `students.read`, `fees.read`, `fees.collect` | students: school |
| Academic coordinator / HOD | `students.read`, `teachers.read`, `attendance.reports`, `results.read`, `exams.manage`, `timetable.manage`, `notes.upload` | students: assigned, academic: assigned, notes: own |
| Examination controller | `students.read`, `results.read`, `exams.manage` | students: school, academic: school |
| Class teacher (extra duties) | `attendance.reports`, `leaves.review` | academic: assigned, leaves: assigned |
| Librarian | `library.manage` | - |
| Transport manager | `transport.manage` | - |
| HR / payroll officer | `teachers.read`, `teachers.manage`, `hr.manage` | - |
| Sports / activities coordinator | `communication.manage` | - |

Not offered because the product has no module for them yet: counsellor, nurse, inventory manager.

## Rules enforced on the server

- A role can only contain permissions that exist in the catalogue, and only ones the person creating it holds themselves (delegation limit); scopes may not be wider than the creator's.
- Nobody changes the roles they hold, and nobody assigns roles to themselves.
- The built-in administrator role cannot be assigned as an extra role, edited or deleted. Built-in roles cannot be edited (make a copy).
- The only active administrator of a school cannot be deactivated.
- Creating an administrator account needs full administrator rights.
- Roles are looked up on every request: removing a role or switching it off takes effect on the next request, not at next login.
- Every role change, role assignment and teaching-assignment change is written to the audit log.
- Plan limits: a permission whose module is not in the school's plan is removed from the effective set.

Tests: `tests/authorization.test.js`, `tests/scope.test.js`, `tests/school-roles.test.js`, `tests/access-matrix.test.js` (every route x every account type), `tests/teaching-assignments.test.js`.
