import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Learning AI end to end against the test backend (no mocks). The test backend runs with ASSISTANT_AI=off, so this checks
// the real wiring and the honest "AI unavailable" paths; the AI answers themselves are covered with mocked providers in
// the backend tests and learning.spec.js. Writes only to the test backend's in-memory database.

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
