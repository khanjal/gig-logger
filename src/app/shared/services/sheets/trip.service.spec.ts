import { TestBed } from '@angular/core/testing';
import { TripService } from './trip.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';
import { ActionEnum } from '@enums/action.enum';
import { DateHelper } from '@helpers/date.helper';

describe('TripService', () => {
  let service: TripService;

  const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    key: overrides.key ?? 'trip-1',
    date: overrides.date ?? '2024-01-01',
    service: overrides.service ?? 'Uber',
    number: overrides.number ?? 1,
    saved: overrides.saved ?? true,
    pickupTime: overrides.pickupTime ?? '10:00',
    dropoffTime: overrides.dropoffTime ?? '11:00',
    ...overrides
  } as ITrip);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TripService]
    });
    service = TestBed.inject(TripService);
  });

  afterEach(async () => {
    await spreadsheetDB.trips.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addNext', () => {
    it('creates next trip with incremented rowId and carryover data', async () => {
      spyOn(service, 'getMaxRowId').and.returnValue(Promise.resolve(5));
      spyOn(service, 'add').and.returnValue(Promise.resolve(undefined));

      const baseTrip = makeTrip({
        key: 'key-123',
        date: '2024-01-15',
        region: 'Downtown',
        service: 'Lyft',
        number: 3,
        place: 'Airport',
        type: 'Pickup',
        startAddress: '123 Main St',
        dropoffTime: '14:30'
      });

      await service.addNext(baseTrip);

      expect(service.add).toHaveBeenCalled();
      const addedTrip = (service.add as jasmine.Spy).calls.mostRecent().args[0];
      expect(addedTrip.rowId).toBe(6);
      expect(addedTrip.key).toBe('key-123');
      expect(addedTrip.pickupTime).toBe('14:30');
      expect(addedTrip.action).toBe(ActionEnum.Add);
    });
  });

  describe('clone', () => {
    it('clones trip with new rowId and Add action', async () => {
      spyOn(service, 'getMaxRowId').and.returnValue(Promise.resolve(10));
      spyOn(service, 'add').and.returnValue(Promise.resolve(undefined));

      const original = makeTrip({ id: 5, rowId: 8, service: 'Uber' });

      await service.clone(original);

      expect(service.add).toHaveBeenCalled();
      const clonedTrip = (service.add as jasmine.Spy).calls.mostRecent().args[0];
      expect(clonedTrip.id).toBeUndefined();
      expect(clonedTrip.rowId).toBe(11);
      expect(clonedTrip.action).toBe(ActionEnum.Add);
    });
  });

  describe('getSaved', () => {
    it('returns only trips with saved=true', async () => {
      await spreadsheetDB.trips.bulkAdd([
        makeTrip({ id: 1, saved: true }),
        makeTrip({ id: 2, saved: false }),
        makeTrip({ id: 3, saved: true })
      ]);

      const result = await service.getSaved();

      expect(result.length).toBe(2);
      expect(result.every(t => t.saved)).toBeTrue();
    });
  });

  describe('getBetweenDates', () => {
    it('returns trips between start and end dates inclusive', async () => {
      await spreadsheetDB.trips.bulkAdd([
        makeTrip({ id: 1, date: '2024-01-05' }),
        makeTrip({ id: 2, date: '2024-01-10' }),
        makeTrip({ id: 3, date: '2024-01-15' }),
        makeTrip({ id: 4, date: '2024-01-20' })
      ]);

      const result = await service.getBetweenDates('2024-01-10', '2024-01-15');

      expect(result.length).toBe(2);
      expect(result.map(t => t.date)).toEqual(['2024-01-10', '2024-01-15']);
    });
  });

  describe('getByDate', () => {
    it('returns all trips for a specific date', async () => {
      await spreadsheetDB.trips.bulkAdd([
        makeTrip({ id: 1, date: '2024-01-12' }),
        makeTrip({ id: 2, date: '2024-01-12' }),
        makeTrip({ id: 3, date: '2024-01-13' })
      ]);

      const result = await service.getByDate('2024-01-12');

      expect(result.length).toBe(2);
      expect(result.every(t => t.date === '2024-01-12')).toBeTrue();
    });
  });

  describe('getPreviousDays', () => {
    it('returns trips on or after computed start date', async () => {
      spyOn(DateHelper, 'toISO').and.callFake((d?: Date) => d ? d.toLocaleDateString('sv-SE') : '2024-01-15');
      spyOn(DateHelper, 'getDateFromDays').and.returnValue(new Date('2024-01-15'));

      await spreadsheetDB.trips.bulkAdd([
        makeTrip({ id: 1, date: '2024-01-10' }),
        makeTrip({ id: 2, date: '2024-01-16' }),
        makeTrip({ id: 3, date: '2024-01-20' })
      ]);

      const result = await service.getPreviousDays(5);

      expect(result.map(t => t.date)).toEqual(['2024-01-16', '2024-01-20']);
    });
  });
});
