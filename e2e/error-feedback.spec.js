import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Failures show what went wrong and what to do, never "Error" or a technical text. The API answers here are
// mocked in the browser, so nothing is written to the demo database.

test('errorMessage turns each kind of failure into a readable message', async ({ page }) => {
  await page.goto('/select-school');
  const out = await page.evaluate(async () => {
    const { errorMessage } = await import('/src/utils/toast.js');
    const http = (status, data, headers = {}) => Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data, headers }, config: { url: '/api/x', method: 'post' } });
    return {
      serverWords: errorMessage(http(400, { message: 'Admission number already exists' }), 'Could not save the student'),
      server500: errorMessage(http(500, { message: 'Something went wrong. Please try again.', requestId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' }), 'Could not save the student'),
      exposed500: errorMessage(http(503, { message: 'AI is busy right now', requestId: 'feedbeef00' }), 'Could not answer'),
      gateway: errorMessage(http(502, '<html>Bad gateway</html>'), 'Could not save the book'),
      forbidden: errorMessage(http(403, {}), 'Could not delete'),
      unknownRoute: errorMessage(http(404, { message: 'Endpoint not found' }), 'Could not load'),
      missingRecord: errorMessage(http(404, {}), 'Could not load'),
      tooMany: errorMessage(http(429, {}), 'Could not sign in'),
      axiosOffline: errorMessage(Object.assign(new Error('Network Error'), { request: {}, config: {} }), 'Could not save'),
      fetchOffline: errorMessage(new TypeError('Failed to fetch'), 'Could not load'),
      safariOffline: errorMessage(new TypeError('Load failed'), 'Could not load'),
      timeout: errorMessage(Object.assign(new Error('timeout of 30000ms exceeded'), { code: 'ECONNABORTED' }), 'Could not load'),
      thrownByScreen: errorMessage(new Error('This support link has expired.'), 'Could not start'),
      codeBug: errorMessage(new TypeError("Cannot read properties of undefined (reading 'map')"), 'Could not load the bus details'),
      badJson: errorMessage(new SyntaxError('Unexpected token < in JSON'), 'Could not upload the file'),
      nothing: errorMessage(undefined),
    };
  });
  expect(out.serverWords).toBe('Admission number already exists');
  expect(out.server500).toBe('Could not save the student. The server had a problem; please try again in a moment. Reference: 1a2b3c4d');
  expect(out.exposed500).toBe('AI is busy right now. Reference: feedbeef');
  expect(out.gateway).toBe('Could not save the book. The server had a problem; please try again in a moment.');
  expect(out.forbidden).toMatch(/^You don't have permission/);
  // An address the server does not have (an older server) is not a missing record: refreshing will not help.
  expect(out.unknownRoute).toMatch(/^This part of EduAmigo is not available on the server yet/);
  expect(out.unknownRoute).not.toMatch(/refresh/i);
  expect(out.missingRecord).toMatch(/^This item could not be found/);
  expect(out.tooMany).toMatch(/^Too many attempts/);
  for (const k of ['axiosOffline', 'fetchOffline', 'safariOffline']) expect(out[k]).toMatch(/^Can't reach EduAmigo right now/);
  expect(out.timeout).toMatch(/took too long/);
  expect(out.thrownByScreen).toBe('This support link has expired.');
  expect(out.codeBug).toBe('Could not load the bus details.');
  expect(out.badJson).toBe('Could not upload the file.');
  expect(out.nothing).toBe('Something went wrong. Please try again.');
  for (const v of Object.values(out)) expect(v).not.toMatch(/^Error$|status code|Failed to fetch|Network Error|Cannot read/);
});

test('a failed save shows what failed and a support reference, not "Error"', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/library');
  await page.route('**/api/library', (route) => (route.request().method() === 'POST'
    ? route.fulfill({ status: 500, json: { success: false, message: 'Something went wrong. Please try again.', requestId: '9f8e7d6c-0000-4000-8000-000000000000' } })
    : route.fallback()));
  await page.getByRole('button', { name: 'Add Book' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add New Book' });
  await dialog.getByPlaceholder('Book title...').fill('Mock title');
  await dialog.locator('input[type="number"]').first().fill('2');
  await dialog.getByRole('button', { name: 'Add Book' }).click();
  await expect(page.getByRole('status')).toContainText('Could not save the book. The server had a problem; please try again in a moment. Reference: 9f8e7d6c');
  await expect(dialog).toBeVisible(); // the typed book is still there to retry
});

test('a lost connection says so instead of a technical message', async ({ page }) => {
  await signIn(page, 'teacher');
  await page.route('**/api/notifications/my', (route) => route.abort('internetdisconnected'));
  await page.goto('/teacher/notifications');
  await expect(page.getByText("Can't reach EduAmigo right now. Check your internet connection and try again.")).toBeVisible();
  await expect(page.getByText('Failed to fetch')).toHaveCount(0);
});
