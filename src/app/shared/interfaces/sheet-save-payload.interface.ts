import { ISheetProperties } from '@interfaces/sheet-properties.interface';
import { IExpense } from '@interfaces/expense.interface';
import { ITripSheetRow } from '@interfaces/trip-sheet-row.interface';
import { IShiftSheetRow } from '@interfaces/shift-sheet-row.interface';

/**
 * Payload used when sending sheet save requests to the backend.
 * This is a wire-format and may contain nullable input fields.
 */
export interface ISheetSavePayload {
  properties: ISheetProperties;
  trips: ITripSheetRow[];
  shifts: IShiftSheetRow[];
  expenses: IExpense[];
}
