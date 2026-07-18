import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ExpensesQuickViewComponent } from './expenses-quick-view.component';
import { ExpensesService } from '@services/sheets/expenses.service';
import { ActionEnum } from '@enums/action.enum';
import type { IExpense } from '@interfaces/entities/expense.interface';

describe('ExpensesQuickViewComponent', () => {
  let expensesService: jasmine.SpyObj<ExpensesService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;

  function createComponent(): ExpensesQuickViewComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: ExpensesService, useValue: expensesService },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    return TestBed.runInInjectionContext(() => new ExpensesQuickViewComponent());
  }

  beforeEach(() => {
    expensesService = jasmine.createSpyObj<ExpensesService>('ExpensesService', ['deleteItem', 'update']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
  });

  it('should be created', () => {
    const comp = createComponent();
    expect(comp).toBeTruthy();
  });

  describe('canEditExpense', () => {
    it('returns true when the expense is not marked for deletion', () => {
      const comp = createComponent();
      comp.expense = { id: 1 } as IExpense;

      expect(comp.canEditExpense()).toBeTrue();
    });

    it('returns false when the expense is marked for deletion', () => {
      const comp = createComponent();
      comp.expense = { id: 1, action: ActionEnum.Delete } as IExpense;

      expect(comp.canEditExpense()).toBeFalse();
    });
  });

  describe('editExpense', () => {
    it('emits edit and navigates to the expenses page when not inline', async () => {
      const comp = createComponent();
      comp.expense = { id: 1, rowId: 42 } as IExpense;
      comp.inlineMode = false;
      const emitSpy = spyOn(comp.edit, 'emit');

      await comp.editExpense();

      expect(emitSpy).toHaveBeenCalledWith(comp.expense);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/expenses'], { queryParams: { edit: 42 } });
    });

    it('emits edit but does not navigate when inline (e.g. embedded in pending changes)', async () => {
      const comp = createComponent();
      comp.expense = { id: 1, rowId: 42 } as IExpense;
      comp.inlineMode = true;
      const emitSpy = spyOn(comp.edit, 'emit');

      await comp.editExpense();

      expect(emitSpy).toHaveBeenCalledWith(comp.expense);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('confirmDeleteExpenseDialog', () => {
    it('deletes the expense when the user confirms', async () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as unknown as ReturnType<MatDialog['open']>);
      expensesService.deleteItem.and.returnValue(Promise.resolve());
      const comp = createComponent();
      comp.expense = { id: 1 } as IExpense;
      const reloadSpy = spyOn(comp.parentReload, 'emit');

      comp.confirmDeleteExpenseDialog();
      // afterClosed().subscribe(async ...) resolves on the microtask queue.
      await Promise.resolve();
      await Promise.resolve();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(expensesService.deleteItem).toHaveBeenCalledWith(comp.expense);
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('does not delete when the user cancels', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as unknown as ReturnType<MatDialog['open']>);
      const comp = createComponent();
      comp.expense = { id: 1 } as IExpense;

      comp.confirmDeleteExpenseDialog();

      expect(expensesService.deleteItem).not.toHaveBeenCalled();
    });
  });

  describe('deleteExpense', () => {
    it('deletes the expense and emits parentReload', async () => {
      expensesService.deleteItem.and.returnValue(Promise.resolve());
      const comp = createComponent();
      comp.expense = { id: 1 } as IExpense;
      const reloadSpy = spyOn(comp.parentReload, 'emit');

      await comp.deleteExpense();

      expect(expensesService.deleteItem).toHaveBeenCalledWith(comp.expense);
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('restoreExpense', () => {
    it('marks the expense as updated and unsaved, then emits parentReload', async () => {
      expensesService.update.and.returnValue(Promise.resolve());
      const comp = createComponent();
      comp.expense = { id: 1, action: ActionEnum.Delete, saved: true } as IExpense;
      const reloadSpy = spyOn(comp.parentReload, 'emit');

      await comp.restoreExpense();

      expect(comp.expense.action).toBe(ActionEnum.Update);
      expect(comp.expense.saved).toBeFalse();
      expect(expensesService.update).toHaveBeenCalledWith([comp.expense]);
      expect(reloadSpy).toHaveBeenCalled();
    });
  });
});
