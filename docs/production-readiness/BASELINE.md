# Baseline (2026-10-23)

Reuses the verified reports in `docs/audit/` (INITIAL, WORKFLOW, SECURITY, AUTH, RESPONSIVE, DASHBOARD, FINAL) and the backend docs. Nothing here was taken from older documents without checking the code.

## Git state
- Frontend `eduamigo-frontend`: branch `feature/responsive-product`, HEAD `89c041b`, 43 changed or untracked paths, all uncommitted (landing, auth, dashboards, audit docs, tests; plus the owner's bus WIP: `src/pages/bus/*`, `parent/Bus.jsx`, `student/Bus.jsx`, `src/index.css`, `.sweep.mjs`).
- Backend `eduamigo-backend`: branch `hardening/pilot-readiness`, 32 changed or untracked paths, all uncommitted.
- Nothing is committed from the work of the last days. **Recommendation: the owner commits or tags this state before the next phases.** No reset, stash, clean or force operation was used by me.

## Checks run today (non-production, in-memory MongoDB)
| Check | Result |
|---|---|
| Backend `npx jest --runInBand` | 52 suites, **979 passed**, 0 failed (179 s) |
| Frontend `npm run build` | passes |
| Frontend `npm run lint` | 153 problems (134 errors, 19 warnings), all in older code (the new files are clean) |
| Browser suite (last full run, 2026-10-22) | 276 passed, 7 failed, 19 skipped of 303; 5 of the 7 were fixed and re-run green; 2 pre-existing `/student/learn` layout failures remain; 20 layout tests that never finish on the live-bus pages are excluded |
| Responsive sweep | 20 of 20 passed (390/768/1280/1440) |
| axe-core | 0 violations on landing, auth and the four dashboards |

## Environment facts
- The real MongoDB Atlas URI showed a DNS/SRV error (`querySrv EBADRESP`) earlier; this is an environment problem. Tests and the demo use an in-memory MongoDB and do not need it.
- No live credentials, deployment or DNS access is used or needed for the local work.

## Known open items carried in
`docs/audit/FINAL_REPORT.md` section 3 and `DASHBOARD_REPORT.md` section 7: CSP, MFA for the platform owner, privacy/terms pages, retention rule for demo requests, stale-dev-server hazard in Playwright config, `/student/learn` layout, 20 layout tests, npm audit (Firebase chain).

## Facts, inferences, unknowns
- **Verified:** everything in the table above; the architecture in `ARCHITECTURE.md` section 1 (read from code).
- **Inferred:** performance of large schools (no load test run).
- **Unknown:** production data shape (for example how many teachers have empty `subjects`), real Razorpay/Firebase/Cloudinary behaviour, push delivery to admin phones.
