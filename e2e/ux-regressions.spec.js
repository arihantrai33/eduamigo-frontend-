import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Behaviour fixed during the web UI/UX transformation; these keep it fixed.

test('teacher profile "Edit Profile" opens the edit form for that teacher', async ({ page }) => {
  // It used to open /admin/teachers/edit/:id, a route that does not exist (blank screen).
  await signIn(page, 'admin');
  await page.goto('/admin/teachers');
  await page.getByRole('button', { name: 'View', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Teacher Profile' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit Teacher' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input').first()).not.toHaveValue('');
  // Closing it and reloading does not open it again.
  await dialog.getByRole('button', { name: 'Close' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Teachers' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the student home header scrolls away with the page', async ({ page }) => {
    await signIn(page, 'student');
    await page.goto('/student/home');
    const header = page.locator('.ea-home > :first-child');
    await expect(header).toBeVisible();
    const before = (await header.boundingBox()).y;
    await page.locator('.ea-scroll').evaluate((el) => { el.scrollTop = 300; });
    await expect.poll(async () => before - (await header.boundingBox()).y).toBeGreaterThan(200);
  });

  test('the results screen uses the shared tab bar with Learn as the current tab', async ({ page }) => {
    await signIn(page, 'student');
    await page.goto('/student/result');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Learn' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('button')).toHaveText(['Home', 'Bus', 'Learn', 'Chat', 'Me']);
  });
});
