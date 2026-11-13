import { expect, test } from '@playwright/test';
import { API_BASE, fulfillJson, signIn, stubBackend } from './support/stub-backend';
import { sheetEntity, shiftRow, tripRow } from './support/sheet-fixture';

const SYNC_MODAL_TIMEOUT_MS = 30_000;
const NEW_SHEET_NAME = 'My First Sheet';
const NEW_SHEET = { id: 'e2e-created-sheet-id', name: NEW_SHEET_NAME };
const SETUP_CARD_TITLE = 'Set Up Your Spreadsheet';
const CURRENT_SHEETS_TITLE = 'Current Spreadsheets';

// A signed-in user with nothing linked yet: the setup card is offered, and the sheet-gated
// pages bounce back to /setup until a default sheet exists.
test('first-time setup shows the setup card and guards the sheet-gated pages', async ({ page, context }) => {
  await signIn(context);
  await stubBackend(context);

  await page.goto('/setup');
  await expect(page.getByText(SETUP_CARD_TITLE)).toBeVisible();
  await expect(page.getByRole('button', { name: /Create New/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Link Sheet/ })).toBeVisible();
  await expect(page.getByText(CURRENT_SHEETS_TITLE)).toBeHidden();

  for (const path of ['/trips', '/shifts', '/stats']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/setup$/);
    await expect(page.getByText(SETUP_CARD_TITLE)).toBeVisible();
  }
});

test('Create New makes the file and sheets, loads them, and unlocks the app', async ({ page, context }) => {
  await signIn(context);
  await stubBackend(context);

  const fileBodies: unknown[] = [];
  await page.route(`${API_BASE}/files/create`, async route => {
    if (route.request().method() === 'POST') {
      fileBodies.push(route.request().postDataJSON());
    }
    await fulfillJson(route, NEW_SHEET);
  });
  const sheetCreates: { sheetId: string | undefined }[] = [];
  await page.route(`${API_BASE}/sheets`, async route => {
    if (route.request().method() === 'POST') {
      sheetCreates.push({ sheetId: route.request().headers()['sheet-id'] });
    }
    await fulfillJson(route, {});
  });
  await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, {
    sheetEntity: { ...sheetEntity({ shifts: [shiftRow()], trips: [tripRow()] }), properties: NEW_SHEET },
  }));

  await page.goto('/setup');
  await page.getByRole('button', { name: /Create New/ }).click();
  await page.getByLabel('Sheet Name').fill(NEW_SHEET_NAME);
  await page.getByRole('dialog').getByRole('button', { name: /Create$/ }).click();

  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await expect(syncModal).toBeHidden({ timeout: SYNC_MODAL_TIMEOUT_MS });

  expect(fileBodies).toEqual([expect.objectContaining({ name: NEW_SHEET_NAME })]);
  expect(sheetCreates).toEqual([{ sheetId: NEW_SHEET.id }]);

  // The setup card gives way to the linked sheet, and the guarded pages open.
  await expect(page.getByText(CURRENT_SHEETS_TITLE)).toBeVisible();
  await expect(page.getByText(SETUP_CARD_TITLE)).toBeHidden();
  await expect(page.getByText(NEW_SHEET_NAME).first()).toBeVisible();

  await page.goto('/trips');
  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.locator('#todaysTrips')).toContainText("Today's Trips (1)");
});

// A failed file creation must not leave a half-linked sheet that would unlock the app.
test('a failed file creation links nothing and keeps the setup card', async ({ page, context }) => {
  await signIn(context);
  await stubBackend(context);
  await page.route(`${API_BASE}/files/create`, route => fulfillJson(route, { message: 'boom' }, 500));

  await page.goto('/setup');
  await page.getByRole('button', { name: /Create New/ }).click();
  await page.getByLabel('Sheet Name').fill(NEW_SHEET_NAME);
  await page.getByRole('dialog').getByRole('button', { name: /Create$/ }).click();

  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await syncModal.getByRole('button', { name: /Close/ }).click();
  await expect(syncModal).toBeHidden();

  await expect(page.getByText(SETUP_CARD_TITLE)).toBeVisible();
  await expect(page.getByText(CURRENT_SHEETS_TITLE)).toBeHidden();
  await page.goto('/trips');
  await expect(page).toHaveURL(/\/setup$/);
});
