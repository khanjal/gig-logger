import { MonthlyService } from './monthly.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IMonthly } from '@interfaces/monthly.interface';

const makeMonthly = (overrides: Partial<IMonthly> = {}): IMonthly => ({
  rowId: overrides.rowId ?? 1,
  average: overrides.average ?? 40,
  month: overrides.month ?? '2025-12',
  days: overrides.days ?? 31,
  number: overrides.number ?? 12,
  year: overrides.year ?? 2025,
  trips: overrides.trips ?? 100,
  distance: overrides.distance ?? 800,
  time: overrides.time ?? '40:00',
  pay: overrides.pay ?? 3000,
  tip: overrides.tip ?? 600,
  bonus: overrides.bonus ?? 100,
  cash: overrides.cash ?? 0,
  total: overrides.total ?? 3700,
  amountPerTrip: overrides.amountPerTrip ?? 37,
  amountPerDistance: overrides.amountPerDistance ?? 4.6,
  amountPerTime: overrides.amountPerTime ?? 92.5,
});

describe('MonthlyService', () => {
  let service: MonthlyService;

  beforeEach(() => {
    service = new MonthlyService();
  });

  it('list() returns monthly items', async () => {
    const items = [makeMonthly(), makeMonthly({ month: '2025-11', number: 11 })];
    spyOn(spreadsheetDB.monthly, 'toArray').and.resolveTo(items);
    const result = await service.list();
    expect(result).toEqual(items);
  });

  it('filter() uses startsWithAnyOfIgnoreCase()', async () => {
    const filtered = [makeMonthly({ month: '2025-12' })];
    spyOn(spreadsheetDB.monthly, 'where').and.returnValue({
      startsWithAnyOfIgnoreCase: (_value: string) => ({ toArray: () => Promise.resolve(filtered) })
    } as any);
    const result = await service.filter('month', '2025');
    expect(result).toEqual(filtered);
  });

  it('find() uses anyOfIgnoreCase().first()', async () => {
    const item = makeMonthly({ month: '2025-12' });
    spyOn(spreadsheetDB.monthly, 'where').and.returnValue({
      anyOfIgnoreCase: (_value: string) => ({ first: () => Promise.resolve(item) })
    } as any);
    const result = await service.find('month', '2025-12');
    expect(result).toEqual(item);
  });
});
