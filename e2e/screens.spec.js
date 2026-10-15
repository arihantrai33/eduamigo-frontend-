import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Every screen of every portal opens without crashing (no error screen, no uncaught error).
// This is what caught a screen that used a component it never imported.
const SCREENS = {
  student: ['home', 'attendance', 'result', 'fee', 'bus', 'timetable', 'notes', 'revise', 'apply-leave', 'notifications', 'chat', 'profile'].map((p) => `/student/${p}`),
  teacher: ['home', 'students', 'attendance', 'marks', 'upload', 'timetable', 'leave', 'notifications', 'profile', 'chat'].map((p) => `/teacher/${p}`),
  parent: ['home', 'chat', 'apply-leave', 'notifications', 'attendance', 'calendar', 'fee', 'result', 'bus', 'profile'].map((p) => `/parent/${p}`),
  admin: ['', 'students', 'students/add', 'parents/add', 'teachers', 'teachers/add', 'attendance-reports', 'chat', 'exams', 'fees', 'fee-reports',
    'fee-structure', 'leaves', 'library', 'admissions', 'communications', 'reports', 'results', 'salaries', 'settings', 'academic', 'activity',
    'ask', 'year-end', 'timetable', 'transport', 'user-management', 'parents', 'event-calendar', 'id-card-generator', 'bulk-operations',
    'hr-management'].map((p) => `/admin/${p}`),
};

for (const [role, paths] of Object.entries(SCREENS)) {
  test(`every ${role} screen opens without an error`, async ({ page }) => {
    test.setTimeout(120_000); // up to 32 screens in one test; 45 s was too tight on a busy machine
    const errors = [];
    page.on('pageerror', (err) => errors.push(`${page.url()}: ${err.message}`));
    await signIn(page, role);
    for (const path of paths) {
      await page.goto(path);
      await page.waitForTimeout(700);
      await expect(page.getByText('Something went wrong on this screen'), `${path} crashed`).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
