import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { API_BASE, E2E_SHEET, fulfillJson, signIn, stubBackend } from '../e2e/support/stub-backend';
import { sheetEntity, shiftRow, tripRow } from '../e2e/support/sheet-fixture';
import { SCREENSHOT_ENTRIES } from './manifest-screenshots';

// Captures the PWA install-preview screenshots declared in src/manifest.json. Run with
// `npm run screenshots` (playwright.screenshots.config.ts); never part of `npm run e2e`.

const TEST_TIMEOUT_MS = 120_000;
const SYNC_MODAL_TIMEOUT_MS = 30_000;
const ICON_CSS_URL = 'https://fonts.googleapis.com/icon?family=Material+Icons';
const ICON_FONT_URL = 'https://fonts.gstatic.com/e2e/material-icons.woff2';
const ICON_FONT_DIR = join(__dirname, '..', 'node_modules', 'material-icons', 'iconfont');
const THEME_STORAGE_KEY = 'rg-theme-preference';
const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Rows are numbered from 2; row 1 is the sheet's header.
const FIRST_ROW_ID = 2;
const TODAY_SHIFT_ROW_ID = FIRST_ROW_ID;
const TODAY_TRIP_ROW_ID = FIRST_ROW_ID + 1;

interface ISampleTrip {
  place: string; name: string; type: string; pickup: string; dropoff: string; duration: string;
  pay: number; tip: number; distance: number; startAddress: string; endAddress: string;
}
interface ISampleShift {
  daysAgo: number; number: number; service: string; start: string; finish: string; trips: ISampleTrip[];
}

const SAMPLE_SHIFTS: ISampleShift[] = [
  {
    daysAgo: 0, number: 1, service: 'DoorDash', start: '11:00 AM', finish: '2:30 PM',
    trips: [
      { place: 'Taco Spot', name: 'Alex', type: 'Pickup', pickup: '11:20 AM', dropoff: '11:41 AM', duration: '00:21:00', pay: 4.5, tip: 3, distance: 2.4, startAddress: '120 Main St', endAddress: '48 Oak Ave' },
      { place: 'Green Bowl', name: 'Jordan', type: 'Pickup', pickup: '12:05 PM', dropoff: '12:32 PM', duration: '00:27:00', pay: 5.25, tip: 4.5, distance: 3.1, startAddress: '75 Pine St', endAddress: '310 Elm Dr' },
      { place: 'Pizza Corner', name: 'Sam', type: 'Pickup', pickup: '1:10 PM', dropoff: '1:38 PM', duration: '00:28:00', pay: 6, tip: 5, distance: 4.2, startAddress: '9 Market Sq', endAddress: '22 Lake Rd' },
      { place: 'Noodle House', name: 'Taylor', type: 'Pickup', pickup: '2:00 PM', dropoff: '2:22 PM', duration: '00:22:00', pay: 4.75, tip: 2.5, distance: 2.8, startAddress: '501 River St', endAddress: '14 Cedar Ct' },
    ],
  },
  {
    daysAgo: 1, number: 1, service: 'DoorDash', start: '5:00 PM', finish: '9:15 PM',
    trips: [
      { place: 'Burger Barn', name: 'Morgan', type: 'Pickup', pickup: '5:25 PM', dropoff: '5:49 PM', duration: '00:24:00', pay: 5, tip: 6, distance: 3.5, startAddress: '33 Hill St', endAddress: '81 Birch Ln' },
      { place: 'Sushi Place', name: 'Casey', type: 'Pickup', pickup: '6:40 PM', dropoff: '7:12 PM', duration: '00:32:00', pay: 7.5, tip: 8, distance: 5.6, startAddress: '210 Bay St', endAddress: '6 Harbor Way' },
      { place: 'Taco Spot', name: 'Riley', type: 'Pickup', pickup: '8:05 PM', dropoff: '8:30 PM', duration: '00:25:00', pay: 4.5, tip: 3.5, distance: 2.9, startAddress: '120 Main St', endAddress: '95 Maple Ave' },
    ],
  },
  {
    daysAgo: 2, number: 1, service: 'Uber Eats', start: '12:00 PM', finish: '3:00 PM',
    trips: [
      { place: 'Green Bowl', name: 'Jamie', type: 'Pickup', pickup: '12:30 PM', dropoff: '12:58 PM', duration: '00:28:00', pay: 6.25, tip: 4, distance: 3.8, startAddress: '75 Pine St', endAddress: '40 Spruce St' },
      { place: 'Pizza Corner', name: 'Drew', type: 'Pickup', pickup: '1:45 PM', dropoff: '2:15 PM', duration: '00:30:00', pay: 5.5, tip: 5.5, distance: 4.4, startAddress: '9 Market Sq', endAddress: '18 Willow Ct' },
    ],
  },
];

const round = (n: number) => Math.round(n * 100) / 100;

// Mirrors DateHelper.getDays / toISO, as e2e/support/sheet-fixture.ts does for today.
function dateFor(daysAgo: number): { date: string; serial: number } {
  const day = new Date(Date.now() - daysAgo * MS_PER_DAY);
  return {
    date: day.toLocaleDateString('sv-SE'),
    serial: Math.floor((day.getTime() - new Date('1900-01-01').getTime()) / MS_PER_DAY) + 2,
  };
}

