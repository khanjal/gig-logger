import { TestBed } from '@angular/core/testing';
import { NameService } from './name.service';
import { IName } from '@interfaces/name.interface';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('NameService', () => {
  let service: NameService;

  const makeName = (overrides: Partial<IName> = {}): IName => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    name: overrides.name ?? 'John Doe',
    addresses: overrides.addresses ?? [],
    notes: overrides.notes ?? [],
    trips: overrides.trips ?? 5,
    pay: overrides.pay ?? 50,
    tip: overrides.tip ?? 10,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 60,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NameService],
    });

    service = TestBed.inject(NameService);

    // Mock Dexie methods - create proper chainable mocks
    spyOn(spreadsheetDB.names, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.names, 'delete').and.resolveTo();
    spyOn(spreadsheetDB.names, 'bulkPut').and.resolveTo(1);
    spyOn(spreadsheetDB.names, 'add').and.resolveTo(1);
    
    // Mock where() to return proper chain - will be overridden per test
    spyOn(spreadsheetDB.names, 'where').and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(undefined),
        toArray: jasmine.createSpy('toArray').and.resolveTo([])
      }),
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(undefined)
      }),
      startsWithAnyOfIgnoreCase: jasmine.createSpy('startsWithAnyOfIgnoreCase').and.returnValue({
        toArray: jasmine.createSpy('toArray').and.resolveTo([])
      })
    } as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists all names', async () => {
    const names = [
      makeName({ id: 1, name: 'John Doe' }),
      makeName({ id: 2, name: 'Jane Smith' })
    ];
    (spreadsheetDB.names.toArray as jasmine.Spy).and.resolveTo(names);

    const result = await service.list();

    expect(result.length).toBe(2);
    expect(result[0].name).toBe('John Doe');
  });

  it('gets name by id', async () => {
    const name = makeName({ id: 5 });
    (spreadsheetDB.names.where as jasmine.Spy).and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(name)
      })
    } as any);

    const result = await service.get(5);

    expect(result).toEqual(name);
  });

  it('finds name by field value', async () => {
    const name = makeName({ name: 'John Doe' });
    (spreadsheetDB.names.where as jasmine.Spy).and.returnValue({
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(name)
      })
    } as any);

    const result = await service.find('name', 'John Doe');

    expect(result).toEqual(name);
  });

  it('deletes name by id', async () => {
    await service.delete(5);

    expect(spreadsheetDB.names.delete).toHaveBeenCalledWith(5);
  });

  it('adds new name', async () => {
    const newName = makeName({ id: undefined, name: 'New Person' });

    await service.add(newName);

    expect(spreadsheetDB.names.add).toHaveBeenCalledWith(newName);
  });

  it('deletes unsaved names', async () => {
    const unsaved = makeName({ id: 5, saved: false });
    (spreadsheetDB.names.toArray as jasmine.Spy).and.resolveTo([unsaved]);

    await service.deleteUnsaved();

    expect(spreadsheetDB.names.delete).toHaveBeenCalledWith(5);
  });

  it('returns unsaved names only', async () => {
    const unsaved1 = makeName({ id: 5, saved: false });
    const unsaved2 = makeName({ id: 6, saved: false });
    const saved = makeName({ id: 3, saved: true });
    (spreadsheetDB.names.toArray as jasmine.Spy).and.resolveTo([unsaved1, unsaved2, saved]);

    const result = await service.getUnsaved();

    expect(result.length).toBe(2);
    expect(result.every(n => !n.saved)).toBeTrue();
  });

  it('appends names and merges duplicates', async () => {
    const existingNames = [
      makeName({
        id: 1,
        name: 'John Doe',
        pay: 100,
        tip: 20,
        trips: 5,
        addresses: ['123 Main St']
      })
    ];
    const newName = makeName({
      id: undefined,
      name: 'John Doe',
      pay: 50,
      tip: 10,
      trips: 3,
      addresses: ['456 Oak Ave']
    });

    (spreadsheetDB.names.toArray as jasmine.Spy).and.resolveTo(existingNames);

    await service.append([newName]);

    expect(spreadsheetDB.names.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.names.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBe(1);
    expect(putArg[0].pay).toBe(150); // 100 + 50
    expect(putArg[0].tip).toBe(30); // 20 + 10
    expect(putArg[0].addresses).toContain('123 Main St');
    expect(putArg[0].addresses).toContain('456 Oak Ave');
  });

  it('appends new names without duplicates', async () => {
    const newName = makeName({
      id: undefined,
      name: 'New Person',
      pay: 25,
      tip: 5
    });

    (spreadsheetDB.names.toArray as jasmine.Spy).and.resolveTo([]);

    await service.append([newName]);

    expect(spreadsheetDB.names.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.names.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBeUndefined();
    expect(putArg[0].name).toBe('New Person');
  });

  it('accumulates notes when merging duplicate names', async () => {
    const existingNames = [
      makeName({
        id: 1,
        name: 'John Doe',
        notes: [{ date: '2024-01-01', text: 'Good tipper' }]
      })
    ];
    const newName = makeName({
      id: undefined,
      name: 'John Doe',
      notes: [{ date: '2024-01-02', text: 'Prefers contactless' }]
    });

    (spreadsheetDB.names.toArray as jasmine.Spy).and.resolveTo(existingNames);

    await service.append([newName]);

    const putArg = (spreadsheetDB.names.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].notes.length).toBe(2);
  });
});
