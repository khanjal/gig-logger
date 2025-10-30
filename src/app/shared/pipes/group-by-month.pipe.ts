import { Pipe, PipeTransform } from '@angular/core';
import { IExpense } from '@interfaces/expense.interface';

@Pipe({
  name: 'groupByMonth',
  standalone: true
})
export class GroupByMonthPipe implements PipeTransform {
  transform(expenses: IExpense[]): { [month: string]: IExpense[] } {
    return expenses.reduce((groups, expense) => {
      const month = expense.date.slice(0, 7); // yyyy-mm
      if (!groups[month]) groups[month] = [];
      groups[month].push(expense);
      return groups;
    }, {} as { [month: string]: IExpense[] });
  }
}