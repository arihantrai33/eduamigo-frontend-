/* global process */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { signIn, apiSession } from './helpers';

// Responsive sweep: every route at phone (390), tablet (768) and desktop (1280) width. It takes about ten minutes,
// so it only runs when asked:  SWEEP_DIR=<folder> npx playwright test e2e/responsive-sweep.spec.js
// Fails a screen on: sideways page scroll, a JavaScript error, an element cut off at the edge of the screen, or a
// button/field still covered by the tab bar or a floating button when the page is scrolled to the end.
// Writes a screenshot per screen and report-<role>-<width>.json (also tiny touch targets, clipped text, big gaps).
const DIR = process.env.SWEEP_DIR;
test.skip(!DIR, 'set SWEEP_DIR to run the responsive sweep');

const WIDTHS = [390, 768, 1280];
const HEIGHT = { 390: 844, 768: 1024, 1280: 860 };
const ROUTES = {
  public: ['/', '/select-school', '/s/GVPS', '/login', '/forgot-password', '/support', '/driver'],
  student: ['home', 'attendance', 'result', 'fee', 'bus', 'timetable', 'notes', 'learn', 'revise', 'apply-leave', 'notifications', 'chat', 'profile']
    .map((p) => `/student/${p}`).concat(['/change-password', '/report-card']),
  teacher: ['home', 'students', 'attendance', 'marks', 'upload', 'timetable', 'leave', 'notifications', 'profile', 'chat'].map((p) => `/teacher/${p}`),
  parent: ['home', 'chat', 'apply-leave', 'notifications', 'attendance', 'calendar', 'fee', 'result', 'bus', 'profile'].map((p) => `/parent/${p}`),
  admin: ['', 'students', 'students/add', 'students/:student', 'parents/add', 'teachers', 'teachers/add', 'teachers/:teacher', 'attendance-reports',
    'attendance/report', 'chat', 'exams', 'fees', 'fee-reports', 'fee-structure', 'leaves', 'library', 'admissions', 'communications', 'reports',
    'results', 'salaries', 'settings', 'academic', 'activity', 'ask', 'year-end', 'tc/:student', 'timetable', 'transport', 'user-management',
    'parents', 'event-calendar', 'id-card-generator', 'bulk-operations', 'hr-management'].map((p) => `/admin/${p}`),
};

