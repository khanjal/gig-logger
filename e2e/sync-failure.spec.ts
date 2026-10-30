import { expect, test } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';

// A failed load must end in a visible error and a usable Close button - the sync modal has
// stalled silently on load failures before (13d92962). Drives the real first-time path:
// link a sheet from the list, which triggers the load.
test('a failed sheet load shows an error and lets the sync modal close', async ({ page, context }) => {
  await signIn(context);
  await stubBackend(page);
  await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, { message: 'boom' }, 500));

  await page.goto('/setup');

  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  await page.getByRole('button', { name: /Select/ }).click();

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
