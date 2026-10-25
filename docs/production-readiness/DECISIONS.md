# Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Keep `User.role` as the account type; add roles as data (`SchoolRole`), not a second role system | existing enum drives portals, login and 100+ call sites; replacing it is a rewrite with no benefit |
| D2 | Keep the existing permission keys as canonical and add new keys only where a distinct sensitive action exists (`roles.view`, `roles.manage`, later `marks.publish`, `fees.refund.approve`). Convention for new keys: `domain.action` or `domain.resource.action` | renaming 31 keys across 121 routes, the frontend and tests is churn with risk; the guide's `domain.resource.action` is adopted going forward |
| D3 | Resolver first (seam), data-backed roles second | the seam has no behaviour change and is covered by `access-matrix`; custom roles come only after it |
| D4 | One account in one school stays for now; multi-school identity is handled by the sign-in ticket | a membership collection touches every query; the architecture does not preclude it |
| D5 | Scope resolution lives in one service and replaces `role ===` branches one resource at a time, each with tests | avoids a big-bang change and keeps the isolation sweep meaningful |
| D6 | New code and tests follow the existing patterns (Jest + supertest on in-memory MongoDB; Playwright on the demo backend) | no new test stack |
| D7 | Real payments, messages, DNS, deployment and production data are never touched; blockers are documented | safety boundary of the program |
