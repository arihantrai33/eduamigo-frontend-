import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// The Bus page on a desktop: "Bus not on route yet" sits in the space left of the stops panel, so the panel never
// covers it (between 1024 and 1279 px it did), and both stay readable inside the page.

for (const role of ['student', 'parent']) {
  for (const width of [1024, 1100, 1279, 1280]) {
    test(`${role} bus: the empty message and the stops panel do not overlap at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await signIn(page, role);
      await page.goto(`/${role}/bus`);
      const message = page.getByText(/Bus (is )?not on route yet/);
      await expect(message).toBeVisible();
      const panel = page.locator('.ea-bus-panel');
      await expect(panel).toBeVisible();
      const m = await message.boundingBox();
      const sub = await page.getByText('Trip has not started').boundingBox();
      const p = await panel.boundingBox();
      const area = await page.locator('.ea-scroll').boundingBox();

      // No overlap: the text block ends before the panel begins (with room to breathe).
      expect(m.x + m.width + 16).toBeLessThanOrEqual(p.x);
      expect(sub.x + sub.width + 16).toBeLessThanOrEqual(p.x);
      // Both are inside the page area and are readable: the message is not cut, the panel is not taller than the page.
      expect(m.x).toBeGreaterThanOrEqual(area.x);
      expect(p.x + p.width).toBeLessThanOrEqual(area.x + area.width);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y + p.height).toBeLessThanOrEqual(800);
      // The panel's own content is not clipped: its title and the call and SOS buttons are visible.
      await expect(panel.getByText('Route Stops')).toBeVisible();
      await expect(panel.getByRole('link', { name: /Call/ }).or(panel.getByRole('button', { name: /Call/ })).first()).toBeVisible();
      // Nothing scrolls sideways.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
