# Functional check (permissions and saved data)

Run 2026-10-25T11:24 on the local demo (GVPS). 22 of 22 passed.

- PASS: student: 14 features of other roles are refused _(API)_
- PASS: parent: 14 features of other roles are refused _(API)_
- PASS: teacher: 10 features of other roles are refused _(API)_
- PASS: admin: 3 features of other roles are refused _(API)_
- PASS: without signing in, school data is refused _(API)_
- PASS: a forged / altered token is refused _(API)_
- PASS: student: /admin, /admin/fees, /teacher/home, /parent/home do not open _(screen)_
- PASS: parent: /admin, /admin/students, /student/home, /teacher/home do not open _(screen)_
- PASS: teacher: /admin, /admin/fees, /student/home, /parent/home do not open _(screen)_
- PASS: student leave request is listed after submit and after a reload _(screen)_
- PASS: …and after logging out and in again _(screen)_
- PASS: the office sees that request and approves it _(screen)_
- PASS: the student sees "Approved" (after a reload) _(screen)_
- PASS: a classmate from another family (Aarav) cannot see this leave request _(API)_
- PASS: the notice is listed for the office after reload _(screen)_
- PASS: …and after logging out and in again _(screen)_
- PASS: parents get it _(API)_
- PASS: teachers do not _(API)_
- PASS: students do not _(API)_
- PASS: a student added through the form is saved (found by the office list) _(API)_
- PASS: …and shown in the Students screen after a reload and after logging out and in _(screen)_
- PASS: no uncaught errors or console errors (other than blocked requests) happened during the flows above _(screen)_
