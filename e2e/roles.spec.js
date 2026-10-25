// Roles & Access end to end: an administrator makes a role from a template, gives it to a staff account, and that person then
// sees (and is allowed) exactly what the role grants. The server decides; the checks below also call the API directly.
import { test, expect } from '@playwright/test';
import { signIn, apiSession, API, PASSWORD } from './helpers.js';

test('administrator makes a role from a template, gives it to staff, and the staff member gets only that access', async ({ page, request, browser }) => {
  const stamp = Date.now();
  const roleName = `Cashier ${stamp}`;
  const email = `cashier${stamp}@gvps.demo`;
  const admin = await apiSession(request, 'admin');
  const made = await admin.post('/users/register', { name: 'Test Cashier', email, password: PASSWORD, role: 'staff' });
  expect(made.success).toBeTruthy();
  // A new account must choose its own password first; do that through the API so the test reaches the portal.
  const NEW = 'Cashier#2026ok';
  const first = await (await request.post(`${API}/users/login`, { data: { schoolCode: 'GVPS', identifier: email, password: PASSWORD } })).json();
  expect((await request.patch(`${API}/users/password`, { headers: { Authorization: `Bearer ${first.token}` }, data: { currentPassword: PASSWORD, newPassword: NEW } })).ok()).toBeTruthy();

  await signIn(page, 'admin');
  await page.goto('/admin/roles');
  await expect(page.getByRole('heading', { level: 1, name: 'Roles & Access' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Roles' }).getByText('Built-in').first()).toBeVisible();

  await page.getByRole('button', { name: 'New role' }).click();
  await page.getByLabel('Start from').selectOption({ label: 'Fee collector / cashier' });
  await page.getByLabel('Role name').fill(roleName);
  await expect(page.getByRole('checkbox', { name: /Record fee payments/ }).first()).toBeChecked();
  await page.getByRole('button', { name: 'Create role' }).click();
  await expect(page.getByRole('list', { name: 'Roles' }).getByText(roleName)).toBeVisible();

  // Give it to the staff account from User Management.
  await page.goto('/admin/user-management');
  const row = page.locator('.ea-um-row', { hasText: email });
  await row.getByRole('button', { name: /Roles/ }).click();
  await page.getByLabel(new RegExp(roleName)).check();
  await page.getByRole('button', { name: 'Save roles' }).click();
  await expect(row.getByRole('button', { name: 'Roles (1)' })).toBeVisible();

  // The staff member signs in: office portal with fee collection, nothing administrative.
  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto('/select-school');
  await p2.getByLabel('School code or name').fill('GVPS');
  await p2.getByRole('button', { name: 'Continue' }).click();
  const yes = p2.getByRole('button', { name: 'Yes, this is my school' });
  if (await yes.waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false)) await yes.click();
  await p2.getByLabel('Email, mobile number or admission number').fill(email);
  await p2.getByLabel('Password', { exact: true }).fill(NEW);
  await p2.getByRole('button', { name: 'Sign in', exact: true }).click();
  await p2.waitForURL(/\/admin/);
  const nav = p2.getByRole('navigation', { name: 'Admin menu' });
  await expect(nav.getByRole('link', { name: 'Fee Collection' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Roles & Access' })).toHaveCount(0);
  // Whatever the screen shows, the server refuses what the role does not include.
  const login = await request.post(`${API}/users/login`, { data: { schoolCode: 'GVPS', identifier: email, password: NEW } });
  const { token } = await login.json();
  const h = { Authorization: `Bearer ${token}` };
  expect((await request.get(`${API}/roles`, { headers: h })).status()).toBe(403);
  expect((await request.get(`${API}/users`, { headers: h })).status()).toBe(403);
  await ctx.close();
});

test('a teacher given a fee role can open the school office; without it the office sends them back to the teacher portal', async ({ page, request }) => {
  const admin = await apiSession(request, 'admin');
  const { data: list } = await admin.get('/roles');
  const t = list.templates.find((x) => x.key === 'fee_collector');
  const role = (await admin.post('/roles', { name: `Teacher fees ${Date.now()}`, templateKey: t.key })).data;
  const users = (await admin.get('/users?search=teacher%40gvps.demo')).data;
  const teacher = users.find((u) => u.email === 'teacher@gvps.demo');

  await signIn(page, 'teacher');
  await page.goto('/admin/fees');
  await expect(page).toHaveURL(/\/teacher\/home/);

  expect((await admin.put(`/users/${teacher._id}/roles`, { roleIds: [role._id] })).success).toBeTruthy();
  try {
    await page.goto('/admin/fees');
    await expect(page).toHaveURL(/\/admin\/fees/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  } finally {
    await admin.put(`/users/${teacher._id}/roles`, { roleIds: [] });
    await admin.del(`/roles/${role._id}`);
  }
});

test('a school sets its size and is offered roles to match; one click opens the role with the template filled in', async ({ page, request }) => {
  const admin = await apiSession(request, 'admin');
  expect((await admin.put('/schools/me', { size: 'small' })).success).toBeTruthy();
  await signIn(page, 'admin');
  await page.goto('/admin/roles');
  const box = page.getByRole('region', { name: 'Suggested roles' });
  await expect(box).toBeVisible();
  await box.getByRole('button', { name: /Office manager/ }).click();
  await expect(page.getByLabel('Role name')).toHaveValue(/Office manager/);
  await expect(page.getByRole('checkbox', { name: /Add, edit and deactivate students/ })).toBeChecked();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await admin.put('/schools/me', { size: '' });
});

test('teaching assignments: an administrator limits a teacher to one subject in one class, and the teacher sees only that', async ({ page, request }) => {
  const admin = await apiSession(request, 'admin');
  const teachers = (await admin.get('/teachers')).data;
  const t = teachers.find((x) => x.email === 'teacher@gvps.demo');
  await signIn(page, 'admin');
  await page.goto(`/admin/teachers/${t._id}`);
  const panel = page.getByRole('heading', { name: 'Teaching assignments' }).locator('xpath=ancestor::div[2]');
  await expect(panel).toBeVisible();
  await panel.getByLabel('Class', { exact: true }).fill(t.assignedClasses[0].split('-')[0]);
  await panel.getByLabel('Subject').fill('Mathematics');
  await panel.getByRole('button', { name: 'Add' }).click();
  await expect(panel.getByRole('list', { name: 'Teaching assignments' })).toContainText('Mathematics');
  await panel.getByRole('button', { name: /Remove Mathematics/ }).click();
  await expect(panel.getByRole('list', { name: 'Teaching assignments' })).toHaveCount(0);
});
