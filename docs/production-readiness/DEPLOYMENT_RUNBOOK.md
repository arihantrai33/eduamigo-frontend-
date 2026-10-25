# Deployment runbook

Nothing here has been run against production. It is the order to follow, with the checks that decide whether to continue. The detailed
steps for secrets, Render, Atlas, Firebase and school onboarding are in the backend's `docs/DEPLOYMENT.md`; this file adds what this
release needs and the go / no-go checks.

## Before deploying
1. All tests green on the commit to deploy: backend `npm test`; frontend `npm run build`; browser suite against a local demo.
2. `npm run backup` against the production database (or an Atlas snapshot) and note where it is.
3. Environment (backend): `MONGO_URI`, `JWT_SECRET` (32+ chars), `CORS_ORIGINS` (the real frontend origins), `DATA_ENCRYPTION_KEY`, email provider keys,
   Cloudinary, Firebase, AI keys. Frontend: `VITE_API_URL` (Render URL ending `/api`). Tenant hosts only after wildcard DNS exists:
   `PLATFORM_BASE_DOMAIN` / `VITE_TENANT_ROUTING` / `VITE_PLATFORM_BASE_DOMAIN`.
4. Decide a Content-Security-Policy with the production origins (open item O1 in SECURITY_REVIEW.md).

## Order
1. Deploy the backend (it is compatible with data that has not been migrated: see MIGRATION_GUIDE.md).
2. Check `GET /api/health` returns `{status:"ok", db:"up"}`; check logs for `tenant_guard` lines (there should be none).
3. `npm run migrate` (dry run), read the report, then `npm run migrate -- --apply`; run the dry run again and expect no pending changes.
4. Deploy the frontend (Vercel). Hard-refresh; sign in as an administrator, a teacher, a parent and a student of a test school.
5. Smoke test (5 minutes): admin opens Roles & Access (3 built-in roles listed); create a role from a template; assign it to a test staff
   account; that account signs in and sees only the matching menus; a teacher with a teaching assignment cannot enter marks for another subject.

## Go / no-go
Stop and roll back if: health is not ok; sign-in fails for any role; the migration report shows `indexes.failed.*` you do not understand;
any `tenant_guard` log line appears; an administrator loses menu items.

## Rollback
Frontend: redeploy the previous Vercel build. Backend: redeploy the previous Render build; the new collections are ignored by older code,
except `staff` accounts (switch them off first). Data: restore the backup only if the migration itself damaged data (it only adds documents).

## What this runbook cannot confirm
Hosting settings, DNS, secrets, Atlas network access and Firebase rules live outside the repository and were not inspected.
