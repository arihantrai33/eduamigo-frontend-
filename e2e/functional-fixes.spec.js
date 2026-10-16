import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { signIn } from './helpers';

// Functional defects found after the redesign; these keep them fixed.

const pdf = { name: 'medical-note.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%test\n') };

// The leave form's attachment: keyboard only, from the reason box to a sent request.
async function attachByKeyboard(page, role) {
  // The upload goes to Cloudinary and the request would add a real leave: both are answered here.
  const uploads = [];
  const applied = [];
  await page.route('**/api/chat/upload', async (route) => {
    uploads.push(route.request().postDataBuffer()?.includes('medical-note.pdf'));
    await route.fulfill({ json: { success: true, url: 'https://files.example.test/medical-note.pdf', fileName: 'medical-note.pdf' } });
  });
  await page.route('**/api/leaves/apply', async (route) => {
    applied.push(route.request().postDataJSON());
    await route.fulfill({ json: { success: true, data: {} } });
  });

  await signIn(page, role);
  await page.goto(`/${role}/apply-leave`);
  await page.getByLabel('From date').fill('2030-01-10');
  await page.getByLabel('To date').fill('2030-01-11');
  await page.getByLabel('Reason').fill('Fever, doctor advised rest');

  // Tab from the reason box reaches the attachment field, by its name.
  await page.getByLabel('Reason').focus();
  await page.keyboard.press('Tab');
  const field = page.getByLabel('Attach document (optional)');
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('type', 'file');

  // Space opens the file picker (it used to be a click-only div with a hidden input).
  let chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Space');
  await (await chooser).setFiles(pdf);
  await expect(page.getByText('medical-note.pdf')).toBeVisible();

  // Remove is its own button, reached with Tab; it clears the file and returns focus to the field.
  await page.keyboard.press('Tab');
  const remove = page.getByRole('button', { name: 'Remove attachment' });
  await expect(remove).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('medical-note.pdf')).toHaveCount(0);
  await expect(remove).toHaveCount(0);
  await expect(field).toBeFocused();

  // The same file can be chosen again after Remove (the input value was cleared too).
  chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  await (await chooser).setFiles(pdf);
  await expect(page.getByText('medical-note.pdf')).toBeVisible();

  await page.getByRole('button', { name: 'Submit Leave Request' }).click();
  await expect.poll(() => applied.length).toBe(1);
  expect(uploads).toEqual([true]);
  expect(applied[0]).toMatchObject({ attachmentUrl: 'https://files.example.test/medical-note.pdf', attachmentName: 'medical-note.pdf', reason: 'Fever, doctor advised rest' });
}

test('student leave: the document can be attached, removed and sent with the keyboard', async ({ page }) => {
  await attachByKeyboard(page, 'student');
});

test('parent leave: the document can be attached, removed and sent with the keyboard', async ({ page }) => {
  await attachByKeyboard(page, 'parent');
});

test('student assignments have no Submit button that does nothing', async ({ page }) => {
  const due = new Date(Date.now() + 5 * 86400000).toISOString();
  await page.route('**/api/notes/assignments', (route) => route.fulfill({ json: { success: true, data: [
    { _id: 'a1', title: 'Algebra worksheet', subject: 'Mathematics', type: 'Assignment', status: 'Pending', dueDate: due, fileUrl: 'https://files.example.test/algebra.pdf' },
    { _id: 'a2', title: 'Essay outline', subject: 'English', type: 'Assignment', status: 'Pending', dueDate: due },
    { _id: 'a3', title: 'Lab record', subject: 'Chemistry', type: 'Assignment', status: 'Submitted', dueDate: due },
  ] } }));
  await signIn(page, 'student');
  await page.goto('/student/notes');
  await page.getByRole('button', { name: 'Tasks' }).click();
  await expect(page.getByText('Algebra worksheet')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(0);
  // With the teacher's file: a working link to it.
  const open = page.getByRole('link', { name: 'Open Algebra worksheet' });
  await expect(open).toHaveAttribute('href', 'https://files.example.test/algebra.pdf');
  await expect(page.getByRole('link', { name: /Open Essay outline/ })).toHaveCount(0);
  // Done is a status, not a button.
  await expect(page.getByText('Done', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Done' })).toHaveCount(0);
});
