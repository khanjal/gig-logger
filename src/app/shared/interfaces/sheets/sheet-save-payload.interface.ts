import { ISheetProperties } from '@interfaces/sheets/sheet-properties.interface';
import { IExpense } from '@interfaces/entities/expense.interface';
import { ITripSheetRow } from '@interfaces/sheets/trip-sheet-row.interface';
import { IShiftSheetRow } from '@interfaces/sheets/shift-sheet-row.interface';

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
