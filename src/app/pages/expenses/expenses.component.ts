import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IExpense } from '@interfaces/expense.interface';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss'],
  providers: [CurrencyPipe, DatePipe]
})
export class ExpensesComponent implements OnInit {
  expenseForm!: FormGroup;
  expenses: IExpense[] = [];
  groupedExpenses: { [month: string]: IExpense[] } = {};
  defaultCategories = [
    'Fuel', 'Food', 'Parking', 'Maintenance', 'Tolls', 'Supplies', 'Other'
  ];
  customCategories: string[] = [];

  constructor(private fb: FormBuilder) {}

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
    await spreadsheetDB.expenses.add(expense);
    this.expenseForm.reset({ date: this.getToday() });
    await this.loadExpenses();
  }

  get categories(): string[] {
    return [...this.defaultCategories, ...this.customCategories];
  }

  sortByMonth = (a: {key: string}, b: {key: string}) => a.key > b.key ? -1 : 1;
}
