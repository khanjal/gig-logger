export interface IExpenseFormValue {
  rowId?: number | null;
  date?: string | Date | null;
  name?: string | null;
  amount?: number | string | null;
  category?: string | null;
  note?: string | null;
}
