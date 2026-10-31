import type { IShift } from '@interfaces/entities/shift.interface';

/**
 * Wire-format for a shift row when saving to Google Sheets.
 * Numeric input fields are nullable to allow empty cells on the sheet.
 */
export interface IShiftSheetRow extends Omit<IShift, 'pay' | 'tip' | 'bonus' | 'cash' | 'tags'> {
  /** Comma-delimited on the sheet; RaptorSheets stores it as opaque text. */
  tags: string;
  pay: number | null;
  tip: number | null;
  bonus: number | null;
  cash: number | null;
}
