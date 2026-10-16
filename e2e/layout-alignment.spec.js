import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// One frame for every signed-in screen (see "Page frame" in index.css). On a desktop, in all four portals:
//   - the page title starts one gutter (32 px) right of the sidebar, at the same height;
//   - the content starts on the same line as the title (nothing is centred in a wider area or pushed further in);
//   - the content is as wide as the page's purpose allows: "read" (forms, detail views: 1040 px), "wide" (dashboards,
//     timetables, results, Learning AI: 1200 px) or "full" (admin tables: the whole area), never wider.
// Widths differ by purpose on purpose; the left edge and the title position do not. A list or overview page fills the
// frame (up to 1280 px, centred beyond that); a form or detail page keeps a reading width (1040 px) on the same left edge.
// Below 1024 px the portals use the phone app bar, and the check is that content keeps the phone gutter.

const ROUTES = {
  student: { home: 'wide', notifications: 'wide', timetable: 'wide', notes: 'wide', learn: 'wide', result: 'wide', attendance: 'wide', fee: 'wide', bus: 'map', 'apply-leave': 'wide', chat: 'wide', profile: 'wide' },
  parent: { home: 'wide', notifications: 'wide', attendance: 'wide', result: 'wide', fee: 'wide', bus: 'map', calendar: 'wide', 'apply-leave': 'wide', chat: 'wide', profile: 'wide' },
  teacher: { home: 'wide', attendance: 'wide', marks: 'wide', students: 'wide', upload: 'read', timetable: 'wide', leave: 'wide', notifications: 'wide', chat: 'wide', profile: 'wide' },
  admin: { '': 'full', students: 'full', 'students/add': 'read', teachers: 'full', fees: 'full', exams: 'full', leaves: 'full', library: 'full', communications: 'full', settings: 'full', academic: 'read', timetable: 'full', 'hr-management': 'full', reports: 'full', admissions: 'full', 'event-calendar': 'full', ask: 'full', 'bulk-operations': 'full', 'year-end': 'wide', 'id-card-generator': 'full', 'fee-reports': 'full', 'fee-structure': 'full', results: 'full', salaries: 'full', 'user-management': 'wide', 'attendance-reports': 'full', activity: 'wide', parents: 'full', 'parents/add': 'read', 'teachers/add': 'read', transport: 'full' },
};
const WIDTH = { read: 1040, wide: 1280 };
const SIDEBAR = 260;
const GUTTER = 32;

// The title and the content blocks of the page as drawn: cards, bars and bands (anything with a fill or a border),
// not text inside them. Fixed and absolutely placed layers (Ask button, sheets, map overlays) are not page content.
function measure() {
  const root = document.querySelector('#admin-main') || document.querySelector('.ea-scroll');
  const title = [...root.querySelectorAll('h1')].find((e) => e.getBoundingClientRect().width > 0);
  const pageBg = getComputedStyle(root).backgroundColor;
  const area = root.getBoundingClientRect();
  const blocks = [];
  for (const el of root.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width < 160 || r.height < 24 || r.top > innerHeight * 1.5) continue;
    // The page's own background (a wrapper as wide as the whole area) is not a content block.
    if (r.left <= area.left + 1 && r.right >= area.right - 1) continue;
    const s = getComputedStyle(el);
    if (s.position === 'fixed' || s.position === 'absolute' || s.visibility === 'hidden') continue;
    // Layers inside the page only (the admin shell itself is a fixed frame around the page).
    const layer = el.closest('[style*="position: fixed"], [style*="position: absolute"], .ea-bus-panel, table, [role="dialog"]');
    if (layer && root.contains(layer)) continue;
    const filled = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== pageBg;
    const bordered = parseFloat(s.borderLeftWidth) > 0 && parseFloat(s.borderRightWidth) > 0;
    if (filled || bordered || s.backgroundImage !== 'none') blocks.push([Math.round(r.left), Math.round(r.right)]);
  }
  // On a home dashboard the title is inside the coloured band: the band is what starts on the line.
  const t = (title?.closest('.ea-pd-band') || title)?.getBoundingClientRect();
  return {
    title: t ? [Math.round(t.left), Math.round(t.top)] : null,
    left: Math.min(...blocks.map((b) => b[0])),
    right: Math.max(...blocks.map((b) => b[1])),
    area: Math.round(root.getBoundingClientRect().right),
  };
}

