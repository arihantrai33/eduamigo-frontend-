// The public website at "/": what a first-time visitor sees, the demo form, and who does NOT see it.
import { test, expect } from '@playwright/test';
import { signIn } from './helpers.js';

const unique = () => `visitor${Date.now()}${Math.floor(Math.random() * 1e4)}@school.example`;

async function fill(page, over = {}) {
  const v = { name: 'Asha Verma', school: 'Green Valley Public School', email: unique(), ...over };
  await page.getByLabel('Your name').fill(v.name);
  await page.getByLabel('School name').fill(v.school);
  await page.getByLabel('Email').fill(v.email);
  return v;
}

test.describe('landing page', () => {
  test('a first-time visitor sees what EduAmigo is, with working sign-in and demo links, and no console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Less paperwork');
    await expect(page).toHaveTitle(/EduAmigo/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /attendance, fees, results/);
    // One main landmark, and the sections the navigation points to exist.
    await expect(page.getByRole('main')).toHaveCount(1);
    for (const id of ['why', 'features', 'ai', 'start', 'demo', 'faq']) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(errors).toEqual([]);
  });

  test('no horizontal scroll and no clipped content at the test widths', async ({ page }) => {
    for (const [width, height] of [[320, 568], [375, 812], [430, 932], [768, 1024], [1366, 768], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const out = [...document.querySelectorAll('.lp *')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > vw + 1 || r.left < -1) && !el.closest('.lp-trap') && !el.closest('.lp-orb') && !el.closest('.lp-marquee') && !el.classList.contains('lp-orb');
        }).slice(0, 3).map((el) => `${el.tagName}.${el.className}`);
        return { scroll: document.documentElement.scrollWidth - vw, out };
      });
      expect(m, `${width}px`).toEqual({ scroll: 0, out: [] });
    }
  });

  test('on a phone the menu opens, links close it, and Escape closes it too', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const burger = page.getByRole('button', { name: 'Open menu' });
    await expect(page.getByRole('link', { name: 'FAQ' }).first()).toBeHidden();
    await burger.click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#lp-drawer').getByRole('link', { name: 'FAQ' }).click();
    await expect(page.locator('#lp-drawer')).toHaveCount(0);
    await expect(page.locator('#faq')).toBeInViewport();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lp-drawer')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('the AI chat plays by itself, and the page no longer claims a fixed set of portals', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lp-chat').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(page.locator('.lp-chat .lp-msg--me').first()).toContainText('Solve 2x + 3 = 11', { timeout: 10_000 });
    await expect(page.locator('.lp-chat .lp-msg--ai').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.lp-ai__art')).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByText(/four portals|role portals/i)).toHaveCount(0);
  });

  test('"A day in your school" stays on screen and its device follows the scroll, and a step can be clicked', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto('/');
    const day = page.locator('#day');
    await day.waitFor();
    const at = (f) => page.evaluate((f) => { const el = document.getElementById('day'); window.scrollTo(0, el.offsetTop - 68 + f * (el.offsetHeight - innerHeight)); }, f);
    await at(0.02);
    await expect(page.getByRole('button', { name: /Morning attendance/ })).toHaveAttribute('aria-current', 'step');
    await at(0.5);
    await expect(page.getByRole('button', { name: /The school bus, live/ })).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('.lp-day__head b')).toHaveText('Live bus');
    await page.getByRole('button', { name: /Doubts, answered/ }).click();
    await expect(page.getByRole('button', { name: /Doubts, answered/ })).toHaveAttribute('aria-current', 'step', { timeout: 5000 });
  });

  test('FAQ answers open and close', async ({ page }) => {
    await page.goto('/');
    const q = page.getByText('Can parents pay fees online?');
    await q.scrollIntoViewIfNeeded();
    await q.click();
    await expect(page.getByText('Each school connects its own Razorpay account')).toBeVisible();
    await q.click();
    await expect(page.getByText('Each school connects its own Razorpay account')).toBeHidden();
  });
});

