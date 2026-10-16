import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Notification cards: the unread state comes from theme tokens (a tint of the school colour and a bar), not from fixed
// colours, so it reads in the light and the dark portal. The two portals that show notices share one card style.

const now = new Date().toISOString();
const items = (readKey) => [
  { _id: 'n1', title: 'Unit Test 2 scheduled', message: 'Mathematics, Fri 17 Oct, 10:00-11:30', type: 'general', [readKey]: false, createdAt: now },
  { _id: 'n2', title: 'Attendance marked', message: 'Marked Present today.', type: 'attendance', [readKey]: true, createdAt: now },
];

// Contrast of a text colour on the card's own background.
function measure() {
  const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return c.startsWith('color(') ? m.slice(0, 3).map((v) => v * 255).concat(m[3] ?? 1) : m; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (fg, bg) => { const a = lum(fg), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const cards = [...document.querySelectorAll('.ea-notice')];
  const brand = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
  const probe = document.createElement('i'); probe.style.color = brand; document.body.appendChild(probe);
  const brandRgb = getComputedStyle(probe).color; probe.remove();
  return {
    brandRgb,
    cards: cards.map((c) => {
      const s = getComputedStyle(c);
      const bg = parse(s.backgroundColor);
      const text = [...c.querySelectorAll('div')].filter((d) => d.children.length === 0 && d.textContent.trim());
      return {
        unread: c.classList.contains('is-unread'), bg: s.backgroundColor, bgLum: lum(bg), bar: s.borderLeftColor, barWidth: s.borderLeftWidth,
        minRatio: Math.min(...text.map((t) => ratio(parse(getComputedStyle(t).color), bg))),
      };
    }),
  };
}

for (const [role, readKey, dark] of [['student', 'read', 0], ['student', 'read', 1], ['parent', 'isRead', 0], ['parent', 'isRead', 1]]) {
  test(`${role} notifications: unread follows the theme in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
    await page.route('**/api/notifications/my', (r) => r.fulfill({ json: { success: true, data: items(readKey) } }));
    await page.route('**/api/notifications/*/read', (r) => r.fulfill({ json: { success: true } }));
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, role);
    if (dark) await page.evaluate(() => { localStorage.setItem('themeVer', '2'); localStorage.setItem('darkMode', 'true'); });
    await page.goto(`/${role}/notifications`);
    await expect(page.getByText('Unit Test 2 scheduled')).toBeVisible();
    const m = await page.evaluate(measure);
    const unread = m.cards.find((c) => c.unread);
    const read = m.cards.find((c) => !c.unread);
    expect(unread && read).toBeTruthy();
    // Unread is visibly different, carries the brand bar, and read has no bar.
    expect(unread.bg).not.toBe(read.bg);
    expect(unread.bar).toBe(m.brandRgb);
    expect(unread.barWidth).toBe('3px');
    // Not the old fixed blues (rgb(239, 246, 255) in light, rgb(30, 58, 95) in dark).
    expect(unread.bg).not.toBe('rgb(239, 246, 255)');
    expect(unread.bg).not.toBe('rgb(30, 58, 95)');
    // The card is dark in dark mode and light in light mode (it follows the surface), and its text stays readable.
    for (const c of m.cards) {
      if (dark) expect(c.bgLum).toBeLessThan(0.15); else expect(c.bgLum).toBeGreaterThan(0.6);
      expect(c.minRatio).toBeGreaterThanOrEqual(4.5);
    }
    // Opening an unread notice marks it read (behaviour is unchanged).
    await page.getByText('Unit Test 2 scheduled').click();
    await expect(page.locator('.ea-notice.is-unread')).toHaveCount(0);
  });
}
