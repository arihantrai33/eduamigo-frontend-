# Test strategy

| Layer | Tool | Where | What it protects |
|---|---|---|---|
| Permission decisions | Jest | `tests/authorization.test.js` | parity with the original table, deny by default, plan cap, `explain`; static guards that stop code from reading roles directly |
| Scope | Jest | `tests/scope.test.js` (written before the refactor, still green), `tests/teaching-assignments.test.js` | school / assigned / own reach, class-section-subject combinations |
| Roles | Jest + supertest | `tests/school-roles.test.js` | seeding, templates, create/edit/preview/delete, enforcement, revocation, delegation limits, last admin, audit, onboarding by size |
| Route x account matrix | Jest | `tests/access-matrix.test.js` | every listed route for every account type |
| Tenancy | Jest | tenant-guard, isolation-sweep, auth-boundaries, cross-school cases in new suites | no cross-school reads or writes |
| Assistant | Jest | `tests/assistant*.test.js` | routing, grounding, injection, access by real access (`assistant-roles`) |
| Migration | Jest | `tests/migration.test.js` | idempotent, dry run writes nothing |
| Browser journeys | Playwright (Chrome) | `e2e/*.spec.js` against the in-memory demo | sign-in, dashboards, roles, assignments, layout, controls, accessibility (axe), bus |

Rules used while working: write the characterisation test first when refactoring; confirm a new test fails without the fix; run the
related suites, then the whole suite; record what was not run. E2E uses its own ports (`E2E_API_PORT`, `E2E_WEB_PORT`) because a stale
dev server on the default port once contaminated results.

Not covered by automation: live payment providers, push delivery, the live AI model, real GPS hardware, physical phones, Safari/Firefox,
screen readers, and load beyond `loadtests/`. See TEST_RESULTS.md for the last run.