test.describe('demo request form', () => {
  test('empty required fields are named under the field and focus moves to the first one', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Request a demo' }).last().click();
    await expect(page.getByText('Enter your name.')).toBeVisible();
    await expect(page.getByText("Enter your school's name.")).toBeVisible();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByLabel('Your name')).toBeFocused();
    await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true');
    // Typing clears that field's message.
    await page.getByLabel('Your name').fill('Asha');
    await expect(page.getByText('Enter your name.')).toBeHidden();
  });

  test('a bad email and a bad phone are refused before anything is sent', async ({ page }) => {
    let sent = 0;
    await page.route('**/api/public/demo-requests', (r) => { sent++; r.abort(); });
    await page.goto('/');
    await fill(page, { email: 'not-an-email' });
    await page.getByLabel('Phone (optional)').fill('call me');
    await page.getByRole('button', { name: 'Request a demo' }).last().click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Enter a valid phone number')).toBeVisible();
    expect(sent).toBe(0);
  });

  test('a valid request is sent once, even with a double click, and the visitor sees a thank-you', async ({ page }) => {
    let sent = 0;
    let body;
    await page.route('**/api/public/demo-requests', async (route) => {
      sent++;
      body = route.request().postDataJSON();
      await new Promise((r) => setTimeout(r, 400));
      await route.fallback();
    });
    await page.goto('/');
    const v = await fill(page);
    const submit = page.getByRole('button', { name: 'Request a demo' }).last();
    await submit.dblclick();
    await expect(page.getByText('Thank you. We have your request.')).toBeVisible();
    await expect(page.getByRole('status')).toContainText(v.email);
    expect(sent).toBe(1);
    expect(body).toMatchObject({ name: 'Asha Verma', schoolName: 'Green Valley Public School', website: '' });
  });

  test('the server saying "too many" or failing shows a message and keeps what was typed', async ({ page }) => {
    await page.goto('/');
    const v = await fill(page);
    await page.route('**/api/public/demo-requests', (r) => r.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Too many requests from this network. Please try again later.' }) }));
    await page.getByRole('button', { name: 'Request a demo' }).last().click();
    await expect(page.getByRole('alert')).toContainText('Too many requests');
    await page.unroute('**/api/public/demo-requests');
    await page.route('**/api/public/demo-requests', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'boom' }) }));
    await page.getByRole('button', { name: 'Request a demo' }).last().click();
    await expect(page.getByRole('alert')).toContainText('Your details were not sent');
    await expect(page.getByLabel('Email')).toHaveValue(v.email);
    await expect(page.getByRole('button', { name: 'Request a demo' }).last()).toBeEnabled();
  });

  test('no connection shows a plain message, and the next try can succeed', async ({ page }) => {
    await page.goto('/');
    await fill(page);
    await page.route('**/api/public/demo-requests', (r) => r.abort('internetdisconnected'));
    await page.getByRole('button', { name: 'Request a demo' }).last().click();
    await expect(page.getByRole('alert')).toContainText("Can't reach EduAmigo");
    await page.unroute('**/api/public/demo-requests');
    await page.getByRole('button', { name: 'Request a demo' }).last().click();
    await expect(page.getByText('Thank you. We have your request.')).toBeVisible();
  });

  test('server field errors are shown under the fields', async ({ page }) => {
    await page.route('**/api/public/demo-requests', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Please check the highlighted fields.', fieldErrors: { email: 'Enter a valid email address.' } }) }));
    await page.goto('/');
    await fill(page);
    await page.getByRole('button', { name: 'Request a demo' }).last().click();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeFocused();
  });
});

test.describe('who sees the landing page', () => {
  test('a device that already chose its school goes straight to sign-in', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('eduamigo_school', JSON.stringify({ code: 'GVPS', name: 'GVPS' })));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Less paperwork. More teaching.' })).toHaveCount(0);
    await page.waitForURL(/\/login$/, { timeout: 10_000 });
  });

  test('an installed web app (standalone) opens the splash, not the website', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q));
    });
    await page.goto('/');
    await page.waitForURL(/\/select-school$/, { timeout: 10_000 });
    await ctx.close();
  });

  test('a signed-in person opening "/" goes to their portal', async ({ page }) => {
    await signIn(page, 'admin');
    await page.goto('/');
    await page.waitForURL(/\/admin/, { timeout: 10_000 });
  });
});


test('the privacy page is reachable from the website footer, says it is not yet the formal policy, and fits a phone', async ({ page }) => {
  await page.goto('/welcome');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy and data handling' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy and data handling' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('not yet the formal privacy policy');
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Back to the website' }).click();
  await expect(page).toHaveURL(/\/welcome$/);
});
