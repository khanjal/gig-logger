import { ITrip } from './trip.interface';

/**
 * Wire-format for a trip row when saving to Google Sheets.
 * Numeric input fields are nullable to allow empty cells on the sheet.
 */
export interface ITripSheetRow extends Omit<ITrip,
  'pay' | 'tip' | 'bonus' | 'cash' | 'distance' | 'startOdometer' | 'endOdometer'> {
  pay: number | null;
  tip: number | null;
  bonus: number | null;
  cash: number | null;
  distance: number | null;
  startOdometer: number | null;
  endOdometer: number | null;
}