for (const [role, routes] of Object.entries(ROUTES)) {
  for (const width of [1024, 1280, 1440]) {
    test(`${role} pages share one frame at ${width}px`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width, height: 900 });
      await signIn(page, role);
      const edge = SIDEBAR + GUTTER;
      const problems = [];
      for (const [path, purpose] of Object.entries(routes)) {
        await page.goto(`/${role}/${path}`.replace(/\/$/, ''));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(400);
        const m = await page.evaluate(measure);
        const where = `/${role}/${path}`;
        if (purpose === 'map') {
          // The bus map fills the area by design; its header card floats on the frame like every page title.
          const head = await page.locator('.ea-bus-head').boundingBox();
          if (!head || Math.abs(head.x - edge) > 1 || Math.abs(head.y - 28) > 2) problems.push(`${where}: header card at ${head && [head.x, head.y]}`);
          continue;
        }
        if (m.title && Math.abs(m.title[0] - edge) > 1) problems.push(`${where}: title at x=${m.title[0]}, expected ${edge}`);
        if (Math.abs(m.left - edge) > 1) problems.push(`${where}: content starts at x=${m.left}, expected ${edge}`);
        const max = purpose === 'full' ? m.area - GUTTER : Math.min(edge + WIDTH[purpose], m.area - GUTTER);
        if (m.right > max + 1) problems.push(`${where}: content ends at x=${m.right}, wider than ${purpose} (${max})`);
        if (purpose !== 'read' && m.right < max - 1) problems.push(`${where}: content ends at x=${m.right}, short of the ${purpose} column (${max})`);
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
}

// The title sits at the same height on every header page of a portal (the home dashboards open with their band).
test('page titles sit at the same height across portals', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const tops = new Map();
  for (const [role, routes] of Object.entries(ROUTES)) {
    await signIn(page, role);
    for (const path of Object.keys(routes).filter((p) => !['', 'home', 'bus'].includes(p))) {
      await page.goto(`/${role}/${path}`);
      await page.waitForLoadState('networkidle');
      const m = await page.evaluate(measure);
      if (m.title) tops.set(`/${role}/${path}`, m.title[1]);
    }
    await page.evaluate(() => { localStorage.removeItem('eduamigo_user'); localStorage.removeItem('token'); });
  }
  const odd = [...tops].filter(([, top]) => Math.abs(top - 28) > 2).map(([p, top]) => `${p}: title top ${top}`);
  expect(odd, odd.join('\n')).toEqual([]);
});

// Phones and tablets: no sidebar; every page's content starts on the same 16 px gutter (the app bar spans the width).
for (const [role, routes] of Object.entries(ROUTES)) {
  for (const width of [390, 768]) {
    test(`${role} pages keep the phone gutter at ${width}px`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width, height: 900 });
      await signIn(page, role);
      const problems = [];
      for (const [path, purpose] of Object.entries(routes)) {
        if (purpose === 'map') continue;
        await page.goto(`/${role}/${path}`.replace(/\/$/, ''));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(400);
        const m = await page.evaluate(measure);
        if (Math.abs(m.left - 16) > 1) problems.push(`/${role}/${path}: content starts at x=${m.left}, expected 16`);
        if (m.right > width - 16 + 1) problems.push(`/${role}/${path}: content ends at x=${m.right}, past the gutter (${width - 16})`);
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
}

// A very wide screen: the frame (1280 px) is centred in the area, and every page of a portal still starts on the same
// line (read and wide pages share a left edge; nothing drifts to one side).
for (const role of Object.keys(ROUTES)) {
  test(`${role} pages share one centred frame at 1920px`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1920, height: 1000 });
    await signIn(page, role);
    const problems = [];
    for (const [path, purpose] of Object.entries(ROUTES[role])) {
      if (purpose === 'map') continue;
      await page.goto(`/${role}/${path}`.replace(/\/$/, ''));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);
      const m = await page.evaluate(measure);
      const expected = SIDEBAR + Math.max(GUTTER, Math.round((m.area - SIDEBAR - WIDTH.wide) / 2));
      const where = `/${role}/${path}`;
      if (m.title && Math.abs(m.title[0] - expected) > 2) problems.push(`${where}: title at x=${m.title[0]}, expected ${expected}`);
      if (Math.abs(m.left - expected) > 2) problems.push(`${where}: content starts at x=${m.left}, expected ${expected}`);
      if (m.right > expected + WIDTH.wide + 2) problems.push(`${where}: content ends at x=${m.right}, wider than the frame`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

// Learning AI: the typing box is pinned to the bottom of the tutor card on every screen size (it used to follow the
// last message, leaving the lower half of a wide screen empty), the card fits the screen, and nothing scrolls sideways.
for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844]]) {
  test(`Learning AI keeps its typing box at the bottom of the card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await signIn(page, 'student');
    await page.goto('/student/learn');
    await page.waitForLoadState('networkidle');
    const card = await page.locator('.ea-learn__tutor').boundingBox();
    const box = await page.locator('.ea-learn__composer').boundingBox();
    const input = page.getByLabel('Your question');
    await expect(input).toBeVisible();
    // The composer ends within one margin of the card's bottom edge, and the card ends within the visible screen.
    expect(card.y + card.height - (box.y + box.height)).toBeLessThanOrEqual(18);
    expect(card.y + card.height).toBeLessThanOrEqual(height);
    expect(box.x).toBeGreaterThanOrEqual(card.x);
    expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Typing works from the keyboard.
    await input.fill('What is photosynthesis?');
    await expect(input).toHaveValue('What is photosynthesis?');
  });
}
