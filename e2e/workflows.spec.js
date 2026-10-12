import { test, expect } from '@playwright/test';
import { signIn, apiSession } from './helpers';

// Whole workflows across roles: UI action -> API -> database -> what the other person sees.

test('a teacher marks a student absent and the parent is told once', async ({ page, request }) => {
  const parentApi = await apiSession(request, 'parent');
  const absentNotes = async () => ((await parentApi.get('/notifications/my')).data || [])
    .filter((n) => n.type === 'Attendance' && /Kabir Sharma was marked Absent/.test(n.message)).length;

  await signIn(page, 'teacher');
  await page.goto('/teacher/attendance');
  await page.getByRole('button', { name: 'Class 9-A' }).click();
  const present = page.getByRole('button', { name: 'Present: Kabir Sharma' });
  await expect(present).toBeVisible();
  // Start from Present so that marking Absent is a real change today.
  await present.click();
  await page.getByRole('button', { name: /(Save|Update) Attendance/ }).click();
  await expect(page.getByText(/Attendance saved for/)).toBeVisible();
  const before = await absentNotes();

  await page.getByRole('button', { name: 'Absent: Kabir Sharma' }).click();
  await expect(page.getByRole('button', { name: 'Absent: Kabir Sharma' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /(Save|Update) Attendance/ }).click();
  await expect(page.getByText(/Attendance saved for/)).toBeVisible();
  await expect.poll(absentNotes).toBe(before + 1);

  // Saving the same again does not message the parent a second time.
  await page.getByRole('button', { name: 'Update Attendance' }).click();
  await expect(page.getByText(/Attendance saved for/)).toBeVisible();
  await page.waitForTimeout(500);
  expect(await absentNotes()).toBe(before + 1);

  // The parent sees it in the app.
  await page.goto('/login');
  await page.evaluate(() => { localStorage.removeItem('eduamigo_user'); localStorage.removeItem('token'); });
  await signIn(page, 'parent');
  await page.goto('/parent/notifications');
  await expect(page.getByText(/Kabir Sharma was marked Absent/).first()).toBeVisible();
});

test('the office records a fee payment and gets the next receipt number of the school', async ({ page, request }) => {
  const adminApi = await apiSession(request, 'admin');
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'admin');
  await page.goto('/admin/fees');
  const collect = page.getByRole('button', { name: 'Collect' }).first();
  await expect(collect).toBeVisible();
  await collect.click();
  await expect(page.getByText('Collect Fee Payment')).toBeVisible();
  await page.getByLabel('AMOUNT (₹)').fill('1');
  await page.getByRole('button', { name: 'Record payment' }).click();

  // The confirmation names the new receipt; its number follows the school's sequence for this year.
  const year = new Date().getFullYear();
  const dialog = page.getByText(new RegExp(`Payment recorded\\. Receipt RCPT-${year}-\\d{6}`));
  await expect(dialog).toBeVisible();
  const receipt = (await dialog.textContent()).match(/RCPT-\d{4}-\d{6}/)[0];
  await page.getByRole('button', { name: 'Cancel' }).click();

  // The database holds that payment exactly once, and the fee's totals add up.
  const fees = (await adminApi.get('/fees')).data;
  const withReceipt = fees.filter((f) => (f.payments || []).some((p) => p.receiptNo === receipt));
  expect(withReceipt).toHaveLength(1);
  const fee = withReceipt[0];
  const sum = Math.round(fee.payments.reduce((t, p) => t + p.amount, 0) * 100) / 100;
  expect(fee.paidAmount).toBe(sum);
  const all = fees.flatMap((f) => (f.payments || []).map((p) => p.receiptNo));
  expect(new Set(all).size).toBe(all.length);
});

test('a parent asks for leave, the office approves it, and the parent sees the decision', async ({ page, request }) => {
  const reason = `Family function (e2e ${Date.now()})`;
  const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  await signIn(page, 'parent');
  await page.goto('/parent/apply-leave');
  await page.getByLabel('FROM DATE').fill(day);
  await page.getByLabel('TO DATE').fill(day);
  await page.getByLabel('REASON').fill(reason);
  await page.getByRole('button', { name: 'Submit Leave Request' }).click();

  const parentApi = await apiSession(request, 'parent');
  const mine = async () => ((await parentApi.get('/leaves/my')).data || []).find((l) => l.reason === reason);
  await expect.poll(async () => (await mine())?.status).toBe('Pending');

  // The office approves it.
  await page.goto('/login');
  await page.evaluate(() => { localStorage.removeItem('eduamigo_user'); localStorage.removeItem('token'); });
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'admin');
  await page.goto('/admin/leaves');
  await page.getByPlaceholder('Search by name or reason...').fill(reason);
  await page.getByRole('button', { name: /Approve/ }).first().click();
  await expect.poll(async () => (await mine())?.status).toBe('Approved');

  // The parent sees the decision in their leave history.
  await page.goto('/login');
  await page.evaluate(() => { localStorage.removeItem('eduamigo_user'); localStorage.removeItem('token'); });
  await signIn(page, 'parent');
  await page.goto('/parent/apply-leave');
  const card = page.locator('div').filter({ hasText: reason }).filter({ hasText: 'Approved' }).last();
  await expect(card).toBeVisible();
});

test('the office sends a notice to parents: parents see it, teachers do not', async ({ page, request }) => {
  const title = `PTM on Saturday (e2e ${Date.now()})`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'admin');
  await page.goto('/admin/communications');
  await page.getByRole('button', { name: /Send Notification/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Send Notification' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('TITLE')).toBeFocused(); // focus moves into the dialog
  await dialog.getByLabel('TITLE').fill(title);
  await dialog.getByLabel('MESSAGE').fill('Parent-teacher meeting from 10 am in the school hall.');
  await dialog.getByRole('button', { name: 'Parents', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Parents', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Send Now' }).click();
  await expect(dialog).toBeHidden();

  const parentApi = await apiSession(request, 'parent');
  const teacherApi = await apiSession(request, 'teacher');
  const has = async (api) => ((await api.get('/notifications/my')).data || []).some((n) => n.title === title);
  await expect.poll(() => has(parentApi)).toBe(true);
  expect(await has(teacherApi)).toBe(false);

  await page.goto('/login');
  await page.evaluate(() => { localStorage.removeItem('eduamigo_user'); localStorage.removeItem('token'); });
  await signIn(page, 'parent');
  await page.goto('/parent/notifications');
  await expect(page.getByText(title)).toBeVisible();
});

test('dialogs: Escape closes them, focus returns to the button that opened them, and they fit a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page, 'admin');
  await page.goto('/admin/communications');
  const opener = page.getByRole('button', { name: /Send Notification/ }).first();
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Send Notification' });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
