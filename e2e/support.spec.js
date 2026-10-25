// School office <-> EduAmigo: announcements from the owner console and support requests, through the real backend (demo data).
import { test, expect } from '@playwright/test';
import { signIn, apiSession, API } from './helpers.js';

async function owner(request) {
  const res = await request.post(`${API}/platform/login`, { data: { email: 'owner@eduamigo.demo', password: 'Demo@1234' } });
  const { token } = await res.json();
  const h = { Authorization: `Bearer ${token}` };
  return {
    post: async (p, data) => (await request.post(`${API}/platform${p}`, { headers: h, data })).json(),
    patch: async (p, data) => (await request.patch(`${API}/platform${p}`, { headers: h, data })).json(),
  };
}

test('an announcement from EduAmigo appears on the office dashboard, can be closed, and stops when archived; teachers never see it', async ({ page, request, browser }) => {
  const o = await owner(request);
  const title = `Maintenance ${Date.now()}`;
  const made = await o.post('/notices', { title, message: 'The service restarts at 2 am on Sunday.', level: 'warning' });
  expect(made.success).toBeTruthy();
  try {
    await signIn(page, 'admin');
    await page.goto('/admin');
    const banner = page.getByLabel('Announcements from EduAmigo');
    await expect(banner).toContainText(title);
    await banner.getByRole('button', { name: new RegExp(`Close announcement: ${title}`) }).click();
    await expect(page.getByText(title)).toHaveCount(0);

    const ctx = await browser.newContext(); const t = await ctx.newPage();
    await signIn(t, 'teacher');
    await expect(t.getByText(title)).toHaveCount(0);
    await ctx.close();
  } finally { await o.post(`/notices/${made.data._id}/archive`, {}); }
});

test('a school asks for help, EduAmigo replies, and the school sees the public reply but never the internal note', async ({ page, request }) => {
  const o = await owner(request);
  const subject = `Receipts blank ${Date.now()}`;
  await signIn(page, 'admin');
  await page.goto('/admin/support');
  await expect(page.getByRole('heading', { level: 1, name: 'Help and support' })).toBeVisible();
  await page.getByLabel('Subject').fill(subject);
  await page.getByLabel('What do you need?').fill('The receipt page is blank for Class 5 students when we print.');
  await page.getByRole('button', { name: 'Send request' }).click();
  const item = page.getByRole('list', { name: 'Your requests' }).getByRole('listitem').filter({ hasText: subject });
  await expect(item).toBeVisible();

  const admin = await apiSession(request, 'admin');
  const mine = (await admin.get('/support/requests')).data.find((r) => r.subject === subject);
  await o.patch(`/support/${mine._id}`, { note: 'Internal: likely the print template.', internal: true });
  await o.patch(`/support/${mine._id}`, { note: 'We are looking into it and will update you today.', status: 'in_progress' });

  await page.reload();
  const row = page.getByRole('list', { name: 'Your requests' }).getByRole('listitem').filter({ hasText: subject });
  await expect(row).toContainText('Being looked at');
  await row.getByRole('button').first().click();
  await expect(row).toContainText('We are looking into it and will update you today.');
  await expect(row).toContainText('EduAmigo support');
  await expect(page.getByText('print template')).toHaveCount(0);
  await row.getByLabel('Your reply').fill('Thank you, we will wait.');
  await row.getByRole('button', { name: 'Send' }).click();
  await expect(row).toContainText('Thank you, we will wait.');
});

test('a teacher cannot open the support page or call its API', async ({ page, request }) => {
  await signIn(page, 'teacher');
  await page.goto('/admin/support');
  await expect(page).toHaveURL(/\/teacher\/home/);
  const t = await apiSession(request, 'teacher');
  expect((await t.get('/support/requests')).success).not.toBe(true);
});
