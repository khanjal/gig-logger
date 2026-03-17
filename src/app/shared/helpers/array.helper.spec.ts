import { groupBy, uniquePush, getValueOrFallback } from './array.helper';

describe('Array Helper', () => {
  describe('groupBy', () => {
    it('should group items by key function', () => {
      const items = [
        { category: 'fruit', name: 'apple' },
        { category: 'vegetable', name: 'carrot' },
        { category: 'fruit', name: 'banana' },
        { category: 'vegetable', name: 'broccoli' }
      ];

      const grouped = groupBy(items, item => item.category);

      expect(grouped.size).toBe(2);
      expect(grouped.get('fruit')?.length).toBe(2);
      expect(grouped.get('vegetable')?.length).toBe(2);
      expect(grouped.get('fruit')?.[0].name).toBe('apple');
      expect(grouped.get('fruit')?.[1].name).toBe('banana');
    });

    it('should handle empty array', () => {
      const items: any[] = [];
      const grouped = groupBy(items, item => item.key);

      expect(grouped.size).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ type: 'test', value: 1 }];
      const grouped = groupBy(items, item => item.type);

      expect(grouped.size).toBe(1);
      expect(grouped.get('test')?.length).toBe(1);
    });
  });

  describe('uniquePush', () => {
    it('should add unique value to array', () => {
      const arr = [1, 2, 3];
      uniquePush(arr, 4);

      expect(arr).toEqual([1, 2, 3, 4]);
    });

    it('should not add duplicate value', () => {
      const arr = [1, 2, 3];
      uniquePush(arr, 2);

      expect(arr).toEqual([1, 2, 3]);
    });

    it('should handle undefined array gracefully', () => {
      expect(() => uniquePush(undefined, 5)).not.toThrow();
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      uniquePush(arr, 1);

      expect(arr).toEqual([1]);
    });
  });

  describe('getValueOrFallback', () => {
    interface TestItem {
      id: number;
      service?: string;
      region?: string;
      count?: number;
    }

    it('should return value from primary item when it exists', () => {
      const item: TestItem = { id: 1, service: 'primary-service', region: 'primary-region' };
      const fallbackArray: TestItem[] = [
        { id: 2, service: 'fallback-service' },
        { id: 3, service: 'other-service' }
      ];

      const result = getValueOrFallback(item, fallbackArray, 'service');

      expect(result).toBe('primary-service');
    });

    it('should return fallback value when primary item lacks property', () => {
      const item: TestItem = { id: 1, region: 'primary-region' };
      const fallbackArray: TestItem[] = [
        { id: 2 },
        { id: 3, service: 'fallback-service' },
        { id: 4, service: 'other-service' }
      ];

      const result = getValueOrFallback(item, fallbackArray, 'service');

      expect(result).toBe('fallback-service');
    });

    it('should return undefined when no item has the property', () => {
      const item: TestItem = { id: 1 };
      const fallbackArray: TestItem[] = [
        { id: 2 },
        { id: 3 }
      ];

      const result = getValueOrFallback(item, fallbackArray, 'service');

      expect(result).toBeUndefined();
    });

    it('should handle undefined primary item', () => {
      const fallbackArray: TestItem[] = [
        { id: 1 },
        { id: 2, service: 'fallback-service' }
      ];

      const result = getValueOrFallback(undefined, fallbackArray, 'service');

      expect(result).toBe('fallback-service');
    });

    it('should handle empty fallback array', () => {
      const item: TestItem = { id: 1 };
      const fallbackArray: TestItem[] = [];

      const result = getValueOrFallback(item, fallbackArray, 'service');

      expect(result).toBeUndefined();
    });

    it('should work with numeric values', () => {
      const item: TestItem = { id: 1, count: 0 };
      const fallbackArray: TestItem[] = [
        { id: 2 },
        { id: 3, count: 5 }
      ];

      // Note: 0 is falsy, so it falls back
      const result = getValueOrFallback(item, fallbackArray, 'count');

      expect(result).toBe(5);
    });

    it('should return first matching fallback when multiple exist', () => {
      const item: TestItem = { id: 1 };
      const fallbackArray: TestItem[] = [
        { id: 2, service: 'first-match' },
        { id: 3, service: 'second-match' },
        { id: 4, service: 'third-match' }
      ];

      const result = getValueOrFallback(item, fallbackArray, 'service');

      expect(result).toBe('first-match');
    });

    it('should handle falsy string values in primary item', () => {
      const item: TestItem = { id: 1, service: '' };
      const fallbackArray: TestItem[] = [
        { id: 2, service: 'fallback-service' }
      ];

      // Empty string is falsy, so it falls back
      const result = getValueOrFallback(item, fallbackArray, 'service');

      expect(result).toBe('fallback-service');
    });
  });
});
