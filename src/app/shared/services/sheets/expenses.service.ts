import { Injectable } from '@angular/core';
import { SyncableCrudService } from '@services/syncable-crud.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IExpense } from '@interfaces/expense.interface';

@Injectable({ providedIn: 'root' })
export class ExpensesService extends SyncableCrudService<IExpense> {
  constructor() {
    super(spreadsheetDB.expenses);
  }
}
