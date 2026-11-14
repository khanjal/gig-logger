import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';
import {
  FIRST_ROW_ID, OTHER_SERVICE, OTHER_SHIFT_KEY, SHIFT_KEY, YESTERDAY, sheetEntity, shiftRow, tripRow,
} from './support/sheet-fixture';

const SYNC_MODAL_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 90_000;
const FIELD_TIMEOUT_MS = 10_000;
const EDIT_TRIP_PATH = `/trips/edit/${FIRST_ROW_ID}`;
const TRIP_REGION = 'Uptown';
const NEWEST_REGION = 'Downtown';
const TRIP_SHIFT_LABEL = `${OTHER_SERVICE} #1`;
// How long the add-mode load's last read of the shifts table (the "newest shift" lookup behind the
// default service/region) is held back, so the edited trip's data lands first (#505).
const HELD_READ_DELAY_MS = 2_500;
// Source text of the form's deferred first callback; the add-mode load starts there.
const FORM_LOAD_CALL_MARKER = '.load()';
const SHIFTS_STORE = 'shifts';
const HELD_READS_KEY = '__e2eHeldReads';

async function loadSheet(page: Page): Promise<void> {
  await page.goto('/setup');
  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  await page.getByRole('button', { name: /Select/ }).click();
  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await expect(syncModal).toBeHidden({ timeout: SYNC_MODAL_TIMEOUT_MS });
}

// An edit form must keep the trip's own shift, service and region even when the add-mode load that
// the form also runs is still reading the newest shift as the trip's data arrives.
test('edit trip keeps its own shift and region when a late add-mode default arrives', async ({ page, context }) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await signIn(context);
  await stubBackend(context);
  // Newest shift (last row) is DoorDash today; the edited trip is on an older Uber shift.
  await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, {
    sheetEntity: sheetEntity({
      shifts: [
        shiftRow({ rowId: 2, key: OTHER_SHIFT_KEY, service: OTHER_SERVICE, date: YESTERDAY, region: TRIP_REGION }),
        shiftRow({ rowId: 3, key: SHIFT_KEY, region: NEWEST_REGION }),
      ],
      trips: [tripRow({ key: OTHER_SHIFT_KEY, service: OTHER_SERVICE, date: YESTERDAY, region: TRIP_REGION })],
    }),
  }));
  await loadSheet(page);

  // Once the form's own load has started, hold back the first full read of the shifts table that
  // follows (only the add-mode "newest shift" lookup reads it whole), so the edit data arrives first.
  await page.addInitScript(({ delayMs, marker, store, key }) => {
    const counters = window as unknown as Record<string, number>;
    counters[key] = 0;
    let armed = false;
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 0 && String(handler).includes(marker) && typeof handler === 'function') {
        const original = handler;
        handler = ((...inner: unknown[]) => { armed = true; return original(...inner); }) as TimerHandler;
      }
      return nativeSetTimeout(handler, timeout, ...args);
    }) as typeof window.setTimeout;
    const descriptor = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess')!;
    Object.defineProperty(IDBRequest.prototype, 'onsuccess', {
      configurable: true,
      get: descriptor.get,
      set(this: IDBRequest, handler: ((event: Event) => void) | null) {
        const source = this.source as { name?: string } | null;
        if (armed && handler && source instanceof IDBObjectStore && source.name === store) {
          armed = false;
          counters[key]++;
          const original = handler;
          handler = function (this: IDBRequest, event: Event) {
            nativeSetTimeout(() => original.call(this, event), delayMs);
          };
        }
        descriptor.set!.call(this, handler);
      },
    });
  }, { delayMs: HELD_READ_DELAY_MS, marker: FORM_LOAD_CALL_MARKER, store: SHIFTS_STORE, key: HELD_READS_KEY });

  await page.goto(EDIT_TRIP_PATH);
  await expect(page.getByLabel('Place')).toHaveValue(tripRow()['place'] as string, { timeout: FIELD_TIMEOUT_MS });
  await expect(page.locator('mat-select[name="shift"]')).toContainText(TRIP_SHIFT_LABEL, { timeout: FIELD_TIMEOUT_MS });
  // Wait for the held read to have been released and applied, then check nothing was clobbered.
  await expect.poll(() => page.evaluate(key => (window as unknown as Record<string, number>)[key], HELD_READS_KEY),
    { timeout: FIELD_TIMEOUT_MS }).toBeGreaterThan(0);
  await page.waitForTimeout(HELD_READ_DELAY_MS + 500);
  await expect(page.locator('mat-select[name="shift"]')).toContainText(TRIP_SHIFT_LABEL);
  await expect(page.getByLabel('Region/Zone')).toHaveValue(TRIP_REGION);
});
