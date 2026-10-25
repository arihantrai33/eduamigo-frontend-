// The office screen sends one Idempotency-Key with a payment, so a repeated request is recorded once by the server
// (backend tests/fee-idempotency.test.js). Here: the key is sent, and a retry of the same dialog reuses it.
import { test, expect } from '@playwright/test';
import { signIn } from './helpers.js';

test('a payment is sent with an Idempotency-Key, and a failed try that is repeated uses the same key', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'admin');
  await page.goto('/admin/fees');
  const keys = [];
  let attempt = 0;
  await page.route('**/api/fees/*/pay', async (route) => {
    keys.push(route.request().headers()['idempotency-key']);
    // The first try looks like a network failure to the screen (the server may or may not have saved it); the second goes through.
    if (++attempt === 1) return route.abort('internetdisconnected');
    return route.continue();
  });
  const collect = page.getByRole('button', { name: 'Collect' }).first();
  await expect(collect).toBeVisible();
  await collect.click();
  await page.getByLabel('AMOUNT (₹)').fill('1');
  await page.getByRole('button', { name: 'Record payment' }).click();
  await expect(page.getByText('Collect Fee Payment')).toBeVisible(); // still open after the failure
  await page.getByRole('button', { name: 'Record payment' }).click();
  await expect(page.getByText(/Payment recorded\. Receipt RCPT-/)).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toMatch(/^[\w.:-]{8,64}$/);
  expect(keys[1]).toBe(keys[0]);
});
