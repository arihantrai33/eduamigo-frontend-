// Opens every page of every role at desktop and phone width and records what a person would not see but a developer must:
// console errors, uncaught errors, failed API calls (4xx/5xx), pages that show an error message, and sideways scrolling.
//   node e2e/crawl-check.mjs [--web http://localhost:5173] [--school GVPS] [--password Demo@1234] [--admin ID --teacher ID --student ID --parent ID] [--headed]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const WEB = arg('web', 'http://localhost:5173'); const SCHOOL = arg('school', 'GVPS'); const PW = arg('password', 'Demo@1234');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const roles = {
  admin: { id: arg('admin', 'admin@gvps.demo'), pages: ['/admin', '/admin/academic', '/admin/year-end', '/admin/admissions', '/admin/students', '/admin/students/add', '/admin/teachers', '/admin/teachers/add', '/admin/timetable', '/admin/homework', '/admin/exams', '/admin/results', '/admin/attendance-reports', '/admin/fee-structure', '/admin/fees', '/admin/fee-reports', '/admin/leaves', '/admin/hr-management', '/admin/staff', '/admin/parents', '/admin/communications', '/admin/chat', '/admin/event-calendar', '/admin/library', '/admin/transport', '/admin/id-card-generator', '/admin/bulk-operations', '/admin/user-management', '/admin/roles', '/admin/reports', '/admin/activity', '/admin/ask', '/admin/settings', '/admin/support'] },
  teacher: { id: arg('teacher', 'teacher@gvps.demo'), pages: ['/teacher/home', '/teacher/students', '/teacher/attendance', '/teacher/marks', '/teacher/upload', '/teacher/timetable', '/teacher/leave', '/teacher/notifications', '/teacher/profile', '/teacher/homework', '/teacher/chat'] },
  student: { id: arg('student', '1'), pages: ['/student/home', '/student/attendance', '/student/result', '/student/fee', '/student/bus', '/student/timetable', '/student/notes', '/student/homework', '/student/learn', '/student/revise', '/student/apply-leave', '/student/notifications', '/student/chat', '/student/profile'] },
  parent: { id: arg('parent', '9876543210'), pages: ['/parent/home', '/parent/chat', '/parent/apply-leave', '/parent/notifications', '/parent/attendance', '/parent/calendar', '/parent/fee', '/parent/result', '/parent/bus', '/parent/profile', '/parent/homework'] },
};
const sizes = [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]];
const browser = await chromium.launch({ channel: 'chrome', headless: !process.argv.includes('--headed') });
const issues = []; let visited = 0;
for (const [role, def] of Object.entries(roles)) {
  for (const [sizeName, viewport] of sizes) {
    const ctx = await browser.newContext({ viewport }); const page = await ctx.newPage();
    await ctx.addInitScript((code) => localStorage.setItem('eduamigo_school', JSON.stringify({ code, name: code })), SCHOOL);
    let where = 'sign-in';
    const note = (kind, detail) => issues.push({ role, size: sizeName, page: where, kind, detail: String(detail).slice(0, 220) });
    page.on('console', (m) => { if (m.type() === 'error') note('console error', m.text()); });
    page.on('pageerror', (e) => note('uncaught error', e.message));
    page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 400 && !/\/api\/(photos|files)\//.test(r.url())) note(`API ${r.status()}`, `${r.request().method()} ${new URL(r.url()).pathname}`); });
    await page.goto(`${WEB}/login`);
    await page.getByLabel('Email, mobile number or admission number').fill(def.id);
    await page.getByLabel('Password', { exact: true }).fill(PW);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((u) => !/\/(login|select-school)/.test(u.pathname), { timeout: 20000 });
    for (const p of def.pages) {
      where = p; visited += 1;
      try { await page.goto(`${WEB}${p}`, { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}); await sleep(500); } catch (e) { note('did not open', e.message); continue; }
      const landed = new URL(page.url()).pathname;
      if (!landed.startsWith(p.split('/').slice(0, 3).join('/')) && landed !== p) note('redirected', `to ${landed}`);
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth; const text = document.body.innerText || '';
        const wide = [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.right > vw + 2 && st.position !== 'fixed' && !el.closest('[style*="overflow"]') && !el.closest('table,[class*="scroll"],[class*="tabs"],[class*="chips"]'); }).slice(0, 2).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)}`);
        return { overflow: document.documentElement.scrollWidth - vw, wide, blank: text.trim().length < 20, errorText: (/something went wrong|failed to load|could not load|unexpected error/i.exec(text) || /\bundefined\b|\bNaN\b|\[object Object\]/.exec(text) || [''])[0] };
      });
      if (m.overflow > 1 && m.wide.length) note('sideways scroll', `${m.overflow}px: ${m.wide.join(', ')}`);
      if (m.blank) note('blank page', '');
      if (m.errorText) note('error text on page', m.errorText);
    }
    await ctx.close();
  }
}
await browser.close();
// one line per distinct problem
const seen = new Map(); for (const i of issues) { const k = `${i.role}|${i.page}|${i.kind}|${i.detail}`; const s = seen.get(k) || { ...i, sizes: new Set() }; s.sizes.add(i.size); seen.set(k, s); }
const list = [...seen.values()].map((s) => ({ ...s, sizes: [...s.sizes].join('+') }));
fs.writeFileSync('docs/production-readiness/crawl-raw.json', JSON.stringify(list, null, 1));
console.log(`${visited} page visits (${Object.values(roles).reduce((n, r) => n + r.pages.length, 0)} pages x 2 sizes), ${list.length} distinct problems`);
for (const s of list) console.log(`${s.role.padEnd(7)} ${s.page.padEnd(28)} ${s.sizes.padEnd(13)} ${s.kind}: ${s.detail}`);
