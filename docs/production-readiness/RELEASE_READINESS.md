# Release readiness checklist

Short checklist form of PRODUCTION_READINESS_REPORT.md. Tick only with evidence.

- [x] Backend suite green (58 suites, 1182 tests)
- [x] Frontend build passes
- [x] Browser journeys for roles, assignments, dashboards, auth, landing pass (see TEST_RESULTS.md for reruns)
- [x] Tenant isolation sweep includes every new route
- [x] Migration is idempotent and dry-run safe (tested on in-memory data)
- [ ] Migration dry run against a copy of real data
- [ ] Staging deployment and smoke test (DEPLOYMENT_RUNBOOK.md)
- [ ] Backup restore rehearsed
- [ ] Formal privacy policy and terms of use
- [ ] Content-Security-Policy
- [ ] Uptime monitor and alerts
- [ ] Live payment and AI provider checks with test accounts
- [ ] Real-device and cross-browser pass
- [x] Layout test hangs resolved (waits for the bus header, not network idle)
- [ ] `/student/learn` header aligned with the shared frame (5 layout checks fail on that one page)
