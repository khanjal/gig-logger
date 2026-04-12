import { mapExpenseFormValueToDraft, mapExpenseToFormValue, normalizeExpenseDate } from './expense-form.helper';

describe('expense-form.helper', () => {
  describe('normalizeExpenseDate', () => {
    it('returns empty string for nullish values', () => {
      expect(normalizeExpenseDate(null)).toBe('');
      expect(normalizeExpenseDate(undefined)).toBe('');
    });

    it('normalizes Date values to yyyy-MM-dd', () => {
      const value = normalizeExpenseDate(new Date(2024, 0, 15));
      expect(value).toBe('2024-01-15');
    });

    it('trims string dates to yyyy-MM-dd', () => {
      expect(normalizeExpenseDate('2024-01-15T10:30:00.000Z')).toBe('2024-01-15');
    });
  });

  describe('mapExpenseFormValueToDraft', () => {
    it('normalizes date and amount boundaries', () => {
      const draft = mapExpenseFormValueToDraft({
        date: '2024-01-15T10:30:00.000Z',
        name: '  Fuel  ',
        amount: '45.50',
        category: '  Fuel  ',
        note: '  receipt kept  '
      });

      expect(draft.date).toBe('2024-01-15');
      expect(draft.amount).toBe(45.5);
      expect(draft.name).toBe('Fuel');
      expect(draft.category).toBe('Fuel');
      expect(draft.note).toBe('receipt kept');
    });

    it('converts empty amount to zero', () => {
      const draft = mapExpenseFormValueToDraft({ amount: null });
      expect(draft.amount).toBe(0);
    });
  });

  describe('mapExpenseToFormValue', () => {
    it('converts expense date string to Date for form controls', () => {
      const result = mapExpenseToFormValue({
        date: '2024-02-20',
        amount: 10,
        category: 'Food',
      } as any);

      expect(result.date instanceof Date).toBeTrue();
      expect((result.date as Date).getFullYear()).toBe(2024);
      expect((result.date as Date).getMonth()).toBe(1);
      expect((result.date as Date).getDate()).toBe(20);
    });
  });
});
