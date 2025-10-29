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
import { ExpensesService } from '@services/sheets/expenses.service';

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
    OrdinalPipe
  ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss'],
  providers: [CurrencyPipe, DatePipe]
})
export class ExpensesComponent implements OnInit {
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
    const expense: IExpense = this.expenseForm.value;
    if (this.editingExpenseId) {
      // Update existing expense
      expense.id = this.editingExpenseId;
      await this.expensesService.add(expense); // Use add for upsert in GenericCrudService
      this.editingExpenseId = undefined;
    } else {
      // Add new expense
      await this.expensesService.add(expense);
    }
    this.expenseForm.reset({ date: this.getToday() });
    await this.loadExpenses();
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

  resetForm() {
    this.editingExpenseId = undefined;
    this.expenseForm.reset({ date: this.getToday() });
  // Do not close the form here; handled by button
  }

  cancelEdit() {
    this.editingExpenseId = undefined;
    this.expenseForm.reset({ date: this.getToday() });
  this.showAddForm = false;
  }

  deleteExpense(expense: IExpense) {
    if (typeof expense.id === 'number') {
      this.expensesService.delete(expense.id).then(() => {
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
    return [...this.defaultCategories, ...this.customCategories];
  }

  sortByMonth = (a: {key: string}, b: {key: string}) => a.key > b.key ? -1 : 1;

  get editingExpense(): IExpense | null {
    if (!this.editingExpenseId) return null;
    const expense = this.expenses.find(e => e.id === this.editingExpenseId);
    return expense ? { ...expense } : null;
  }
}
