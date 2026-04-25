import { GroupByMonthPipe } from '@pipes/group-by-month.pipe';
import { OrdinalPipe } from '@pipes/ordinal.pipe';
import { OrderByPipe } from '@pipes/order-by-date-asc.pipe';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IExpense } from '@interfaces/expense.interface';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { BaseDatepickerComponent } from '@components/base/base-datepicker/base-datepicker.component';
import { BaseFabButtonComponent } from '@components/base';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseInputComponent } from '@components/base/base-input/base-input.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { ExpensesService } from '@services/sheets/expenses.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { ActionEnum } from '@enums/action.enum';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { AuthGoogleService } from '@services/auth-google.service';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { updateAction } from '@utils/action.utils';
import { DATE_FORMATS } from '@constants/date.constants';
import { firstValueFrom } from 'rxjs';
import { mapExpenseFormValueToDraft, mapExpenseToFormValue, normalizeExpenseDate } from '@helpers/expense-form.helper';
import type { IExpenseFormValue } from '@interfaces/expense-form-value.interface';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    OrderByPipe,
    MatAutocompleteModule,
    GroupByMonthPipe,
    MatMenuModule,
    BaseDatepickerComponent,
    BaseFabButtonComponent,
    BaseRectButtonComponent,
    BaseInputComponent
  ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss'],
  providers: [CurrencyPipe, DatePipe]
})

