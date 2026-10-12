// End-to-end tests: the real app in Chrome against the backend's in-memory demo (npm run demo; fresh demo data each start).
// Uses the Chrome installed on this machine (channel: 'chrome'), so no browser download is needed.
//   npx playwright test            run everything (starts the demo backend and Vite if they are not running)
//   npx playwright test --ui       interactive
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  workers: 1, // the demo data is shared, and some tests change it
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'npm run demo', cwd: '../eduamigo-backend', url: 'http://localhost:8000/api/health', reuseExistingServer: true, timeout: 180_000 },
    { command: 'npx vite --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 60_000 },
  ],
});
