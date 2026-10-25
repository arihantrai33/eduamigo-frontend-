# Migration guide (this release)

Run only against a database you have a backup of. Nothing here was run against real data; it was run against in-memory databases in tests.

1. Back up: `npm run backup` (backend). On Atlas paid tiers also take a snapshot.
2. Deploy the new backend. It starts fine on old data: a school without `SchoolRole` documents uses the code table for its three built-in
   roles; a teacher without `TeachingAssignment` documents uses the old class and subject lists. So the migration can follow the deploy.
3. Dry run: `npm run migrate`. New lines in the report:
   - `roles.system_roles_missing`: schools that will get their built-in roles.
   - `teaching.assignments_from_lists`: assignments that will be created from the teachers' lists.
   - `teaching.cross_product_teachers_to_review`: teachers with several classes AND several subjects (see below).
4. Apply: `npm run migrate -- --apply`. It creates documents only; it deletes nothing. A second run reports no pending changes.
5. After applying, schools can narrow teachers under *Teachers > (teacher) > Teaching assignments*, and create roles under *Roles & Access*.
6. New accounts of type `staff` need the new backend (older code rejects the role value). Do not create `staff` accounts before every
   instance runs the new version.

## Behaviour that changes on deploy (intended)
- A teacher without a teacher profile no longer sees all pending student leaves (fail closed).
- A parent or student cannot read the timetable of a class that is not theirs.
- A teacher no longer receives school-wide student lists from the dashboard endpoint.
- The web app waits for the server's profile answer before deciding access for a stored session (a slower first paint on a slow link; a
  user whose permissions were reduced no longer sees the old screens).

## Rollback
Restore the backup, or drop `schoolroles`, `teachingassignments` and `staffprofiles` and clear `extraRoles` on users; the code then behaves
as before for the three built-in roles. `staff` accounts must be switched off or deleted first because older code does not know the value.

## Not yet migrated
Payroll (`Salary`) and staff leave (`StaffLeave`) still reference teachers only. Office staff have an employee record (`StaffProfile`)
but no payroll or leave in the product yet; a later migration would add a generic employee reference next to `teacher`.
