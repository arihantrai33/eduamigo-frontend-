import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// The shared canvas, the sign-in controls and the Learning AI Send button.

const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

test('the sign-in and school-selection fields and buttons each have a clear border (the role tabs they replaced had one too)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  // These screens are light whatever the device's dark-mode setting is.
  for (const dark of [0, 1]) {
    await page.goto('/login');
    await page.evaluate((d) => { localStorage.setItem('themeVer', '2'); localStorage.setItem('darkMode', d ? 'true' : 'false'); }, dark);
    await page.reload();
    const edge = (locator) => locator.evaluate((e) => {
      const c = getComputedStyle(e); let back = [255, 255, 255];
      for (let p = e.parentElement; p; p = p.parentElement) { const bg = getComputedStyle(p).backgroundColor; const m = bg.match(/[\d.]+/g); if (m && (m[3] === undefined || +m[3] > 0.9)) { back = m.slice(0, 3).map(Number); break; } }
      return { w: c.borderTopWidth, color: c.borderTopColor, back };
    });
    const check = async (name, locator) => {
      const s = await edge(locator);
      expect(parseFloat(s.w), `${name} border width`).toBeGreaterThanOrEqual(1);
      expect(ratio(rgb(s.color), s.back), `${name} border contrast (${dark ? 'dark' : 'light'} setting)`).toBeGreaterThanOrEqual(3);
    };
    await check('ID field', page.getByLabel('Email, mobile number or admission number'));
    await check('password field', page.getByLabel('Password', { exact: true }));
    await page.goto('/select-school');
    await check('school field', page.getByLabel('School code or name'));
    await page.getByLabel('School code or name').fill('green');
    await expect(page.getByRole('button', { name: /Green Valley Public School/ })).toBeVisible();
    await check('school card', page.getByRole('button', { name: /Green Valley Public School/ }));
  }
});

test('the page canvas is the shared light blue-grey with a faint wash (and flat in the dark theme)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'student');
  await page.goto('/student/home');
  const light = await page.locator('.ea-stage').evaluate((e) => { const s = getComputedStyle(e); return { bg: s.backgroundColor, img: s.backgroundImage }; });
  expect(light.bg).toBe('rgb(237, 243, 249)');
  expect(light.img).toContain('radial-gradient');
  await page.evaluate(() => { localStorage.setItem('themeVer', '2'); localStorage.setItem('darkMode', 'true'); });
  await page.reload();
  const dark = await page.locator('.ea-stage').evaluate((e) => { const s = getComputedStyle(e); return { bg: s.backgroundColor, img: s.backgroundImage }; });
  expect(dark.img).toBe('none');
  await expect.poll(async () => lum(rgb(await page.locator('.ea-stage').evaluate((e) => getComputedStyle(e).backgroundColor)))).toBeLessThan(0.05);
});

test('the Learning AI Send button is clearly different when it can and cannot be used', async ({ page }) => {
  await page.route('**/api/learning/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/learning/, '');
    if (path === '/context') return route.fulfill({ json: { success: true, data: { class: '10', section: 'A', subjects: ['Science'], exams: [], capabilities: { ai: { available: true } } } } });
    return route.fulfill({ json: { success: true, data: [] } });
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'student');
  await page.goto('/student/learn');
  const send = page.getByRole('button', { name: 'Send' });
  await expect(send).toBeDisabled();
  const off = await send.evaluate((e) => { const s = getComputedStyle(e); return { bg: s.backgroundColor, color: s.color, opacity: s.opacity }; });
  await page.getByLabel('Your question').fill('Explain photosynthesis');
  await expect(send).toBeEnabled();
  const read = () => send.evaluate((e) => { const s = getComputedStyle(e); return { bg: s.backgroundColor, color: s.color, opacity: s.opacity }; });
  const brand = await page.evaluate(() => { const p = document.createElement('i'); p.style.color = getComputedStyle(document.documentElement).getPropertyValue('--brand'); document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; });
  await expect.poll(async () => (await read()).bg).toBe(brand);
  const on = await read();
  expect(on.opacity).toBe('1');
  expect(off.opacity).toBe('1');
  // Enabled: white on the brand colour (readable); disabled: a grey that is far from it.
  expect(ratio(rgb(on.color), rgb(on.bg))).toBeGreaterThanOrEqual(4.5);
  expect(ratio(rgb(on.bg), rgb(off.bg))).toBeGreaterThanOrEqual(2);
});

test('checkboxes and radios use the brand colour, not the browser blue', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, 'student');
  await page.route('**/api/learning/**', (route) => route.fulfill({ json: { success: true, data: { class: '10', section: 'A', subjects: [], exams: [], capabilities: { ai: { available: true } } } } }));
  await page.goto('/student/learn?tab=practice');
  const box = page.getByRole('checkbox').first();
  await expect(box).toBeVisible();
  const accent = await box.evaluate((e) => getComputedStyle(e).accentColor);
  const brand = await page.evaluate(() => { const p = document.createElement('i'); p.style.color = getComputedStyle(document.documentElement).getPropertyValue('--brand'); document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; });
  expect(accent).toBe(brand);
});

// Learning AI: on a desktop the title, class and the four sections are one bordered panel at the top, and the tutor panel
// starts right under it with all four prompt cards clear of the typing box.
const learnContext = { class: '10', section: 'A', subjects: ['Mathematics'], exams: [], capabilities: { ai: { available: true }, historyDays: 180 } };
for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768]]) {
  test(`Learning AI header is a bordered panel with the sections inside, and the tutor panel starts under it at ${width}x${height}`, async ({ page }) => {
    await page.route('**/api/learning/**', (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api\/learning/, '');
      return route.fulfill({ json: { success: true, data: path === '/context' ? learnContext : [] } });
    });
    await page.setViewportSize({ width, height });
    await signIn(page, 'student');
    await page.goto('/student/learn');
    const head = page.locator('.ea-learn__head');
    await expect(head).toBeVisible();
    const box = await head.boundingBox();
    const style = await head.evaluate((e) => { const s = getComputedStyle(e); return { w: s.borderTopWidth, r: s.borderTopLeftRadius, bg: s.backgroundColor }; });
    expect(style.w).toBe('1px');
    expect(parseFloat(style.r)).toBeGreaterThanOrEqual(12);
    // The title, the class and all four sections are inside the panel.
    await expect(head.getByRole('heading', { name: 'Learning AI' })).toBeVisible();
    await expect(head.getByText('Class 10-A')).toBeVisible();
    for (const name of ['AI Tutor', 'Practice & Assessment', 'Revision Planner', 'Learning Progress']) {
      const tab = await head.getByRole('tab', { name }).boundingBox();
      expect(tab.y).toBeGreaterThanOrEqual(box.y);
      expect(tab.y + tab.height).toBeLessThanOrEqual(box.y + box.height);
    }
    // The tutor panel starts right under the header (it used to start about 230 px down), and is tall.
    const tutor = await page.locator('.ea-learn__tutor').boundingBox();
    expect(tutor.y).toBeGreaterThanOrEqual(box.y + box.height);
    expect(tutor.y - (box.y + box.height)).toBeLessThanOrEqual(24);
    expect(tutor.y).toBeLessThanOrEqual(190);
    // All four prompt cards stay clear of the typing box.
    const composer = await page.locator('.ea-learn__composer').boundingBox();
    for (const card of await page.locator('.ea-learn__starter').all()) {
      const r = await card.boundingBox();
      expect(r.y + r.height).toBeLessThanOrEqual(composer.y);
    }
  });
}
