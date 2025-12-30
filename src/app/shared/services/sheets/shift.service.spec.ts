import { TestBed } from '@angular/core/testing';
import { ShiftService } from './shift.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IShift } from '@interfaces/shift.interface';
import { DateHelper } from '@helpers/date.helper';

describe('ShiftService', () => {
  let service: ShiftService;

  let idCounter = 1;
  const makeShift = (overrides: Partial<IShift> = {}): IShift => ({
    id: overrides.id ?? idCounter++,
    rowId: overrides.rowId ?? 1,
    key: overrides.key ?? 'shift-1',
    date: overrides.date ?? '2024-01-01',
    service: overrides.service ?? 'Uber',
    number: overrides.number ?? 1,
    saved: overrides.saved ?? true,
    ...overrides
  } as IShift);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShiftService]
    });
    service = TestBed.inject(ShiftService);
  });

  afterEach(async () => {
    await spreadsheetDB.shifts.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUnsavedShifts', () => {
    it('returns shifts with saved=false', async () => {
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ id: 1, saved: false }),
        makeShift({ id: 2, saved: true }),
        makeShift({ id: 3, saved: false })
      ]);

      const result = await service.getUnsavedShifts();

      expect(result.length).toBe(2);
      expect(result.every(s => !s.saved)).toBeTrue();
    });
  });

  describe('getPreviousWeekShifts', () => {
    it('retrieves shifts from previous 7 days', async () => {
      spyOn(DateHelper, 'getDatesArray').and.returnValue(['2024-01-05', '2024-01-04', '2024-01-03']);
      
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ date: '2024-01-05' }),
        makeShift({ date: '2024-01-03' }),
        makeShift({ date: '2023-12-20' })
      ]);

      const result = await service.getPreviousWeekShifts();

      expect(result.length).toBe(2);
      expect(result.find(s => s.date === '2023-12-20')).toBeUndefined();
    });
  });

  describe('getShiftsPreviousDays', () => {
    it('returns shifts within specified days', async () => {
      spyOn(DateHelper, 'getDatesArray').and.returnValue(['2024-01-10', '2024-01-09', '2024-01-08']);
      
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ id: 1, date: '2024-01-10' }),
        makeShift({ id: 2, date: '2024-01-08' }),
        makeShift({ id: 3, date: '2024-01-01' })
      ]);

      const result = await service.getShiftsPreviousDays(3);

      expect(result.length).toBe(2);
    });
  });

  describe('getShiftsByDate', () => {
    it('returns all shifts for a specific date', async () => {
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ id: 1, date: '2024-01-15' }),
        makeShift({ id: 2, date: '2024-01-15' }),
        makeShift({ id: 3, date: '2024-01-16' })
      ]);

      const result = await service.getShiftsByDate('2024-01-15');

      expect(result.length).toBe(2);
      expect(result.every(s => s.date === '2024-01-15')).toBeTrue();
    });
  });

  describe('getShiftsByStartDate', () => {
    it('returns shifts on or after the start date', async () => {
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ id: 1, date: '2024-01-10' }),
        makeShift({ id: 2, date: '2024-01-15' }),
        makeShift({ id: 3, date: '2024-01-20' })
      ]);

      const result = await service.getShiftsByStartDate('2024-01-15');

      expect(result.length).toBe(2);
      expect(result.find(s => s.date === '2024-01-10')).toBeUndefined();
    });
  });

  describe('getRemoteShiftsBetweenDates', () => {
    it('returns shifts between start and end dates inclusive', async () => {
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ id: 1, date: '2024-01-05' }),
        makeShift({ id: 2, date: '2024-01-10' }),
        makeShift({ id: 3, date: '2024-01-15' }),
        makeShift({ id: 4, date: '2024-01-20' })
      ]);

      const result = await service.getRemoteShiftsBetweenDates('2024-01-10', '2024-01-15');

      expect(result.length).toBe(2);
      expect(result.map(s => s.date)).toEqual(['2024-01-10', '2024-01-15']);
    });
  });

  describe('getShiftsBetweenDates', () => {
    it('delegates to getRemoteShiftsBetweenDates', async () => {
      spyOn(service, 'getRemoteShiftsBetweenDates').and.returnValue(
        Promise.resolve([makeShift({ date: '2024-01-12' })])
      );

      const result = await service.getShiftsBetweenDates('2024-01-10', '2024-01-15');

      expect(service.getRemoteShiftsBetweenDates).toHaveBeenCalledWith('2024-01-10', '2024-01-15');
      expect(result.length).toBe(1);
    });
  });

  describe('queryShiftByKey', () => {
    it('returns shift matching the key', async () => {
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ key: 'shift-a' }),
        makeShift({ key: 'shift-b', number: 2 })
      ]);

      const result = await service.queryShiftByKey('shift-b');

      expect(result.key).toBe('shift-b');
    });
  });

  describe('saveUnsavedShifts', () => {
    it('delegates to parent saveUnsaved method', async () => {
      spyOn(service, 'saveUnsaved').and.returnValue(Promise.resolve());

      await service.saveUnsavedShifts();

      expect(service.saveUnsaved).toHaveBeenCalled();
    });
  });

  describe('getLastShift', () => {
    it('returns the most recent shift by date', async () => {
      await spreadsheetDB.shifts.bulkAdd([
        makeShift({ id: 1, date: '2024-01-10' }),
        makeShift({ id: 2, date: '2024-01-20' }),
        makeShift({ id: 3, date: '2024-01-05' })
      ]);

      const result = await service.getLastShift();

      expect(result?.date).toBe('2024-01-20');
    });

    it('returns undefined when no shifts exist', async () => {
      const result = await service.getLastShift();

      expect(result).toBeUndefined();
    });
  });
});
