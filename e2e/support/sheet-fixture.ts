import { E2E_SHEET } from './stub-backend';

// Builds the sheetEntity /sheets/all returns, shaped like ISheet in
// src/app/shared/interfaces/sheets. Every sheet collection must be present, or the app's
// loader fails on the missing one.

// The first data row; row 1 is the header on the real spreadsheet.
const FIRST_ROW_ID = 2;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const SERVICE = 'DoorDash';
const SHIFT_NUMBER = 1;

// Evaluated once per spec file, so a date and the key built from it can never disagree.
const NOW = new Date();

/** Today in the app's own date format (DateHelper.toISO), so the trip lands in "Today's Trips". */
export const TODAY = NOW.toLocaleDateString('sv-SE');

/** Mirrors DateHelper.getDays: the spreadsheet's day serial, which shift and trip keys start with. */
const DAY_SERIAL = Math.floor((NOW.getTime() - new Date('1900-01-01').getTime()) / MS_PER_DAY) + 2;

/** Mirrors ShiftHelper.createNewShift's key, so the trip and its shift link up. */
export const SHIFT_KEY = `${DAY_SERIAL}-${SHIFT_NUMBER}-${SERVICE}`;

/** A shift row as the API sends it - tags are the sheet's raw comma-delimited text. */
export function shiftRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rowId: FIRST_ROW_ID,
    saved: true,
    action: '',
    actionTime: 0,
    date: TODAY,
    key: SHIFT_KEY,
    number: SHIFT_NUMBER,
    service: SERVICE,
    region: '',
    start: '11:30 AM',
    finish: '',
    active: '',
    time: '',
    trips: 0,
    distance: 0,
    pay: 0, tip: 0, bonus: 0, cash: 0, total: 0,
    amountPerTrip: 0, amountPerDistance: 0, amountPerTime: 0,
    totalActive: '', totalTime: '', totalTrips: 1, totalDistance: 2,
    totalPay: 5, totalTips: 3, totalBonus: 0, grandTotal: 8, totalCash: 0,
    note: '',
    omit: false,
    tags: '',
    ...overrides,
  };
}

/** A trip row on the fixture's shift. */
export function tripRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rowId: FIRST_ROW_ID,
    saved: true,
    action: '',
    actionTime: 0,
    date: TODAY,
    key: SHIFT_KEY,
    number: SHIFT_NUMBER,
    service: SERVICE,
    type: 'Pickup',
    place: 'Taco Spot',
    name: 'Alex',
    pickupTime: '12:00 PM',
    dropoffTime: '12:20 PM',
    duration: '00:20:00',
    startAddress: '1 Main St',
    endAddress: '2 Oak Ave',
    endUnit: '',
    orderNumber: '',
    note: '',
    region: '',
    pay: 5, tip: 3, bonus: 0, cash: 0, total: 8,
    distance: 2,
    startOdometer: 0,
    endOdometer: 0,
    exclude: false,
    amountPerDistance: 4,
    amountPerTime: 24,
    tags: '',
    ...overrides,
  };
}

export function sheetEntity(sheets: { trips?: unknown[]; shifts?: unknown[] } = {}): Record<string, unknown> {
  return {
    properties: { id: E2E_SHEET.id, name: E2E_SHEET.name },
    messages: [],
    sheets: {
      addresses: [], daily: [], deliveries: [], expenses: [], locations: [], monthly: [],
      names: [], places: [], regions: [], services: [], setup: [], types: [], weekdays: [],
      weekly: [], yearly: [],
      shifts: sheets.shifts ?? [],
      trips: sheets.trips ?? [],
    },
  };
}