export class ExpensesComponent implements OnInit {
  dateFormats = DATE_FORMATS;
  groupedExpensesByYear = signal<{ [year: string]: IExpense[] }>({});
  yearTotals = signal<Record<string, number>>({});
  showAddForm = signal(false);
  monthTotals = signal<Record<string, number>>({});
  expenseForm!: FormGroup;
  expenses = signal<IExpense[]>([]);
  groupedExpenses = signal<{ [month: string]: IExpense[] }>({});
  defaultCategories = [
    'Fuel', 'Food', 'Parking', 'Maintenance', 'Tolls', 'Supplies', 'Other'
  ];
  customCategories = signal<string[]>([]);
  editingExpenseId = signal<number | undefined>(undefined);
  unsavedData = signal(false);
  saving = signal(false);
  actionEnum = ActionEnum;
  maxRowId = signal(1);
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    private unsavedDataService: UnsavedDataService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    protected authService: AuthGoogleService
  ) {}

  async ngOnInit() {
    this.maxRowId.set(await this.expensesService.getMaxRowId() || 1);
    const nextRowId = this.maxRowId() + 1;
    this.expenseForm = this.fb.group({
      rowId: [{ value: nextRowId, disabled: true }],
      date: [this.getTodayDate(), Validators.required],
      name: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      note: ['']
    });

    this.expensesService.expenses$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(expenses => {
        void this.syncExpenseState(expenses);
      });

    this.unsavedDataService.unsavedData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hasUnsaved => this.unsavedData.set(hasUnsaved));
  }

  private getTodayDate(): Date {
    return new Date();
  }

  async loadExpenses() {
    const expenses = await this.expensesService.list();
    await this.syncExpenseState(expenses);
  }

  private async syncExpenseState(expenses: IExpense[]): Promise<void> {
    const normalizedExpenses = expenses.map(expense => ({
      ...expense,
      date: normalizeExpenseDate(expense.date as string | Date)
    }));

    const groupedExpenses = normalizedExpenses.reduce((groups, expense) => {
      const month = expense.date.slice(0, 7);
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(expense);
      return groups;
    }, {} as { [month: string]: IExpense[] });

    const groupedExpensesByYear = normalizedExpenses.reduce((groups: { [year: string]: IExpense[] }, expense: IExpense) => {
      const year = expense.date.slice(0, 4);
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(expense);
      return groups;
    }, {} as { [year: string]: IExpense[] });

    const monthTotals = Object.entries(groupedExpenses).reduce((totals, [month, monthExpenses]) => {
      totals[month] = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      return totals;
    }, {} as Record<string, number>);

    const yearTotals = Object.entries(groupedExpensesByYear).reduce((totals, [year, yearExpenses]) => {
      totals[year] = yearExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      return totals;
    }, {} as Record<string, number>);

    this.expenses.set(normalizedExpenses);
    this.maxRowId.set(await this.expensesService.getMaxRowId() || 1);
    this.customCategories.set(Array.from(new Set(normalizedExpenses.map(e => e.category).filter(c => !this.defaultCategories.includes(c)))));
    this.groupedExpenses.set(groupedExpenses);
    this.groupedExpensesByYear.set(groupedExpensesByYear);
    this.monthTotals.set(monthTotals);
    this.yearTotals.set(yearTotals);

    // If there are no expenses, open the add form by default so users can create one.
    if (normalizedExpenses.length === 0) {
      this.showAddForm.set(true);
    }
  }

  async addExpense() {
    if (this.expenseForm.invalid) return;
    const now = Date.now();
    const formValue = this.expenseForm.value as IExpenseFormValue;
    const draft = mapExpenseFormValueToDraft(formValue);
    let expense: IExpense = {
      ...draft,
      rowId: Number(formValue.rowId) || this.maxRowId() + 1,
      action: ActionEnum.Add,
      actionTime: now,
      saved: false
    };

    if (this.editingExpenseId()) {
      // Update existing expense by id
      const existingExpense = this.expenses().find(e => e.id === this.editingExpenseId());
      expense.id = this.editingExpenseId();
      expense.rowId = existingExpense!.rowId;
      expense.action = ActionEnum.Update;
      await this.expensesService.update([expense]);
      this.editingExpenseId.set(undefined);
    } else {
      // Insert new expense with rowId (starting at 2, since 1 is the header)
      expense.rowId = this.maxRowId() + 1;
      expense.action = ActionEnum.Add;
      await this.expensesService.add(expense);
    }
    this.expenseForm.reset({ date: this.getTodayDate() });
    this.showAddForm.set(false);
  }

  editExpense(expense: IExpense) {
    this.expenseForm.patchValue(mapExpenseToFormValue(expense));
    this.editingExpenseId.set(expense.id);
    this.showAddForm.set(true);
  }

  /**
   * Resets the form and clears editing state, but keeps the form open.
   * Used when the user wants to clear the form without closing it.
   */
  async resetForm() {
    await this.clearFormState();
    // Do not close the form here; handled by button
  }

  /**
   * Cancels editing, resets the form, and closes the form.
   * Used when the user explicitly cancels editing or adding.
   */
  cancelEdit() {
    this.clearFormState();
    this.showAddForm.set(false);
  }

  /**
   * Shared logic to reset the form and clear editing state.
   */
  private async clearFormState() {
    this.editingExpenseId.set(undefined);
    this.expenseForm.reset({ date: this.getTodayDate(), rowId: this.maxRowId() + 1 });
  }

  /**
   * Deletes the currently editing expense
   */
  async deleteCurrentExpense() {
    if (!this.editingExpenseId()) return;
    const expense = this.expenses().find(e => e.id === this.editingExpenseId());
    if (expense) {
      await this.confirmDeleteExpenseDialog(expense);
    }
  }

  /**
   * Checks if the currently editing expense is marked for deletion
   */
  isEditingDeleted(): boolean {
    if (!this.editingExpenseId()) return false;
    const expense = this.expenses().find(e => e.id === this.editingExpenseId());
    return expense?.action === ActionEnum.Delete;
  }

  /**
   * Restores a deleted expense
   */
  async restoreCurrentExpense() {
    if (!this.editingExpenseId()) return;
    const expense = this.expenses().find(e => e.id === this.editingExpenseId());
    if (expense) {
      updateAction(expense, ActionEnum.Update);
      expense.saved = false;
      await this.expensesService.update([expense]);
      this.cancelEdit();
    }
  }

  /**
   * Restores an expense from the table menu
   */
  async restoreExpense(expense: IExpense) {
    updateAction(expense, ActionEnum.Update);
    expense.saved = false;
    await this.expensesService.update([expense]);
  }

  /**
   * Confirms deletion with user before deleting expense
   */
  async confirmDeleteExpenseDialog(expense: IExpense) {
    const message = `This expense will be deleted from your spreadsheet. Are you sure you want to delete this?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Delete";
    dialogData.message = message;
    dialogData.trueText = "Delete";
    dialogData.trueColor = "danger";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.deleteExpense(expense);
      this.cancelEdit();
    }
  }

  /**
   * Deletes an expense using soft-delete pattern.
   * If the expense was just added (ActionEnum.Add), it's removed from the database.
   * Otherwise, it's marked as deleted and will be removed from the spreadsheet on next sync.
   */
  async deleteExpense(expense: IExpense) {
    if (expense.action === ActionEnum.Add) {
      // Permanently delete newly added expenses that haven't been synced yet
      await this.expensesService.delete(expense.id!);
    } else {
      // Mark existing expenses as deleted for sync
      updateAction(expense, ActionEnum.Delete);
      expense.saved = false;
      await this.expensesService.update([expense]);
    }
  }

  async confirmSaveDialog() {
    const message = `This will save all changes to your spreadsheet. This process will take less than a minute.`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Save";
    dialogData.message = message;
    dialogData.trueText = "Save";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.saveSheetDialog('save');
    }
  }

  async saveSheetDialog(inputValue: string) {
    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOGIN_TO_SYNC_CHANGES, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(DataSyncModalComponent, {
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      // Show success message
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.CHANGES_SAVED_TO_SPREADSHEET, { action: 'Close', duration: 3000 });
    }
  }

  hideAddForm() {
    this.showAddForm.set(false);
  }

  get categories(): string[] {
    // Merge, dedupe, and sort categories alphabetically
    const merged = Array.from(new Set([...this.defaultCategories, ...this.customCategories()]));
    return merged.sort((a, b) => a.localeCompare(b));
  }

  sortByMonth = (a: {key: string}, b: {key: string}) => a.key > b.key ? -1 : 1;
}
