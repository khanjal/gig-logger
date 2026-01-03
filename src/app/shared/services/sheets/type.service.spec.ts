import { TestBed } from '@angular/core/testing';
import { TypeService } from './type.service';
import { IType } from '@interfaces/type.interface';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('TypeService', () => {
  let service: TypeService;

  const makeType = (overrides: Partial<IType> = {}): IType => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    type: overrides.type ?? 'Delivery',
    trips: overrides.trips ?? 5,
    pay: overrides.pay ?? 50,
    tip: overrides.tip ?? 10,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 60,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TypeService],
    });

    service = TestBed.inject(TypeService);

    spyOn(spreadsheetDB.types, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.types, 'delete').and.resolveTo();
    spyOn(spreadsheetDB.types, 'bulkPut').and.resolveTo(1);
    spyOn(spreadsheetDB.types, 'add').and.resolveTo(1);
    
    spyOn(spreadsheetDB.types, 'where').and.returnValue({
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

  it('lists all types', async () => {
    const types = [
      makeType({ id: 1, type: 'Delivery' }),
      makeType({ id: 2, type: 'Pickup' })
    ];
    (spreadsheetDB.types.toArray as jasmine.Spy).and.resolveTo(types);

    const result = await service.list();

    expect(result.length).toBe(2);
    expect(result[0].type).toBe('Delivery');
  });

  it('gets type by id', async () => {
    const type = makeType({ id: 5 });
    (spreadsheetDB.types.where as jasmine.Spy).and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(type)
      })
    } as any);

    const result = await service.get(5);

    expect(result).toEqual(type);
  });

  it('deletes type by id', async () => {
    await service.delete(5);

    expect(spreadsheetDB.types.delete).toHaveBeenCalledWith(5);
  });

  it('deletes unsaved types', async () => {
    const unsaved = makeType({ id: 5, saved: false });
    (spreadsheetDB.types.toArray as jasmine.Spy).and.resolveTo([unsaved]);

    await service.deleteUnsaved();

    expect(spreadsheetDB.types.delete).toHaveBeenCalledWith(5);
  });

  it('returns unsaved types only', async () => {
    const unsaved1 = makeType({ id: 5, saved: false });
    const unsaved2 = makeType({ id: 6, saved: false });
    const saved = makeType({ id: 3, saved: true });
    (spreadsheetDB.types.toArray as jasmine.Spy).and.resolveTo([unsaved1, unsaved2, saved]);

    const result = await service.getUnsaved();

    expect(result.length).toBe(2);
    expect(result.every(t => !t.saved)).toBeTrue();
  });

  it('appends types and merges duplicates', async () => {
    const existingTypes = [
      makeType({
        id: 1,
        type: 'Delivery',
        pay: 100,
        tip: 20,
        trips: 5
      })
    ];
    const newType = makeType({
      id: undefined,
      type: 'Delivery',
      pay: 50,
      tip: 10,
      trips: 3
    });

    (spreadsheetDB.types.toArray as jasmine.Spy).and.resolveTo(existingTypes);

    await service.append([newType]);

    expect(spreadsheetDB.types.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.types.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBe(1);
    expect(putArg[0].pay).toBe(150);
    expect(putArg[0].tip).toBe(30);
  });

  it('appends new types without duplicates', async () => {
    const newType = makeType({
      id: undefined,
      type: 'Return',
      pay: 25,
      tip: 5
    });

    (spreadsheetDB.types.toArray as jasmine.Spy).and.resolveTo([]);

    await service.append([newType]);

    expect(spreadsheetDB.types.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.types.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBeUndefined();
    expect(putArg[0].type).toBe('Return');
  });
});
