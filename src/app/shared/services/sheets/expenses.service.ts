import { Injectable } from '@angular/core';
import { SyncableCrudService } from '@services/syncable-crud.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IExpense } from '@interfaces/expense.interface';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';

@Injectable({ providedIn: 'root' })
export class ExpensesService extends SyncableCrudService<IExpense> {
  expenses$ = from(liveQuery(() => spreadsheetDB.expenses.toArray()));

  constructor() {
    super(spreadsheetDB.expenses);
  }
}
