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
// Source text of the form's own deferred add-mode load (`this.load().finally(...)`).
const FORM_LOAD_CALL_MARKER = '.load().finally(';
const SHIFTS_STORE = 'shifts';
const TRIPS_STORE = 'trips';
const TRIP_LOOKUP_INDEX = 'rowId';
const SHIFT_LOOKUP_INDEX = 'key';
const HELD_READS_KEY = '__e2eHeldReads';
const RELEASED_READS_KEY = '__e2eReleasedReads';

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

  // Orders the race deterministically, with no timing assumptions:
  //  1. once the form's own add-mode load has started (its `.load().finally(` timer, which the page's
  //     `tripForm?.load()` timers do not match), the first whole-table read of `shifts` is held;
  //  2. the page's trip lookup (the `rowId` index of `trips`) is held until that read has been issued,
  //     so the add-mode run is always already waiting on it when the trip arrives;
  //  3. the held read is released once the edit load has looked its own shift up (the `key` index of
  //     `shifts`), i.e. after the trip's data is on the form.
  await page.addInitScript(({ marker, shiftsStore, tripsStore, tripLookupIndex, shiftLookupIndex, heldKey, releasedKey }) => {
    const counters = window as unknown as Record<string, number>;
    counters[heldKey] = 0;
    counters[releasedKey] = 0;
    let armed = false;
    let heldShiftsRead = false;
    const releaseTripLookup: (() => void)[] = [];
    const releaseShiftsRead: (() => void)[] = [];
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 0 && typeof handler === 'function' && String(handler).includes(marker)) {
        const original = handler;
        handler = ((...inner: unknown[]) => { armed = true; return original(...inner); }) as TimerHandler;
      }
      return nativeSetTimeout(handler, timeout, ...args);
    }) as typeof window.setTimeout;
    const descriptor = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess')!;
    const deferUntil = (queue: (() => void)[], request: IDBRequest, handler: (event: Event) => void) =>
      function (this: IDBRequest, event: Event) {
        queue.push(() => handler.call(request, event));
      };
    Object.defineProperty(IDBRequest.prototype, 'onsuccess', {
      configurable: true,
      get: descriptor.get,
      set(this: IDBRequest, handler: ((event: Event) => void) | null) {
        const source = this.source as IDBObjectStore | IDBIndex | null;
        const storeName = source instanceof IDBIndex ? source.objectStore.name : source?.name;
        const indexName = source instanceof IDBIndex ? source.name : undefined;
        if (handler && armed && !heldShiftsRead && source instanceof IDBObjectStore && storeName === shiftsStore) {
          heldShiftsRead = true;
          counters[heldKey]++;
          const original = handler;
          handler = deferUntil(releaseShiftsRead, this, original);
          // Issued: the held trip lookup may now go ahead.
          nativeSetTimeout(() => releaseTripLookup.splice(0).forEach(run => run()), 0);
        } else if (handler && !heldShiftsRead && storeName === tripsStore && indexName === tripLookupIndex) {
          handler = deferUntil(releaseTripLookup, this, handler);
        } else if (handler && heldShiftsRead && storeName === shiftsStore && indexName === shiftLookupIndex) {
          const original = handler;
          handler = function (this: IDBRequest, event: Event) {
            original.call(this, event);
            // Counted a macrotask later, once the app has run what the lookup's result triggers.
            nativeSetTimeout(() => {
              releaseShiftsRead.splice(0).forEach(run => run());
              nativeSetTimeout(() => { counters[releasedKey]++; }, 0);
            }, 0);
          };
        }
        descriptor.set!.call(this, handler);
      },
    });
  }, {
    marker: FORM_LOAD_CALL_MARKER, shiftsStore: SHIFTS_STORE, tripsStore: TRIPS_STORE,
    tripLookupIndex: TRIP_LOOKUP_INDEX, shiftLookupIndex: SHIFT_LOOKUP_INDEX,
    heldKey: HELD_READS_KEY, releasedKey: RELEASED_READS_KEY,
  });

  await page.goto(EDIT_TRIP_PATH);
  await expect(page.getByLabel('Place')).toHaveValue(tripRow()['place'] as string, { timeout: FIELD_TIMEOUT_MS });
  await expect(page.locator('mat-select[name="shift"]')).toContainText(TRIP_SHIFT_LABEL, { timeout: FIELD_TIMEOUT_MS });
  // The held read has to have been released and applied before the final checks mean anything.
  await expect.poll(() => page.evaluate(key => (window as unknown as Record<string, number>)[key], RELEASED_READS_KEY),
    { timeout: FIELD_TIMEOUT_MS }).toBeGreaterThan(0);
  await expect(page.locator('mat-select[name="shift"]')).toContainText(TRIP_SHIFT_LABEL);
  await expect(page.getByLabel('Region/Zone')).toHaveValue(TRIP_REGION);
});
