import { GroupByMonthPipe } from './group-by-month.pipe';
import { IExpense } from '@interfaces/expense.interface';

describe('GroupByMonthPipe', () => {
  let pipe: GroupByMonthPipe;

  beforeEach(() => {
    pipe = new GroupByMonthPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should group expenses by month', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024-01-15', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-01-20', category: 'Food', amount: 30 } as IExpense,
      { rowId: 3, date: '2024-02-10', category: 'Gas', amount: 45 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(result['2024-01']).toBeDefined();
    expect(result['2024-01'].length).toBe(2);
    expect(result['2024-02']).toBeDefined();
    expect(result['2024-02'].length).toBe(1);
  });

  it('should handle expenses from same month', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024-03-01', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-03-15', category: 'Food', amount: 30 } as IExpense,
      { rowId: 3, date: '2024-03-31', category: 'Gas', amount: 45 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(result['2024-03']).toBeDefined();
    expect(result['2024-03'].length).toBe(3);
    expect(Object.keys(result).length).toBe(1);
  });

  it('should handle empty array', () => {
    const result = pipe.transform([]);
    expect(result).toEqual({});
    expect(Object.keys(result).length).toBe(0);
  });

  it('should preserve expense objects in groups', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024-05-10', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-05-20', category: 'Food', amount: 30 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(result['2024-05'][0]).toBe(expenses[0]);
    expect(result['2024-05'][1]).toBe(expenses[1]);
  });

  it('should handle multiple months', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024-01-10', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-02-10', category: 'Food', amount: 30 } as IExpense,
      { rowId: 3, date: '2024-03-10', category: 'Gas', amount: 45 } as IExpense,
      { rowId: 4, date: '2024-04-10', category: 'Food', amount: 35 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(Object.keys(result).length).toBe(4);
    expect(result['2024-01'].length).toBe(1);
    expect(result['2024-02'].length).toBe(1);
    expect(result['2024-03'].length).toBe(1);
    expect(result['2024-04'].length).toBe(1);
  });

  it('should handle invalid date formats', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: 'invalid', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-05-10', category: 'Food', amount: 30 } as IExpense
    ];

    const result = pipe.transform(expenses);

      // 'invalid' is length 7, so it returns 'invalid' (first 7 chars)
      expect(result['invalid']).toBeDefined();
      expect(result['invalid'].length).toBe(1);
    expect(result['2024-05']).toBeDefined();
    expect(result['2024-05'].length).toBe(1);
  });

  it('should handle short date strings', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-0', category: 'Food', amount: 30 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(result['Invalid']).toBeDefined();
    expect(result['Invalid'].length).toBe(2);
  });

  it('should extract yyyy-mm from longer date strings', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024-06-15T10:30:00', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-06-20 14:45:30', category: 'Food', amount: 30 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(result['2024-06']).toBeDefined();
    expect(result['2024-06'].length).toBe(2);
  });

  it('should group across different years', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2023-12-15', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-01-15', category: 'Food', amount: 30 } as IExpense,
      { rowId: 3, date: '2024-12-15', category: 'Gas', amount: 45 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(result['2023-12']).toBeDefined();
    expect(result['2024-01']).toBeDefined();
    expect(result['2024-12']).toBeDefined();
    expect(Object.keys(result).length).toBe(3);
  });

  it('should maintain insertion order within groups', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024-07-01', category: 'Gas', amount: 50 } as IExpense,
      { rowId: 2, date: '2024-07-15', category: 'Food', amount: 30 } as IExpense,
      { rowId: 3, date: '2024-07-30', category: 'Gas', amount: 45 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(result['2024-07'][0].rowId).toBe(1);
    expect(result['2024-07'][1].rowId).toBe(2);
    expect(result['2024-07'][2].rowId).toBe(3);
  });

  it('should handle single expense', () => {
    const expenses: IExpense[] = [
      { rowId: 1, date: '2024-08-10', category: 'Gas', amount: 50 } as IExpense
    ];

    const result = pipe.transform(expenses);

    expect(Object.keys(result).length).toBe(1);
    expect(result['2024-08'].length).toBe(1);
    expect(result['2024-08'][0]).toBe(expenses[0]);
  });
});
