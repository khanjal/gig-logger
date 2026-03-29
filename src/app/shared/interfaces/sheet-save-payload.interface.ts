import { ISheetProperties } from './sheet-properties.interface';
import { IExpense } from './expense.interface';
import { ITripSheetRow } from './trip-sheet-row.interface';
import { IShiftSheetRow } from './shift-sheet-row.interface';

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
