import { TestBed } from '@angular/core/testing';
import { RegionService } from './region.service';
import { IRegion } from '@interfaces/region.interface';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('RegionService', () => {
  let service: RegionService;

  const makeRegion = (overrides: Partial<IRegion> = {}): IRegion => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    region: overrides.region ?? 'Downtown',
    trips: overrides.trips ?? 5,
    pay: overrides.pay ?? 50,
    tip: overrides.tip ?? 10,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 60,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RegionService],
    });

    service = TestBed.inject(RegionService);

    spyOn(spreadsheetDB.regions, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.regions, 'delete').and.resolveTo();
    spyOn(spreadsheetDB.regions, 'bulkPut').and.resolveTo(1);
    spyOn(spreadsheetDB.regions, 'add').and.resolveTo(1);
    
    spyOn(spreadsheetDB.regions, 'where').and.returnValue({
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

  it('lists all regions', async () => {
    const regions = [
      makeRegion({ id: 1, region: 'Downtown' }),
      makeRegion({ id: 2, region: 'Suburbs' })
    ];
    (spreadsheetDB.regions.toArray as jasmine.Spy).and.resolveTo(regions);

    const result = await service.list();

    expect(result.length).toBe(2);
    expect(result[0].region).toBe('Downtown');
  });

  it('gets region by id', async () => {
    const region = makeRegion({ id: 5 });
    (spreadsheetDB.regions.where as jasmine.Spy).and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(region)
      })
    } as any);

    const result = await service.get(5);

    expect(result).toEqual(region);
  });

  it('deletes region by id', async () => {
    await service.delete(5);

    expect(spreadsheetDB.regions.delete).toHaveBeenCalledWith(5);
  });

  it('deletes unsaved regions', async () => {
    const unsaved = makeRegion({ id: 5, saved: false });
    (spreadsheetDB.regions.toArray as jasmine.Spy).and.resolveTo([unsaved]);

    await service.deleteUnsaved();

    expect(spreadsheetDB.regions.delete).toHaveBeenCalledWith(5);
  });

  it('returns unsaved regions only', async () => {
    const unsaved1 = makeRegion({ id: 5, saved: false });
    const unsaved2 = makeRegion({ id: 6, saved: false });
    const saved = makeRegion({ id: 3, saved: true });
    (spreadsheetDB.regions.toArray as jasmine.Spy).and.resolveTo([unsaved1, unsaved2, saved]);

    const result = await service.getUnsaved();

    expect(result.length).toBe(2);
    expect(result.every(r => !r.saved)).toBeTrue();
  });

  it('appends regions and merges duplicates', async () => {
    const existingRegions = [
      makeRegion({
        id: 1,
        region: 'Downtown',
        pay: 100,
        tip: 20,
        trips: 5
      })
    ];
    const newRegion = makeRegion({
      id: undefined,
      region: 'Downtown',
      pay: 50,
      tip: 10,
      trips: 3
    });

    (spreadsheetDB.regions.toArray as jasmine.Spy).and.resolveTo(existingRegions);

    await service.append([newRegion]);

    expect(spreadsheetDB.regions.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.regions.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBe(1);
    expect(putArg[0].pay).toBe(150);
    expect(putArg[0].tip).toBe(30);
  });

  it('appends new regions without duplicates', async () => {
    const newRegion = makeRegion({
      id: undefined,
      region: 'Airport',
      pay: 25,
      tip: 5
    });

    (spreadsheetDB.regions.toArray as jasmine.Spy).and.resolveTo([]);

    await service.append([newRegion]);

    expect(spreadsheetDB.regions.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.regions.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBeUndefined();
    expect(putArg[0].region).toBe('Airport');
  });
});
