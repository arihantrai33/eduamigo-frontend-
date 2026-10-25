import { expect } from '@playwright/test';

export const PASSWORD = 'Demo@1234';
export const USERS = {
  admin: { tab: 'Admin', id: 'admin@gvps.demo' },
  teacher: { tab: 'Teacher', id: 'teacher@gvps.demo' },
  student: { tab: 'Student', id: '1' },
  parent: { tab: 'Parent', id: '9876543210' },
};

// Signs in the way a person does: find the school, choose the role tab, type the ID and password.
export async function signIn(page, role, { school = 'GVPS', password = PASSWORD, expectSuccess = password === PASSWORD } = {}) {
  const u = USERS[role];
  await page.goto('/select-school');
  await page.getByLabel('School code or name').fill(school);
  await page.getByRole('button', { name: 'Continue' }).click();
  const confirm = page.getByRole('button', { name: 'Yes, this is my school' });
  // A typed code shows a confirmation card first (the name and city of the school).
  if (await confirm.waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false)) await confirm.click();
  await expect(page).toHaveURL(/\/login/);
  // One sign-in for every role: the role comes back from the server with the session.
  await page.getByLabel('Email, mobile number or admission number').fill(u.id);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  if (expectSuccess) await page.waitForURL((url) => !/\/(login|select-school)/.test(url.pathname));
}

// The test backend (see playwright.config.js), not the demo on 8000.
export const API = `http://localhost:${process.env.E2E_API_PORT || 8100}/api`;

// A signed-in API session, for checking what the database holds after a step done in the UI.
export async function apiSession(request, role, school = 'GVPS') {
  const res = await request.post(`${API}/users/login`, { data: { schoolCode: school, identifier: USERS[role].id, password: PASSWORD } });
  const { token } = await res.json();
  const headers = { Authorization: `Bearer ${token}` };
  return {
    get: async (path) => (await request.get(`${API}${path}`, { headers })).json(),
    // For setting up a test's own records (on the test backend only).
    post: async (path, data) => (await request.post(`${API}${path}`, { headers, data })).json(),
    put: async (path, data) => (await request.put(`${API}${path}`, { headers, data })).json(),
    del: async (path, data) => (await request.delete(`${API}${path}`, { headers, data })).json(),
  };
}
