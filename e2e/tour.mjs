// A slow, visible tour of EduAmigo in one Chrome window: public website, then each role signed in through the real login page.
//   node e2e/tour.mjs [--web http://localhost:5173] [--pause 3000]
import { chromium } from '@playwright/test';
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const WEB = arg('web', 'http://localhost:5173'); const PAUSE = Number(arg('pause', 3000));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] });

const tour = [
  { role: 'Admin (school office)', id: 'admin@gvps.demo', pages: [['Dashboard', '/admin'], ['Students', '/admin/students'], ['Teachers', '/admin/teachers'], ['Fees', '/admin/fees'], ['Attendance reports', '/admin/attendance-reports'], ['Homework (all teachers)', '/admin/homework'], ['Communications', '/admin/communications'], ['Transport', '/admin/transport'], ['Chat', '/admin/chat'], ['Reports', '/admin/reports'], ['Settings', '/admin/settings']] },
  { role: 'Teacher', id: 'teacher@gvps.demo', pages: [['Home', '/teacher/home'], ['Attendance', '/teacher/attendance'], ['Homework', '/teacher/homework'], ['Marks', '/teacher/marks'], ['Timetable', '/teacher/timetable'], ['Chat', '/teacher/chat'], ['Profile', '/teacher/profile']] },
  { role: 'Student (Riya)', id: '1', pages: [['Home', '/student/home'], ['Attendance', '/student/attendance'], ['Homework', '/student/homework'], ['Results', '/student/result'], ['Fee status', '/student/fee'], ['School bus', '/student/bus'], ['Learning AI', '/student/learn'], ['Chat', '/student/chat'], ['Profile', '/student/profile']] },
  { role: 'Parent (Meera)', id: '9876543210', pages: [['Home', '/parent/home'], ['Attendance', '/parent/attendance'], ['Homework', '/parent/homework'], ['Fee', '/parent/fee'], ['School bus', '/parent/bus'], ['Calendar', '/parent/calendar'], ['Chat', '/parent/chat']] },
];

async function banner(page, text) {
  await page.evaluate((t) => { let b = document.getElementById('__tour'); if (!b) { b = document.createElement('div'); b.id = '__tour'; b.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483647;background:#0f172a;color:#fff;font:600 15px system-ui;padding:10px 18px;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none'; document.body.appendChild(b); } b.textContent = t; }, text).catch(() => {});
}
const note = async (page, t) => { console.log(t); await banner(page, t); };

// ---- public website
{
  const ctx = await browser.newContext({ viewport: null }); const page = await ctx.newPage();
  await page.goto(`${WEB}/`); await sleep(1500); await note(page, 'EduAmigo website');
  for (let y = 0; y <= 6; y += 1) { await page.evaluate((i) => window.scrollTo({ top: i * innerHeight * 0.9, behavior: 'smooth' }), y); await sleep(1500); }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await sleep(1000);
  await ctx.close();
}
for (const t of tour) {
  const ctx = await browser.newContext({ viewport: null }); const page = await ctx.newPage();
  await ctx.addInitScript(() => localStorage.setItem('eduamigo_school', JSON.stringify({ code: 'GVPS', name: 'GVPS' })));
  await page.goto(`${WEB}/login`); await sleep(1500);
  await note(page, `${t.role}: signing in`);
  await page.getByLabel('Email, mobile number or admission number').fill(t.id); await sleep(500);
  await page.getByLabel('Password', { exact: true }).fill('Demo@1234'); await sleep(500);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((u) => !/\/(login|select-school)/.test(u.pathname), { timeout: 20000 });
  for (const [name, path] of t.pages) {
    await page.goto(`${WEB}${path}`); await sleep(1200);
    await note(page, `${t.role}: ${name}`);
    await sleep(PAUSE);
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 0.7, behavior: 'smooth' })).catch(() => {}); await sleep(1200);
  }
  await ctx.close();
}
console.log('Tour finished.');
await sleep(2000); await browser.close();
