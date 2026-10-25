# Operations runbook

## Signals that exist today
- `GET /api/health`: 200 `{status:"ok", db:"up"}` or 503 when MongoDB is not connected. It checks the database only (not Cloudinary,
  Firebase, the AI provider or email).
- Request log: one JSON line per request with `requestId`, method, path (driver tokens and photo tokens masked), status and timing. A client may send
  `x-request-id`. 5xx responses include `requestId` so a report from a user can be matched to a log line.
- `request_failed` lines carry the error; `tenant_guard` lines mean a query lacked its school filter (treat as a bug and fix the query).
- Assistant: `/api/assistant/metrics` and `/evaluation` (needs `assistant.insights`); AI usage per school in AI Usage.
- Audit log (Activity Log screen, `audit.read`): role changes, role assignments, teaching-assignment changes, staff record changes, user
  creation, deactivation, fee and marks changes.

## Not in place
No external uptime monitor, alerting, error tracker, log retention policy or dashboard is configured in the repository. Add an uptime monitor on
`/api/health` and alerts on 5xx rate; this is a configuration task outside the code.

## Routine tasks
| Task | How |
|---|---|
| Add a school | `npm run create-school` (see backend docs/DEPLOYMENT.md "Onboarding a new school"); the school gets its built-in roles automatically |
| Give office staff access | User Management > Add User (type Staff), then Roles on that row, or give a teacher extra duties the same way |
| Remove access | Switch the account off (immediate) or remove the role (effective on the next request) |
| Lost the last administrator | `create-school`/DB access is needed; the product refuses to deactivate the only active administrator |
| Back up | `npm run backup`; restore with `-- --restore <dir> --confirm` |
| Platform owner | `npm run create-platform-admin`; separate console app (`eduamigo-console`) |

## Incidents
1. Note the time and `requestId` from the user. 2. Search logs by it. 3. If data from one school appears in another: set nothing off,
disable the route via deploy rollback, keep the logs, and treat as a security incident (see SECURITY_REVIEW.md). 4. Bad role change: the
audit log shows who changed what; fix the role or remove it from the person. 5. Suspected stolen session: change the password or use
"sign out everywhere" (`tokenVersion`), which invalidates earlier tokens.

## Support
Support sessions (platform owner) are marked in the token and all writes in them are audited. No customer-support process, contact or SLA
is defined in the repository; the owner must decide these before launch.
