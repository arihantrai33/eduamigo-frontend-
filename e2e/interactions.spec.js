import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Interactions found during the 2026-10-15 audit: list buttons, search, switches, month arrows, expandable rows,
// field-level sign-in messages and keyboard use of the portal navigation.

test('admin: View on a student row opens that student\'s profile', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/students');
  await page.getByRole('row', { name: /Riya Sharma/ }).getByRole('button', { name: 'View', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/students\/[a-f0-9]{24}$/);
  await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
});

test('admin: the student search narrows the list and says when nothing matches', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/students');
  const search = page.getByRole('textbox', { name: 'Search students' });
  await search.fill('Kabir');
  await expect(page.getByRole('row', { name: /Kabir Sharma/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Riya Sharma/ })).toHaveCount(0);
  await search.fill('zzzz-no-such-student');
  await expect(page.getByText('No students found')).toBeVisible();
});

test('admin: an account switch is a real switch, works by keyboard and keeps focus while the list refreshes', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/user-management');
  const sw = page.getByRole('switch', { name: 'Account active: Rohit Gupta' });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(sw).toBeFocused();
  await page.keyboard.press('Space'); // back to active, as the demo had it
  await expect(sw).toHaveAttribute('aria-checked', 'true');
});

test('admin: on a tablet, user management shows each user as a card without the column headings', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await signIn(page, 'admin');
  await page.goto('/admin/user-management');
  await expect(page.getByRole('switch', { name: 'Account active: Rohit Gupta' })).toBeVisible();
  await expect(page.locator('.ea-um-head')).toBeHidden();
  const row = page.locator('.ea-um-row').filter({ hasText: 'Rohit Gupta' });
  const [name, toggle] = [await row.getByText('Rohit Gupta').boundingBox(), await row.getByRole('switch').boundingBox()];
  expect(Math.abs(name.y - toggle.y)).toBeLessThan(30); // name and switch share the first line
});

test('admin: the event calendar arrows move to the next and the previous month', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/event-calendar');
  const month = (offset) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.toLocaleString('en-US', { month: 'long' }); };
  await expect(page.getByText(month(0), { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.getByText(month(1), { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(page.getByText(month(0), { exact: true }).first()).toBeVisible();
});

test('admin: a bus row opens and closes its details, and says which it is', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/transport');
  const show = page.getByRole('button', { name: 'Show bus details' }).first();
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await show.click();
  const hide = page.getByRole('button', { name: 'Hide bus details' }).first();
  await expect(hide).toHaveAttribute('aria-expanded', 'true');
  await hide.click();
  await expect(page.getByRole('button', { name: 'Hide bus details' })).toHaveCount(0);
});

test('sign-in: an empty field is named under that field, focus goes to it, and typing clears the message', async ({ page }) => {
  await page.goto('/select-school');
  await page.getByLabel('School code or name').fill('GVPS');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, this is my school' }).click();
  await page.getByRole('tab', { name: 'Admin' }).click();
  await page.getByRole('button', { name: 'Log in as Admin' }).click();
  const id = page.getByLabel('Email address');
  const password = page.getByLabel('Password', { exact: true });
  await expect(id).toBeFocused();
  await expect(id).toHaveAttribute('aria-invalid', 'true');
  await expect(id).toHaveAccessibleDescription('Enter your email address');
  await expect(password).toHaveAccessibleDescription('Enter your password');
  await id.fill('admin@gvps.demo');
  await expect(id).not.toHaveAttribute('aria-invalid', 'true');
  // Enter in the ID field signs in too; the password is still missing, so focus moves there.
  await id.press('Enter');
  await expect(password).toBeFocused();
  // The show-password button can be reached by keyboard.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Show password' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
});

test('portal on a phone: Tab reaches the tab bar, Enter opens the screen, and the current tab is announced', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'parent');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(page.getByRole('button', { name: /Fee Status/ })).toBeVisible(); // the home screen has loaded
  let reached = false;
  for (let i = 0; i < 80 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => !!document.activeElement?.closest('nav[aria-label="Main"]'));
  }
  expect(reached, 'Tab reaches the tab bar').toBe(true);
  const fees = nav.getByRole('button', { name: 'Fees' });
  await fees.focus();
  expect(await fees.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/parent\/fee/);
  await expect(nav.getByRole('button', { name: 'Fees' })).toHaveAttribute('aria-current', 'page');
});

test('portal on a desktop: the sidebar links work by keyboard and mark the current page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await signIn(page, 'student');
  const link = page.locator('aside').getByRole('link', { name: 'Timetable' });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/student\/timetable/);
  await expect(page.locator('aside').getByRole('link', { name: 'Timetable' })).toHaveAttribute('aria-current', 'page');
});

test('admin: Add Student names each missing required field under it and moves focus to the first', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/students/add');
  await page.getByRole('button', { name: 'Add Student', exact: true }).click();
  const name = page.getByRole('textbox', { name: /Full Name/ });
  await expect(name).toBeFocused();
  await expect(name).toHaveAccessibleDescription("Enter the student's full name");
  await expect(page.getByRole('combobox', { name: /^Class/ })).toHaveAccessibleDescription('Choose the class');
  await expect(page.getByRole('combobox', { name: /^Section/ })).toHaveAccessibleDescription('Choose the section');
  await expect(page.getByRole('textbox', { name: /Parent Mobile/ })).toHaveAccessibleDescription(/phone or the parent's mobile number/);
  await name.fill('Test Pupil');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
});

test('student: Apply Leave names each missing field, then a "to" date before the "from" date', async ({ page }) => {
  await signIn(page, 'student');
  await page.goto('/student/apply-leave');
  const submit = page.getByRole('button', { name: /Submit Leave Request/ });
  await submit.click();
  await expect(page.getByLabel('FROM DATE')).toBeFocused();
  await expect(page.getByLabel('FROM DATE')).toHaveAccessibleDescription('Choose the first day of leave.');
  await expect(page.getByLabel('REASON')).toHaveAccessibleDescription('Write the reason for the leave.');
  await page.getByLabel('FROM DATE').fill('2026-12-10');
  await page.getByLabel('TO DATE').fill('2026-12-08');
  await page.getByLabel('REASON').fill('Family function');
  await submit.click();
  await expect(page.getByLabel('TO DATE')).toHaveAccessibleDescription('End date cannot be before start date.');
});

test('change password: a weak, then a mismatched new password is named under its own field', async ({ page }) => {
  await signIn(page, 'student');
  await page.goto('/change-password');
  const fresh = page.getByLabel('New password', { exact: true });
  await page.getByLabel(/Current password|Temporary password/).fill('Demo@1234');
  await fresh.fill('short');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(fresh).toHaveAccessibleDescription(/at least 8 characters/);
  await expect(fresh).toBeFocused();
  await fresh.fill('Better1234');
  await page.getByLabel('Confirm new password').fill('Better12345');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByLabel('Confirm new password')).toHaveAccessibleDescription('The new passwords do not match.');
});

test('student chat: a contact can be opened with the keyboard and the tabs say which is selected', async ({ page }) => {
  await signIn(page, 'student');
  await page.goto('/student/chat');
  await expect(page.getByRole('button', { name: 'Chats', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const contact = page.getByRole('button', { name: /Anita Verma/ }).first();
  await contact.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Back to contacts' })).toBeVisible();
});
