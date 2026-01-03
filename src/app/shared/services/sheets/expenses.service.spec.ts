import { TestBed } from '@angular/core/testing';
import { ExpensesService } from './expenses.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IExpense } from '@interfaces/expense.interface';

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExpensesService]
    });
    service = TestBed.inject(ExpensesService);
  });

  afterEach(async () => {
    await spreadsheetDB.expenses.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('extends SyncableCrudService with expenses table', async () => {
    const expense: IExpense = {
      id: 1,
      date: '2024-01-01',
      category: 'Gas',
      amount: 50
    } as IExpense;

    await service.add(expense);
    const result = await service.list();

    expect(result.length).toBe(1);
    expect(result[0].category).toBe('Gas');
  });

  it('inherits CRUD operations from parent class', async () => {
    const expense: IExpense = { id: 1, category: 'Maintenance', amount: 100 } as IExpense;
    
    await service.add(expense);
    const all = await service.list();
    
    expect(all.length).toBe(1);
    
    await service.delete(1);
    const afterDelete = await service.list();
    
    expect(afterDelete.length).toBe(0);
  });
});
