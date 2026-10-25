import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// The Bus page on a desktop with no trip running: the whole route is on the map, the title card sits top left, the stops panel rests
// at the bottom right and never covers the title card, and both stay inside the page.

for (const role of ['student', 'parent']) {
  for (const width of [1024, 1100, 1279, 1280]) {
    test(`${role} bus: the title card and the resting stops panel do not overlap at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await signIn(page, role);
      await page.goto(`/${role}/bus`);
      const head = page.locator('.ea-bus-head');
      await expect(head).toBeVisible();
      await expect(page.getByTestId('bus-live-badge')).toContainText(/not on route/i);
      const panel = page.locator('.ea-bus-panel');
      await expect(panel).toBeVisible();
      await expect(page.locator('.ea-bus-leaflet')).toBeVisible();
      const h = await head.boundingBox();
      const p = await panel.boundingBox();
      const area = await page.locator('.ea-scroll').boundingBox();

      // At rest the panel is only its summary, at the bottom; the title card is at the top: they cannot meet.
      expect(p.height).toBeLessThan(200);
      expect(h.y + h.height + 16).toBeLessThanOrEqual(p.y);
      expect(h.x).toBeGreaterThanOrEqual(area.x);
      expect(p.x + p.width).toBeLessThanOrEqual(area.x + area.width);
      expect(p.y + p.height).toBeLessThanOrEqual(800);

      // Pulled up, the panel shows its content and still stays inside the page.
      await page.locator('.ea-bus-grip').click();
      await expect(panel.getByText('Route Stops')).toBeVisible();
      await expect(panel.getByRole('link', { name: /Call/ }).or(panel.getByRole('button', { name: /Call/ })).first()).toBeVisible();
      const open = await panel.boundingBox();
      expect(open.y).toBeGreaterThan(h.y + h.height);
      expect(open.y + open.height).toBeLessThanOrEqual(800);
      // Nothing scrolls sideways.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
