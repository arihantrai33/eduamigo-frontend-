import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.describe('sign in and portal navigation', () => {
  test('a parent signs in through the school code and lands on the parent portal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, 'parent');
    await expect(page).toHaveURL(/\/parent\/home/);
    // Desktop: the sidebar lists the portal, the bottom bar is hidden.
    const sidebar = page.getByRole('complementary', { name: 'Parent Portal navigation' });
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Fee Status' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
  });

  test('on a phone the same portal uses the bottom tabs, with the labels parents know', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signIn(page, 'parent');
    const tabs = page.getByRole('navigation', { name: 'Main' });
    await expect(tabs).toBeVisible();
    for (const label of ['Home', 'Teachers', 'Fees', 'Alerts', 'Me']) await expect(tabs.getByRole('button', { name: label, exact: true })).toBeVisible();
    await tabs.getByRole('button', { name: 'Fees' }).click();
    await expect(page).toHaveURL(/\/parent\/fee/);
    await expect(tabs.getByRole('button', { name: 'Fees' })).toHaveAttribute('aria-current', 'page');
  });

  test('a wrong password is refused with a visible message', async ({ page }) => {
    await signIn(page, 'teacher', { password: 'not-the-password' });
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('each role reaches its own portal', async ({ page }) => {
    for (const [role, url] of [['student', /\/student\/home/], ['teacher', /\/teacher\/home/], ['admin', /\/admin/]]) {
      await page.context().clearCookies();
      await page.goto('/login');
      await page.evaluate(() => { localStorage.removeItem('eduamigo_user'); localStorage.removeItem('token'); });
      await signIn(page, role);
      await expect(page).toHaveURL(url);
    }
  });

  test('a parent who opens an admin address is sent back to the parent portal', async ({ page }) => {
    await signIn(page, 'parent');
    await expect(page).toHaveURL(/\/parent\/home/);
    await page.goto('/admin/students');
    await expect(page).toHaveURL(/\/parent\/home/);
  });

  test('signing out from the sidebar ends the session', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, 'teacher');
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/teacher/home');
    await expect(page).toHaveURL(/\/login/);
  });
});
