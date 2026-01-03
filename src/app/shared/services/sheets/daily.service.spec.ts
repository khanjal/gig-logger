import { DailyService } from './daily.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IDaily } from '@interfaces/daily.interface';

const makeDaily = (overrides: Partial<IDaily> = {}): IDaily => ({
  rowId: overrides.rowId ?? 1,
  date: overrides.date ?? '2025-12-01',
  day: overrides.day ?? 1,
  weekday: overrides.weekday ?? 'Mon',
  week: overrides.week ?? '2025-W48',
  month: overrides.month ?? '2025-12',
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

describe('DailyService', () => {
  let service: DailyService;

  beforeEach(() => {
    service = new DailyService();
  });

  it('add() calls table.add', async () => {
    spyOn(spreadsheetDB.daily, 'add').and.resolveTo(1 as any);
    const item = makeDaily();
    await service.add(item);
    expect(spreadsheetDB.daily.add).toHaveBeenCalledWith(item);
  });

  it('delete() calls table.delete', async () => {
    spyOn(spreadsheetDB.daily, 'delete').and.resolveTo(undefined);
    await service.delete(1);
    expect(spreadsheetDB.daily.delete).toHaveBeenCalledWith(1);
  });

  it('list() returns all items', async () => {
    const items = [makeDaily({ day: 1 }), makeDaily({ day: 2 })];
    spyOn(spreadsheetDB.daily, 'toArray').and.resolveTo(items);
    const result = await service.list();
    expect(result).toEqual(items);
  });

  it('filter() uses where().startsWithAnyOfIgnoreCase().toArray()', async () => {
    const filtered = [makeDaily({ month: '2025-12' })];
    spyOn(spreadsheetDB.daily, 'where').and.returnValue({
      startsWithAnyOfIgnoreCase: (_value: string) => ({
        toArray: () => Promise.resolve(filtered)
      })
    } as any);

    const result = await service.filter('month', '2025');
    expect(result).toEqual(filtered);
  });

  it('find() uses where().anyOfIgnoreCase().first()', async () => {
    const item = makeDaily({ date: '2025-12-01' });
    spyOn(spreadsheetDB.daily, 'where').and.returnValue({
      anyOfIgnoreCase: (_value: string) => ({
        first: () => Promise.resolve(item)
      })
    } as any);

    const result = await service.find('date', '2025-12-01');
    expect(result).toEqual(item);
  });

  it('get() uses where("id").equals().first()', async () => {
    const existing = makeDaily();
    spyOn(spreadsheetDB.daily, 'where').and.returnValue({
      equals: (_value: number) => ({
        first: () => Promise.resolve(existing)
      })
    } as any);

    const result = await service.get(1);
    expect(result).toEqual(existing);
  });

  it('includes() filters by substring (case-insensitive)', async () => {
    const items = [makeDaily({ month: '2025-12' }), makeDaily({ month: '2025-11' })];
    spyOn(spreadsheetDB.daily, 'toArray').and.resolveTo(items);
    const result = await service.includes('month', '12');
    expect(result.length).toBe(1);
    expect(result[0].month).toBe('2025-12');
  });

  it('load() clears and bulk adds items', async () => {
    const items = [makeDaily(), makeDaily({ day: 2 })];
    spyOn(spreadsheetDB.daily, 'clear').and.resolveTo(undefined);
    spyOn(spreadsheetDB.daily, 'bulkAdd').and.resolveTo(undefined);

    await service.load(items);
    expect(spreadsheetDB.daily.clear).toHaveBeenCalled();
    expect(spreadsheetDB.daily.bulkAdd).toHaveBeenCalledWith(items);
  });

  it('paginate() with sortField uses orderBy chain', async () => {
    const paged = [makeDaily({ day: 3 }), makeDaily({ day: 4 })];
    spyOn(spreadsheetDB.daily, 'orderBy').and.callFake((field: string) => ({
      reverse: () => ({ offset: (o: number) => ({ limit: (l: number) => ({ toArray: () => Promise.resolve(paged) }) }) }),
      offset: (o: number) => ({ limit: (l: number) => ({ toArray: () => Promise.resolve(paged) }) }),
      toArray: () => Promise.resolve(paged)
    }) as any);

    const result = await service.paginate(0, 2, 'date', 'asc');
    expect(result).toEqual(paged);
  });

  it('daily$ emits current array', (done) => {
    const items = [makeDaily(), makeDaily({ day: 2 })];
    spyOn(spreadsheetDB.daily, 'toArray').and.resolveTo(items);

    service.daily$.subscribe(value => {
      expect(value).toEqual(items);
      done();
    });
  });
});
