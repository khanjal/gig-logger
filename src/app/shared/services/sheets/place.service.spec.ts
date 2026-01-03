import { TestBed } from '@angular/core/testing';
import { PlaceService } from './place.service';
import { IPlace } from '@interfaces/place.interface';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('PlaceService', () => {
  let service: PlaceService;

  const makePlace = (overrides: Partial<IPlace> = {}): IPlace => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    place: overrides.place ?? 'Target',
    addresses: overrides.addresses ?? [],
    types: overrides.types ?? [],
    trips: overrides.trips ?? 5,
    pay: overrides.pay ?? 50,
    tip: overrides.tip ?? 10,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 60,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlaceService],
    });

    service = TestBed.inject(PlaceService);

    spyOn(spreadsheetDB.places, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.places, 'delete').and.resolveTo();
    spyOn(spreadsheetDB.places, 'bulkPut').and.resolveTo(1);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deletes unsaved places', async () => {
    const unsaved = makePlace({ id: 5, saved: false });
    spyOn(service, 'list').and.returnValue(Promise.resolve([unsaved]));

    await service.deleteUnsaved();

    expect(spreadsheetDB.places.delete).toHaveBeenCalledWith(5);
  });

  it('returns only unsaved places', async () => {
    const places = [
      makePlace({ saved: true }),
      makePlace({ id: 2, saved: false }),
    ];
    spyOn(service, 'list').and.returnValue(Promise.resolve(places));

    const result = await service.getUnsaved();

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  it('merges place data when appending existing places', async () => {
    const existing = makePlace({ place: 'Target', pay: 50, tip: 10, trips: 5 });
    const incoming = makePlace({ place: 'Target', pay: 30, tip: 5, trips: 3, id: undefined });
    
    spyOn(service, 'list').and.returnValue(Promise.resolve([existing]));

    await service.append([incoming]);

    expect(spreadsheetDB.places.bulkPut).toHaveBeenCalled();
    const merged = (spreadsheetDB.places.bulkPut as jasmine.Spy).calls.mostRecent().args[0][0];
    expect(merged.pay).toBe(80);
    expect(merged.tip).toBe(15);
    expect(merged.trips).toBe(8);
  });

  it('adds new places when appending non-existing', async () => {
    const incoming = makePlace({ place: 'Walmart', id: 999 });
    
    spyOn(service, 'list').and.returnValue(Promise.resolve([]));

    await service.append([incoming]);

    const places = (spreadsheetDB.places.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(places[0].id).toBeUndefined();
  });
});
