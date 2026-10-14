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

// `root`: a selector to check inside (the last match, e.g. the dialog on top); the whole page when left out.
const unnamedControls = (root) => {
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
  const scope = root ? [...document.querySelectorAll(root)].pop() : document;
  return [...scope.querySelectorAll(sel)].filter((el) => visible(el) && !nameOf(el))
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

test('sign-in, password and driver pages: every control has an accessible name', async ({ page }) => {
  const found = [];
  const check = async (label) => { await page.waitForTimeout(400); for (const c of await page.evaluate(unnamedControls)) found.push(`${label}: ${c}`); };
  await page.goto('/select-school');
  await check('/select-school');
  await page.getByLabel('School code or name').fill('GVPS');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, this is my school' }).click();
  await page.waitForURL(/\/login/);
  await check('/login');
  for (const role of ['parent', 'teacher', 'student']) { await page.goto(`/forgot-password?role=${role}`); await check(`/forgot-password?role=${role}`); }
  await page.goto('/driver');
  await check('/driver');
  await signIn(page, 'student');
  await page.goto('/change-password');
  await check('/change-password');
  expect(found, found.join('\n')).toEqual([]);
});

// Each dialog opens as a real dialog, and every field in it has a name.
const DIALOGS = [
  ['/admin/library', 'Add Book'], ['/admin/exams', 'Schedule Exam'], ['/admin/fee-structure', 'Add Fee'], ['/admin/transport', 'New Bus'],
  ['/admin/salaries', 'Add Salary'], ['/admin/hr-management', 'Add Salary'], ['/admin/event-calendar', 'Add Event'],
  ['/admin/user-management', 'Add User'], ['/admin/admissions', 'New enquiry'], ['/admin/communications', 'Send Notification'],
];
test('admin dialogs: each opens as a dialog and every control in it has an accessible name', async ({ page }) => {
  test.setTimeout(180_000);
  await signIn(page, 'admin');
  const found = [];
  for (const [path, opener] of DIALOGS) {
    await page.goto(path);
    await page.waitForTimeout(600);
    const button = page.getByRole('button', { name: opener }).first();
    if (!(await button.count())) { found.push(`${path}: no "${opener}" button`); continue; }
    await button.click();
    await page.waitForTimeout(500);
    if (!(await page.locator('[role="dialog"]').count())) { found.push(`${path} "${opener}": opens without role="dialog"`); continue; }
    for (const c of await page.evaluate(unnamedControls, '[role="dialog"]')) found.push(`${path} "${opener}": ${c}`);
  }
  expect(found, found.join('\n')).toEqual([]);
});
