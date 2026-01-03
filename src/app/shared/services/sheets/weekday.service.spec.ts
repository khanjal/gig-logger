import { WeekdayService } from './weekday.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IWeekday } from '@interfaces/weekday.interface';

const makeWeekday = (overrides: Partial<IWeekday> = {}): IWeekday => ({
  id: overrides.id ?? 1,
  rowId: overrides.rowId ?? 1,
  day: overrides.day ?? 1,
  days: overrides.days ?? 7,
  dailyAverage: overrides.dailyAverage ?? 10,
  dailyPrevAverage: overrides.dailyPrevAverage ?? 8,
  currentAmount: overrides.currentAmount ?? 12,
  previousAmount: overrides.previousAmount ?? 9,
  trips: overrides.trips ?? 2,
  distance: overrides.distance ?? 10,
  time: overrides.time ?? '00:30',
  pay: overrides.pay ?? 20,
  tip: overrides.tip ?? 5,
  bonus: overrides.bonus ?? 0,
  cash: overrides.cash ?? 0,
  total: overrides.total ?? 25,
  amountPerTrip: overrides.amountPerTrip ?? 12.5,
  amountPerDistance: overrides.amountPerDistance ?? 2.5,
  amountPerTime: overrides.amountPerTime ?? 50,
});

describe('WeekdayService', () => {
  let service: WeekdayService;

  beforeEach(() => {
    service = new WeekdayService();
  });

  it('weekdays$ emits array', (done) => {
    const items = [makeWeekday(), makeWeekday({ day: 2 })];
    spyOn(spreadsheetDB.weekdays, 'toArray').and.resolveTo(items);
    service.weekdays$.subscribe(value => {
      expect(value).toEqual(items);
      done();
    });
  });

  it('getCurrentTotal() sums currentAmount via each()', async () => {
    const items = [makeWeekday({ currentAmount: 5 }), makeWeekday({ currentAmount: 7 })];
    spyOn(spreadsheetDB.weekdays, 'each').and.callFake((fn: any) => {
      for (const w of items) fn(w, { key: w.id, primaryKey: w.id } as any);
      return Promise.resolve(undefined) as any;
    });
    const total = await service.getCurrentTotal();
    expect(total).toBe(12);
  });

  it('getDailyTotal() sums dailyAverage via each()', async () => {
    const items = [makeWeekday({ dailyAverage: 3 }), makeWeekday({ dailyAverage: 4 })];
    spyOn(spreadsheetDB.weekdays, 'each').and.callFake((fn: any) => {
      for (const w of items) fn(w, { key: w.id, primaryKey: w.id } as any);
      return Promise.resolve(undefined) as any;
    });
    const total = await service.getDailyTotal();
    expect(total).toBe(7);
  });

  it('getPreviousTotal() sums dailyPrevAverage via each()', async () => {
    const items = [makeWeekday({ dailyPrevAverage: 6 }), makeWeekday({ dailyPrevAverage: 1 })];
    spyOn(spreadsheetDB.weekdays, 'each').and.callFake((fn: any) => {
      for (const w of items) fn(w, { key: w.id, primaryKey: w.id } as any);
      return Promise.resolve(undefined) as any;
    });
    const total = await service.getPreviousTotal();
    expect(total).toBe(7);
  });
});