// Runs in the page. Scrolls every scroller to the end before the "covered" check, so measure after the screenshot.
function measure() {
  const W = innerWidth, H = innerHeight;
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const name = (el) => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}${el.textContent?.trim() ? ` "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28)}"` : ''}`;
  const clippedBy = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox !== 'visible') return true; } return false; };
  const all = [...document.querySelectorAll('body *')].filter((el) => !el.closest('[aria-hidden="true"], [inert], .ea-skip-link, .leaflet-container') && visible(el));
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());

  const sideways = document.documentElement.scrollWidth - W;
  // Partly off screen (fully off-screen drawers and carousels are hidden on purpose), and not inside a scroller.
  const cutOff = all.filter((el) => { const r = el.getBoundingClientRect(); return ((r.left < -1 && r.right > 0) || (r.right > W + 1 && r.left < W)) && !clippedBy(el); }).slice(0, 4).map(name);
  const clippedText = all.filter((el) => {
    const cs = getComputedStyle(el);
    if (!ownText(el) || cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' || /auto|scroll/.test(cs.overflowX + cs.overflowY)) return false;
    return (cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 2) || (cs.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 2);
  }).slice(0, 4).map(name);
  const targets = all.filter((el) => el.matches('button, a[href], select, input:not([type=checkbox]):not([type=radio]):not([type=hidden]), [role=tab]'));
  const tiny = targets.filter((el) => { const r = el.getBoundingClientRect(); const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline'; return !inline && (r.width < 24 || r.height < 24); });
  // Largest empty vertical band between pieces of content (text, controls, pictures) inside the main area.
  const main = document.querySelector('main') || document.body;
  const spans = all.filter((el) => main.contains(el) && (ownText(el) || el.matches('img, svg, canvas, video, iframe, input, select, textarea, button, table')))
    .map((el) => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.bottom + scrollY]; }).sort((a, b) => a[0] - b[0]);
  let gap = 0, gapAt = 0, end = spans.length ? spans[0][1] : 0;
  for (const [top, bottom] of spans) { if (top - end > gap) { gap = top - end; gapAt = end; } end = Math.max(end, bottom); }

  // Scroll everything to the end, then look for controls still under a bar or button fixed to the bottom of the screen.
  scrollTo(0, document.documentElement.scrollHeight);
  for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); if (/auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight; }
  const fixed = [...document.querySelectorAll('body *')].filter((el) => visible(el) && getComputedStyle(el).position === 'fixed' && getComputedStyle(el).pointerEvents !== 'none')
    .filter((el) => { const r = el.getBoundingClientRect(); return r.top > H * 0.5 && r.height < H * 0.5; });
  const covered = [];
  for (const f of fixed) {
    const fr = f.getBoundingClientRect();
    for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea')) {
      if (f.contains(el) || el.contains(f) || !visible(el)) continue;
      const r = el.getBoundingClientRect();
      const x0 = Math.max(r.left, fr.left), x1 = Math.min(r.right, fr.right), y0 = Math.max(r.top, fr.top), y1 = Math.min(r.bottom, fr.bottom);
      if (x1 - x0 < 6 || y1 - y0 < 6) continue;
      const top = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2);
      if (top && f.contains(top) && !el.contains(top)) covered.push(`${name(el)} under ${name(f)}`);
    }
  }
  return { sideways, cutOff, covered: covered.slice(0, 4), clippedText, tiny: tiny.length, tinyExamples: tiny.slice(0, 3).map(name), gap: Math.round(gap), gapAt: Math.round(gapAt), docHeight: document.documentElement.scrollHeight };
}

for (const [role, routes] of Object.entries(ROUTES)) {
  for (const width of WIDTHS) {
    test(`${role} at ${width}px`, async ({ browser, request }) => {
      test.setTimeout(600_000);
      const context = await browser.newContext({ viewport: { width, height: HEIGHT[width] }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      const failedApi = [];
      page.on('response', (res) => { if (res.url().includes('/api/') && res.status() >= 500) failedApi.push(`${res.status()} ${new URL(res.url()).pathname}`); });
      let ids = {};
      if (role !== 'public') await signIn(page, role);
      if (role === 'admin') {
        const api = await apiSession(request, 'admin');
        const first = async (p) => { const body = await api.get(p); const list = Array.isArray(body) ? body : Object.values(body).find(Array.isArray) || Object.values(body.data || {}).find(Array.isArray) || []; return list[0]?._id; };
        ids = { student: await first('/students'), teacher: await first('/teachers') };
      }
      const report = [];
      for (const route of routes) {
        const url = route.replace(/:(\w+)/, (_, k) => ids[k]);
        errors.length = 0; failedApi.length = 0;
        await page.goto(url);
        await page.locator('.ea-spinner, [aria-busy="true"]').first().waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(500);
        const file = `${width}_${role}_${route.replace(/[/:]+/g, '_').replace(/^_|_$/g, '') || 'root'}.png`;
        const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.screenshot({ path: path.join(DIR, file), fullPage: true, clip: { x: 0, y: 0, width, height: Math.min(docHeight, HEIGHT[width] * (width === 390 ? 2 : 1)) } });
        const m = await page.evaluate(measure);
        const entry = { route, landed: new URL(page.url()).pathname, file, errors: [...errors], failedApi: [...failedApi], ...m };
        report.push(entry);
        expect.soft(m.sideways, `${route} at ${width}: sideways scroll`).toBeLessThanOrEqual(0);
        expect.soft(m.cutOff, `${route} at ${width}: cut off at the screen edge`).toEqual([]);
        expect.soft(m.covered, `${route} at ${width}: covered by a fixed bar or button`).toEqual([]);
        expect.soft(entry.errors, `${route} at ${width}: JavaScript errors`).toEqual([]);
      }
      fs.writeFileSync(path.join(DIR, `report-${role}-${width}.json`), JSON.stringify(report, null, 1));
      await context.close();
    });
  }
}
