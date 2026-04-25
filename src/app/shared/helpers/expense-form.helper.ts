import { DateHelper } from '@helpers/date.helper';
import { NumberHelper } from '@helpers/number.helper';
import type { IExpense } from '@interfaces/expense.interface';
import type { IExpenseFormValue } from '@interfaces/expense-form-value.interface';

/**
 * Normalizes an expense date from form/domain sources into YYYY-MM-DD.
 * @param date Date-like value from form controls or stored expense entities.
 * @returns Normalized date string or empty string when unavailable.
 */
export function normalizeExpenseDate(date: string | Date | null | undefined): string {
  if (!date) {
    return '';
  }

  if (date instanceof Date) {
    return DateHelper.toISO(date);
  }

  return typeof date === 'string' ? date.slice(0, 10) : '';
}

/**
 * Converts expense form values to an expense draft with stable date/number boundaries.
 * @param formValue Raw form value object.
 * @returns Expense fields normalized for domain/storage usage.
 */
export function mapExpenseFormValueToDraft(formValue: IExpenseFormValue): Pick<IExpense, 'date' | 'name' | 'amount' | 'category' | 'note'> {
  return {
    date: normalizeExpenseDate(formValue.date),
    name: formValue.name?.trim() || '',
    amount: NumberHelper.toNumber(formValue.amount),
    category: formValue.category?.trim() || '',
    note: formValue.note?.trim() || '',
  };
}

/**
 * Converts a stored expense entity into a form-compatible value object.
 * @param expense Expense entity from storage.
 * @returns Form value object with local Date object for date picker controls.
 */
export function mapExpenseToFormValue(expense: IExpense): IExpenseFormValue {
  return {
    ...expense,
    date: expense.date ? DateHelper.parseLocalDate(expense.date) : null,
  };
}
