import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import type { IExpense } from '@interfaces/entities/expense.interface';
import { ExpensesService } from '@services/sheets/expenses.service';
import { ActionEnum } from '@enums/action.enum';
import { updateAction } from '@utils/action.utils';
import type { IConfirmDialog } from '@interfaces/ui/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DATE_FORMATS } from '@constants/date.constants';
import { BaseRectButtonComponent } from '@components/base';

@Component({
  selector: 'app-expenses-quick-view',
  standalone: true,
  templateUrl: './expenses-quick-view.component.html',
  styleUrl: './expenses-quick-view.component.scss',
  imports: [MatIcon, NgClass, CurrencyPipe, DatePipe, BaseRectButtonComponent]
})
export class ExpensesQuickViewComponent {
  private expensesService = inject(ExpensesService);
  private router = inject(Router);
  public dialog = inject(MatDialog);

  public ActionEnum = ActionEnum;
  public dateFormats = DATE_FORMATS;

  @Input() public expense: IExpense = {} as IExpense;
  @Input() public index = 0;
  @Input() public inlineMode = false;
  @Output() public parentReload = new EventEmitter<void>();
  @Output() public edit = new EventEmitter<IExpense>();

  public canEditExpense(): boolean {
    return !!this.expense && this.expense.action !== ActionEnum.Delete;
  }

  public async editExpense(): Promise<void> {
    // Emit so an embedding parent (e.g. pending changes) can decide how to open
    // the editor; only self-navigate when standalone. Expenses are edited inline
    // on the expenses page, so we route there with the row to open.
    this.edit.emit(this.expense);
    if (!this.inlineMode) {
      await this.router.navigate(['/expenses'], { queryParams: { edit: this.expense.rowId } });
    }
  }

  public confirmDeleteExpenseDialog(): void {
    const dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = 'Confirm Delete';
    dialogData.message = 'This expense will be removed from your spreadsheet on the next sync. Are you sure you want to delete this?';
    dialogData.trueText = 'Delete';
    dialogData.trueColor = 'danger';
    dialogData.falseText = 'Cancel';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.deleteExpense();
      }
    });
  }

  public async deleteExpense(): Promise<void> {
    await this.expensesService.deleteItem(this.expense);
    this.parentReload.emit();
  }

  public async restoreExpense(): Promise<void> {
    updateAction(this.expense, ActionEnum.Update);
    this.expense.saved = false;
    await this.expensesService.update([this.expense]);
    this.parentReload.emit();
  }
}
