import { WeeklyService } from './weekly.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IWeekly } from '@interfaces/weekly.interface';

const makeWeekly = (overrides: Partial<IWeekly> = {}): IWeekly => ({
  rowId: overrides.rowId ?? 1,
  week: overrides.week ?? '2025-W48',
  days: overrides.days ?? 7,
  average: overrides.average ?? 50,
  number: overrides.number ?? 48,
  year: overrides.year ?? 2025,
  begin: overrides.begin ?? '2025-11-24',
  end: overrides.end ?? '2025-11-30',
  trips: overrides.trips ?? 10,
  distance: overrides.distance ?? 80,
  time: overrides.time ?? '05:20',
  pay: overrides.pay ?? 400,
  tip: overrides.tip ?? 80,
  bonus: overrides.bonus ?? 20,
  cash: overrides.cash ?? 0,
  total: overrides.total ?? 500,
  amountPerTrip: overrides.amountPerTrip ?? 50,
  amountPerDistance: overrides.amountPerDistance ?? 6.25,
  amountPerTime: overrides.amountPerTime ?? 100,
});

describe('WeeklyService', () => {
  let service: WeeklyService;

  beforeEach(() => {
    service = new WeeklyService();
  });

  it('list() returns weekly items', async () => {
    const items = [makeWeekly(), makeWeekly({ number: 49 })];
    spyOn(spreadsheetDB.weekly, 'toArray').and.resolveTo(items);
    const result = await service.list();
    expect(result).toEqual(items);
  });

  it('query() uses where().equals().toArray()', async () => {
    const items = [makeWeekly({ year: 2025 })];
    spyOn(spreadsheetDB.weekly, 'where').and.returnValue({
      equals: (_value: any) => ({ toArray: () => Promise.resolve(items) })
    } as any);
    const result = await service.query('year', 2025);
    expect(result).toEqual(items);
  });

  it('getLastWeekFromDay() uses below().last()', async () => {
    const last = makeWeekly({ begin: '2025-11-17', end: '2025-11-23', number: 47 });
    spyOn(spreadsheetDB.weekly, 'where').and.returnValue({
      below: (_day: string) => ({ last: () => Promise.resolve(last) })
    } as any);

    const result = await service.getLastWeekFromDay('2025-11-24');
    expect(result).toEqual(last);
  });

  it('find() uses anyOfIgnoreCase().first()', async () => {
    const item = makeWeekly({ week: '2025-W48' });
    spyOn(spreadsheetDB.weekly, 'where').and.returnValue({
      anyOfIgnoreCase: (_value: string) => ({ first: () => Promise.resolve(item) })
    } as any);
    const result = await service.find('week', '2025-W48');
    expect(result).toEqual(item);
  });
});
