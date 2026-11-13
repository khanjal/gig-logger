import { defineConfig } from '@playwright/test';
import { APP_ORIGIN, E2E_PORT } from './e2e/support/stub-backend';
import { SCREENSHOT_FORM_FACTORS, SCREENSHOT_SIZES } from './e2e-screenshots/manifest-screenshots';

const SERVER_START_TIMEOUT_MS = 180_000;

// Regenerates the PWA install-preview screenshots listed in src/manifest.json (npm run
// screenshots). Kept apart from playwright.config.ts so `npm run e2e` never rewrites assets.
// Backend, Google and S3 are stubbed exactly as in the e2e suite.
export default defineConfig({
  testDir: './e2e-screenshots',
  testMatch: '*.spec.ts',
  // One worker: every project shares the same dev server and writes into src/assets.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: APP_ORIGIN,
    serviceWorkers: 'block',
    colorScheme: 'light',
    deviceScaleFactor: 1,
  },
  projects: SCREENSHOT_FORM_FACTORS.map(formFactor => ({
    name: formFactor,
    use: { viewport: SCREENSHOT_SIZES[formFactor] },
  })),
  webServer: {
    command: `npm start -- --port ${E2E_PORT} --proxy-config src/proxy.empty.json`,
    url: APP_ORIGIN,
    reuseExistingServer: true,
    stdout: 'ignore',
    timeout: SERVER_START_TIMEOUT_MS,
  },
});