function buildSheet(): Record<string, unknown> {
  const shifts: Record<string, unknown>[] = [];
  const trips: Record<string, unknown>[] = [];
  let rowId = FIRST_ROW_ID;
  let tripRowId = FIRST_ROW_ID;
  for (const sample of SAMPLE_SHIFTS) {
    const { date, serial } = dateFor(sample.daysAgo);
    const key = `${serial}-${sample.number}-${sample.service}`;
    const pay = round(sample.trips.reduce((sum, t) => sum + t.pay, 0));
    const tip = round(sample.trips.reduce((sum, t) => sum + t.tip, 0));
    const distance = round(sample.trips.reduce((sum, t) => sum + t.distance, 0));
    const total = round(pay + tip);
    shifts.push(shiftRow({
      rowId: rowId++, date, key, number: sample.number, service: sample.service,
      start: sample.start, finish: sample.finish,
      trips: sample.trips.length, distance, pay, tip, total,
      totalTrips: sample.trips.length, totalDistance: distance, totalPay: pay, totalTips: tip, grandTotal: total,
      amountPerTrip: round(total / sample.trips.length),
    }));
    for (const t of sample.trips) {
      trips.push(tripRow({
        rowId: tripRowId++, date, key, number: sample.number, service: sample.service,
        type: t.type, place: t.place, name: t.name,
        pickupTime: t.pickup, dropoffTime: t.dropoff, duration: t.duration,
        startAddress: t.startAddress, endAddress: t.endAddress,
        pay: t.pay, tip: t.tip, total: round(t.pay + t.tip), distance: t.distance,
        amountPerDistance: round((t.pay + t.tip) / t.distance),
      }));
    }
  }
  return sheetEntity({ shifts, trips });
}

/**
 * index.html loads Material Icons from Google Fonts, which the e2e stubs abort - without
 * this every icon would render as its ligature text. Serves the devDependency's copy instead.
 */
async function serveIconFont(page: Page): Promise<void> {
  await page.route(ICON_CSS_URL, route => route.fulfill({
    contentType: 'text/css',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: readFileSync(join(ICON_FONT_DIR, 'material-icons.css'), 'utf8')
      .replace(/url\(\s*["']?[^)"']*material-icons\.woff2["']?\s*\)/, `url(${ICON_FONT_URL})`)
      .replace(/,\s*url\([^)]*\.woff["']?\)\s*format\(["']woff["']\)/, ''),
  }));
  await page.route(ICON_FONT_URL, route => route.fulfill({
    contentType: 'font/woff2',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: readFileSync(join(ICON_FONT_DIR, 'material-icons.woff2')),
  }));
}

async function linkSheet(page: Page): Promise<void> {
  await page.goto('/setup');
  await page.getByRole('button', { name: /Link Sheet/ }).click();
  await page.getByRole('heading', { name: E2E_SHEET.name }).click();
  await page.getByRole('button', { name: /Select/ }).click();
  const syncModal = page.locator('app-data-sync-modal');
  await expect(syncModal).toBeVisible();
  await expect(syncModal).toBeHidden({ timeout: SYNC_MODAL_TIMEOUT_MS });
}

/** Waits for fonts and the last layout pass so icons never render as their ligature text. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('mat-progress-spinner, mat-spinner, mat-progress-bar')).toHaveCount(0);
  await expect(page.getByText('Loading...')).toBeHidden();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

// How to reach each manifest screen and what proves it has rendered real data.
const SCREENS: Record<string, (page: Page) => Promise<void>> = {
  'add-trip': async page => {
    await page.goto('/trips');
    await expect(page.getByText('Taco Spot').first()).toBeVisible();
    await expect(page.getByLabel('Note', { exact: true })).toBeVisible();
  },
  'todays-trips': async page => {
    await page.goto('/trips');
    await expect(page.getByText('Noodle House').first()).toBeVisible();
    // The list sits below the add form; bring it to the top of the frame.
    const heading = page.getByText(/Today's Trips \(4\)/);
    await expect(heading).toBeVisible();
    await heading.evaluate(el => {
      el.style.scrollMarginTop = '72px'; // clear the sticky toolbar
      el.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  },
  'edit-trip': async page => {
    await page.goto(`/trips/edit/${TODAY_TRIP_ROW_ID}`);
    await expect(page).toHaveURL(/\/trips\/edit\//);
    await expect(page.getByLabel('Note', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Place')).toHaveValue('Green Bowl');
  },
  'shifts': async page => {
    await page.goto('/shifts');
    await expect(page.getByText('Uber Eats').first()).toBeVisible();
  },
  'edit-shift': async page => {
    await page.goto(`/shifts/edit/${TODAY_SHIFT_ROW_ID}`);
    await expect(page).toHaveURL(/\/shifts\/edit\//);
    await expect(page.getByRole('heading', { name: /Edit Shift/ })).toBeVisible();
    await expect(page.getByLabel('Start Time')).not.toHaveValue('');
  },
  'stats': async page => {
    await page.goto('/stats');
    await expect(page.locator('app-stats-table').first()).toContainText('DoorDash');
  },
};

test.describe('install-preview screenshots', () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    // Titles start with the form factor; skip before the (slow) sheet load for the other project.
    test.skip(!testInfo.title.startsWith(`${testInfo.project.name} `), 'other form factor');
    test.setTimeout(TEST_TIMEOUT_MS);
    await signIn(context);
    await context.addInitScript(key => localStorage.setItem(key, 'light'), THEME_STORAGE_KEY);
    await stubBackend(context);
    await page.route(`${API_BASE}/sheets/all`, route => fulfillJson(route, { sheetEntity: buildSheet() }));
    await serveIconFont(page);
    await linkSheet(page);
  });

  for (const entry of SCREENSHOT_ENTRIES) {
    test(`${entry.formFactor} ${entry.name}`, async ({ page }) => {
      const open = SCREENS[entry.name];
      expect(open, `no capture defined for manifest screenshot "${entry.name}"`).toBeDefined();
      await open(page);
      await settle(page);
      await page.screenshot({ path: entry.file });
    });
  }
});
