// Student, teacher and school-admin home dashboards (the parent's is in dashboard-parent.spec.js): real names and numbers from the
// server, honest missing/error states, working links, the office's notification inbox, role limits and layout.
import { test, expect } from '@playwright/test';
import { signIn, apiSession, API, USERS, PASSWORD } from './helpers.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const summary = (page) => page.getByRole('region', { name: /summary|your day/i });
const metric = (page, name) => summary(page).getByRole('link', { name: new RegExp(`^${name}`) });
const tokenOf = async (request, role) => {
  const res = await request.post(`${API}/users/login`, { data: { schoolCode: 'GVPS', identifier: USERS[role].id, password: PASSWORD } });
  return { Authorization: `Bearer ${(await res.json()).token}` };
};
const overflow = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const scroller = document.querySelector('.ea-scroll, .ea-admin-main');
  const wide = [...document.querySelectorAll('.dx *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1) && !e.closest('.dx-kids') && !e.matches('.sr-only'); }).slice(0, 3).map((e) => `${e.tagName}.${e.className}`);
  return { scroll: document.documentElement.scrollWidth - vw, inner: scroller ? scroller.scrollWidth - scroller.clientWidth : 0, wide };
});

test.describe('student home', () => {
  test('is the signed-in student\'s own: name, class, school and the server\'s numbers', async ({ page, request }) => {
    const api = await apiSession(request, 'student');
    const profile = (await api.get('/students/my-profile')).data;
    const me = (await api.get('/users/profile')).data;
    await signIn(page, 'student');
    await page.goto('/student/home');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Hello, ${me.name.trim().split(/\s+/)[0]}`);
    await expect(page.locator('.dx-school')).toContainText(me.branding.appName || me.school);
    await expect(page.locator('.dx-child-line')).toContainText(`Class ${profile.class}-${profile.section}`);
    const att = (await api.get('/attendance/my-summary')).data;
    await expect(metric(page, 'Attendance')).toContainText(att.total ? `${parseFloat(att.percentage)}%` : '—');
    const res = await api.get('/exams/my-results');
    if (res.data?.length) {
      await expect(metric(page, 'Average marks')).toContainText(`${Math.round(Number(res.averagePercentage))}%`);
      await expect(metric(page, 'Overall grade')).toContainText(res.overallGrade);
    }
    const day = DAYS[new Date().getDay()];
    if (day !== 'Sunday') {
      const periods = (await api.get(`/timetable/my?day=${day}`)).data;
      if (periods.length) await expect(page.getByRole('region', { name: /Today's classes/ }).getByRole('listitem')).toHaveCount(periods.length);
    }
  });

  test('Learning AI opens from its card; "Ask EduAmigo" opens the assistant; links go to the right screens', async ({ page }) => {
    await signIn(page, 'student');
    await page.goto('/student/home');
    await expect(page.locator('.dx-top').getByRole('button', { name: /Ask EduAmigo/ })).toHaveCount(0);
    await page.locator('.ea-ask-fab').click();
    await expect(page.getByRole('dialog', { name: 'EduAmigo Ask' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('link', { name: 'Start learning' }).click();
    await expect(page).toHaveURL(/\/student\/learn/);
    for (const [label, url] of [['Timetable', /timetable/], ['Notes', /notes/], ['Results', /result/], ['Fee Status', /fee/], ['Apply for leave', /apply-leave/], ['Chat', /chat/]]) {
      await page.goto('/student/home');
      await page.getByRole('navigation', { name: 'Quick actions' }).getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test('failed and empty sections say so; no bus means no bus card', async ({ page }) => {
    await signIn(page, 'student');
    await page.route((u) => u.pathname === '/api/exams/my-results', (r) => r.fulfill({ status: 500, json: { success: false } }));
    await page.route((u) => u.pathname.startsWith('/api/timetable/my'), (r) => r.fulfill({ json: { success: true, data: [] } }));
    await page.route((u) => u.pathname === '/api/attendance/my-summary', (r) => r.fulfill({ json: { success: true, data: { total: 0, present: 0, absent: 0, late: 0, leave: 0, percentage: '0%' } } }));
    await page.route((u) => u.pathname === '/api/students/my-profile', (r) => r.fulfill({ json: { success: true, data: { _id: 's1', name: 'Test', class: '9', section: 'A', bus: null, feeStatus: 'Paid' } } }));
    await page.goto('/student/home');
    await expect(page.getByRole('alert').filter({ hasText: 'Could not load results' })).toBeVisible();
    await expect(metric(page, 'Attendance')).toContainText('No attendance marked yet');
    await expect(metric(page, 'Attendance')).not.toContainText('%');
    if (DAYS[new Date().getDay()] !== 'Sunday') await expect(page.getByText('No timetable for today')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'School bus' })).toHaveCount(0);
    await expect(metric(page, 'Fees')).toContainText('Paid');
  });

  test('a student cannot reach staff or other students\' data, whatever the screen does', async ({ request }) => {
    const headers = await tokenOf(request, 'student');
    const admin = await apiSession(request, 'admin');
    const me = (await (await request.get(`${API}/students/my-profile`, { headers })).json()).data;
    const other = (await admin.get('/students')).data.find((s) => String(s._id) !== String(me._id));
    for (const path of ['/users', '/teachers', '/audit', '/leaves/pending', `/attendance/student/${other._id}/summary`, `/exams/student/${other._id}/results`]) {
      const res = await request.get(`${API}${path}`, { headers });
      expect([400, 401, 403, 404], `${path} -> ${res.status()}`).toContain(res.status());
    }
    // The office dashboard endpoint answers each role only with what that role may see: a student gets nothing of the school.
    const dash = (await (await request.get(`${API}/schools/me/dashboard`, { headers })).json()).data;
    expect(Object.keys(dash.counts || {})).toEqual([]);
    for (const key of ['attendance', 'fees', 'classes', 'recentStudents', 'activity']) expect(dash[key], key).toBeUndefined();
  });

  test('no sideways scroll or cut-off content from 320 to 1920 px', async ({ page }) => {
    await signIn(page, 'student');
    for (const [width, height] of [[320, 568], [375, 812], [768, 1024], [1024, 768], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/student/home');
      await expect(page.locator('.dx-metric').first()).toBeVisible();
      expect(await overflow(page), `${width}px`).toEqual({ scroll: 0, inner: 0, wide: [] });
    }
  });
});

test.describe('teacher home', () => {
  test('is the teacher\'s own: name, subjects, classes, today\'s periods, leave requests and class attendance from the server', async ({ page, request }) => {
    const api = await apiSession(request, 'teacher');
    const t = (await api.get('/teachers/me')).data;
    const me = (await api.get('/users/profile')).data;
    await signIn(page, 'teacher');
    await page.goto('/teacher/home');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Welcome, ${me.name.trim().split(/\s+/)[0]}`);
    await expect(page.locator('.dx-welcome')).toContainText(t.subjects.join(', '));
    for (const c of t.assignedClasses) await expect(page.locator('.dx-welcome')).toContainText(c);
    const leaves = (await api.get('/leaves/pending')).data;
    await expect(metric(page, 'Leave requests')).toContainText(String(leaves.length));
    const day = DAYS[new Date().getDay()];
    if (day !== 'Sunday') {
      const rows = (await api.get(`/timetable/teacher/${t._id}`)).data.find((d) => d.day === day)?.periods || [];
      await expect(metric(page, 'Periods today')).toContainText(String(rows.length));
    }
    for (const c of t.assignedClasses) await expect(page.getByRole('region', { name: 'Attendance today' }).getByText(`Class ${c}`)).toBeVisible();
    const unread = (await api.get('/chat/unread-count')).count;
    await expect(metric(page, 'Unread messages')).toContainText(String(unread));
  });

  test('a class without attendance today says so and links to marking it', async ({ page }) => {
    await signIn(page, 'teacher');
    await page.route((u) => u.pathname.startsWith('/api/attendance/class/'), (r) => r.fulfill({ json: { success: true, count: 0, data: [] } }));
    await page.goto('/teacher/home');
    const panel = page.getByRole('region', { name: 'Attendance today' });
    await expect(panel.getByText('Not marked yet today')).toBeVisible();
    await expect(metric(page, 'Attendance to mark')).toContainText('of');
    await panel.getByRole('link', { name: 'Mark now' }).first().click();
    await expect(page).toHaveURL(/\/teacher\/attendance/);
  });

  test('failed sections say so and can be retried', async ({ page }) => {
    await signIn(page, 'teacher');
    let fail = true;
    await page.route((u) => u.pathname === '/api/leaves/pending', (r) => (fail ? r.fulfill({ status: 500, json: { success: false } }) : r.continue()));
    await page.goto('/teacher/home');
    const alert = page.getByRole('alert').filter({ hasText: 'Could not load leave requests' });
    await expect(alert).toBeVisible();
    fail = false;
    await alert.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('region', { name: 'Leave requests to review' })).toBeVisible();
    await expect(alert).toHaveCount(0);
  });

  test('a teacher sees only their own classes: another class\'s attendance, and school-wide data, are refused by the server', async ({ request }) => {
    const headers = await tokenOf(request, 'teacher');
    const admin = await apiSession(request, 'admin');
    const mine = (await (await request.get(`${API}/teachers/me`, { headers })).json()).data.assignedClasses.map((c) => c.split('-')[0]);
    const cls = (await admin.get('/students')).data.map((s) => String(s.class)).find((c) => !mine.includes(c)) || '12';
    expect((await request.get(`${API}/attendance/class/${cls}`, { headers })).status()).toBe(403);
    for (const path of ['/audit', '/users', '/hr/salaries']) {
      const res = await request.get(`${API}${path}`, { headers });
      expect([401, 403], `${path} -> ${res.status()}`).toContain(res.status());
    }
    // ...and the office dashboard endpoint gives a teacher no fees, no activity log, no school-wide attendance or student lists.
    const dash = (await (await request.get(`${API}/schools/me/dashboard`, { headers })).json()).data;
    for (const key of ['fees', 'activity', 'attendance', 'classes', 'recentStudents']) expect(dash[key], key).toBeUndefined();
  });

  test('quick actions and links lead to the right screens', async ({ page }) => {
    await signIn(page, 'teacher');
    for (const [label, url] of [['Take attendance', /attendance/], ['Upload notes', /upload/], ['Enter marks', /marks/], ['Parent messages', /chat/], ['My timetable', /timetable/], ['Leave requests', /leave/], ['My students', /students/]]) {
      await page.goto('/teacher/home');
      await page.getByRole('navigation', { name: 'Quick actions' }).getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test('no sideways scroll or cut-off content from 320 to 1920 px', async ({ page }) => {
    await signIn(page, 'teacher');
    for (const [width, height] of [[320, 568], [375, 812], [768, 1024], [1024, 768], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/teacher/home');
      await expect(page.locator('.dx-metric').first()).toBeVisible();
      expect(await overflow(page), `${width}px`).toEqual({ scroll: 0, inner: 0, wide: [] });
    }
  });
});

test.describe('school admin home', () => {
  test('shows the school\'s own numbers, counted by the server', async ({ page, request }) => {
    const api = await apiSession(request, 'admin');
    const d = (await api.get('/schools/me/dashboard')).data;
    const me = (await api.get('/users/profile')).data;
    await signIn(page, 'admin');
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
    await expect(page.locator('.dx-school')).toContainText(me.branding.appName || me.school);
    await expect(metric(page, 'Students')).toContainText(String(d.counts.students));
    await expect(metric(page, 'Teachers')).toContainText(String(d.counts.teachers));
    if (d.fees?.billed) await expect(metric(page, 'Fees collected')).toContainText(rupees(d.fees.collected));
    await expect(metric(page, 'Leave requests')).toContainText(String(d.pendingLeaves));
    if (d.attendance?.total) await expect(metric(page, 'Attendance today')).toContainText('%');
    await expect(page.getByRole('region', { name: 'Students by class' })).toBeVisible();
  });

  test('a failed dashboard says so and can be retried', async ({ page }) => {
    await signIn(page, 'admin');
    let fail = true;
    await page.route((u) => u.pathname === '/api/schools/me/dashboard', (r) => (fail ? r.fulfill({ status: 500, json: { success: false } }) : r.continue()));
    await page.goto('/admin');
    const alert = page.getByRole('alert').filter({ hasText: 'The dashboard could not be loaded' });
    await expect(alert).toBeVisible();
    fail = false;
    await alert.getByRole('button', { name: 'Try again' }).click();
    await expect(metric(page, 'Students')).toBeVisible();
  });

  test('a safety alert raised by a parent reaches the office inbox, with the unread count on the bell, and can be marked read', async ({ page, request }) => {
    const parent = await tokenOf(request, 'parent');
    const kids = (await (await request.get(`${API}/parents/my-child`, { headers: parent })).json()).data.children;
    const sos = await request.post(`${API}/transport/sos`, { headers: parent, data: { studentId: kids[0]._id, note: 'Bus has not arrived' } });
    expect([201, 429]).toContain(sos.status()); // 429: one was raised a moment ago by another run
    await signIn(page, 'admin');
    await page.goto('/admin');
    await expect(page.getByRole('region', { name: 'Alerts for you' })).toContainText('SOS alert');
    await expect(page.getByRole('link', { name: /Notifications, \d+ unread/ })).toBeVisible();
    await page.getByRole('link', { name: /Notifications/ }).click();
    await expect(page).toHaveURL(/\/admin\/inbox/);
    await expect(page.getByRole('heading', { name: /Notifications/ })).toBeVisible();
    await expect(page.getByText(/raised an SOS/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(page.getByRole('button', { name: 'Mark all as read' })).toHaveCount(0);
    await page.goto('/admin');
    await expect(page.getByRole('link', { name: 'Notifications' })).toBeVisible();
    await expect(page.locator('.dx-count')).toHaveCount(0);
  });

  test('"Go to" links open the modules this role may use', async ({ page }) => {
    await signIn(page, 'admin');
    await page.goto('/admin');
    for (const [label, url] of [['Students', /\/admin\/students$/], ['Fee collection', /\/admin\/fees/], ['Timetable', /\/admin\/timetable/]]) {
      await page.goto('/admin');
      await page.getByRole('navigation', { name: 'Go to' }).getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test('the account menu has Log out (no profile page for staff) and ends the session', async ({ page }) => {
    await signIn(page, 'admin');
    await page.goto('/admin');
    await page.locator('.dx-profile__btn').click();
    await expect(page.getByRole('menuitem', { name: 'My profile' })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('no sideways scroll or cut-off content from 320 to 1920 px', async ({ page }) => {
    await signIn(page, 'admin');
    for (const [width, height] of [[320, 568], [375, 812], [768, 1024], [1024, 768], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/admin');
      await expect(page.locator('.dx-metric').first()).toBeVisible();
      expect(await overflow(page), `${width}px`).toEqual({ scroll: 0, inner: 0, wide: [] });
    }
  });
});
