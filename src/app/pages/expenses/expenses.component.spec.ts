import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpensesComponent } from './expenses.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ExpensesService } from '@services/sheets/expenses.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { IExpense } from '@interfaces/expense.interface';
import { ActionEnum } from '@enums/action.enum';
import { BehaviorSubject, of } from 'rxjs';

describe('ExpensesComponent', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;
  let expensesServiceSpy: jasmine.SpyObj<ExpensesService>;
  let unsavedDataServiceSpy: jasmine.SpyObj<UnsavedDataService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let authGoogleServiceMock: Partial<AuthGoogleService>;
  let expensesStream$: BehaviorSubject<IExpense[]>;

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
    expensesStream$ = new BehaviorSubject<IExpense[]>([]);
    expensesServiceSpy = jasmine.createSpyObj(
      'ExpensesService',
      ['getMaxRowId', 'add', 'update', 'delete', 'list'],
      { expenses$: expensesStream$.asObservable() }
    );
    unsavedDataServiceSpy = jasmine.createSpyObj('UnsavedDataService', ['hasUnsavedData']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    authGoogleServiceMock = {
      canSync: () => Promise.resolve(false),
      isAuthenticated: () => Promise.resolve(false),
      isAuthenticatedSync: () => false,
      profile$: new BehaviorSubject<any>(null)
    };

    expensesServiceSpy.getMaxRowId.and.returnValue(Promise.resolve(10));
  expensesServiceSpy.list.and.returnValue(Promise.resolve([]));
    unsavedDataServiceSpy.hasUnsavedData.and.returnValue(Promise.resolve(false));

    await TestBed.configureTestingModule({
      imports: [ExpensesComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ExpensesService, useValue: expensesServiceSpy },
        { provide: UnsavedDataService, useValue: unsavedDataServiceSpy },
        { provide: AuthGoogleService, useValue: authGoogleServiceMock },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        CurrencyPipe,
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    await component.ngOnInit();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('initializes form with default values', async () => {
      await component.ngOnInit();

      expect(component.expenseForm).toBeDefined();
      expect(component.expenseForm.get('rowId')?.value).toBe(11); // maxRowId + 1
      expect(component.expenseForm.get('date')?.value).toBeTruthy();
    });

    it('subscribes to reactive expenses on init', async () => {
      const streamedExpense = makeExpense({ id: 7, name: 'Reactive Fuel' });

      await component.ngOnInit();
      expensesStream$.next([streamedExpense]);
      await Promise.resolve();

      expect(component.expenses()).toEqual([streamedExpense]);
    });

    it('sets maxRowId from service', async () => {
      await component.ngOnInit();

      expect(expensesServiceSpy.getMaxRowId).toHaveBeenCalled();
      expect(component.maxRowId()).toBe(10);
    });
  });

  describe('date defaults', () => {
    it('initializes date control with a Date value', async () => {
      await component.ngOnInit();

      const dateValue = component.expenseForm.get('date')?.value;
      expect(dateValue instanceof Date).toBeTrue();
    });
  });

  describe('loadExpenses', () => {

    it('groups expenses by month', async () => {
      const expenses = [
        makeExpense({ date: '2024-01-15', amount: 50 }),
        makeExpense({ date: '2024-01-20', amount: 30 }),
        makeExpense({ date: '2024-02-10', amount: 40 })
      ];
      expensesServiceSpy.list.and.returnValue(Promise.resolve(expenses));

      await component.loadExpenses();

      expect(component.groupedExpenses()['2024-01']).toBeDefined();
      expect(component.groupedExpenses()['2024-01'].length).toBe(2);
      expect(component.groupedExpenses()['2024-02'].length).toBe(1);
    });

    it('groups expenses by year', async () => {
      const expenses = [
        makeExpense({ date: '2024-01-15' }),
        makeExpense({ date: '2023-12-20' })
      ];
      expensesServiceSpy.list.and.returnValue(Promise.resolve(expenses));

      await component.loadExpenses();

      expect(component.groupedExpensesByYear()['2024']).toBeDefined();
      expect(component.groupedExpensesByYear()['2023']).toBeDefined();
    });

    it('extracts custom categories', async () => {
      const expenses = [
        makeExpense({ category: 'Fuel' }),
        makeExpense({ category: 'CustomCategory' }),
        makeExpense({ category: 'AnotherCustom' })
      ];
      expensesServiceSpy.list.and.returnValue(Promise.resolve(expenses));

      await component.loadExpenses();

      expect(component.customCategories()).toContain('CustomCategory');
      expect(component.customCategories()).toContain('AnotherCustom');
      expect(component.customCategories()).not.toContain('Fuel'); // default category
    });

    it('refreshes unsaved data through stream binding on init', async () => {
      expensesServiceSpy.list.and.returnValue(Promise.resolve([]));

      await component.ngOnInit();
      await component.loadExpenses();

      expect(unsavedDataServiceSpy.hasUnsavedData).toHaveBeenCalled();
    });

    it('precomputes month and year totals', async () => {
      const expenses = [
        makeExpense({ date: '2024-01-15', amount: 25.50 }),
        makeExpense({ date: '2024-01-20', amount: 30.25 }),
        makeExpense({ date: '2024-02-10', amount: 15.00 })
      ];
      expensesServiceSpy.list.and.returnValue(Promise.resolve(expenses));

      await component.loadExpenses();

      expect(component.monthTotals()['2024-01']).toBeCloseTo(55.75, 2);
      expect(component.monthTotals()['2024-02']).toBeCloseTo(15.00, 2);
      expect(component.yearTotals()['2024']).toBeCloseTo(70.75, 2);
    });
  });

  describe('addExpense', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('does nothing if form is invalid', async () => {
      component.expenseForm.patchValue({ name: '', amount: null });

      await component.addExpense();

      expect(expensesServiceSpy.add).not.toHaveBeenCalled();
    });

    it('adds new expense with correct action', async () => {
      component.maxRowId.set(10);
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
      component.editingExpenseId.set(5);
      component.expenses.set([makeExpense({ id: 5, rowId: 6 })]);
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
      component.editingExpenseId.set(5);
      component.expenses.set([makeExpense({ id: 5, rowId: 6 })]);
      component.expenseForm.patchValue({
        date: '2024-01-15',
        name: 'Gas',
        amount: 50,
        category: 'Fuel'
      });
      expensesServiceSpy.update.and.returnValue(Promise.resolve());

      await component.addExpense();

      expect(component.editingExpenseId()).toBeUndefined();
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
      component.showAddForm.set(true);
      component.expenseForm.patchValue({
        date: '2024-01-15',
        name: 'Gas',
        amount: 50,
        category: 'Fuel'
      });
      expensesServiceSpy.add.and.returnValue(Promise.resolve());

      await component.addExpense();

      expect(component.showAddForm()).toBe(false);
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

      expect(component.editingExpenseId()).toBe(5);
    });

    it('shows add form', () => {
      const expense = makeExpense();
      component.showAddForm.set(false);

      component.editExpense(expense);

      expect(component.showAddForm()).toBe(true);
    });
  });

  describe('cancelEdit', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('clears editing state', () => {
      component.editingExpenseId.set(5);

      component.cancelEdit();

      expect(component.editingExpenseId()).toBeUndefined();
    });

    it('closes form', () => {
      component.showAddForm.set(true);

      component.cancelEdit();

      expect(component.showAddForm()).toBe(false);
    });

    it('resets form', () => {
      component.expenseForm.patchValue({ name: 'Test' });

      component.cancelEdit();

      expect(component.expenseForm.get('name')?.value).toBeFalsy();
    });
  });

  describe('deleteCurrentExpense', () => {
    it('does nothing if no expense is being edited', async () => {
      component.editingExpenseId.set(undefined);
      spyOn(component, 'confirmDeleteExpenseDialog');

      await component.deleteCurrentExpense();

      expect(component.confirmDeleteExpenseDialog).not.toHaveBeenCalled();
    });

    it('confirms deletion for editing expense', async () => {
      const expense = makeExpense({ id: 5 });
      component.editingExpenseId.set(5);
      component.expenses.set([expense]);
      spyOn(component, 'confirmDeleteExpenseDialog').and.returnValue(Promise.resolve());

      await component.deleteCurrentExpense();

      expect(component.confirmDeleteExpenseDialog).toHaveBeenCalledWith(expense);
    });
  });

  describe('isEditingDeleted', () => {
    it('returns false if not editing', () => {
      component.editingExpenseId.set(undefined);

      expect(component.isEditingDeleted()).toBe(false);
    });

    it('returns true if editing expense marked for deletion', () => {
      component.editingExpenseId.set(5);
      component.expenses.set([makeExpense({ id: 5, action: ActionEnum.Delete })]);

      expect(component.isEditingDeleted()).toBe(true);
    });

    it('returns false if editing expense not deleted', () => {
      component.editingExpenseId.set(5);
      component.expenses.set([makeExpense({ id: 5, action: ActionEnum.Saved })]);

      expect(component.isEditingDeleted()).toBe(false);
    });
  });

  describe('restoreCurrentExpense', () => {
    beforeEach(() => {
      spyOn(component, 'cancelEdit');
    });

    it('restores deleted expense being edited', async () => {
      const expense = makeExpense({ id: 5, action: ActionEnum.Delete });
      component.editingExpenseId.set(5);
      component.expenses.set([expense]);
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
      component.editingExpenseId.set(5);
      component.expenses.set([expense]);
      expensesServiceSpy.update.and.returnValue(Promise.resolve());

      await component.restoreCurrentExpense();

      expect(component.cancelEdit).toHaveBeenCalled();
    });
  });

  describe('confirmDeleteExpenseDialog', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('deletes expense and cancels edit when dialog is confirmed', async () => {
      const expense = makeExpense({ id: 5, action: ActionEnum.Saved });
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      expensesServiceSpy.update.and.returnValue(Promise.resolve());
      component.editingExpenseId.set(5);

      await component.confirmDeleteExpenseDialog(expense);

      expect(expensesServiceSpy.update).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({ id: 5, action: ActionEnum.Delete })
        ])
      );
      expect(component.editingExpenseId()).toBeUndefined();
    });

    it('does not delete when dialog is cancelled', async () => {
      const expense = makeExpense({ id: 5 });
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      await component.confirmDeleteExpenseDialog(expense);

      expect(expensesServiceSpy.delete).not.toHaveBeenCalled();
      expect(expensesServiceSpy.update).not.toHaveBeenCalled();
    });
  });

  describe('confirmSaveDialog', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('calls saveSheetDialog when dialog is confirmed', async () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      const saveSpy = spyOn(component, 'saveSheetDialog').and.resolveTo();

      await component.confirmSaveDialog();

      expect(saveSpy).toHaveBeenCalledWith('save');
    });

    it('does not call saveSheetDialog when dialog is cancelled', async () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      const saveSpy = spyOn(component, 'saveSheetDialog').and.resolveTo();

      await component.confirmSaveDialog();

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('saveSheetDialog', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('shows login snackbar when canSync is false', async () => {
      (authGoogleServiceMock as any).canSync = () => Promise.resolve(false);

      await component.saveSheetDialog('save');

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('shows success snackbar after successful sync', async () => {
      (authGoogleServiceMock as any).canSync = () => Promise.resolve(true);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

      await component.saveSheetDialog('save');

      expect(snackBarSpy.open).toHaveBeenCalled();
    });

    it('does not show success snackbar when sync dialog is cancelled', async () => {
      (authGoogleServiceMock as any).canSync = () => Promise.resolve(true);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      await component.saveSheetDialog('save');

      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });
  });
});
