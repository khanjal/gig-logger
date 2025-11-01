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

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService
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
  }

  async addExpense() {
    if (this.expenseForm.invalid) return;
    const now = Date.now();
    const formValue = this.expenseForm.value;
    let expense: IExpense = {
      ...formValue,
      action: ActionEnum.Add, // Initialize action; will be updated if editing
      actionTime: now
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
      // Insert new expense
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
   * Deletes an expense using soft-delete pattern.
   * Instead of permanently removing the record, this marks it as deleted
   * and syncs it to the backend so it can be properly removed from Google Sheets.
   * This ensures consistency between local storage and the remote spreadsheet.
   */
  deleteExpense(expense: IExpense) {
    if (typeof expense.id === 'number') {
      const deleted: IExpense = {
        ...expense,
        action: ActionEnum.Delete,
        actionTime: Date.now()
      };
      this.expensesService.update([deleted]).then(() => {
        this.syncData();
      });
    }
  }

  syncData() {
    // Call the data sync component/service to save changes
    console.log('Syncing data...');
    // Implement actual sync logic here
  }

  get categories(): string[] {
    // Merge, dedupe, and sort categories alphabetically
    const merged = Array.from(new Set([...this.defaultCategories, ...this.customCategories]));
    return merged.sort((a, b) => a.localeCompare(b));
  }

  sortByMonth = (a: {key: string}, b: {key: string}) => a.key > b.key ? -1 : 1;

  get editingExpense(): IExpense | null {
    if (!this.editingExpenseId) return null;
    const expense = this.expenses.find(e => e.id === this.editingExpenseId);
    return expense ? { ...expense } : null;
  }
}
