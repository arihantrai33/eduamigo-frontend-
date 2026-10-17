import { test, expect } from '@playwright/test';
import { API, apiSession, signIn } from './helpers';

// Live bus tracking through the real backend (no mocks): a driver phone sends GPS readings, the server follows the stops, and
// the student's Bus screen shows the bus moving with its ETA, stop progress and signal. The backend runs with BUS_STALE_MS=6000.
// One driver screen test uses the browser's own (simulated) GPS, so the whole path phone -> server -> screen is exercised.

const STEP_MS = 5000;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

async function setup(request, role = 'student') {
  const student = await apiSession(request, role);
  const admin = await apiSession(request, 'admin');
  const mine = (await student.get('/transport/my-child-bus')).data;
  const token = (await admin.get('/transport')).data.find((b) => b._id === mine.busId).driverToken;
  const stops = [...mine.stops].sort((a, b) => a.order - b.order).map((s) => [s.latitude, s.longitude]);
  let clock = Date.now() - 10 * 60 * 1000;
  const base = `${API}/transport/driver/${token}`;
  const call = async (method, path, data) => (await request.fetch(`${base}${path}`, { method, data })).json();
  return {
    mine, token, stops,
    start: (data = {}) => call('PATCH', '/start-trip', data),
    end: () => call('PATCH', '/end-trip'),
    send: (points) => call('POST', '/location', { points }),
    snapshot: async () => (await student.get(`/transport/live/${mine.busId}`)).data,
    // n readings along stops[from] -> stops[to], one every five seconds. The clock starts ten minutes ago and only moves
    // forward (readings older than the last one are dropped), so a test can send many batches one after another.
    leg: (from, to, n, tFrom = 0, tTo = 1) => Array.from({ length: n }, (_, i) => {
      const [lat, lng] = lerp(stops[from], stops[to], tFrom + ((tTo - tFrom) * i) / Math.max(1, n - 1));
      clock += STEP_MS;
      return { lat, lng, accuracy: 6, at: clock };
    }),
  };
}

const bus = (page) => page.locator('.leaflet-marker-icon[title="School bus"]');
const transform = (page) => bus(page).evaluate((el) => el.style.transform);

