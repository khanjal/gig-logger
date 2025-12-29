import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';

describe('SearchService', () => {
  let service: SearchService;

  const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    action: overrides.action ?? '',
    actionTime: overrides.actionTime ?? 0,
    key: overrides.key ?? 'k1',
    date: overrides.date ?? '2024-01-01',
    distance: overrides.distance ?? 0,
    endAddress: overrides.endAddress ?? '',
    endUnit: overrides.endUnit ?? '',
    endOdometer: overrides.endOdometer ?? 0,
    exclude: overrides.exclude ?? false,
    dropoffTime: overrides.dropoffTime ?? '10:30',
    duration: overrides.duration ?? '00:30:00',
    name: overrides.name ?? '',
    note: overrides.note ?? '',
    number: overrides.number ?? 1,
    orderNumber: overrides.orderNumber ?? '',
    pickupTime: overrides.pickupTime ?? '10:00',
    place: overrides.place ?? 'Target',
    region: overrides.region ?? 'CA',
    service: overrides.service ?? 'DoorDash',
    startAddress: overrides.startAddress ?? '',
    startOdometer: overrides.startOdometer ?? 0,
    type: overrides.type ?? 'delivery',
    amountPerDistance: overrides.amountPerDistance ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0,
    pay: overrides.pay ?? 10,
    tip: overrides.tip ?? 2,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 12,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchService],
    });

    service = TestBed.inject(SearchService);

    // Mock Dexie tables
    spyOn(spreadsheetDB.trips, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.services, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.places, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.names, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.addresses, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.regions, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.types, 'toArray').and.resolveTo([]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns empty array for empty search term', async () => {
    const result = await service.search('');

    expect(result).toEqual([]);
  });

  it('returns empty array for whitespace search term', async () => {
    const result = await service.search('   ');

    expect(result).toEqual([]);
  });

  it('searches services by category', async () => {
    const trips = [makeTrip({ service: 'Uber' }), makeTrip({ service: 'Uber' })];
    (spreadsheetDB.trips.toArray as jasmine.Spy).and.resolveTo(trips);
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, service: 'Uber', rowId: 1, saved: true, pay: 50, tip: 10, bonus: 0, cash: 0, total: 60, trips: 2, distance: 100, time: '2:00' }
    ]);

    const result = await service.search('Uber', 'Service');

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('Service');
  });

  it('searches places by category', async () => {
    const trips = [makeTrip({ place: 'Starbucks' })];
    (spreadsheetDB.trips.toArray as jasmine.Spy).and.resolveTo(trips);
    (spreadsheetDB.places.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, place: 'Starbucks', rowId: 1, saved: true, addresses: [], types: [], pay: 20, tip: 5, bonus: 0, cash: 0, total: 25, trips: 1 }
    ]);

    const result = await service.search('Starbucks', 'Place');

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('Place');
  });

  it('searches all categories when category is All', async () => {
    const trips = [
      makeTrip({ service: 'DoorDash', place: 'Target', region: 'CA' }),
      makeTrip({ service: 'Uber', place: 'Starbucks', region: 'TX' })
    ];
    (spreadsheetDB.trips.toArray as jasmine.Spy).and.resolveTo(trips);
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, service: 'DoorDash', rowId: 1, saved: true, pay: 10, tip: 2, bonus: 0, cash: 0, total: 12, trips: 1, distance: 5, time: '0:30' }
    ]);
    (spreadsheetDB.places.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, place: 'Target', rowId: 1, saved: true, addresses: [], types: [], pay: 10, tip: 2, bonus: 0, cash: 0, total: 12, trips: 1 }
    ]);
    (spreadsheetDB.regions.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, region: 'CA', rowId: 1, saved: true, pay: 10, tip: 2, bonus: 0, cash: 0, total: 12, trips: 1, distance: 5, time: '0:30' }
    ]);

    const result = await service.search('Target', 'All');

    expect(result.length).toBeGreaterThan(0);
  });

  it('searches multiple categories with searchMultipleCategories', async () => {
    const trips = [makeTrip({ service: 'Uber', place: 'Coffee Shop' })];
    (spreadsheetDB.trips.toArray as jasmine.Spy).and.resolveTo(trips);
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, service: 'Uber', rowId: 1, saved: true, pay: 5, tip: 1, bonus: 0, cash: 0, total: 6, trips: 1, distance: 3, time: '0:15' }
    ]);
    (spreadsheetDB.places.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, place: 'Coffee Shop', rowId: 1, saved: true, addresses: [], types: [], pay: 5, tip: 1, bonus: 0, cash: 0, total: 6, trips: 1 }
    ]);

    const result = await service.searchMultipleCategories('Shop', ['Service', 'Place']);

    expect(result.length).toBeGreaterThan(0);
  });

  it('supports exact match in searchMultipleCategories', async () => {
    const trips = [makeTrip({ place: 'Target' })];
    (spreadsheetDB.trips.toArray as jasmine.Spy).and.resolveTo(trips);
    (spreadsheetDB.places.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, place: 'Target', rowId: 1, saved: true, addresses: [], types: [], pay: 20, tip: 3, bonus: 0, cash: 0, total: 23, trips: 1 }
    ]);

    const result = await service.searchMultipleCategories('Target', ['Place'], true);

    expect(result.length).toBeGreaterThan(0);
  });

  it('supports case-sensitive search', async () => {
    const trips = [makeTrip({ service: 'DoorDash' })];
    (spreadsheetDB.trips.toArray as jasmine.Spy).and.resolveTo(trips);
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, service: 'DoorDash', rowId: 1, saved: true, pay: 10, tip: 2, bonus: 0, cash: 0, total: 12, trips: 1, distance: 5, time: '0:30' }
    ]);

    const result = await service.searchMultipleCategories('DoorDash', ['Service'], false, true);

    expect(result.length).toBeGreaterThan(0);
  });

  it('returns autocomplete options for selected categories', async () => {
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, service: 'Uber', rowId: 1, saved: true, pay: 5, tip: 1, bonus: 0, cash: 0, total: 6, trips: 1, distance: 3, time: '0:15' },
      { id: 2, service: 'DoorDash', rowId: 2, saved: true, pay: 10, tip: 2, bonus: 0, cash: 0, total: 12, trips: 1, distance: 5, time: '0:30' }
    ]);
    (spreadsheetDB.places.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, place: 'Target', rowId: 1, saved: true, addresses: [], types: [], pay: 10, tip: 2, bonus: 0, cash: 0, total: 12, trips: 1 }
    ]);

    const options = await service.getAutocompleteOptions(['Service', 'Place']);

    expect(options.length).toBeGreaterThan(0);
    expect(options).toContain('Uber');
    expect(options).toContain('DoorDash');
    expect(options).toContain('Target');
  });

  it('returns sorted autocomplete options', async () => {
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, service: 'Zebra', rowId: 1, saved: true, pay: 5, tip: 1, bonus: 0, cash: 0, total: 6, trips: 1, distance: 3, time: '0:15' },
      { id: 2, service: 'Apple', rowId: 2, saved: true, pay: 10, tip: 2, bonus: 0, cash: 0, total: 12, trips: 1, distance: 5, time: '0:30' }
    ]);

    const options = await service.getAutocompleteOptions(['Service']);

    expect(options[0]).toBe('Apple');
    expect(options[1]).toBe('Zebra');
  });

  it('filters autocomplete options when no categories selected', async () => {
    const options = await service.getAutocompleteOptions([]);

    expect(options.length).toBe(0);
  });

  it('handles case-insensitive search by default', async () => {
    const trips = [makeTrip({ place: 'TARGET' })];
    (spreadsheetDB.trips.toArray as jasmine.Spy).and.resolveTo(trips);
    (spreadsheetDB.places.toArray as jasmine.Spy).and.resolveTo([
      { id: 1, place: 'TARGET', rowId: 1, saved: true, addresses: [], types: [], pay: 20, tip: 3, bonus: 0, cash: 0, total: 23, trips: 1 }
    ]);

    const result = await service.search('target', 'Place');

    expect(result.length).toBeGreaterThan(0);
  });
});
