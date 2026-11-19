import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';
import { FIRST_ROW_ID, sheetEntity, shiftRow, tripRow } from './support/sheet-fixture';

const SYNC_MODAL_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 90_000;
const SELECT_TIMEOUT_MS = 10_000;
const SHIFT_LABEL = 'DoorDash #1';
const EDIT_TRIP_PATH = `/trips/edit/${FIRST_ROW_ID}`;
// The trip form defers its own hydration with setTimeout(0) while the page looks the trip up in
// the local database; on a slow device the lookup wins (#503, #474). Holding back only that one
// callback (recognised by the load() call it makes) makes that order the one the test always sees,
// with no throttling or sleeps, and leaves Material's own timers alone.
const DEFERRED_TIMER_DELAY_MS = 1_500;
// Source text of the form's deferred callback; if it is renamed the hook stops matching, which the
// delayed-timer counter below turns into a failure instead of a silently vacuous pass.
const FORM_LOAD_CALL_MARKER = '.load()';
const DELAYED_TIMERS_KEY = '__e2eDelayedTimers';

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

  await page.addInitScript(({ delayMs, marker, counterKey }) => {
    const counters = window as unknown as Record<string, number>;
    counters[counterKey] = 0;
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const holdBack = timeout === 0 && String(handler).includes(marker);
      if (holdBack) {
        counters[counterKey]++;
      }
      return nativeSetTimeout(handler, holdBack ? delayMs : timeout, ...args);
    }) as typeof window.setTimeout;
  }, { delayMs: DEFERRED_TIMER_DELAY_MS, marker: FORM_LOAD_CALL_MARKER, counterKey: DELAYED_TIMERS_KEY });
  await page.goto(EDIT_TRIP_PATH);
  await expect(page).toHaveURL(new RegExp(`${EDIT_TRIP_PATH}$`));
  await expect(page.getByLabel('Place')).toHaveValue(tripRow()['place'] as string, { timeout: SELECT_TIMEOUT_MS });
  // The race this test is about only happened if the form's own load was actually held back.
  expect(await page.evaluate(key => (window as unknown as Record<string, number>)[key], DELAYED_TIMERS_KEY)).toBeGreaterThan(0);
  await expect(page.locator('mat-select[name="shift"]')).toContainText(SHIFT_LABEL, { timeout: SELECT_TIMEOUT_MS });
});
