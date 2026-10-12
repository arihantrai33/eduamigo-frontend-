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
