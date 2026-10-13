import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Unsaved changes. Covered: reloading/closing the tab (browser's own question), moving to another screen inside the
// app, and the browser's Back/Forward buttons (the app's question). Nothing is saved in these tests.

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

// Library reached inside the app (so Back and Forward stay inside it), with a half-filled "Add Book" dialog.
async function libraryWithTypedBook(page) {
  await signIn(page, 'admin');
  await page.goto('/admin/students');
  await page.locator('aside').getByText('Library', { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/library$/);
  await page.getByRole('button', { name: 'Add Book' }).click();
  const field = page.getByRole('dialog', { name: 'Add New Book' }).getByPlaceholder('Book title...');
  await field.fill('Unsaved book');
  return field;
}

test('the browser Back button asks first; Cancel keeps the page and the typed text, Leave goes back', async ({ page }) => {
  const field = await libraryWithTypedBook(page);
  await page.goBack({ waitUntil: 'commit' }).catch(() => {});
  await expect(page.getByText(ASK)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/library$/); // the address is put back while the question is open
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  await expect(page).toHaveURL(/\/admin\/library$/);
  await expect(field).toHaveValue('Unsaved book');

  await page.goBack({ waitUntil: 'commit' }).catch(() => {});
  await page.getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/students$/);
  await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();
  // Nothing is guarded any more: Forward goes straight back to the library.
  await page.goForward();
  await expect(page).toHaveURL(/\/admin\/library$/);
  await expect(page.getByText(ASK)).toHaveCount(0);
});

test('the browser Forward button asks first too', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/library');
  await page.locator('aside').getByText('All Students', { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/students$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/admin\/library$/);
  await page.getByRole('button', { name: 'Add Book' }).click();
  const field = page.getByRole('dialog', { name: 'Add New Book' }).getByPlaceholder('Book title...');
  await field.fill('Unsaved book');

  await page.goForward({ waitUntil: 'commit' }).catch(() => {});
  await expect(page.getByText(ASK)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  await expect(page).toHaveURL(/\/admin\/library$/);
  await expect(field).toHaveValue('Unsaved book');
});

test('without unsaved changes Back goes back without a question', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/students');
  await page.locator('aside').getByText('Library', { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/library$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/admin\/students$/);
  await expect(page.getByText(ASK)).toHaveCount(0);
});
