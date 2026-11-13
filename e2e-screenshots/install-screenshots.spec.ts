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
const STATS_RANGE_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Rows are numbered from 2; row 1 is the sheet's header.
const FIRST_ROW_ID = 2;

interface ISampleTrip {
  place: string; name: string; type: string; pickup: string; dropoff: string; duration: string;
  pay: number; tip: number; bonus?: number; distance: number; startAddress: string; endAddress: string;
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

// [place, customer, pay, tip, bonus, distance, minutes] - compact rows for the older shifts, which
// give the stats page several weekdays, a few $0 tips, some bonuses and varied distances.
type SampleRow = [string, string, number, number, number, number, number];
const EXTRA_SHIFTS: [daysAgo: number, number: number, service: string, start: string, rows: SampleRow[]][] = [
  [3, 1, 'DoorDash', '6:00 PM', [['Burger Barn', 'Avery', 5.5, 0, 2, 1.8, 18], ['Sushi Place', 'Blake', 8, 9, 0, 6.4, 34], ['Noodle House', 'Cameron', 4.25, 2, 0, 2.2, 20], ['Taco Spot', 'Devon', 4.75, 3.5, 1.5, 3.0, 22]]],
  [4, 1, 'Uber Eats', '11:30 AM', [['Green Bowl', 'Emery', 6, 5, 0, 4.1, 26], ['Pizza Corner', 'Finley', 5, 0, 0, 2.6, 19], ['Burger Barn', 'Harper', 5.75, 4, 3, 7.9, 41]]],
  [6, 1, 'DoorDash', '4:30 PM', [['Taco Spot', 'Indy', 4.5, 3, 0, 1.4, 15], ['Sushi Place', 'Jules', 9.25, 7.5, 0, 8.8, 44], ['Green Bowl', 'Kai', 5.25, 0, 0, 3.3, 24], ['Pizza Corner', 'Logan', 6.5, 6, 2.5, 5.2, 31], ['Noodle House', 'Max', 4.5, 2.5, 0, 2.0, 17]]],
  [8, 1, 'Uber Eats', '5:15 PM', [['Burger Barn', 'Nico', 6.25, 8, 0, 4.7, 29], ['Taco Spot', 'Oakley', 4.5, 3, 0, 2.1, 18], ['Sushi Place', 'Parker', 7.75, 10, 4, 9.6, 46]]],
  [9, 1, 'DoorDash', '12:00 PM', [['Green Bowl', 'Quinn', 5.5, 4, 0, 3.7, 25], ['Pizza Corner', 'Reese', 5, 0, 0, 2.9, 21], ['Noodle House', 'Sage', 4.75, 3, 0, 2.4, 19]]],
  [11, 1, 'DoorDash', '6:30 PM', [['Burger Barn', 'Tatum', 5.25, 5.5, 2, 3.9, 27], ['Taco Spot', 'Uma', 4.5, 2, 0, 1.6, 16], ['Sushi Place', 'Val', 8.5, 6, 0, 7.3, 38], ['Green Bowl', 'Wren', 5.5, 3.5, 0, 3.4, 23]]],
];

const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

function parseClock(clock: string): number {
  const [, hours, minutes, meridiem] = /(\d+):(\d+) (AM|PM)/.exec(clock)!;
  return (Number(hours) % 12 + (meridiem === 'PM' ? 12 : 0)) * 60 + Number(minutes);
}

function formatClock(minutes: number): string {
  return new Date(2000, 0, 1, 0, minutes).toLocaleTimeString('en-US', TIME_FORMAT);
}

function expandExtraShifts(): ISampleShift[] {
  return EXTRA_SHIFTS.map(([daysAgo, number, service, start, rows]) => {
    let clock = parseClock(start);
    const trips = rows.map(([place, name, pay, tip, bonus, distance, minutes], index) => {
      clock += 15; // wait for the order
      const pickup = formatClock(clock);
      clock += minutes;
      const trip: ISampleTrip = {
        place, name, type: 'Pickup', pickup, dropoff: formatClock(clock),
        duration: `00:${String(minutes).padStart(2, '0')}:00`, pay, tip, bonus, distance,
        startAddress: `${100 + index * 37} Main St`, endAddress: `${20 + index * 53} ${['Oak Ave', 'Elm Dr', 'Lake Rd', 'Cedar Ct', 'Birch Ln'][index % 5]}`,
      };
      return trip;
    });
    return { daysAgo, number, service, start, finish: formatClock(clock + 10), trips };
  });
}

const round = (n: number) => Math.round(n * 100) / 100;

// Mirrors DateHelper.getDays / toISO, as e2e/support/sheet-fixture.ts does for today.
function dateFor(daysAgo: number): { date: string; serial: number } {
  const day = new Date(Date.now() - daysAgo * MS_PER_DAY);
  return {
    date: day.toLocaleDateString('sv-SE'),
    serial: Math.floor((day.getTime() - new Date('1900-01-01').getTime()) / MS_PER_DAY) + 2,
  };
}

// Oldest first, so the newest shift gets the highest row id and tops the app's lists.
function allShifts(): ISampleShift[] {
  return [...SAMPLE_SHIFTS, ...expandExtraShifts()].sort((a, b) => b.daysAgo - a.daysAgo);
}

// Row ids of today's shift (the last one) and of its second trip (Green Bowl), for the edit screens.
const TODAY_SHIFT_ROW_ID = FIRST_ROW_ID + allShifts().length - 1;
const TODAY_TRIP_ROW_ID = FIRST_ROW_ID + allShifts().slice(0, -1).reduce((sum, shift) => sum + shift.trips.length, 0) + 1;

function buildSheet(): Record<string, unknown> {
  const shifts: Record<string, unknown>[] = [];
  const trips: Record<string, unknown>[] = [];
  let rowId = FIRST_ROW_ID;
  let tripRowId = FIRST_ROW_ID;
  const daily = new Map<string, { serial: number; daysAgo: number; trips: number; distance: number; pay: number; tip: number; bonus: number; total: number; hours: number }>();
  for (const sample of allShifts()) {
    const { date, serial } = dateFor(sample.daysAgo);
    const key = `${serial}-${sample.number}-${sample.service}`;
    const pay = round(sample.trips.reduce((sum, t) => sum + t.pay, 0));
    const tip = round(sample.trips.reduce((sum, t) => sum + t.tip, 0));
    const distance = round(sample.trips.reduce((sum, t) => sum + t.distance, 0));
    const bonus = round(sample.trips.reduce((sum, t) => sum + (t.bonus ?? 0), 0));
    const total = round(pay + tip + bonus);
    const hours = (parseClock(sample.finish) - parseClock(sample.start)) / 60;
    const day = daily.get(date) ?? { serial, daysAgo: sample.daysAgo, trips: 0, distance: 0, pay: 0, tip: 0, bonus: 0, total: 0, hours: 0 };
    daily.set(date, {
      ...day, trips: day.trips + sample.trips.length, distance: round(day.distance + distance),
      pay: round(day.pay + pay), tip: round(day.tip + tip), bonus: round(day.bonus + bonus),
      total: round(day.total + total), hours: day.hours + hours,
    });
    shifts.push(shiftRow({
      rowId: rowId++, date, key, number: sample.number, service: sample.service,
      start: sample.start, finish: sample.finish,
      trips: sample.trips.length, distance, pay, tip, bonus, total,
      totalTrips: sample.trips.length, totalDistance: distance, totalPay: pay, totalTips: tip, totalBonus: bonus, grandTotal: total,
      amountPerTrip: round(total / sample.trips.length), amountPerTime: round(total / hours),
    }));
    for (const t of sample.trips) {
      trips.push(tripRow({
        rowId: tripRowId++, date, key, number: sample.number, service: sample.service,
        type: t.type, place: t.place, name: t.name,
        pickupTime: t.pickup, dropoffTime: t.dropoff, duration: t.duration,
        startAddress: t.startAddress, endAddress: t.endAddress,
        pay: t.pay, tip: t.tip, bonus: t.bonus ?? 0, total: round(t.pay + t.tip + (t.bonus ?? 0)), distance: t.distance,
        amountPerDistance: round((t.pay + t.tip + (t.bonus ?? 0)) / t.distance),
      }));
    }
  }
  const dailyRows = [...daily.entries()].map(([date, d], index) => ({
    rowId: FIRST_ROW_ID + index, saved: true, action: '', actionTime: 0,
    date, day: d.serial,
    weekday: new Date(Date.now() - d.daysAgo * MS_PER_DAY).toLocaleDateString('en-US', { weekday: 'short' }),
    week: '', month: '',
    trips: d.trips, distance: d.distance, time: '', pay: d.pay, tip: d.tip, bonus: d.bonus, cash: 0, total: d.total,
    amountPerTrip: round(d.total / d.trips), amountPerDistance: round(d.total / d.distance), amountPerTime: round(d.total / d.hours),
  }));
  return { ...sheetEntity({ shifts, trips }), sheets: { ...(sheetEntity({ shifts, trips }) as { sheets: object }).sheets, daily: dailyRows } };
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
    // Pick the last 30 days through the date-range inputs so the picker shows a range.
    const format = (daysAgo: number) => new Date(Date.now() - daysAgo * MS_PER_DAY).toLocaleDateString('en-US');
    await page.getByPlaceholder('Start date').fill(format(STATS_RANGE_DAYS));
    await page.getByPlaceholder('End date').fill(format(0));
    await page.getByPlaceholder('End date').press('Tab');
    await expect(page.locator('app-stats-table').first()).toContainText('DoorDash');
    // Every stat card must hold a real value; a dash means the seed data is too thin.
    await expect(page.locator('app-stats-summary')).toContainText('Busiest Day');
    await expect(page.locator('app-stats-summary')).not.toContainText('—');
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
