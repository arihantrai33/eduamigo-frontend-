import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { signIn } from './helpers';

// The tutor's drawings: a ray diagram drawn from a validated spec (backend learning/diagram.js, fixture made by it), shown beside
// the explanation on a wide screen and under it on a phone; and the answer text typed out at a steady pace.

const lens = JSON.parse(fs.readFileSync(new URL('./fixtures/lens-scene.json', import.meta.url), 'utf8'));
const flow = JSON.parse(fs.readFileSync(new URL('./fixtures/flow.json', import.meta.url), 'utf8'));
const TEXT = [
  'A convex lens bends light rays towards a point, so it can form a real image of an object.\n\n',
  '1. **Object:** it stands 20 cm from the lens, a little beyond the focal length of 15 cm.\n',
  '2. **Parallel ray:** the ray from the top of the object, parallel to the axis, bends through the focus on the far side.\n',
  '3. **Central ray:** the ray through the optical centre goes straight on without bending.\n',
  '4. **Image:** the two rays meet at 60 cm, so the image is real, inverted and magnified three times.\n\n',
  '[[diagram:0]]\n\nDoes this picture help you see why the image is upside down?',
];
const ANSWER = [
  { type: 'meta', conversationId: 'c1', language: 'en', materialsChecked: true, sources: [] },
  ...TEXT.slice(0, 5).map((text) => ({ type: 'delta', text })),
  { type: 'final', text: TEXT.join(''), conversationId: 'c1', used: [], checks: [], diagrams: [lens], confidence: null, timings: { totalMs: 900 } },
];

async function setup(page, answer = ANSWER) {
  await signIn(page, 'student');
  await page.route('**/api/learning/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/learning/, '');
    if (path === '/context') return route.fulfill({ json: { success: true, data: { class: '10', section: 'A', subjects: ['Science'], exams: [], capabilities: { webResearch: false, historyDays: 180 } } } });
    if (path === '/chat') return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: `${answer.map((e) => JSON.stringify(e)).join('\n')}\n` });
    return route.fulfill({ status: 404, json: { success: false } });
  });
  await page.goto('/student/learn');
  await page.getByLabel('Your question').fill('draw a ray diagram for a convex lens');
  await page.getByRole('button', { name: 'Send' }).click();
}

test('a drawing sits beside the explanation on a wide screen, with its labels and the worked-out caption', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setup(page);
  const fig = page.locator('.ea-learn__answer-figs figure');
  await expect(fig).toBeVisible({ timeout: 15000 });
  await expect(fig).toContainText('Convex lens, u = 20 cm, f = 15 cm: image at 60 cm');
  for (const label of ['Object', 'Real image', 'u = 20 cm', 'v = 60 cm']) await expect(fig.locator('svg text', { hasText: label }).first()).toBeVisible();
  const text = await page.locator('.ea-learn__answer-text').boundingBox();
  const f = await fig.boundingBox();
  expect(f.x).toBeGreaterThanOrEqual(text.x + text.width - 2); // beside the text, not under it
  expect(f.width).toBeGreaterThanOrEqual(300);
  await expect(page.locator('.ea-learn__answer-text li')).toHaveCount(4); // the explanation is pointwise
  await page.locator('.ea-learn__log').evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/drawing-wide.png` : 'test-results/drawing-wide.png' });
});

test('on a phone the drawing sits under the explanation and the page does not scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const fig = page.locator('.ea-learn__answer-figs figure');
  await expect(fig).toBeVisible({ timeout: 15000 });
  const text = await page.locator('.ea-learn__answer-text').boundingBox();
  const f = await fig.boundingBox();
  expect(f.y).toBeGreaterThanOrEqual(text.y + text.height - 2);
  expect(f.x + f.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the answer is typed out at a steady pace, not shown in one jump', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setup(page);
  const lengths = [];
  const end = Date.now() + 6000;
  while (Date.now() < end) {
    lengths.push(await page.locator('.ea-learn__answer-text').first().innerText().then((t) => t.length, () => 0));
    if (await page.locator('.ea-learn__answer-figs figure').count()) break;
    await page.waitForTimeout(60);
  }
  const grew = lengths.filter((n, i) => i && n > lengths[i - 1]);
  expect(grew.length).toBeGreaterThanOrEqual(4); // several steps of growth
  expect(lengths.some((n) => n > 0 && n < 120)).toBe(true); // it started short
  await expect(page.locator('.ea-learn__answer-text')).toContainText('upside down?');
});

test('a flow of steps is drawn as numbered boxes with arrows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const answer = [...ANSWER.slice(0, -1), { ...ANSWER.at(-1), diagrams: [flow] }];
  await setup(page, answer);
  const fig = page.locator('.ea-learn__answer-figs figure');
  await expect(fig).toBeVisible({ timeout: 15000 });
  await expect(fig.locator('svg rect')).toHaveCount(3);
  await expect(fig.locator('svg polygon')).toHaveCount(2);
  await expect(fig.locator('svg text', { hasText: 'Water is split' })).toBeVisible();
});

for (const name of ['lens-scene', 'lens-virtual', 'lens-concave', 'draw-plant_cell', 'draw-animal_cell', 'draw-atom', 'draw-earth_layers', 'draw-circuit']) {
  test(`the ${name} drawing stays inside its frame and its labels do not run off the edge`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const d = JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
    await setup(page, [...ANSWER.slice(0, -1), { ...ANSWER.at(-1), diagrams: [d] }]);
    const fig = page.locator('.ea-learn__answer-figs figure');
    await expect(fig).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);
    const svg = await fig.locator('svg').boundingBox();
    for (const t of await fig.locator('svg text').all()) {
      const b = await t.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(svg.x - 1);
      expect(b.x + b.width).toBeLessThanOrEqual(svg.x + svg.width + 1);
      expect(b.y).toBeGreaterThanOrEqual(svg.y - 1);
      expect(b.y + b.height).toBeLessThanOrEqual(svg.y + svg.height + 1);
    }
    await fig.screenshot({ path: `${process.env.SHOT_DIR || 'test-results'}/${name}.png` });
  });
}
