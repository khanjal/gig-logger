import { expect, test } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from './support/stub-backend';
import { sheetEntity, tripRow } from './support/sheet-fixture';

const SAVE_TIMEOUT_MS = 20_000;
const EDITED_NOTE = 'edited in the app';

// Tags typed straight into the sheet must survive an edit made in the app (ff56d5cf). The
// cell arrives as raw text - unsorted, no spaces - and must go back as the app's normalised
// form, alongside the edit, rather than being dropped or blanked.
test('tags typed in the sheet survive editing the trip in the app', async ({ page, context }) => {
  await signIn(context);
  await stubBackend(context);
  await page.route(`${API_BASE}/sheets/all`, route =>
    fulfillJson(route, { sheetEntity: sheetEntity({ trips: [tripRow({ tags: 'rain,airport' })] }) }));

  let savedBody: { sheets: { trips: Record<string, unknown>[] } } | undefined;
  await page.route(`${API_BASE}/sheets`, async route => {
    if (route.request().method() === 'PUT') {
      savedBody = route.request().postDataJSON();
    }
    await fulfillJson(route, { sheetEntity: { messages: [] } });
  });

  // Load the sheet through the real first-time path.
  await page.goto('/setup');
  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  await page.getByRole('button', { name: /Select/ }).click();
  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await expect(syncModal).toBeHidden({ timeout: SAVE_TIMEOUT_MS });

  // Edit something unrelated to tags.
  await page.goto('/trips');
  await page.getByRole('button', { name: /Edit/ }).first().click();
  await page.getByLabel('Note').fill(EDITED_NOTE);
  await page.getByRole('button', { name: /Update/ }).click();

  // Save to the spreadsheet.
  await page.getByRole('button', { name: /Save Changes to Spreadsheet/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Save$/ }).click();

  await expect.poll(() => savedBody, { timeout: SAVE_TIMEOUT_MS }).toBeDefined();
  const [savedTrip] = savedBody!.sheets.trips;
  expect(savedTrip['note']).toBe(EDITED_NOTE);
  expect(savedTrip['tags']).toBe('airport, rain');
});
