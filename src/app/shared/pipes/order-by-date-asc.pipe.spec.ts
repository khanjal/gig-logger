import { OrderByPipe } from './order-by-date-asc.pipe';

describe('OrderByPipe', () => {
  let pipe: OrderByPipe;

  beforeEach(() => {
    pipe = new OrderByPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('Ascending order', () => {
    it('should sort numbers in ascending order', () => {
      const array = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = pipe.transform(array, 'value', 'asc');
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(3);
    });

    it('should sort strings in ascending order', () => {
      const array = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const result = pipe.transform(array, 'name', 'asc');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should sort dates in ascending order', () => {
      const array = [
        { date: '2024-03-01' },
        { date: '2024-01-01' },
        { date: '2024-02-01' }
      ];
      const result = pipe.transform(array, 'date', 'asc');
      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-02-01');
      expect(result[2].date).toBe('2024-03-01');
    });

    it('should use ascending as default direction', () => {
      const array = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = pipe.transform(array, 'value');
      expect(result[0].value).toBe(1);
      expect(result[2].value).toBe(3);
    });
  });

  describe('Descending order', () => {
    it('should sort numbers in descending order', () => {
      const array = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const result = pipe.transform(array, 'value', 'desc');
      expect(result[0].value).toBe(3);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(1);
    });

    it('should sort strings in descending order', () => {
      const array = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
      const result = pipe.transform(array, 'name', 'desc');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });

    it('should sort dates in descending order', () => {
      const array = [
        { date: '2024-01-01' },
        { date: '2024-03-01' },
        { date: '2024-02-01' }
      ];
      const result = pipe.transform(array, 'date', 'desc');
      expect(result[0].date).toBe('2024-03-01');
      expect(result[1].date).toBe('2024-02-01');
      expect(result[2].date).toBe('2024-01-01');
    });
  });

  describe('Null and undefined handling', () => {
    it('should put null values at the end', () => {
      const array = [{ value: 2 }, { value: null }, { value: 1 }];
      const result = pipe.transform(array, 'value', 'asc');
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBeNull();
    });

    it('should put undefined values at the end', () => {
      const array = [{ value: 2 }, { value: undefined }, { value: 1 }];
      const result = pipe.transform(array, 'value', 'asc');
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBeUndefined();
    });

    it('should handle multiple null values', () => {
      const array = [
        { value: null },
        { value: 1 },
        { value: null },
        { value: 2 }
      ];
      const result = pipe.transform(array, 'value', 'asc');
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBeNull();
      expect(result[3].value).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should return same array if not an array', () => {
      const notArray = 'not an array' as any;
      const result = pipe.transform(notArray, 'value');
      expect(result).toBe(notArray);
    });

    it('should return same array if property is not provided', () => {
      const array = [{ value: 2 }, { value: 1 }];
      const result = pipe.transform(array, '' as any);
      expect(result).toEqual(array);
    });

    it('should handle empty array', () => {
      const result = pipe.transform([], 'value');
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [{ value: 1 }];
      const result = pipe.transform(array, 'value');
      expect(result).toEqual([{ value: 1 }]);
    });

    it('should not mutate original array', () => {
      const array = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const original = [...array];
      pipe.transform(array, 'value');
      expect(array).toEqual(original);
    });

    it('should handle arrays with duplicate values', () => {
      const array = [{ value: 2 }, { value: 1 }, { value: 2 }, { value: 1 }];
      const result = pipe.transform(array, 'value', 'asc');
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(1);
      expect(result[2].value).toBe(2);
      expect(result[3].value).toBe(2);
    });

    it('should handle mixed case strings', () => {
      const array = [{ name: 'zebra' }, { name: 'Apple' }, { name: 'banana' }];
      const result = pipe.transform(array, 'name', 'asc');
      expect(result[0].name).toBe('Apple');
      expect(result[1].name).toBe('banana');
      expect(result[2].name).toBe('zebra');
    });
  });

  describe('Complex objects', () => {
    it('should sort by nested property values', () => {
      const array = [
        { id: 1, data: { score: 30 } },
        { id: 2, data: { score: 10 } },
        { id: 3, data: { score: 20 } }
      ];
      const result = pipe.transform(array, 'id', 'asc');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should handle boolean values', () => {
      const array = [{ active: false }, { active: true }, { active: false }];
      const result = pipe.transform(array, 'active', 'desc');
      expect(result[0].active).toBe(true);
      expect(result[1].active).toBe(false);
      expect(result[2].active).toBe(false);
    });
  });
});
