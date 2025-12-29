import { sort, byPropertiesOf } from './sort.helper';

describe('sort.helper', () => {
  interface TestItem {
    id: number;
    name: string;
    value: number;
  }

  const makeItems = (): TestItem[] => [
    { id: 3, name: 'Charlie', value: 100 },
    { id: 1, name: 'Alice', value: 200 },
    { id: 2, name: 'Bob', value: 150 },
  ];

  describe('byPropertiesOf', () => {
    it('sorts by single property ascending', () => {
      const items = makeItems();
      const comparator = byPropertiesOf<TestItem>(['id']);
      
      items.sort(comparator);
      
      expect(items[0].id).toBe(1);
      expect(items[1].id).toBe(2);
      expect(items[2].id).toBe(3);
    });

    it('sorts by single property descending', () => {
      const items = makeItems();
      const comparator = byPropertiesOf<TestItem>(['-id']);
      
      items.sort(comparator);
      
      expect(items[0].id).toBe(3);
      expect(items[1].id).toBe(2);
      expect(items[2].id).toBe(1);
    });

    it('sorts by multiple properties with precedence', () => {
      const items: TestItem[] = [
        { id: 1, name: 'Bob', value: 100 },
        { id: 1, name: 'Alice', value: 100 },
        { id: 2, name: 'Charlie', value: 100 },
      ];
      const comparator = byPropertiesOf<TestItem>(['id', 'name']);
      
      items.sort(comparator);
      
      expect(items[0].name).toBe('Alice');
      expect(items[1].name).toBe('Bob');
      expect(items[2].name).toBe('Charlie');
    });

    it('handles mixed ascending and descending', () => {
      const items = makeItems();
      const comparator = byPropertiesOf<TestItem>(['-value', 'name']);
      
      items.sort(comparator);
      
      expect(items[0].value).toBe(200);
      expect(items[2].value).toBe(100);
    });
  });

  describe('sort', () => {
    it('sorts array by single property', () => {
      const items = makeItems();
      
      sort(items, 'name');
      
      expect(items[0].name).toBe('Alice');
      expect(items[1].name).toBe('Bob');
      expect(items[2].name).toBe('Charlie');
    });

    it('sorts array by descending property', () => {
      const items = makeItems();
      
      sort(items, '-value');
      
      expect(items[0].value).toBe(200);
      expect(items[1].value).toBe(150);
      expect(items[2].value).toBe(100);
    });

    it('sorts array by multiple properties', () => {
      const items: TestItem[] = [
        { id: 2, name: 'Bob', value: 100 },
        { id: 1, name: 'Charlie', value: 100 },
        { id: 1, name: 'Alice', value: 100 },
      ];
      
      sort(items, 'id', 'name');
      
      expect(items[0].id).toBe(1);
      expect(items[0].name).toBe('Alice');
      expect(items[1].id).toBe(1);
      expect(items[1].name).toBe('Charlie');
      expect(items[2].id).toBe(2);
    });

    it('handles empty arrays', () => {
      const items: TestItem[] = [];
      
      expect(() => sort(items, 'id')).not.toThrow();
      expect(items.length).toBe(0);
    });

    it('handles single item arrays', () => {
      const items = [makeItems()[0]];
      
      sort(items, 'id');
      
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(3);
    });
  });
});
