import { Injectable } from '@angular/core';
import { GenericCrudService } from '@services/generic-crud.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IExpense } from '@interfaces/expense.interface';

@Injectable({ providedIn: 'root' })
export class ExpensesService extends GenericCrudService<IExpense> {
  constructor() {
    super(spreadsheetDB.expenses);
  }

  async getUnsaved(): Promise<IExpense[]> {
    return await spreadsheetDB.expenses.filter(e => e.saved === false).toArray();
  }

  async saveUnsaved(): Promise<void> {
    const unsaved = await this.getUnsaved();
    for (const expense of unsaved) {
      expense.saved = true;
      await this.update([expense]);
    }
  }

  async getMaxRowId(): Promise<number> {
    const expenses = await spreadsheetDB.expenses.toArray();
    if (expenses.length === 0) return 0;
    return Math.max(...expenses.map(e => e.rowId || 0));
  }
}
