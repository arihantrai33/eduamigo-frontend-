import { test, expect } from '@playwright/test';
import { signIn, apiSession } from './helpers';

// Date of admission: a student whose date is not recorded gets "Not recorded" on the transfer certificate (never the
// date the record was made), the screen asks for the real date, and once saved the certificate shows it.
// Runs on the test backend; the students are made by the test.

test('a transfer certificate without a recorded admission date says so, and the date can be recorded there', async ({ page, request }) => {
  const api = await apiSession(request, 'admin');
  const made = await api.post('/students', { name: 'Imported Pupil', phone: '9000001234', class: '9', section: 'A' });
  expect(made.data.admittedOn).toBeNull();
  const id = made.data._id;
  await api.del(`/students/${id}`, { reason: 'Family moved to Pune' });

  await signIn(page, 'admin');
  await page.goto(`/admin/tc/${id}`);
  const row = page.getByRole('row', { name: /Date of admission/ });
  await expect(row).toContainText('Not recorded');
  const warning = page.getByRole('alert').filter({ hasText: 'Not recorded for this student' });
  await expect(warning).toContainText('date of admission and date of birth');

  // The warning is for the screen only.
  await page.emulateMedia({ media: 'print' });
  await expect(warning).toBeHidden();
  await expect(row).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

  await warning.getByLabel('Date of admission').fill('2019-04-02');
  await warning.getByRole('button', { name: 'Save to student record' }).click();
  await expect(row).toContainText('02 April 2019');
  await expect(page.getByRole('alert').filter({ hasText: 'Not recorded for this student' })).toContainText('date of birth');
  await expect(page.getByRole('alert').filter({ hasText: 'Not recorded for this student' })).not.toContainText('date of admission');
  const saved = await api.get(`/students/${id}/transfer-certificate`);
  expect(saved.data.student.admittedOn.slice(0, 10)).toBe('2019-04-02');
});

test('the student edit form shows and saves the date of birth and the date of admission', async ({ page, request }) => {
  const api = await apiSession(request, 'admin');
  const made = await api.post('/students', { name: 'Edit Me', phone: '9000001235', class: '9', section: 'A', dateOfBirth: '2012-08-09' });
  await signIn(page, 'admin');
  await page.goto('/admin/students');
  // exact: the row's Delete button is named "Delete Edit Me", which also contains "Edit"
  await page.getByRole('row', { name: /Edit Me/ }).getByRole('button', { name: 'Edit', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: /Edit Student/ });
  const dob = dialog.locator('input[type="date"]').first();
  await expect(dob).toHaveValue('2012-08-09'); // the field used to read a "dob" key the server never sends
  await dialog.locator('input[type="date"]').nth(1).fill('2018-06-01');
  await dialog.getByRole('button', { name: 'Save Student' }).click();
  await expect(dialog).toHaveCount(0);
  const list = await api.get('/students?search=Edit%20Me');
  const s = list.data.find((x) => x._id === made.data._id);
  expect({ dob: s.dateOfBirth.slice(0, 10), admitted: s.admittedOn.slice(0, 10) }).toEqual({ dob: '2012-08-09', admitted: '2018-06-01' });
});
