import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';
import { sheetEntity, shiftRow, tripRow } from './support/sheet-fixture';

const SYNC_MODAL_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 90_000;
const SELECT_TIMEOUT_MS = 10_000;
const SHIFT_LABEL = 'DoorDash #1';
const EDIT_TRIP_ROUTE = /\/trips\/edit\/2$/;
// The trip form defers its own hydration with setTimeout(0) while the page looks the trip up in
// the local database; on a slow device the lookup wins (#503, #474). Holding back only that one
// callback (recognised by the load() call it makes) makes that order the one the test always sees,
// with no throttling or sleeps, and leaves Material's own timers alone.
const DEFERRED_TIMER_DELAY_MS = 1_500;

async function loadSheet(page: Page): Promise<void> {
  await page.goto('/setup');
  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  await page.getByRole('button', { name: /Select/ }).click();
  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await expect(syncModal).toBeHidden({ timeout: SYNC_MODAL_TIMEOUT_MS });
}

// The edit form's Shift/Batch/Group select must show the trip's shift when the edit route is the
// first page loaded, whichever of the form's own load and the trip lookup finishes first.
test('edit trip form shows the trip shift when opened directly when the trip arrives before the form load', async ({ page, context }) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await signIn(context);
  await stubBackend(context);
  await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, {
    sheetEntity: sheetEntity({ shifts: [shiftRow()], trips: [tripRow()] }),
  }));
  await loadSheet(page);

  await page.addInitScript(delayMs => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      nativeSetTimeout(handler, timeout === 0 && String(handler).includes('.load()') ? delayMs : timeout, ...args)) as typeof window.setTimeout;
  }, DEFERRED_TIMER_DELAY_MS);
  await page.goto('/trips/edit/2');
  await expect(page).toHaveURL(EDIT_TRIP_ROUTE);
  await expect(page.getByLabel('Place')).toHaveValue(tripRow()['place'] as string, { timeout: SELECT_TIMEOUT_MS });
  await expect(page.locator('mat-select[name="shift"]')).toContainText(SHIFT_LABEL, { timeout: SELECT_TIMEOUT_MS });
});
