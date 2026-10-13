import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Unsaved changes. Covered: reloading/closing the tab (browser's own question) and moving to another screen inside
// the app (the app's question). Not covered, by design of BrowserRouter: the browser's Back/Forward buttons.
// Nothing is saved in these tests.

const ASK = 'You have unsaved changes. Leave this page and lose them?';
const firstField = (page) => page.locator('main input').first();

// Reload without waiting for it: when the question is answered "stay", the reload never happens.
async function reloadAndAnswer(page, accept) {
  const dialog = page.waitForEvent('dialog');
  page.reload().catch(() => {});
  const d = await dialog;
  const type = d.type();
  if (accept) await d.accept(); else await d.dismiss();
  return type;
}

test('a half-filled page form asks before the tab is reloaded', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/teachers/add');
  await firstField(page).click();
  await firstField(page).pressSequentially('Unsaved Teacher');
  expect(await reloadAndAnswer(page, false)).toBe('beforeunload');
  await expect(firstField(page)).toHaveValue('Unsaved Teacher');
});

test('a dialog with typed-in changes asks before the tab is reloaded', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/library');
  await page.getByRole('button', { name: 'Add Book' }).click();
  const field = page.getByRole('dialog', { name: 'Add New Book' }).getByPlaceholder('Book title...');
  await field.click();
  await field.pressSequentially('Unsaved book');
  expect(await reloadAndAnswer(page, false)).toBe('beforeunload');
  await expect(field).toHaveValue('Unsaved book');
});

test('moving to another screen asks first; Cancel keeps the form, Leave moves on', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/teachers/add');
  await firstField(page).fill('Unsaved Teacher');
  const sidebar = page.locator('aside');
  await sidebar.getByText('All Students', { exact: true }).click();
  await expect(page.getByText(ASK)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  await expect(page).toHaveURL(/\/admin\/teachers\/add$/);
  await expect(firstField(page)).toHaveValue('Unsaved Teacher');

  await sidebar.getByText('All Students', { exact: true }).click();
  await page.getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/students$/);
  // Once left, nothing is guarded any more.
  await sidebar.getByText('Library', { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/library$/);
  await expect(page.getByText(ASK)).toHaveCount(0);
});

test('an empty form moves on without a question', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/teachers/add');
  await page.locator('aside').getByText('All Students', { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/students$/);
  await expect(page.getByText(ASK)).toHaveCount(0);
});

test('signing out with unsaved changes asks first and Cancel keeps the session', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/teachers/add');
  await firstField(page).fill('Unsaved Teacher');
  await page.locator('aside').getByText('Log Out').click();
  await expect(page.getByText(ASK)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  await expect(page).toHaveURL(/\/admin\/teachers\/add$/);
  expect(await page.evaluate(() => !!localStorage.getItem('token'))).toBe(true);

  await page.locator('aside').getByText('Log Out').click();
  await page.getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
});
