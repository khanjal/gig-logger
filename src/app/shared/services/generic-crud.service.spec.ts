import { GenericCrudService } from './generic-crud.service';

interface TestEntity {
  id?: number;
  rowId: number;
  name: string;
  value?: number;
}

// Lightweight in-memory mock of Dexie's Table API used in GenericCrudService
class FakeTable<T extends { id?: number }> {
  private items: T[] = [];
  private nextId = 1;

  constructor(initial: T[] = []) {
    initial.forEach(i => this.add(i));
  }

  add(item: T): Promise<void> {
    if (!item.id) {
      item.id = this.nextId++;
    }
    this.items.push({ ...item });
    return Promise.resolve();
  }

  delete(id: number): Promise<void> {
    this.items = this.items.filter(i => i.id !== id);
    return Promise.resolve();
  }

  put(item: T): Promise<void> {
    if (!item.id) {
      return this.add(item);
    }
    this.items = this.items.map(i => (i.id === item.id ? { ...item } : i));
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.items = [];
    return Promise.resolve();
  }

  bulkAdd(items: T[]): Promise<void> {
    return Promise.all(items.map(i => this.add(i))).then(() => undefined);
  }

  toArray(): Promise<T[]> {
    return Promise.resolve([...this.items]);
  }

  orderBy(field: string) {
    const sorted = [...this.items].sort((a: any, b: any) => {
      if (a[field] === b[field]) return 0;
      return a[field] < b[field] ? -1 : 1;
    });
    return {
      reverse: () => ({
        offset: (skip: number) => ({
          limit: (take: number) => ({ toArray: () => Promise.resolve(sorted.slice().reverse().slice(skip, skip + take)) }),
        }),
        toArray: () => Promise.resolve(sorted.slice().reverse()),
      }),
      offset: (skip: number) => ({
        limit: (take: number) => ({ toArray: () => Promise.resolve(sorted.slice(skip, skip + take)) }),
      }),
      toArray: () => Promise.resolve(sorted),
    };
  }

  where(field: string) {
    return {
      equals: (value: any) => {
        const matches = this.items.filter((i: any) => i[field] === value);
        return {
          toArray: () => Promise.resolve([...matches]),
          first: () => Promise.resolve(matches[0]),
        };
      },
      anyOfIgnoreCase: (value: any) => {
        const matches = this.items.filter((i: any) => String(i[field]).toLowerCase() === String(value).toLowerCase());
        return {
          first: () => Promise.resolve(matches[0]),
          toArray: () => Promise.resolve(matches),
        };
      },
      startsWithAnyOfIgnoreCase: (value: any) => {
        const matches = this.items.filter((i: any) =>
          String(i[field]).toLowerCase().startsWith(String(value).toLowerCase())
        );
        return {
          toArray: () => Promise.resolve(matches),
        };
      },
    };
  }
}

describe('GenericCrudService', () => {
  let table: FakeTable<TestEntity>;
  let service: GenericCrudService<TestEntity>;

  beforeEach(() => {
    table = new FakeTable<TestEntity>([
      { id: 1, rowId: 1, name: 'Alpha', value: 10 },
      { id: 2, rowId: 2, name: 'Beta', value: 20 },
      { id: 3, rowId: 3, name: 'Gamma', value: 30 },
    ]);
    service = new GenericCrudService<TestEntity>(table as any);
  });

  it('adds and lists items', async () => {
    await service.add({ rowId: 4, name: 'Delta', value: 40 });
    const items = await service.list();
    expect(items.length).toBe(4);
    expect(items.some(i => i.name === 'Delta')).toBeTrue();
  });

  it('updates existing items via put()', async () => {
    await service.update([{ id: 2, rowId: 2, name: 'Beta-updated', value: 25 }]);
    const item = await service.get(2);
    expect(item?.name).toBe('Beta-updated');
    expect(item?.value).toBe(25);
  });

  it('deletes an item by id', async () => {
    await service.delete(1);
    const items = await service.list();
    expect(items.find(i => i.id === 1)).toBeUndefined();
  });

  it('paginates and sorts ascending and descending', async () => {
    const pageAsc = await service.paginate(0, 2, 'value', 'asc');
    expect(pageAsc.map(i => i.value)).toEqual([10, 20]);

    const pageDesc = await service.paginate(0, 2, 'value', 'desc');
    expect(pageDesc.map(i => i.value)).toEqual([30, 20]);
  });

  it('finds duplicates in equals mode (case-insensitive, normalized)', async () => {
    await service.add({ rowId: 5, name: ' beta ', value: 50 });
    const duplicates = await service.findDuplicates('name');
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].items.length).toBe(2);
  });

  it('finds duplicates in contains mode', async () => {
    await service.add({ rowId: 5, name: 'Alph', value: 5 });
    const duplicates = await service.findDuplicates('name', { mode: 'contains', minLength: 3 });
    expect(duplicates.some(d => d.items.length > 1)).toBeTrue();
  });
});