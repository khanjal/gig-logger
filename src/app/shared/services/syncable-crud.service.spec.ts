import { SyncableCrudService } from './syncable-crud.service';
import { ActionEnum } from '@enums/action.enum';
import { IActionRecord } from '@interfaces/action-record.interface';

interface SyncEntity extends IActionRecord {
  id?: number;
  rowId: number;
  name: string;
  saved: boolean;
  action: string;
  actionTime: number;
}

class FakeTable<T extends { id?: number }> {
  private items: T[] = [];
  private nextId = 1;

  constructor(initial: T[] = []) {
    initial.forEach(i => this.add(i));
  }

  add = async (item: T) => {
    if (!item.id) item.id = this.nextId++;
    this.items.push({ ...item });
  };

  delete = async (id: number) => {
    this.items = this.items.filter(i => i.id !== id);
  };

  put = async (item: T) => {
    if (!item.id) return this.add(item);
    this.items = this.items.map(i => (i.id === item.id ? { ...item } : i));
  };

  toArray = async () => [...this.items];

  where(field: string) {
    return {
      equals: (value: any) => {
        const matches = this.items.filter((i: any) => i[field] === value);
        return {
          toArray: async () => [...matches],
          first: async () => matches[0],
        };
      },
    };
  }
}

describe('SyncableCrudService', () => {
  let table: FakeTable<SyncEntity>;
  let service: SyncableCrudService<SyncEntity>;

  beforeEach(() => {
    table = new FakeTable<SyncEntity>([
      { id: 1, rowId: 1, name: 'a', saved: true, action: '', actionTime: 100 },
      { id: 2, rowId: 2, name: 'b', saved: false, action: ActionEnum.Update, actionTime: 200 },
      { id: 3, rowId: 3, name: 'c', saved: false, action: ActionEnum.Delete, actionTime: 300 },
    ]);
    service = new SyncableCrudService<SyncEntity>(table as any);
  });

  it('getUnsaved returns only unsaved records', async () => {
    const unsaved = await service.getUnsaved();
    expect(unsaved.length).toBe(2);
    expect(unsaved.every(i => !i.saved)).toBeTrue();
  });

  it('saveUnsaved clears action and saves items when timestamps match original', async () => {
    // Arrange: create original with same actionTime for id 2
    await table.put({ id: 2, rowId: 2, name: 'b', saved: true, action: '', actionTime: 200 });

    await service.saveUnsaved();

    const updated = await service.get(2);
    expect(updated?.action).toBe('');
    expect(updated?.saved).toBeTrue();
  });

  it('saveUnsaved deletes items flagged for delete', async () => {
    await service.saveUnsaved();
    const item = await service.get(3);
    expect(item).toBeUndefined();
  });

  it('updateRowIds re-sequences rowIds in batch', async () => {
    await table.add({ id: 4, rowId: 4, name: 'd', saved: true, action: '', actionTime: 0 });
    await service.updateRowIds(1);
    const items = await service.list();
    const rowIds = items.map(i => i.rowId).sort((a, b) => a - b);
    expect(rowIds).toEqual([1, 2, 3]);
  });

  it('deleteItem removes unsaved items immediately', async () => {
    const unsavedItem: SyncEntity = { id: 5, rowId: 5, name: 'temp', saved: false, action: ActionEnum.Add, actionTime: 0 };
    await table.add(unsavedItem);
    await service.deleteItem(unsavedItem);
    const fetched = await service.get(5);
    expect(fetched).toBeUndefined();
  });

  it('deleteItem marks saved items for deletion', async () => {
    const savedItem: SyncEntity = { id: 6, rowId: 6, name: 'saved', saved: true, action: '', actionTime: 0 };
    await table.add(savedItem);
    await service.deleteItem(savedItem);
    const fetched = await service.get(6);
    expect(fetched?.action).toBe(ActionEnum.Delete);
    expect(fetched?.saved).toBeFalse();
  });
});