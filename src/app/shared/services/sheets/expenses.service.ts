import { Injectable } from '@angular/core';
import { GenericCrudService } from '@services/generic-crud.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IExpense } from '@interfaces/expense.interface';

@Injectable({ providedIn: 'root' })
export class ExpensesService extends GenericCrudService<IExpense> {
  constructor() {
    super(spreadsheetDB.expenses);
  }
}
