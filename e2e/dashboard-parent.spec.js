// The parent's home dashboard: real names and numbers from the server for the selected child, child switching, honest
// missing / loading / error states, real unread count, working links and account menu, no overflow, keyboard use.
import { test, expect } from '@playwright/test';
import { signIn, apiSession, API, USERS, PASSWORD } from './helpers.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// A summary number (the sidebar has links with the same names, so these are looked up inside the summary).
const metric = (page, name) => page.getByRole('region', { name: /^Summary for/ }).getByRole('link', { name: new RegExp(`^${name}`) });
const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

async function parentData(request) {
  const api = await apiSession(request, 'parent');
  const kids = (await api.get('/parents/my-child')).data.children;
  return { api, kids };
}

test.describe('parent home', () => {
  test('shows the signed-in parent\'s own name, the school and the children linked to this account', async ({ page, request }) => {
    const { api, kids } = await parentData(request);
    const profile = (await api.get('/users/profile')).data;
    await signIn(page, 'parent');
    await page.goto('/parent/home');
    const first = profile.name.trim().split(/\s+/)[0];
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Welcome back, ${first}`);
    await expect(page.locator('.dx-school')).toContainText(profile.branding.appName || profile.school);
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(kids.length);
    for (const k of kids) await expect(page.getByRole('tab', { name: new RegExp(k.name) })).toBeVisible();
    await expect(page.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
  });

  test('the numbers are the server\'s numbers for that child (attendance, marks, grade, fees, bus, timetable)', async ({ page, request }) => {
    const { api, kids } = await parentData(request);
    const kid = kids[0];
    await signIn(page, 'parent');
    await page.evaluate((id) => localStorage.setItem('eduamigo_selected_child', id), String(kid._id));
    await page.goto('/parent/home');
    const att = (await api.get(`/attendance/student/${kid._id}/summary`)).summary;
    await expect(metric(page, 'Attendance')).toContainText(`${parseFloat(att.percentage)}%`);
    await expect(metric(page, 'Attendance')).toContainText(`${att.present + (att.late || 0)} of ${att.total} school days`);

    const fees = await api.get(`/fees/my?studentId=${kid._id}`);
    const due = fees.summary.totalDue;
    await expect(metric(page, 'Fees')).toContainText(due > 0 ? `${rupees(due)} due` : 'All paid');
    await expect(metric(page, 'Fees')).toContainText(`of ${rupees(fees.summary.total)} this year`);

    const results = (await api.get(`/exams/student/${kid._id}/results`)).data;
    const latest = results[0]?.examName;
    const rows = results.filter((r) => r.examName === latest && r.totalMarks > 0);
    const overall = Math.round((rows.reduce((s, r) => s + r.marksObtained, 0) / rows.reduce((s, r) => s + r.totalMarks, 0)) * 100);
    await expect(metric(page, 'Academic performance')).toContainText(`${overall}%`);
    await expect(page.getByRole('list', { name: new RegExp(`Marks by subject in ${latest}`) }).getByRole('listitem')).toHaveCount(rows.length);

    const bus = await api.get(`/transport/my-child-bus?studentId=${kid._id}`);
    if (bus.data) await expect(metric(page, 'School bus')).toContainText(bus.data.busNumber);

    const day = DAYS[new Date().getDay()];
    if (day !== 'Sunday') {
      const tt = await api.get(`/timetable/class/${kid.class}/${day}?section=${kid.section}`);
      const periods = tt.data?.periods || [];
      if (periods.length) await expect(page.getByRole('region', { name: /Today's schedule/ }).getByRole('listitem')).toHaveCount(periods.length);
    }
  });

  test('switching child changes every child-specific section, and asks the server for that child', async ({ page, request }) => {
    const { api, kids } = await parentData(request);
    test.skip(kids.length < 2, 'needs a parent with two children');
    await signIn(page, 'parent');
    await page.goto('/parent/home');
    const asked = [];
    page.on('request', (r) => { const m = /\/(?:student|my)\/?([a-f0-9]{24})?/.exec(r.url()); if (/\/api\/(attendance|exams)\/student\//.test(r.url())) asked.push(r.url()); void m; });
    const [a, b] = kids;
    await page.getByRole('tab', { name: new RegExp(b.name) }).click();
    await expect(page.getByRole('tab', { name: new RegExp(b.name) })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(`Here is how ${b.name.split(' ')[0]} is doing.`)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('eduamigo_selected_child'))).toBe(String(b._id));
    await expect.poll(() => asked.some((u) => u.includes(b._id))).toBe(true);
    const att = (await api.get(`/attendance/student/${b._id}/summary`)).summary;
    await expect(metric(page, 'Attendance')).toContainText(att.total ? `${parseFloat(att.percentage)}%` : '—');
    // The choice survives a reload, and the keyboard works on the child tabs.
    await page.reload();
    await expect(page.getByRole('tab', { name: new RegExp(b.name) })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: new RegExp(b.name) }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: new RegExp(a.name) })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: new RegExp(a.name) })).toBeFocused();
  });

  test('a parent cannot read a child of another family, whatever the screen does (direct API calls)', async ({ request }) => {
    const { api, kids } = await parentData(request);
    const admin = await apiSession(request, 'admin');
    const all = (await admin.get('/students')).data;
    const stranger = all.find((s) => !kids.some((k) => String(k._id) === String(s._id)));
    expect(stranger).toBeTruthy();
    const login = await request.post(`${API}/users/login`, { data: { identifier: USERS.parent.id, password: PASSWORD } });
    const headers = { Authorization: `Bearer ${(await login.json()).token}` };
    for (const path of [`/attendance/student/${stranger._id}/summary`, `/exams/student/${stranger._id}/results`, `/fees/my?studentId=${stranger._id}`, `/transport/my-child-bus?studentId=${stranger._id}`]) {
      const res = await request.get(`${API}${path}`, { headers });
      expect([400, 403, 404], `${path} -> ${res.status()}`).toContain(res.status());
    }
    expect(api).toBeTruthy();
  });

  test('the bell shows the server\'s unread count, and no number when there is none', async ({ page }) => {
    await signIn(page, 'parent');
    await page.route((u) => u.pathname === '/api/notifications/my', (r) => r.fulfill({ json: { success: true, unread: 3, data: [
      { _id: 'n1', title: 'Fee reminder', message: 'Due on 30 Oct', createdAt: new Date().toISOString(), read: false },
      { _id: 'n2', title: 'Holiday', message: 'School closed', createdAt: new Date().toISOString(), read: false },
      { _id: 'n3', title: 'PTM', createdAt: new Date().toISOString(), read: false },
      { _id: 'n4', title: 'Old news', createdAt: new Date().toISOString(), read: true }] } }));
    await page.goto('/parent/home');
    await expect(page.getByRole('link', { name: 'Notifications, 3 unread' })).toBeVisible();
    await expect(page.locator('.dx-count')).toHaveText('3');
    await expect(page.getByText('Fee reminder (new)')).toBeAttached();
    await page.unroute((u) => u.pathname === '/api/notifications/my');
    await page.route((u) => u.pathname === '/api/notifications/my', (r) => r.fulfill({ json: { success: true, unread: 0, data: [] } }));
    await page.reload();
    await expect(page.getByRole('link', { name: 'Notifications' })).toBeVisible();
    await expect(page.locator('.dx-count')).toHaveCount(0);
    await expect(page.getByText('No notices at the moment')).toBeVisible();
  });

  test('a section that fails says so and can be retried; the others still show', async ({ page }) => {
    await signIn(page, 'parent');
    let fail = true;
    await page.route((u) => u.pathname.startsWith('/api/timetable/class/'), (r) => (fail ? r.fulfill({ status: 500, json: { success: false, message: 'boom' } }) : r.continue()));
    await page.route((u) => /\/api\/exams\/student\/.+\/results/.test(u.pathname), (r) => r.fulfill({ status: 500, json: { success: false, message: 'boom' } }));
    await page.goto('/parent/home');
    const day = DAYS[new Date().getDay()];
    test.skip(day === 'Sunday', 'no timetable section on Sunday');
    await expect(page.getByRole('alert').filter({ hasText: 'Could not load the timetable' })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Could not load results' })).toBeVisible();
    await expect(metric(page, 'Attendance')).toContainText('%'); // untouched
    fail = false;
    await page.getByRole('alert').filter({ hasText: 'Could not load the timetable' }).getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('region', { name: /Today's schedule/ }).getByRole('listitem').first()).toBeVisible();
  });

  test('no timetable, no bus, no results: plain messages, no made-up numbers, no bus card', async ({ page }) => {
    await signIn(page, 'parent');
    await page.route((u) => u.pathname.startsWith('/api/timetable/class/'), (r) => r.fulfill({ status: 404, json: { success: false, message: 'Timetable not found' } }));
    await page.route((u) => u.pathname.startsWith('/api/transport/my-child-bus'), (r) => r.fulfill({ status: 404, json: { success: false, message: 'No bus assigned' } }));
    await page.route((u) => /\/api\/exams\/student\/.+\/results/.test(u.pathname), (r) => r.fulfill({ json: { success: true, data: [] } }));
    await page.route((u) => /\/api\/attendance\/student\/.+\/summary/.test(u.pathname), (r) => r.fulfill({ json: { success: true, summary: { total: 0, present: 0, absent: 0, late: 0, leave: 0, percentage: '0%' }, data: [] } }));
    await page.goto('/parent/home');
    await expect(page.getByText('No results yet')).toBeVisible();
    await expect(metric(page, 'Attendance')).toContainText('No attendance marked yet');
    await expect(metric(page, 'Attendance')).not.toContainText('%');
    await expect(metric(page, 'School bus')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'School bus' })).toHaveCount(0);
    if (DAYS[new Date().getDay()] !== 'Sunday') await expect(page.getByText('No timetable for today')).toBeVisible();
  });

  test('an account with no linked child says so and offers nothing child-specific', async ({ page }) => {
    await signIn(page, 'parent');
    await page.route((u) => u.pathname === '/api/parents/my-child', (r) => r.fulfill({ status: 404, json: { success: false, message: 'No child is linked to this parent' } }));
    await page.goto('/parent/home');
    await expect(page.getByText('No child is linked to this account yet')).toBeVisible();
    await expect(page.locator('.dx-metrics')).toHaveCount(0);
  });

  test('the links lead to the right screens', async ({ page }) => {
    await signIn(page, 'parent');
    const cases = [['Attendance', /\/parent\/attendance/], ['Fees', /\/parent\/fee/], ['Academic performance', /\/parent\/result/]];
    for (const [name, url] of cases) {
      await page.goto('/parent/home');
      await metric(page, name).click();
      await expect(page).toHaveURL(url);
    }
    for (const [label, url] of [['Chat with teachers', /\/parent\/chat/], ['Apply for leave', /\/parent\/apply-leave/], ['School calendar', /\/parent\/calendar/], ['Results', /\/parent\/result/]]) {
      await page.goto('/parent/home');
      await page.getByRole('navigation', { name: 'Quick actions' }).getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(url);
    }
    await page.goto('/parent/home');
    await page.getByRole('link', { name: 'Notifications' }).first().click();
    await expect(page).toHaveURL(/\/parent\/notifications/);
  });

  test('the account menu: opens, Escape closes and returns focus, My profile works, Log out ends the session', async ({ page }) => {
    await signIn(page, 'parent');
    await page.goto('/parent/home');
    const btn = page.getByRole('button', { name: /Meera|Account|M$/ }).first();
    const trigger = page.locator('.dx-profile__btn');
    await trigger.click();
    await expect(page.getByRole('menu', { name: 'Account' })).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole('menuitem', { name: 'My profile' }).click();
    await expect(page).toHaveURL(/\/parent\/profile/);
    await page.goto('/parent/home');
    await page.locator('.dx-profile__btn').click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/parent/home');
    await expect(page).toHaveURL(/\/login/);
    expect(btn).toBeTruthy();
  });

  test('"Ask EduAmigo" opens the real assistant; a suggested question is sent as the parent\'s own message', async ({ page }) => {
    await signIn(page, 'parent');
    await page.goto('/parent/home');
    // The top bar has no Ask button (the floating button is the one entry); the assistant opens from it.
    await expect(page.locator('.dx-top').getByRole('button', { name: /Ask EduAmigo/ })).toHaveCount(0);
    await page.locator('.ea-ask-fab').click();
    await expect(page.getByRole('dialog', { name: 'EduAmigo Ask' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog', { name: 'EduAmigo Ask' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Are any fees pending?' }).click();
    await expect(page.getByRole('dialog', { name: 'EduAmigo Ask' })).toContainText('Are any fees pending?');
  });

  test('on a phone: tab bar present, two numbers across, nothing wider than the screen, tools keep their names and 44 px targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signIn(page, 'parent');
    await page.goto('/parent/home');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(page.locator('.dx-metric').first()).toBeVisible(); // the numbers have loaded
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const tops = [...document.querySelectorAll('.dx-metric')].map((e) => Math.round(e.getBoundingClientRect().top));
      const wide = [...document.querySelectorAll('.dx *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1) && !e.closest('.dx-kids, .sr-only') && !e.matches('.sr-only'); }).slice(0, 3).map((e) => `${e.tagName}.${e.className}`);
      const small = [...document.querySelectorAll('.dx-top button, .dx-top a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 43 || r.height < 43); }).map((e) => e.outerHTML.slice(0, 60));
      return { scroll: document.documentElement.scrollWidth - vw, firstRowCount: tops.filter((t) => t === tops[0]).length, wide, small };
    });
    expect(m).toEqual({ scroll: 0, firstRowCount: 2, wide: [], small: [] });
    await expect(page.locator('.dx-top').getByRole('button', { name: /Ask EduAmigo/ })).toHaveCount(0);
    await expect(page.locator('.ea-ask-fab')).toBeVisible(); // the floating assistant button is still there
    await expect(page.locator('.dx-profile__btn')).toHaveAccessibleName(/\w/);
  });

  test('no sideways scroll or cut-off content from 320 to 1920 px', async ({ page }) => {
    await signIn(page, 'parent');
    for (const [width, height] of [[320, 568], [375, 812], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/parent/home');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.dx-metric').first()).toBeVisible();
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const scroller = document.querySelector('.ea-scroll');
        const wide = [...document.querySelectorAll('.dx *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1) && !e.closest('.dx-kids') && !e.matches('.sr-only'); }).slice(0, 3).map((e) => `${e.tagName}.${e.className}`);
        return { scroll: document.documentElement.scrollWidth - vw, inner: scroller ? scroller.scrollWidth - scroller.clientWidth : 0, wide };
      });
      expect(m, `${width}px`).toEqual({ scroll: 0, inner: 0, wide: [] });
    }
  });

  test('reduced motion: the dashboard does not animate', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await signIn(page, 'parent');
    await page.goto('/parent/home');
    const d = await page.locator('.dx-metric').first().evaluate((e) => parseFloat(getComputedStyle(e).transitionDuration));
    expect(d).toBeLessThan(0.01);
    await ctx.close();
  });
});
