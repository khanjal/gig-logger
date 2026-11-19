import { expect, test } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';
import { SHIFT_KEY, sheetEntity, shiftRow, tripRow } from './support/sheet-fixture';

// The sync modal auto-closes 5s after a clean run and 15s after one that logged a warning;
// this covers the slower case with room for a slow runner.
const SYNC_MODAL_TIMEOUT_MS = 30_000;
// Two sync-modal runs back to back can outlast Playwright's 30s default for a whole test.
const TEST_TIMEOUT_MS = 90_000;
const SHEET_NOTE = 'from the sheet';
const EDITED_NOTE = 'edited in the app';

// What the backend answers a successful save with. ApiMessageHelper.processSheetSaveResponse
// treats a reply with no SAVE_DATA message as a failed save.
const SAVE_SUCCESS = { messages: [{ message: 'Saved', level: 'INFO', type: 'SAVE_DATA', time: 0 }] };

// Tags typed straight into the sheet must survive an edit made in the app (ff56d5cf). The cell
// arrives as raw text - unsorted, no spaces - and must go back, alongside the edit, in the app's
// normalised form rather than dropped or blanked. This checks the whole load → form → save
// round trip, not any single fallback inside it.
test('tags typed in the sheet survive editing the trip in the app', async ({ page, context }) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await signIn(context);
  await stubBackend(context);
  await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, {
    sheetEntity: sheetEntity({ shifts: [shiftRow()], trips: [tripRow({ note: SHEET_NOTE, tags: 'rain,airport' })] }),
  }));

  const savedBodies: { sheets: { trips: Record<string, unknown>[] } }[] = [];
  await page.route(`${API_BASE}/sheets`, async route => {
    if (route.request().method() === 'PUT') {
      savedBodies.push(route.request().postDataJSON());
    }
    await fulfillJson(route, { sheetEntity: SAVE_SUCCESS });
  });

  // Load the sheet through the real first-time path.
  await page.goto('/setup');
  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  await page.getByRole('button', { name: /Select/ }).click();
  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await expect(syncModal).toBeHidden({ timeout: SYNC_MODAL_TIMEOUT_MS });

  // Edit something unrelated to tags.
  await page.goto('/trips');
  await page.locator('app-trips-quick-view').getByRole('button', { name: /\bEdit$/ }).click();
  // /trips already shows an (add) trip form, and the edit form ignores a load once it is dirty,
  // so wait until the edit form holds the sheet's trip before typing into it.
  await expect(page).toHaveURL(/\/trips\/edit\/2$/);
  const note = page.getByLabel('Note', { exact: true });
  await expect(note).toHaveValue(SHEET_NOTE);
  await note.fill(EDITED_NOTE);
  await page.getByRole('button', { name: /\bUpdate$/ }).click();

  // Save to the spreadsheet, and let the save finish.
  await page.getByRole('button', { name: /Save Changes to Spreadsheet/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Save$/ }).click();
  await expect(syncModal.getByText(/SAVED/)).toBeVisible({ timeout: SYNC_MODAL_TIMEOUT_MS });

  expect(savedBodies).toHaveLength(1);
  const { trips } = savedBodies[0].sheets;
  expect(trips).toHaveLength(1);
  // Still on the sheet's shift - the edit must not have re-keyed the trip onto a new one.
  expect(trips[0]['key']).toBe(SHIFT_KEY);
  expect(trips[0]['note']).toBe(EDITED_NOTE);
  expect(trips[0]['tags']).toBe('airport, rain');
});
