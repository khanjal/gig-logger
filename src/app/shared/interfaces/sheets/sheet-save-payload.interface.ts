import type { ISheetProperties } from '@interfaces/sheets/sheet-properties.interface';
import type { IExpense } from '@interfaces/entities/expense.interface';
import type { ITripSheetRow } from '@interfaces/sheets/trip-sheet-row.interface';
import type { IShiftSheetRow } from '@interfaces/sheets/shift-sheet-row.interface';

/**
 * The subset of IGigSheets actually sent on save requests.
 */
export interface ISheetSavePayloadSheets {
  trips: ITripSheetRow[];
  shifts: IShiftSheetRow[];
  expenses: IExpense[];
}

/**
 * Payload used when sending sheet save requests to the backend.
 * This is a wire-format and may contain nullable input fields.
 */
export interface ISheetSavePayload {
  properties: ISheetProperties;
  sheets: ISheetSavePayloadSheets;
}
