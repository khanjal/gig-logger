import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpensesComponent } from './expenses.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ExpensesService } from '@services/sheets/expenses.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { IExpense } from '@interfaces/expense.interface';
import { ActionEnum } from '@enums/action.enum';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('ExpensesComponent', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;
  let expensesServiceSpy: jasmine.SpyObj<ExpensesService>;
  let unsavedDataServiceSpy: jasmine.SpyObj<UnsavedDataService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const makeExpense = (overrides: Partial<IExpense> = {}): IExpense => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 2,
    date: overrides.date ?? '2024-01-15',
    name: overrides.name ?? 'Gas Station',
    amount: overrides.amount ?? 45.50,
    category: overrides.category ?? 'Fuel',
    note: overrides.note ?? '',
    action: overrides.action ?? ActionEnum.Saved,
    actionTime: overrides.actionTime ?? Date.now(),
    saved: overrides.saved ?? true
  });

  beforeEach(async () => {
    expensesServiceSpy = jasmine.createSpyObj('ExpensesService', [
      'getMaxRowId', 'add', 'update', 'delete'
    ]);
    unsavedDataServiceSpy = jasmine.createSpyObj('UnsavedDataService', ['hasUnsavedData']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    expensesServiceSpy.getMaxRowId.and.returnValue(Promise.resolve(10));
    unsavedDataServiceSpy.hasUnsavedData.and.returnValue(Promise.resolve(false));

    await TestBed.configureTestingModule({
      imports: [ExpensesComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ExpensesService, useValue: expensesServiceSpy },
        { provide: UnsavedDataService, useValue: unsavedDataServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        CurrencyPipe,
        DatePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
    
    // Mock spreadsheet DB before ngOnInit
    spyOn(spreadsheetDB.expenses, 'toArray').and.returnValue(Promise.resolve([]) as any);
  });

  it('should create', async () => {
    await component.ngOnInit();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('initializes form with default values', async () => {
      spyOn(component, 'loadExpenses').and.returnValue(Promise.resolve());
      
      await component.ngOnInit();

      expect(component.expenseForm).toBeDefined();
      expect(component.expenseForm.get('rowId')?.value).toBe(11); // maxRowId + 1
      expect(component.expenseForm.get('date')?.value).toBeTruthy();
    });

    it('loads expenses on init', async () => {
      spyOn(component, 'loadExpenses').and.returnValue(Promise.resolve());
      
      await component.ngOnInit();

      expect(component.loadExpenses).toHaveBeenCalled();
    });

    it('sets maxRowId from service', async () => {
      spyOn(component, 'loadExpenses').and.returnValue(Promise.resolve());
      
      await component.ngOnInit();

      expect(expensesServiceSpy.getMaxRowId).toHaveBeenCalled();
      expect(component.maxRowId).toBe(10);
    });
  });

  describe('getToday', () => {
    it('returns today in ISO format', () => {
      const today = component.getToday();
      
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('loadExpenses', () => {

    it('groups expenses by month', async () => {
      const expenses = [
        makeExpense({ date: '2024-01-15', amount: 50 }),
        makeExpense({ date: '2024-01-20', amount: 30 }),
        makeExpense({ date: '2024-02-10', amount: 40 })
      ];
      (spreadsheetDB.expenses.toArray as jasmine.Spy).and.returnValue(Promise.resolve(expenses));

      await component.loadExpenses();

      expect(component.groupedExpenses['2024-01']).toBeDefined();
      expect(component.groupedExpenses['2024-01'].length).toBe(2);
      expect(component.groupedExpenses['2024-02'].length).toBe(1);
    });

    it('groups expenses by year', async () => {
      const expenses = [
        makeExpense({ date: '2024-01-15' }),
        makeExpense({ date: '2023-12-20' })
      ];
      (spreadsheetDB.expenses.toArray as jasmine.Spy).and.returnValue(Promise.resolve(expenses));

      await component.loadExpenses();

      expect(component.groupedExpensesByYear['2024']).toBeDefined();
      expect(component.groupedExpensesByYear['2023']).toBeDefined();
    });

    it('extracts custom categories', async () => {
      const expenses = [
        makeExpense({ category: 'Fuel' }),
        makeExpense({ category: 'CustomCategory' }),
        makeExpense({ category: 'AnotherCustom' })
      ];
      (spreadsheetDB.expenses.toArray as jasmine.Spy).and.returnValue(Promise.resolve(expenses));

      await component.loadExpenses();

      expect(component.customCategories).toContain('CustomCategory');
      expect(component.customCategories).toContain('AnotherCustom');
      expect(component.customCategories).not.toContain('Fuel'); // default category
    });

    it('checks for unsaved data', async () => {
      (spreadsheetDB.expenses.toArray as jasmine.Spy).and.returnValue(Promise.resolve([]));

      await component.loadExpenses();

      expect(unsavedDataServiceSpy.hasUnsavedData).toHaveBeenCalled();
    });
  });

  describe('addExpense', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      spyOn(component, 'loadExpenses').and.returnValue(Promise.resolve());
    });

    it('does nothing if form is invalid', async () => {
      component.expenseForm.patchValue({ name: '', amount: null });

      await component.addExpense();

      expect(expensesServiceSpy.add).not.toHaveBeenCalled();
    });

    it('adds new expense with correct action', async () => {
      component.maxRowId = 10;
      component.expenseForm.patchValue({
        date: '2024-01-15',
        name: 'Gas',
        amount: 50,
        category: 'Fuel'
      });
      expensesServiceSpy.add.and.returnValue(Promise.resolve());

      await component.addExpense();

      expect(expensesServiceSpy.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          rowId: 11,
          action: ActionEnum.Add,
          saved: false
        })
      );
    });

    it('updates existing expense when editing', async () => {
      component.editingExpenseId = 5;
      component.expenses = [makeExpense({ id: 5, rowId: 6 })];
      component.expenseForm.patchValue({
        date: '2024-01-15',
        name: 'Updated Name',
        amount: 75,
        category: 'Fuel'
      });
      expensesServiceSpy.update.and.returnValue(Promise.resolve());

      await component.addExpense();

      expect(expensesServiceSpy.update).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            id: 5,
            action: ActionEnum.Update
          })
        ])
      );
    });

    it('clears editing state after update', async () => {
      component.editingExpenseId = 5;
      component.expenses = [makeExpense({ id: 5, rowId: 6 })];
      component.expenseForm.patchValue({
        date: '2024-01-15',
        name: 'Gas',
        amount: 50,
        category: 'Fuel'
      });
      expensesServiceSpy.update.and.returnValue(Promise.resolve());

      await component.addExpense();

      expect(component.editingExpenseId).toBeUndefined();
    });

    it('resets form after add', async () => {
      component.expenseForm.patchValue({
        date: '2024-01-15',
        name: 'Gas',
        amount: 50,
        category: 'Fuel'
      });
      expensesServiceSpy.add.and.returnValue(Promise.resolve());

      await component.addExpense();

      expect(component.expenseForm.get('name')?.value).toBeFalsy();
    });

    it('closes form after add', async () => {
      component.showAddForm = true;
      component.expenseForm.patchValue({
        date: '2024-01-15',
        name: 'Gas',
        amount: 50,
        category: 'Fuel'
      });
      expensesServiceSpy.add.and.returnValue(Promise.resolve());

      await component.addExpense();

      expect(component.showAddForm).toBe(false);
    });
  });

  describe('editExpense', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('patches form with expense data', () => {
      const expense = makeExpense({ id: 5, name: 'Gas', amount: 45.50 });

      component.editExpense(expense);

      expect(component.expenseForm.get('name')?.value).toBe('Gas');
      expect(component.expenseForm.get('amount')?.value).toBe(45.50);
    });

    it('sets editing expense id', () => {
      const expense = makeExpense({ id: 5 });

      component.editExpense(expense);

      expect(component.editingExpenseId).toBe(5);
    });

    it('shows add form', () => {
      const expense = makeExpense();
      component.showAddForm = false;

      component.editExpense(expense);

      expect(component.showAddForm).toBe(true);
    });
  });

  describe('cancelEdit', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('clears editing state', () => {
      component.editingExpenseId = 5;

      component.cancelEdit();

      expect(component.editingExpenseId).toBeUndefined();
    });

    it('closes form', () => {
      component.showAddForm = true;

      component.cancelEdit();

      expect(component.showAddForm).toBe(false);
    });

    it('resets form', () => {
      component.expenseForm.patchValue({ name: 'Test' });

      component.cancelEdit();

      expect(component.expenseForm.get('name')?.value).toBeFalsy();
    });
  });

  describe('deleteCurrentExpense', () => {
    it('does nothing if no expense is being edited', async () => {
      component.editingExpenseId = undefined;
      spyOn(component, 'confirmDeleteExpenseDialog');

      await component.deleteCurrentExpense();

      expect(component.confirmDeleteExpenseDialog).not.toHaveBeenCalled();
    });

    it('confirms deletion for editing expense', async () => {
      const expense = makeExpense({ id: 5 });
      component.editingExpenseId = 5;
      component.expenses = [expense];
      spyOn(component, 'confirmDeleteExpenseDialog').and.returnValue(Promise.resolve());

      await component.deleteCurrentExpense();

      expect(component.confirmDeleteExpenseDialog).toHaveBeenCalledWith(expense);
    });
  });

  describe('isEditingDeleted', () => {
    it('returns false if not editing', () => {
      component.editingExpenseId = undefined;

      expect(component.isEditingDeleted()).toBe(false);
    });

    it('returns true if editing expense marked for deletion', () => {
      component.editingExpenseId = 5;
      component.expenses = [makeExpense({ id: 5, action: ActionEnum.Delete })];

      expect(component.isEditingDeleted()).toBe(true);
    });

    it('returns false if editing expense not deleted', () => {
      component.editingExpenseId = 5;
      component.expenses = [makeExpense({ id: 5, action: ActionEnum.Saved })];

      expect(component.isEditingDeleted()).toBe(false);
    });
  });

  describe('restoreCurrentExpense', () => {
    beforeEach(() => {
      spyOn(component, 'loadExpenses').and.returnValue(Promise.resolve());
      spyOn(component, 'cancelEdit');
    });

    it('restores deleted expense being edited', async () => {
      const expense = makeExpense({ id: 5, action: ActionEnum.Delete });
      component.editingExpenseId = 5;
      component.expenses = [expense];
      expensesServiceSpy.update.and.returnValue(Promise.resolve());

      await component.restoreCurrentExpense();

      expect(expensesServiceSpy.update).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            action: ActionEnum.Update,
            saved: false
          })
        ])
      );
    });

    it('cancels edit after restore', async () => {
      const expense = makeExpense({ id: 5, action: ActionEnum.Delete });
      component.editingExpenseId = 5;
      component.expenses = [expense];
      expensesServiceSpy.update.and.returnValue(Promise.resolve());

      await component.restoreCurrentExpense();

      expect(component.cancelEdit).toHaveBeenCalled();
    });
  });

  describe('getMonthTotal', () => {
    it('sums expenses amounts', () => {
      const expenses = [
        makeExpense({ amount: 25.50 }),
        makeExpense({ amount: 30.25 }),
        makeExpense({ amount: 15.00 })
      ];

      const total = component.getMonthTotal(expenses);

      expect(total).toBeCloseTo(70.75, 2);
    });

    it('handles null amounts', () => {
      const expenses = [
        makeExpense({ amount: 25.50, action: ActionEnum.Saved }),
        makeExpense({ amount: 0, action: ActionEnum.Saved })
        // Test getMonthTotal with zero amount
      ];

      const total = component.getMonthTotal(expenses);

      expect(total).toBeCloseTo(25.50, 2);
    });
  });

  describe('getYearTotal', () => {
    it('sums expenses amounts for year', () => {
      const expenses = [
        makeExpense({ amount: 100 }),
        makeExpense({ amount: 200 }),
        makeExpense({ amount: 50 })
      ];

      const total = component.getYearTotal(expenses);

      expect(total).toBe(350);
    });
  });
});
