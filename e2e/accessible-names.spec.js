import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Every visible button, link and form field on every portal screen has a name a screen reader can announce
// (text, a <label>, aria-label or title). A placeholder alone does not count: it disappears once something is typed.
const SCREENS = {
  student: ['home', 'attendance', 'result', 'fee', 'bus', 'timetable', 'notes', 'learn', 'revise', 'apply-leave', 'notifications', 'chat', 'profile'].map((p) => `/student/${p}`),
  teacher: ['home', 'students', 'attendance', 'marks', 'upload', 'timetable', 'leave', 'notifications', 'profile', 'chat'].map((p) => `/teacher/${p}`),
  parent: ['home', 'chat', 'apply-leave', 'notifications', 'attendance', 'calendar', 'fee', 'result', 'bus', 'profile'].map((p) => `/parent/${p}`),
  admin: ['', 'students', 'students/add', 'parents/add', 'teachers', 'teachers/add', 'attendance-reports', 'chat', 'exams', 'fees', 'fee-reports',
    'fee-structure', 'leaves', 'library', 'admissions', 'communications', 'reports', 'results', 'salaries', 'settings', 'academic', 'activity',
    'ask', 'year-end', 'timetable', 'transport', 'user-management', 'parents', 'event-calendar', 'id-card-generator', 'bulk-operations',
    'hr-management'].map((p) => `/admin/${p}`),
};

// Screens with known unnamed controls still to fix (icon-only row actions, sibling labels). Their findings are
// listed in the test's annotations instead of failing it. Remove a screen from here once it is fixed.
// Empty since 2026-10-15: every screen below is held to the rule.
const PENDING = new Set([]);

const unnamedControls = () => {
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const nameOf = (el) => {
    if (el.getAttribute('aria-label')?.trim() || el.getAttribute('title')?.trim()) return true;
    const by = el.getAttribute('aria-labelledby');
    if (by && by.split(/\s+/).some((id) => document.getElementById(id)?.textContent.trim())) return true;
    if (el.labels && [...el.labels].some((l) => l.textContent.trim())) return true;
    if (/^(BUTTON|A)$/.test(el.tagName)) return !!(el.textContent.trim() || el.querySelector('img[alt]:not([alt=""])'));
    return false;
  };
  const sel = 'button, a[href], input:not([type=hidden]):not([type=file]), select, textarea';
  return [...document.querySelectorAll(sel)].filter((el) => visible(el) && !nameOf(el))
    .map((el) => `${el.tagName.toLowerCase()}${el.type ? `[${el.type}]` : ''}${el.placeholder ? ` placeholder="${el.placeholder}"` : ''}${el.className && typeof el.className === 'string' ? ` .${el.className.split(' ')[0]}` : ''}`);
};

for (const [role, paths] of Object.entries(SCREENS)) {
  test(`every ${role} control has an accessible name`, async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page, role);
    const found = [];
    for (const path of paths) {
      await page.goto(path);
      await page.waitForTimeout(700);
      for (const c of await page.evaluate(unnamedControls)) {
        if (PENDING.has(path)) test.info().annotations.push({ type: 'pending a11y', description: `${path}: ${c}` });
        else found.push(`${path}: ${c}`);
      }
    }
    expect(found, found.join('\n')).toEqual([]);
  });
}
