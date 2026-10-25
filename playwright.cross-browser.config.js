// Cross-browser smoke run (Firefox and WebKit, the Safari engine):
//   npx playwright test -c playwright.cross-browser.config.js e2e/auth.spec.js e2e/roles.spec.js
// Needs the test backend and Vite already running on E2E_API_PORT / E2E_WEB_PORT, and `npx playwright install firefox webkit` once.
import { defineConfig } from '@playwright/test';
const API = process.env.E2E_API_PORT || 8190, WEB = process.env.E2E_WEB_PORT || 5190;
export default defineConfig({
  testDir: './e2e', timeout: 60000, workers: 1, reporter: [['list']],
  use: { baseURL: `http://localhost:${WEB}` },
  projects: [{ name: 'firefox', use: { browserName: 'firefox' } }, { name: 'webkit', use: { browserName: 'webkit' } }],
});
