// End-to-end tests: the real app in Chrome against the backend's in-memory demo (npm run demo; fresh demo data each start).
// Uses the Chrome installed on this machine (channel: 'chrome'), so no browser download is needed.
//   npx playwright test            run everything (starts the test backend and Vite if they are not running)
//   npx playwright test --ui       interactive
// The tests get their own backend and web server (ports 8100 and 5174 by default), never the demo someone may have
// open on 8000/5173: some tests write records (a fee payment, a leave, a notice, chat messages, attendance).
import { defineConfig } from '@playwright/test';

const API_PORT = process.env.E2E_API_PORT || 8100;
const WEB_PORT = process.env.E2E_WEB_PORT || 5174;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  workers: 1, // the demo data is shared, and some tests change it
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'npm run demo', cwd: '../eduamigo-backend', env: { PORT: String(API_PORT) }, url: `http://localhost:${API_PORT}/api/health`, reuseExistingServer: true, timeout: 180_000 },
    { command: `npx vite --port ${WEB_PORT} --strictPort`, env: { VITE_DEV_API_TARGET: `http://localhost:${API_PORT}` }, url: `http://localhost:${WEB_PORT}`, reuseExistingServer: true, timeout: 60_000 },
  ],
});
