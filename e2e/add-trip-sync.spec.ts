import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';
import { SHIFT_KEY, sheetEntity, shiftRow, tripRow } from './support/sheet-fixture';
import { readTable } from './support/app-db';

const SYNC_MODAL_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 90_000;
const SAVE_SUCCESS = { messages: [{ message: 'Saved', level: 'INFO', type: 'SAVE_DATA', time: 0 }] };
const SEEDED_NEXT_ROW_ID = 3;
const NEW_PLACE = 'Burger Barn';
const NEW_PAY = 7.25;

interface SavedBody { sheets: { trips: Record<string, unknown>[]; shifts: Record<string, unknown>[] } }
type StoredTrip = Record<string, unknown> & { saved: boolean };

/** Signs in, stubs the backend and the sheet load, and records every PUT save body. */
async function stubSheet(page: Page, context: BrowserContext): Promise<SavedBody[]> {
  await signIn(context);
  await stubBackend(context);
  await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, {
    sheetEntity: sheetEntity({ shifts: [shiftRow()], trips: [tripRow()] }),
  }));
  const savedBodies: SavedBody[] = [];
  await page.route(`${API_BASE}/sheets`, async route => {
    if (route.request().method() === 'PUT') {
      savedBodies.push(route.request().postDataJSON());
    }
    await fulfillJson(route, { sheetEntity: SAVE_SUCCESS });
  });
  return savedBodies;
}

/** Links the stubbed sheet through the real first-time path and waits for the load to finish. */
async function loadSheet(page: Page): Promise<void> {
  await page.goto('/setup');
  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  await page.getByRole('button', { name: /Select/ }).click();
  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await expect(syncModal).toBeHidden({ timeout: SYNC_MODAL_TIMEOUT_MS });
}

async function saveToSpreadsheet(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Save Changes to Spreadsheet/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Save$/ }).click();
  await expect(page.locator('app-data-sync-modal').getByText(/SAVED/)).toBeVisible({ timeout: SYNC_MODAL_TIMEOUT_MS });
}

test('Next Stop adds an unsaved trip that syncs to the sheet', async ({ page, context }) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  const savedBodies = await stubSheet(page, context);
  await loadSheet(page);

  await page.goto('/trips');
  const heading = page.locator('#todaysTrips');
  await expect(heading).toContainText("Today's Trips (1)");

  await page.locator('app-trips-quick-view').getByRole('button', { name: 'More options' }).click();
  await page.getByRole('menuitem', { name: /Next Stop/ }).click();

  await expect(heading).toContainText("Today's Trips (2)");
  const stored = await readTable<StoredTrip>(page, 'trips');
  expect(stored).toHaveLength(2);
  expect(stored.filter(t => !t.saved)).toHaveLength(1);

  await saveToSpreadsheet(page);

  expect(savedBodies).toHaveLength(1);
  // Only the unsaved trip goes out, on the sheet's existing shift.
  const { trips } = savedBodies[0].sheets;
  expect(trips).toHaveLength(1);
  expect(trips[0]['key']).toBe(SHIFT_KEY);
  expect(trips[0]['rowId']).toBe(SEEDED_NEXT_ROW_ID);

  // Once saved, nothing is left to push.
  expect((await readTable<StoredTrip>(page, 'trips')).every(t => t.saved)).toBe(true);
  await expect(page.getByRole('button', { name: /Save Changes to Spreadsheet/ })).toBeHidden();
});

test('Store adds a trip from the form, the header count matches IndexedDB, and it syncs', async ({ page, context }) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  const savedBodies = await stubSheet(page, context);
  await loadSheet(page);

  await page.goto('/trips');
  const heading = page.locator('#todaysTrips');
  await expect(heading).toContainText("Today's Trips (1)");

  const form = page.locator('app-trip-form');
  // The form preselects the sheet's existing shift, so no Service field is shown.
  await form.getByLabel('Place').fill(NEW_PLACE);
  await form.getByLabel('Pay', { exact: true }).fill(String(NEW_PAY));
  await form.getByRole('button', { name: /\bStore$/ }).click();

  await expect(heading).toContainText("Today's Trips (2)");
  const stored = await readTable<StoredTrip>(page, 'trips');
  expect(stored).toHaveLength(2);
  const added = stored.find(t => !t.saved);
  expect(added?.['place']).toBe(NEW_PLACE);
  expect(added?.['key']).toBe(SHIFT_KEY);
  expect(added?.['pay']).toBe(NEW_PAY);

  await saveToSpreadsheet(page);

  expect(savedBodies).toHaveLength(1);
  const { trips } = savedBodies[0].sheets;
  expect(trips).toHaveLength(1);
  expect(trips[0]['place']).toBe(NEW_PLACE);
  expect(trips[0]['pay']).toBe(NEW_PAY);
  expect(trips[0]['key']).toBe(SHIFT_KEY);
  expect((await readTable<StoredTrip>(page, 'trips')).every(t => t.saved)).toBe(true);
});
