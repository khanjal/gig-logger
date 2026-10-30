import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_START_TIMEOUT_MS = 180_000;

// Browser E2E tests (#492). Every request to the backend, Google and the S3 bucket is
// stubbed in e2e/support, so these run offline and never touch a real spreadsheet.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    // The service worker would answer requests before page.route sees them.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // The empty proxy config sidesteps #490 (proxy.conf.json breaks ng serve).
    command: 'npm start -- --proxy-config src/proxy.empty.json',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: SERVER_START_TIMEOUT_MS,
  },
});
