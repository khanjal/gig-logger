import { GroupByMonthPipe } from '@pipes/group-by-month.pipe';
import { OrdinalPipe } from '@pipes/ordinal.pipe';
import { OrderByPipe } from '@pipes/order-by-date-asc.pipe';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IExpense } from '@interfaces/expense.interface';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerToggle } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ExpensesService } from '@services/sheets/expenses.service';
import { ActionEnum } from '@enums/action.enum';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { updateAction } from '@utils/action.utils';

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
    MatButtonModule,
    MatDatepickerModule,
    MatDatepickerToggle,
    MatIconModule,
    OrderByPipe,
    OrdinalPipe,
    MatAutocompleteModule,
    GroupByMonthPipe
  ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss'],
  providers: [CurrencyPipe, DatePipe]
})

export class ExpensesComponent implements OnInit {
  // Group expenses by year for yearly totals
  get groupedExpensesByYear(): { [year: string]: IExpense[] } {
    return this.expenses.reduce((groups: { [year: string]: IExpense[] }, expense: IExpense) => {
      const year = expense.date.slice(0, 4);
      if (!groups[year]) groups[year] = [];
      groups[year].push(expense);
      return groups;
    }, {} as { [year: string]: IExpense[] });
  }

  getYearTotal(expenses: IExpense[]): number {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }
  showAddForm = false;

  getMonthTotal(expenses: IExpense[]): number {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }
  // ...existing code...
  expenseForm!: FormGroup;
  expenses: IExpense[] = [];
  groupedExpenses: { [month: string]: IExpense[] } = {};
  defaultCategories = [
    'Fuel', 'Food', 'Parking', 'Maintenance', 'Tolls', 'Supplies', 'Other'
  ];
  customCategories: string[] = [];
  editingExpenseId?: number;
  unsavedExpenses: IExpense[] = [];
  unsavedData: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.expenseForm = this.fb.group({
      date: [this.getToday(), Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      note: ['']
    });
    await this.loadExpenses();
  }

  getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async loadExpenses() {
    this.expenses = await spreadsheetDB.expenses.toArray();
    this.customCategories = Array.from(new Set(this.expenses.map(e => e.category).filter(c => !this.defaultCategories.includes(c))));
    this.groupedExpenses = this.expenses.reduce((groups, expense) => {
      const month = expense.date.slice(0, 7); // yyyy-mm
      if (!groups[month]) groups[month] = [];
      groups[month].push(expense);
      return groups;
    }, {} as { [month: string]: IExpense[] });
    this.checkForUnsavedData();
  }

  checkForUnsavedData(): void {
    this.unsavedExpenses = this.expenses.filter(expense => !expense.saved);
    this.unsavedData = this.unsavedExpenses.length > 0;
  }

  async addExpense() {
    if (this.expenseForm.invalid) return;
    const now = Date.now();
    const formValue = this.expenseForm.value;
    let expense: IExpense = {
      ...formValue,
      action: ActionEnum.Add,
      actionTime: now,
      saved: false
    };
    let scrollId: number | undefined;
    if (this.editingExpenseId) {
      // Update existing expense by id
      expense.id = this.editingExpenseId;
      expense.action = ActionEnum.Update;
      await this.expensesService.update([expense]);
      scrollId = this.editingExpenseId;
      this.editingExpenseId = undefined;
    } else {
      // Insert new expense with rowId
      expense.rowId = await this.expensesService.getMaxRowId() + 1;
      expense.action = ActionEnum.Add;
      await this.expensesService.add(expense);
      scrollId = undefined;
    }
    this.expenseForm.reset({ date: this.getToday() });
    this.showAddForm = false;
    await this.loadExpenses();
    // Scroll to the updated/added row if possible
    setTimeout(() => {
      if (scrollId) {
        const row = document.getElementById('expense-row-' + scrollId);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const top = document.getElementById('expenses-top');
        if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  editExpense(expense: IExpense) {
    // Populate the form with the selected expense for editing
    this.expenseForm.patchValue(expense);
    this.editingExpenseId = expense.id;
    // Scroll to top anchor when editing
    setTimeout(() => {
      const top = document.getElementById('expenses-top');
      if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    this.showAddForm = true;
  }

  /**
   * Resets the form and clears editing state, but keeps the form open.
   * Used when the user wants to clear the form without closing it.
   */
  resetForm() {
    this.clearFormState();
    // Do not close the form here; handled by button
  }

  /**
   * Cancels editing, resets the form, and closes the form.
   * Used when the user explicitly cancels editing or adding.
   */
  cancelEdit() {
    this.clearFormState();
    this.showAddForm = false;
  }

  /**
   * Shared logic to reset the form and clear editing state.
   */
  private clearFormState() {
    this.editingExpenseId = undefined;
    this.expenseForm.reset({ date: this.getToday() });
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
    dialogData.trueColor = "warn";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.deleteExpense(expense);
      }
    });
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
    await this.loadExpenses();
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

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if(result) {
        await this.saveSheetDialog('save');
      }
    });
  }

  async saveSheetDialog(inputValue: string) {
    let dialogRef = this.dialog.open(DataSyncModalComponent, {
        height: '400px',
        width: '500px',
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
        if (result) {
            // Show success message
            this._snackBar.open("Changes Saved to Spreadsheet", "Close", { duration: 3000 });
            
            // Refresh the page to show updated state
            await this.loadExpenses();
        }
    });
  }

  hideAddForm() {
    this.showAddForm = false;
  }

  get categories(): string[] {
    // Merge, dedupe, and sort categories alphabetically
    const merged = Array.from(new Set([...this.defaultCategories, ...this.customCategories]));
    return merged.sort((a, b) => a.localeCompare(b));
  }

  sortByMonth = (a: {key: string}, b: {key: string}) => a.key > b.key ? -1 : 1;
}
