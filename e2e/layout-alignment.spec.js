import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// One frame for every signed-in screen (see "Page frame" in index.css). On a desktop, in all four portals:
//   - the page title starts one gutter (32 px) right of the sidebar, at the same height;
//   - the content starts on the same line as the title (nothing is centred in a wider area or pushed further in);
//   - the content is as wide as the page's purpose allows: "read" (forms, lists: 880 px), "wide" (dashboards,
//     timetables, results, Learning AI: 1200 px) or "full" (admin tables: the whole area), never wider.
// Widths differ by purpose on purpose; the left edge and the title position do not.
// Below 1024 px the portals use the phone app bar, and the check is that content keeps the phone gutter.

const ROUTES = {
  student: { home: 'wide', notifications: 'read', timetable: 'wide', notes: 'read', learn: 'wide', result: 'wide', attendance: 'read', fee: 'read', bus: 'map', 'apply-leave': 'wide', chat: 'read', profile: 'read' },
  parent: { home: 'wide', notifications: 'read', attendance: 'wide', result: 'read', fee: 'read', bus: 'map', calendar: 'read', 'apply-leave': 'wide', chat: 'read', profile: 'read' },
  teacher: { home: 'wide', attendance: 'read', marks: 'read', students: 'read', upload: 'read', timetable: 'wide', leave: 'read', notifications: 'read', chat: 'read', profile: 'read' },
  admin: { '': 'full', students: 'full', 'students/add': 'read', teachers: 'full', fees: 'full', exams: 'full', leaves: 'full', library: 'full', communications: 'full', settings: 'full', academic: 'read', timetable: 'full', 'hr-management': 'full', reports: 'full', admissions: 'full', 'event-calendar': 'full' },
};
const WIDTH = { read: 880, wide: 1200 };
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
  const t = title?.getBoundingClientRect();
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
