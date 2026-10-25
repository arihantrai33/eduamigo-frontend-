# Route and page inventory

Generated from the source (`src/App.jsx`, `src/pages/admin/Home.jsx`) by a script, then annotated. "Test coverage" lists the browser specs that name the route or its screen; every route is also visited by the responsive sweep, the dead-click crawl and the accessible-names check where the demo data allows. "Status" is conservative: *Verified working* only where a test completes a task on that screen.

| Route | Audience | Login | Permission (admin portal) | Screen | API paths read in the screen | Test coverage |
|---|---|---|---|---|---|---|
| `/` | public | no |  | Splash |  | accessible-names, admin-keyboard, admission-date, auth-and-navigation |
| `/select-school` | public | no |  | SelectSchool |  | accessible-names, auth, error-feedback, interactions |
| `/s/:code` | public | no |  | SchoolLink |  | (only the route sweeps) |
| `/login` | public | no |  | Login |  | accessible-names, auth-and-navigation, auth, controls |
| `/forgot-password` | public | no |  | ForgotPassword | `/users/forgot-password` `/users/reset-password` | accessible-names, auth, responsive-sweep |
| `/support` | public | no |  | SupportLogin |  | responsive-sweep |
| `/change-password` | any signed-in role | yes |  | ChangePassword | `/users/password` `/users` | accessible-names, interactions, responsive-sweep |
| `/report-card` | any signed-in role | yes |  | ReportCard | `/report-cards/student` `/report-cards` | print, responsive-sweep |
| `/receipt/:feeId/:receiptNo` | any signed-in role | yes |  | Receipt | `/fees` | fee-idempotency, workflows |
| `/student/home` | student | yes |  | StudentHome | `/students/my-profile` `/attendance/my-summary` `/exams/my-results` `/timetable/my` `/exams` `/events` | auth, dashboards, polish, scroll |
| `/student/attendance` | student | yes |  | StudentAttendance | `/attendance/my-summary` `/attendance` | scroll |
| `/student/result` | student | yes |  | StudentResult | `/exams/my-results` `/exams` | scroll, ux-regressions |
| `/student/fee` | student | yes |  | StudentFee | `/fees/my` `/fees` | scroll |
| `/student/bus` | student | yes |  | StudentBus |  | bus-live |
| `/student/timetable` | student | yes |  | Timetable | `/timetable/my` `/timetable` | dashboard-parent, dashboards, interactions, scroll |
| `/student/notes` | student | yes |  | Notes | `/notes/my` `/notes/assignments` `/notes/upload` `/notes` | dashboards, functional-fixes, learning, scroll |
| `/student/learn` | student | yes |  | Learn | `/context` | controls, dashboards, layout-alignment, learning-completion |
| `/student/revise` | redirect | no |  | (redirect) |  | learning |
| `/student/apply-leave` | student | yes |  | StudentApplyLeave | `/leaves/quota` `/leaves/my` `/chat/upload` `/leaves/apply` `/leaves` `/chat` | interactions, scroll |
| `/student/notifications` | student | yes |  | StudentNotifications | `/notifications/my` `/notifications` | scroll |
| `/student/chat` | student | yes |  | StudentChat | `/chat/teachers` `/chat/admin` `/chat/broadcasts` `/chat/messages` `/chat` | interactions |
| `/student/profile` | student | yes |  | StudentProfile | `/students/my-profile` `/attendance/my-summary` `/exams/my-results` `/students` `/attendance` `/exams` | scroll |
| `/teacher/home` | teacher | yes |  | TeacherHome | `/teachers/me` `/timetable/teacher` `/attendance/class` `/leaves/pending` `/chat/unread-count` `/events` | auth-and-navigation, auth, dashboards, scroll |
| `/teacher/students` | teacher | yes |  | TeacherStudents | `/students` | scroll |
| `/teacher/attendance` | teacher | yes |  | TeacherAttendance | `/teachers/me` `/students` `/attendance/class` `/attendance/bulk` `/teachers` `/attendance` | auth, scroll, workflows |
| `/teacher/marks` | teacher | yes |  | TeacherMarks | `/marks/classes` `/marks/exams` `/marks` `/marks/save` `/marks/publish` | scroll |
| `/teacher/upload` | teacher | yes |  | TeacherUpload | `/teachers/me` `/notes/teacher` `/notes/upload` `/teachers` `/notes` | interactions, scroll |
| `/teacher/timetable` | teacher | yes |  | TeacherTimetable | `/teachers/me` `/timetable/teacher` `/teachers` `/timetable` | scroll |
| `/teacher/leave` | teacher | yes |  | TeacherLeave | `/leaves/my` `/leaves/quota` `/leaves/pending` `/leaves` `/leaves/apply` | interactions, scroll |
| `/teacher/notifications` | teacher | yes |  | TeacherNotifications | `/notifications/my` `/notifications` | error-feedback, scroll |
| `/teacher/profile` | teacher | yes |  | TeacherProfile | `/teachers/me` `/teachers` | scroll |
| `/teacher/chat` | teacher | yes |  | TeacherChat | `/chat/teacher-contacts` `/chat/messages` `/chat` | workflows |
| `/admin/home/*` | admin | yes |  | AdminHome |  | (only the route sweeps) |
| `/admin/*` | admin | yes |  | AdminHome |  | accessible-names, admin-keyboard, admission-date, auth-and-navigation |
| `/parent/home` | parent | yes |  | ParentHome | `/parents/my-child` `/attendance/student` `/exams/student` `/fees/my` `/transport/my-child-bus` `/timetable/class` | auth, dashboard-parent, scroll |
| `/parent/chat` | parent | yes |  | ParentChat | `/chat/parent-teachers` `/chat/messages` `/chat` | workflows |
| `/parent/apply-leave` | parent | yes |  | ParentApplyLeave | `/leaves/my` `/leaves/quota` `/chat/upload` `/leaves/apply` `/leaves` `/chat` | scroll, workflows |
| `/parent/notifications` | parent | yes |  | ParentNotifications | `/notifications/my` `/notifications` | scroll, workflows |
| `/parent/attendance` | parent | yes |  | ParentAttendance | `/parents/my-child` `/attendance/child-summary` `/attendance/child-records` `/parents` `/attendance` | scroll |
| `/parent/calendar` | parent | yes |  | ParentCalendar | `/events` `/exams` `/fees/my` `/fees` | scroll |
| `/parent/fee` | parent | yes |  | ParentFee | `/parents/my-child` `/fees/my` `/parents` `/fees` | auth, scroll |
| `/parent/result` | parent | yes |  | ParentResult | `/parents/my-child` `/exams/student` `/parents` `/exams` | scroll |
| `/parent/bus` | parent | yes |  | ParentBus |  | bus-live |
| `/parent/profile` | parent | yes |  | ParentProfile | `/parents/my-child` `/students/my-child` `/parents` `/students` | scroll |
| `/driver` | public | no |  | DriverHome |  | accessible-names, bus-live, responsive-sweep |
| `/admin/` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | (redirect) | Dashboard |  | accessible-names, admin-keyboard, admission-date, auth-and-navigation |
| `/admin/students` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | students.read | Students |  | admin-keyboard, admission-date, auth-and-navigation, auth |
| `/admin/students/add` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | students.manage | AddStudent |  | controls, interactions |
| `/admin/students/:id` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | students.read | StudentProfile |  | (only the route sweeps) |
| `/admin/parents/add` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | parents.manage | AddParent |  | (only the route sweeps) |
| `/admin/teachers` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | teachers.manage | Teachers |  | auth-and-navigation, dashboards, roles, unsaved-changes |
| `/admin/teachers/add` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | teachers.manage | AddTeacher |  | unsaved-changes |
| `/admin/teachers/:id` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | teachers.manage | TeacherProfile |  | (only the route sweeps) |
| `/admin/attendance-reports` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | attendance.reports | AttendanceReport |  | (only the route sweeps) |
| `/admin/attendance/report` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | attendance.reports | AttendanceReport |  | (only the route sweeps) |
| `/admin/chat` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | chat.directory | Chat |  | dashboard-parent, dashboards, interactions, learning-integration |
| `/admin/exams` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | exams.manage | ExamSchedule |  | accessible-names, interactions |
| `/admin/fees` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | fees.collect | FeeCollection |  | fee-idempotency, roles, workflows |
| `/admin/fee-reports` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | fees.read | FeeReports |  | (only the route sweeps) |
| `/admin/fee-structure` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | fees.structure | FeeStructure |  | accessible-names, interactions |
| `/admin/leaves` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | leaves.all | LeaveRequests |  | workflows |
| `/admin/library` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | library.manage | Library |  | accessible-names, admin-keyboard, error-feedback, interactions |
| `/admin/marks` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | (redirect) | Navigate |  | (only the route sweeps) |
| `/admin/notice-board` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | (redirect) | Navigate |  | (only the route sweeps) |
| `/admin/admissions` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | admissions.manage | Admissions |  | accessible-names |
| `/admin/admissions/*` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | (redirect) | Navigate |  | accessible-names |
| `/admin/communications` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | communication.manage | Communications |  | accessible-names, workflows |
| `/admin/reports` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | attendance.reports | Reports |  | (only the route sweeps) |
| `/admin/results` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | results.read | Results |  | dashboard-parent, dashboards |
| `/admin/salaries` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | hr.manage | SalaryManagement |  | accessible-names |
| `/admin/settings` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | settings.manage | Settings |  | interactions, roles |
| `/admin/academic` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | academics.manage | AcademicSetup |  | (only the route sweeps) |
| `/admin/activity` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | audit.read | ActivityLog |  | (only the route sweeps) |
| `/admin/ask` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | assistant.insights | AskInsights |  | learning-completion |
| `/admin/year-end` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | academics.manage | YearEnd |  | (only the route sweeps) |
| `/admin/tc/:id` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | students.manage | TransferCertificate |  | (only the route sweeps) |
| `/admin/timetable` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | timetable.manage | Timetable |  | dashboard-parent, dashboards, interactions |
| `/admin/transport` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | transport.manage | Transport |  | accessible-names, interactions |
| `/admin/user-management` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | users.manage | UserManagement |  | accessible-names, interactions, roles, ux-regressions |
| `/admin/staff` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | hr.manage | OfficeStaff |  | (only the route sweeps) |
| `/admin/roles` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | roles.view | Roles |  | roles |
| `/admin/parents` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | parents.read | ParentsList |  | (only the route sweeps) |
| `/admin/event-calendar` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | communication.manage | EventCalendar |  | accessible-names, interactions, ux-regressions |
| `/admin/id-card-generator` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | students.manage | IDCardGenerator |  | (only the route sweeps) |
| `/admin/bulk-operations` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | bulk.manage | BulkOperations |  | interactions |
| `/admin/inbox` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | (any staff) | Inbox |  | (only the route sweeps) |
| `/admin/hr-management` | admin portal (admin, accountant, staff; a teacher with office duties) | yes | hr.manage | HRManagement |  | accessible-names, ux-regressions, workflows |
| `/privacy` | public | no |  | Privacy | (static text) | landing |

Routes found: **88** (87 from the route tables plus `/privacy`, drawn by the app shell).
