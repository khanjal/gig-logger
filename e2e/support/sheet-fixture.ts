import { E2E_SHEET } from './stub-backend';

// Builds the sheetEntity /sheets/all returns, shaped like ISheet in
// src/app/shared/interfaces/sheets. Every sheet collection must be present, or the app's
// loader fails on the missing one.

// The first data row; row 1 is the header on the real spreadsheet.
const FIRST_ROW_ID = 2;

/** Today in the app's own date format (DateHelper.toISO), so the trip lands in "Today's Trips". */
export function today(): string {
  return new Date().toLocaleDateString('sv-SE');
}

/** A trip row as the API sends it - tags are the sheet's raw comma-delimited text. */
export function tripRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rowId: FIRST_ROW_ID,
    saved: true,
    action: '',
    actionTime: 0,
    date: today(),
    key: `${today()}-1-DoorDash`,
    number: 1,
    service: 'DoorDash',
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
    pay: 5,
    tip: 3,
    bonus: 0,
    cash: 0,
    total: 8,
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
