import { Pipe, PipeTransform } from '@angular/core';
import { IExpense } from '@interfaces/expense.interface';

@Pipe({
  name: 'groupByMonth',
  standalone: true
})
export class GroupByMonthPipe implements PipeTransform {
  transform(expenses: IExpense[]): { [month: string]: IExpense[] } {
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
    }, {} as { [month: string]: IExpense[] });
  }
}