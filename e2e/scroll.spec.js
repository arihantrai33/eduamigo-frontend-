import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Every portal screen must scroll when its content is taller than the screen (the content area itself does not scroll).
const SCREENS = {
  parent: ['/parent/home', '/parent/fee', '/parent/notifications', '/parent/attendance', '/parent/result', '/parent/calendar', '/parent/apply-leave', '/parent/profile'],
  student: ['/student/home', '/student/fee', '/student/attendance', '/student/result', '/student/timetable', '/student/notes', '/student/notifications', '/student/profile', '/student/apply-leave'],
  teacher: ['/teacher/home', '/teacher/attendance', '/teacher/marks', '/teacher/timetable', '/teacher/leave', '/teacher/notifications', '/teacher/profile', '/teacher/students', '/teacher/upload'],
};

for (const [role, paths] of Object.entries(SCREENS)) {
  test(`${role} screens scroll to their last content on a short phone`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 560 });
    await signIn(page, role);
    const stuck = [];
    for (const path of paths) {
      await page.goto(path);
      await page.waitForTimeout(1200);
      // Find the element that actually scrolls, scroll it to the end, and check the page's last content is on screen.
      const result = await page.evaluate(() => {
        const stage = document.querySelector('.ea-stage');
        const all = [stage, ...stage.querySelectorAll('*')];
        const tall = all.filter((el) => el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY));
        tall.forEach((el) => { el.scrollTop = el.scrollHeight; });
        const contentBottom = Math.max(...[...stage.querySelectorAll('*')].filter((el) => !/fixed|sticky/.test(getComputedStyle(el).position) && el.closest('.ea-bottom-nav') === null && el.getClientRects().length).map((el) => el.getBoundingClientRect().bottom));
        return { scrollers: tall.length, contentBottom: Math.round(contentBottom), viewport: innerHeight };
      });
      if (result.contentBottom > result.viewport + 2) stuck.push(`${path}: content ends at ${result.contentBottom}px, screen is ${result.viewport}px, scrollable areas: ${result.scrollers}`);
    }
    expect(stuck).toEqual([]);
  });
}
