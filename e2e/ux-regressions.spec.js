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

test('a dialog with typed-in changes asks before it is closed', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/library');
  await page.getByRole('button', { name: 'Add Book' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add New Book' });
  await expect(dialog).toBeVisible();
  // Nothing typed yet: Escape closes straight away.
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Add Book' }).click();
  await dialog.locator('input').first().fill('Unsaved title');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Discard the changes you have made?')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  await expect(dialog.locator('input').first()).toHaveValue('Unsaved title');

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Discard' }).click();
  await expect(dialog).toHaveCount(0);
});

test('HR, calendar and user forms open in the shared dialog; HR checks required fields first', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/hr-management');
  await page.getByRole('button', { name: '+ Add Salary' }).click();
  const hr = page.getByRole('dialog', { name: 'Add Salary Record' });
  await expect(hr).toBeVisible();
  // The floating Ask button would otherwise sit above the dialog.
  await expect(page.locator('.ea-ask-fab')).toBeHidden();
  await hr.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toContainText('Select a teacher');
  await expect(hr).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(hr).toHaveCount(0);
  await expect(page.locator('.ea-ask-fab')).toBeVisible();

  await page.goto('/admin/user-management');
  await page.getByRole('button', { name: 'Add User', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add New User' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/admin/event-calendar');
  await page.getByRole('button', { name: 'Add Event', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add New Event' })).toBeVisible();
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
