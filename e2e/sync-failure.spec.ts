import { expect, test } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';

// A server error fetching the sheet must end in a visible error and a usable Close button.
// Drives the real first-time path: link a sheet from the list, which triggers the load.
// (The client-side rejection fixed in 13d92962 is a different path, not covered here.)
test('a failed sheet load shows an error and lets the sync modal close', async ({ page, context }) => {
  await signIn(context);
  await stubBackend(page);
  await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, { message: 'boom' }, 500));

  await page.goto('/setup');

  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  // An aborted request would produce the same error line, so prove the 500 was served.
  const failedLoad = page.waitForResponse(r =>
    r.url() === `${API_BASE}/sheets/all` && r.request().method() === 'GET' && r.status() === 500);
  await page.getByRole('button', { name: /Select/ }).click();
  await failedLoad;

  const modal = page.locator('app-data-sync-modal');
  await expect(modal).toBeVisible();

  const failedStep = modal.locator('.text-error', { hasText: 'Getting sheet data... ERROR' });
  await expect(failedStep).toBeVisible();
  await expect(modal.getByText('Auto-close disabled')).toBeVisible();

  const close = modal.getByRole('button', { name: /Close/ });
  await expect(close).toBeEnabled();
  await close.click();
  await expect(modal).toBeHidden();
});
