import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Form controls look the same everywhere (see "Form controls" in index.css): a control surface that differs from the
// page, a real boundary (3:1 against the card or page behind it), one height and radius, readable placeholders, and a
// visible focus ring. The check reads the computed style of the actual controls on pages of every portal, in the
// light and the dark theme, and at phone, tablet and desktop widths.

const PAGES = {
  student: ['notes', 'apply-leave', 'chat', 'learn'],
  parent: ['apply-leave', 'chat'],
  teacher: ['students', 'chat', 'attendance'],
  admin: ['students', 'teachers', 'students/add', 'fees', 'library', 'user-management', 'communications', 'admissions', 'leaves', 'results'],
};

function measure() {
  const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return c.startsWith('color(') ? m.slice(0, 3).map((v) => v * 255).concat(m[3] ?? 1) : m.length === 3 ? m.concat(1) : m; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const backdrop = (el) => { for (let e = el.parentElement; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] >= 0.99) return c; } return [255, 255, 255, 1]; };
  const out = [];
  for (const el of document.querySelectorAll('input, select, textarea')) {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (['hidden', 'checkbox', 'radio', 'range', 'file', 'submit', 'button'].includes(type)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 20) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || el.closest('table, .ea-roster, .ea-learn__composer')) continue;
    const fill = parse(s.backgroundColor), edge = parse(s.borderTopColor), back = backdrop(el);
    const ph = getComputedStyle(el, '::placeholder');
    out.push({
      area: el.tagName === 'TEXTAREA',
      name: (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.id || el.tagName).slice(0, 30),
      h: Math.round(r.height), radius: s.borderTopLeftRadius, borderW: s.borderTopWidth,
      fillVsBack: +ratio(fill.slice(0, 3), back.slice(0, 3)).toFixed(2), edgeVsBack: +ratio(edge.slice(0, 3), back.slice(0, 3)).toFixed(2),
      edgeVsFill: +ratio(edge.slice(0, 3), fill.slice(0, 3)).toFixed(2),
      placeholder: el.getAttribute('placeholder') ? +ratio(parse(ph.color).slice(0, 3), fill.slice(0, 3)).toFixed(2) : null,
      text: +ratio(parse(s.color).slice(0, 3), fill.slice(0, 3)).toFixed(2),
    });
  }
  return out;
}

for (const [role, pages] of Object.entries(PAGES)) {
  for (const [width, dark] of role === 'student' || role === 'parent' ? [[1280, 0], [1280, 1], [390, 0], [768, 1]] : [[1440, 0], [1024, 0], [390, 0]]) {
    test(`${role} controls at ${width}px in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width, height: 900 });
      await signIn(page, role);
      if (dark) await page.evaluate(() => { localStorage.setItem('themeVer', '2'); localStorage.setItem('darkMode', 'true'); });
      const problems = []; let seen = 0;
      for (const p of pages) {
        await page.goto(`/${role}/${p}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);
        for (const c of await page.evaluate(measure)) {
          seen++;
          const where = `/${role}/${p} "${c.name}"`;
          if (c.borderW !== '1px') problems.push(`${where}: border ${c.borderW}`);
          if (c.edgeVsBack < 2.5 && c.edgeVsFill < 2.5) problems.push(`${where}: edge ${c.edgeVsBack}:1 on the page and ${c.edgeVsFill}:1 on the field`);
          if (c.fillVsBack < 1.05 && c.edgeVsBack < 2.5) problems.push(`${where}: no visible box`);
          if (c.radius !== '10px' && c.radius !== '12px') problems.push(`${where}: radius ${c.radius}`);
          if (!c.area && (c.h < 36 || c.h > 48)) problems.push(`${where}: height ${c.h}`);
          if (c.placeholder !== null && c.placeholder < 4.5) problems.push(`${where}: placeholder ${c.placeholder}:1`);
          if (c.text < 7) problems.push(`${where}: text ${c.text}:1`);
        }
      }
      expect(seen).toBeGreaterThan(0);
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
}

test('a field shows hover, focus and disabled states you can tell apart', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'admin');
  await page.goto('/admin/students/add');
  const box = page.getByLabel('Full Name').first();
  const style = () => box.evaluate((e) => { const s = getComputedStyle(e); return { border: s.borderTopColor, shadow: s.boxShadow, bg: s.backgroundColor }; });
  const rest = await style();
  await box.hover();
  await expect.poll(async () => (await style()).border).not.toBe(rest.border);
  const hover = await style();
  expect(hover.border).not.toBe(rest.border);
  await box.focus();
  const focus = await style();
  expect(focus.shadow).not.toBe('none');
  expect(focus.border).not.toBe(rest.border);
  await box.evaluate((e) => { e.disabled = true; });
  await expect.poll(async () => (await style()).bg).not.toBe(rest.bg);
});

test('the same search field is used on every list screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const shapes = new Set();
  for (const [role, path, label] of [['student', 'notes', 'Search notes'], ['teacher', 'students', 'Search students'], ['teacher', 'chat', 'Search conversations'], ['admin', 'students', 'Search students'], ['admin', 'library', 'Search books'], ['admin', 'user-management', 'Search users'], ['admin', 'communications', 'Search announcements']]) {
    await page.goto('/login'); await page.evaluate(() => { localStorage.removeItem('eduamigo_user'); localStorage.removeItem('token'); });
    await signIn(page, role);
    await page.goto(`/${role}/${path}`);
    const field = page.getByRole('textbox', { name: label });
    await expect(field).toBeVisible();
    const shape = await field.evaluate((e) => { const s = getComputedStyle(e), w = e.parentElement; return [w.className, e.className.includes('ea-input'), s.height, s.borderTopLeftRadius, s.paddingLeft, !!w.querySelector('svg')].join('|'); });
    shapes.add(shape);
  }
  expect([...shapes]).toHaveLength(1);
});