test('the student watches the bus start, move along the road, pass stops, lose signal and finish', async ({ page, request }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  const t = await setup(request);
  expect(t.stops.length).toBeGreaterThanOrEqual(3);
  const started = await t.start();
  expect(started.success).toBe(true);

  await signIn(page, 'student');
  await page.goto('/student/bus');
  // The trip is on but the phone has not sent a position yet.
  await expect(page.getByText('The bus has started: waiting for its location')).toBeVisible();

  // First readings at the first stop: the map appears with the bus, and the badge says it is live.
  expect((await t.send(t.leg(0, 0, 3))).success).toBe(true);
  await expect(bus(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('bus-live-badge')).toContainText(/live/i);
  const stopMarkers = await page.locator('.leaflet-marker-icon').count();
  expect(stopMarkers).toBeGreaterThanOrEqual(t.stops.length + 1);
  const first = await transform(page);

  // Driving on towards the second stop: the marker moves, and the ETA to the last stop is now a number of minutes.
  const res = await t.send(t.leg(0, 1, 12, 0.05, 0.9));
  expect(res.data.accepted).toBeGreaterThanOrEqual(10);
  await expect.poll(() => transform(page), { timeout: 15_000 }).not.toBe(first);
  await expect(page.getByText(/\d+ min|Arriving/).first()).toBeVisible();
  const snap = await t.snapshot();
  expect(snap.signal).toBe('live');
  expect(snap.position.speedKmh).toBeGreaterThan(0);

  // Arriving at the second stop and leaving it moves the bus on, and the screen follows the server.
  await t.send([...t.leg(1, 1, 3), ...t.leg(1, 2, 6, 0.04, 0.5)]);
  await expect.poll(async () => (await t.snapshot()).currentStopIndex, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
  await expect(page.getByText('Bus is here now').first()).toBeVisible();

  // The phone goes quiet: after the stale time the screen says so instead of showing an old position as live.
  await expect(page.getByTestId('bus-live-badge')).toContainText(/signal lost/i, { timeout: 20_000 });
  // And a new reading brings it back.
  await t.send(t.leg(2, 2, 1).map((p) => ({ ...p, at: Date.now() })));
  await expect(page.getByTestId('bus-live-badge')).toContainText(/live/i, { timeout: 15_000 });

  // The trip ends: the map gives way to the "not on route" message.
  await t.end();
  await expect(page.getByText(/not on route yet/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('bus-live-badge')).toHaveCount(0);
});

test('the parent sees the same bus, with the stops in order and a real ETA instead of made-up times', async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  const t = await setup(request, 'parent');
  await t.start();
  await t.send(t.leg(0, 1, 8, 0, 0.6));
  await signIn(page, 'parent');
  await page.goto('/parent/bus');
  await expect(page.getByText(/Route/).first()).toBeVisible();
  await expect(page.getByTestId('bus-live-badge')).toContainText(/live|signal lost/i, { timeout: 20_000 });
  // No invented departure times such as "Departed at 7:12 AM".
  await expect(page.getByText(/Departed at 7:\d\d/)).toHaveCount(0);
  await t.end();
});

test('the driver screen sends the phone GPS, keeps readings while offline and sends them when the network is back', async ({ browser, request }) => {
  test.setTimeout(150_000);
  const t = await setup(request);
  await t.end().catch(() => {});
  const context = await browser.newContext({ permissions: ['geolocation'], geolocation: { latitude: t.stops[0][0], longitude: t.stops[0][1], accuracy: 8 } });
  const page = await context.newPage();
  await page.addInitScript((token) => { try { localStorage.setItem('driverToken', token); } catch { /* */ } }, t.token);
  await page.goto('/driver');
  await expect(page.getByText(t.mine.busNumber || /./).first()).toBeVisible();

  await page.getByRole('button', { name: 'Start Trip' }).click();
  await expect(page.getByText('GPS Connected')).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => (await t.snapshot()).status).toBe('On Route');
  await expect.poll(async () => (await t.snapshot()).position?.lat ?? null, { timeout: 20_000 }).not.toBeNull();
  await expect(page.getByText(/Location sent/)).toBeVisible({ timeout: 15_000 });

  // Driving: each new GPS reading reaches the server and moves the bus along the road.
  const before = (await t.snapshot()).position.routeMeters;
  // 25 m every 2.3 seconds is about 40 km/h; a faster jump would be refused as a GPS error.
  const walk = async (from, to) => {
    for (let i = from; i <= to; i += 1) {
      const [lat, lng] = lerp(t.stops[0], t.stops[1], i * 0.017);
      await context.setGeolocation({ latitude: lat, longitude: lng, accuracy: 8 });
      await page.waitForTimeout(2300);
    }
  };
  await walk(1, 8);
  await expect.poll(async () => (await t.snapshot()).position.routeMeters, { timeout: 20_000 }).toBeGreaterThan(before + 100);

  // No network: the readings are kept on the phone, the screen says so, and nothing is lost.
  await context.setOffline(true);
  await walk(9, 16);
  await expect(page.getByText(/No internet/)).toBeVisible({ timeout: 20_000 });
  const during = (await t.snapshot()).position.routeMeters;
  await context.setOffline(false);
  await expect.poll(async () => (await t.snapshot()).position.routeMeters, { timeout: 40_000 }).toBeGreaterThan(during + 100);
  await expect(page.getByText(/No internet/)).toHaveCount(0, { timeout: 20_000 });

  // Reloading the page in the middle of the trip does not lose it: the driver is back on the running trip.
  await page.reload();
  await expect(page.getByRole('button', { name: 'End Trip' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'End Trip' }).click();
  await expect.poll(async () => (await t.snapshot()).status, { timeout: 15_000 }).toBe('Completed');
  await context.close();
});
