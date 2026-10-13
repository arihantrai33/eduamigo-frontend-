import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Learning AI end to end against the test backend (no mocks). The test backend runs with ASSISTANT_AI=off, so this checks
// the real wiring and the honest "AI unavailable" paths; the AI answers themselves are covered with mocked providers in
// the backend tests and learning.spec.js. Writes only to the test backend's in-memory database.

test('opening Learning AI loads the student\'s context from the backend (200) and shows the AI Tutor', async ({ page }) => {
  await signIn(page, 'student');
  const context = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/learning/context' && r.request().method() === 'GET');
  await page.goto('/student/learn');
  const res = await context;
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({ success: true, data: { class: expect.any(String), section: expect.any(String), subjects: expect.any(Array), exams: expect.any(Array) } });
  await expect(page.getByText(`Class ${body.data.class}-${body.data.section}`)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'AI Tutor' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Your question')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a server without the Learning AI routes (an older backend) is reported as such, not as a missing item', async ({ page }) => {
  await signIn(page, 'student');
  // What a backend started before /api/learning existed answers (its catch-all for unknown addresses).
  await page.route('**/api/learning/context', (route) => route.fulfill({ status: 404, json: { success: false, message: 'Endpoint not found' } }));
  await page.goto('/student/learn');
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('not available on the server yet');
  await expect(alert).toContainText('older version');
  await expect(alert).not.toContainText(/refresh/i);
});

test('Learning AI end to end without an AI provider: honest messages, a real revision plan and progress', async ({ page }) => {
  await signIn(page, 'student');
  await page.goto('/student/learn');
  await expect(page.getByRole('heading', { name: 'Learning AI' })).toBeVisible();
  await expect(page.getByText(/^Class \d+-[A-Z]$/)).toBeVisible();

  // Tutor: no provider -> said plainly, nothing invented; the question is kept in history.
  await page.getByLabel('Your question').fill('What is photosynthesis?');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('alert')).toContainText('The AI Tutor is not available right now');
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('dialog', { name: 'Chat history' })).toContainText('What is photosynthesis?');
  await page.getByRole('button', { name: 'Close history' }).click();

  // Practice: no provider -> the server's reason, no set.
  await page.getByRole('tab', { name: 'Practice & Assessment' }).click();
  await expect(page.getByRole('button', { name: 'Start practice' })).toBeVisible();
  await page.getByLabel('Subject').fill('Mathematics');
  await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Practice questions need the AI' })).toBeVisible();

  // Planner: works without AI (fixed rules).
  await page.getByRole('tab', { name: 'Revision Planner' }).click();
  // A backend reused between runs may already hold a plan from an earlier run: start a new one then.
  await expect(page.getByRole('button', { name: /Make my plan|New plan/ })).toBeVisible();
  if (await page.getByRole('button', { name: 'New plan' }).isVisible()) await page.getByRole('button', { name: 'New plan' }).click();
  await page.getByLabel('I will enter the date').check();
  const inTen = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Exam date').fill(inTen);
  await page.getByLabel('Exam name (optional)').fill('Maths unit test');
  await page.getByLabel('Subject 1', { exact: true }).fill('Mathematics');
  await page.getByLabel('Topic 1', { exact: true }).fill('Fractions');
  await page.getByRole('button', { name: 'Make my plan' }).click();
  await expect(page.getByText('Maths unit test')).toBeVisible();
  await expect(page.getByText(/0 of \d+ done/)).toBeVisible();
  const task = page.getByLabel(/Study Mathematics: Fractions/);
  await task.click();
  await expect(task).toBeChecked();

  await page.getByRole('tab', { name: 'Learning Progress' }).click();
  await expect(page.getByText('Plan done')).toBeVisible();
  await expect(page.getByText(/^1\/\d+$/)).toBeVisible();
});
