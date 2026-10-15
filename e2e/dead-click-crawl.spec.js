/* global process */
import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { signIn, apiSession } from './helpers';

// Dead-click crawl: on every screen, click each visible, enabled button and tab whose name does not suggest a
// change to data (save, delete, send, pay ...), and record the ones after which nothing happened: same address, same
// page content, no dialog, no change of pressed/expanded/selected state. Those are candidates for a broken button
// (or one that only refreshes the same data); a person reviews the list. Slow, so it only runs when asked:
//   CRAWL_DIR=<folder> npx playwright test e2e/dead-click-crawl.spec.js     (writes crawl-<role>.json)
const DIR = process.env.CRAWL_DIR;
test.skip(!DIR, 'set CRAWL_DIR to run the dead-click crawl');

const SKIP = /delete|remove|log ?out|sign ?out|send|pay|approve|reject|submit|save|post|generate|promote|upload|publish|reset|clear|archive|trip|sos|alert|call|print|download|export|admit|record|issue|return|resolve|deactivate|activate|disable|enable|lock|import|apply|confirm|yes|mark|update|add|create|new chat|discard|leave|stop|speak|listen|microphone|voice|ask|retry|try again|refresh/i;

const ROUTES = {
  student: ['home', 'attendance', 'result', 'fee', 'bus', 'timetable', 'notes', 'learn', 'apply-leave', 'notifications', 'chat', 'profile'].map((p) => `/student/${p}`),
  teacher: ['home', 'students', 'attendance', 'marks', 'upload', 'timetable', 'leave', 'notifications', 'profile', 'chat'].map((p) => `/teacher/${p}`),
  parent: ['home', 'chat', 'apply-leave', 'notifications', 'attendance', 'calendar', 'fee', 'result', 'bus', 'profile'].map((p) => `/parent/${p}`),
  admin: ['', 'students', 'students/:student', 'teachers', 'teachers/:teacher', 'attendance-reports', 'attendance/report', 'chat', 'exams', 'fees',
    'fee-reports', 'fee-structure', 'leaves', 'library', 'admissions', 'communications', 'reports', 'results', 'salaries', 'settings', 'academic',
    'activity', 'year-end', 'timetable', 'transport', 'user-management', 'parents', 'event-calendar', 'id-card-generator', 'bulk-operations',
    'hr-management'].map((p) => `/admin/${p}`),
};

const snapshot = () => {
  let h = 0; const s = document.body.innerHTML;
  for (let i = 0; i < s.length; i += 7) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `${location.pathname}${location.search}|${s.length}|${h}|${document.querySelectorAll('[role=dialog], dialog[open]').length}`;
};

for (const [role, routes] of Object.entries(ROUTES)) {
  test(`dead clicks: ${role}`, async ({ browser, request }) => {
    test.setTimeout(1_800_000);
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await signIn(page, role);
    let ids = {};
    if (role === 'admin') {
      const api = await apiSession(request, 'admin');
      const first = async (p) => { const b = await api.get(p); const l = Array.isArray(b) ? b : Object.values(b).find(Array.isArray) || Object.values(b.data || {}).find(Array.isArray) || []; return l[0]?._id; };
      ids = { student: await first('/students'), teacher: await first('/teachers') };
    }
    const open = async (url) => {
      await page.goto(url);
      await page.locator('.ea-spinner, [aria-busy="true"]').first().waitFor({ state: 'detached', timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(400);
    };
    const candidates = () => page.evaluate((skip) => {
      const re = new RegExp(skip, 'i');
      const nameOf = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ');
      const out = [];
      document.querySelectorAll('button, [role=button], [role=tab]').forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || el.disabled || el.closest('nav, aside, .ea-bottom-nav, .ea-sidebar, [aria-hidden="true"]')) return;
        if (el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-current')) return; // already the current tab/page
        // The pressed option of a single-choice group (filters, segmented tabs, a teacher's only class, Present/Absent):
        // choosing it again rightly changes nothing. Toggles such as mute start unpressed, so they are still tried.
        if (el.getAttribute('aria-pressed') === 'true') return;
        const n = nameOf(el);
        if (!re.test(n)) out.push({ i, name: n.slice(0, 40) });
      });
      return out;
    }, SKIP.source);
    const report = [];
    for (const route of routes) {
      const url = route.replace(/:(\w+)/, (_, k) => ids[k]);
      await open(url);
      const list = (await candidates()).slice(0, 12); // the first 12 per screen keeps a full crawl near half an hour
      const dead = [], failed = [];
      for (const { i, name } of list) {
        const el = page.locator('button, [role=button], [role=tab]').nth(i);
        // With a timeout: after a click that left the page the element is gone, and evaluate() would wait forever.
        const attrs = () => el.evaluate((e) => ['aria-pressed', 'aria-expanded', 'aria-selected', 'aria-checked', 'class'].map((a) => e.getAttribute(a)).join('|'), undefined, { timeout: 1000 }).catch(() => 'gone');
        const before = await page.evaluate(snapshot), a0 = await attrs();
        errors.length = 0;
        const clicked = await el.click({ timeout: 2000 }).then(() => true, () => false);
        await page.waitForTimeout(350);
        if (!clicked) { failed.push(name); continue; }
        const after = await page.evaluate(snapshot), a1 = await attrs();
        if (errors.length) failed.push(`${name} (error: ${errors[0].slice(0, 60)})`);
        if (before === after && a0 === a1) dead.push(name);
        else await open(url);
      }
      report.push({ route, tried: list.length, dead, failed });
      // Saved after every screen, so a run that is stopped early still leaves its results.
      fs.writeFileSync(path.join(DIR, `crawl-${role}.json`), JSON.stringify(report, null, 1));
    }
    await context.close();
  });
}
