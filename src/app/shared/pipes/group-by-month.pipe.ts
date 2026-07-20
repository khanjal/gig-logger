import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { IExpense } from '@interfaces/entities/expense.interface';

@Pipe({
  name: 'groupByMonth',
  standalone: true
})
export class GroupByMonthPipe implements PipeTransform {
  public transform(expenses: IExpense[]): Record<string, IExpense[]> {
    return expenses.reduce((groups, expense) => {
      let month: string;
      if (typeof expense.date === 'string' && expense.date.length >= 7) {
        month = expense.date.slice(0, 7); // yyyy-mm
      } else {
        month = 'Invalid';
      }
      if (!groups[month]) groups[month] = [];
      groups[month].push(expense);
      return groups;
    }, {} as Record<string, IExpense[]>);
  }
}