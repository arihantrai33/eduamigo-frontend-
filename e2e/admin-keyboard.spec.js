import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// The admin menu with the keyboard only: real links and buttons, a visible focus ring, focus kept after moving, a
// skip link, and on phones a menu that behaves as a dialog. Nothing is saved.

const focused = (page) => page.evaluate(() => {
  const el = document.activeElement;
  return { tag: el.tagName, text: (el.textContent || '').trim(), label: el.getAttribute('aria-label'), id: el.id, outline: getComputedStyle(el).outlineStyle };
});

// Presses Tab until the focused element's text or label matches (at most `max` presses).
async function tabTo(page, match, max = 60) {
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press('Tab');
    const f = await focused(page);
    if (match.test(f.text) || match.test(f.label || '')) return f;
  }
  throw new Error(`Tab never reached ${match}`);
}

test('desktop: skip link, menu links by Tab and Enter, focus kept, current page announced, visible ring', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/students');
  await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();

  const skip = await tabTo(page, /^Skip to main content$/, 5);
  expect(skip.tag).toBe('A');
  await page.keyboard.press('Enter');
  expect((await focused(page)).id).toBe('admin-main');

  const menu = page.getByRole('navigation', { name: 'Admin menu' });
  await expect(menu.getByRole('link', { name: 'All Students' })).toHaveAttribute('aria-current', 'page');
  await page.locator('#admin-main').blur();
  const library = await tabTo(page, /^Library$/);
  expect(library.tag).toBe('A');
  expect(library.outline).not.toBe('none'); // keyboard focus is visible
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/admin\/library$/);
  // The menu is not rebuilt on navigation, so focus stays on the entry that was used.
  expect((await focused(page)).text).toBe('Library');
  await expect(menu.getByRole('link', { name: 'Library' })).toHaveAttribute('aria-current', 'page');
  await expect(menu.getByRole('link', { name: 'All Students' })).not.toHaveAttribute('aria-current', 'page');

  const logout = await tabTo(page, /Log Out/);
  expect(logout.tag).toBe('BUTTON');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the menu button opens a dialog menu; Tab stays inside, Escape closes it and focus returns', async ({ page }) => {
    await signIn(page, 'admin');
    await page.goto('/admin/students');
    const open = page.getByRole('button', { name: 'Open menu' });
    await expect(open).toHaveAttribute('aria-expanded', 'false');

    const button = await tabTo(page, /^Open menu$/, 10);
    expect(button.tag).toBe('BUTTON');
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    expect((await focused(page)).label).toBe('Close menu');

    // Shift+Tab from the first control wraps to the last one (Log Out), and Tab wraps back.
    await page.keyboard.press('Shift+Tab');
    expect((await focused(page)).text).toBe('Log Out');
    await page.keyboard.press('Tab');
    expect((await focused(page)).label).toBe('Close menu');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    expect((await focused(page)).label).toBe('Open menu');

    // Open again and move with the keyboard: the menu closes on arrival.
    await page.keyboard.press('Enter');
    await expect(drawer).toBeVisible();
    await tabTo(page, /^Library$/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/admin\/library$/);
    await expect(drawer).toHaveCount(0);
  });
});
