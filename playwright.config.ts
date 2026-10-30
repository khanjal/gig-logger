import { defineConfig, devices } from '@playwright/test';
import { APP_ORIGIN, E2E_PORT } from './e2e/support/stub-backend';

const SERVER_START_TIMEOUT_MS = 180_000;
const isCI = !!process.env['CI'];

// Browser E2E tests (#492). Every request to the backend, Google and the S3 bucket is
// stubbed in e2e/support, so these run offline and never touch a real spreadsheet.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: APP_ORIGIN,
    // The service worker would answer requests before page.route sees them.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // The empty proxy config sidesteps #490 (proxy.conf.json breaks ng serve).
    command: `npm start -- --port ${E2E_PORT} --proxy-config src/proxy.empty.json`,
    url: APP_ORIGIN,
    reuseExistingServer: !isCI,
    // In CI a compile error would otherwise surface only as a silent start timeout.
    stdout: isCI ? 'pipe' : 'ignore',
    timeout: SERVER_START_TIMEOUT_MS,
  },
});
