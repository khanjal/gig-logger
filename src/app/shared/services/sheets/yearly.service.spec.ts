import { YearlyService } from './yearly.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IYearly } from '@interfaces/yearly.interface';

const makeYearly = (overrides: Partial<IYearly> = {}): IYearly => ({
  rowId: overrides.rowId ?? 1,
  year: overrides.year ?? 2025,
  days: overrides.days ?? 365,
  trips: overrides.trips ?? 1200,
  distance: overrides.distance ?? 10000,
  time: overrides.time ?? '500:00',
  pay: overrides.pay ?? 36000,
  tip: overrides.tip ?? 7200,
  bonus: overrides.bonus ?? 1200,
  cash: overrides.cash ?? 0,
  total: overrides.total ?? 44400,
  amountPerTrip: overrides.amountPerTrip ?? 37,
  amountPerDistance: overrides.amountPerDistance ?? 4.4,
  amountPerTime: overrides.amountPerTime ?? 88.8,
});

describe('YearlyService', () => {
  let service: YearlyService;

  beforeEach(() => {
    service = new YearlyService();
  });

  it('list() returns yearly items', async () => {
    const items = [makeYearly(), makeYearly({ year: 2024 })];
    spyOn(spreadsheetDB.yearly, 'toArray').and.resolveTo(items);
    const result = await service.list();
    expect(result).toEqual(items);
  });

  it('query() uses equals().toArray()', async () => {
    const items = [makeYearly({ year: 2025 })];
    spyOn(spreadsheetDB.yearly, 'where').and.returnValue({
      equals: (_value: any) => ({ toArray: () => Promise.resolve(items) })
    } as any);
    const result = await service.query('year', 2025);
    expect(result).toEqual(items);
  });
});
