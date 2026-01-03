import { StatHelper } from './stat.helper';
import { ITrip } from '@interfaces/trip.interface';
import { IDaily } from '@interfaces/daily.interface';

describe('StatHelper', () => {
  const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
    id: overrides.id ?? 1,
    date: overrides.date ?? '2024-01-01',
    distance: overrides.distance ?? 10,
    pay: overrides.pay ?? 5,
    tip: overrides.tip ?? 2,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 7,
    amountPerTime: overrides.amountPerTime ?? 15,
    key: overrides.key ?? 'k1',
    service: overrides.service ?? 'Uber',
    number: overrides.number ?? 1,
    region: overrides.region ?? 'Downtown',
    pickupTime: overrides.pickupTime ?? '',
    dropoffTime: overrides.dropoffTime ?? '',
    duration: overrides.duration ?? '',
    place: overrides.place ?? '',
    name: overrides.name ?? '',
    startAddress: overrides.startAddress ?? '',
    endAddress: overrides.endAddress ?? '',
    endUnit: overrides.endUnit ?? '',
    startOdometer: overrides.startOdometer ?? 0,
    endOdometer: overrides.endOdometer ?? 0,
    type: overrides.type ?? '',
    orderNumber: overrides.orderNumber ?? '',
    note: overrides.note ?? '',
    exclude: overrides.exclude ?? false,
    amountPerDistance: overrides.amountPerDistance ?? 0,
    action: overrides.action ?? '',
    actionTime: overrides.actionTime ?? 0,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
  });

  const makeDaily = (overrides: Partial<IDaily> = {}): IDaily => ({
    date: overrides.date ?? '2024-01-01',
    weekday: overrides.weekday ?? 'Monday',
    trips: overrides.trips ?? 10,
    distance: overrides.distance ?? 100,
    time: overrides.time ?? '',
    total: overrides.total ?? 150,
    pay: overrides.pay ?? 100,
    tip: overrides.tip ?? 40,
    bonus: overrides.bonus ?? 10,
    cash: overrides.cash ?? 0,
    amountPerTrip: overrides.amountPerTrip ?? 15,
    amountPerDistance: overrides.amountPerDistance ?? 1.5,
    amountPerTime: overrides.amountPerTime ?? 20,
    rowId: overrides.rowId ?? 1,
    day: overrides.day ?? 1,
    week: overrides.week ?? 'W1',
    month: overrides.month ?? '2024-01',
  });

  describe('getTripsTotal', () => {
    it('calculates totals for multiple trips', () => {
      const trips = [
        makeTrip({ distance: 10, pay: 5, tip: 2, bonus: 1, cash: 0, total: 8 }),
        makeTrip({ distance: 15, pay: 7, tip: 3, bonus: 0, cash: 1, total: 10 }),
      ];
      
      const result = StatHelper.getTripsTotal(trips);
      
      expect(result.trips).toBe(2);
      expect(result.distance).toBe(25);
      expect(result.pay).toBe(12);
      expect(result.tip).toBe(5);
      expect(result.bonus).toBe(1);
      expect(result.cash).toBe(1);
      expect(result.total).toBe(18);
    });

    it('handles empty trips array', () => {
      const result = StatHelper.getTripsTotal([]);
      
      expect(result.trips).toBe(0);
      expect(result.distance).toBe(0);
      expect(result.pay).toBe(0);
      expect(result.total).toBe(0);
    });

    it('calculates amount per trip', () => {
      const trips = [
        makeTrip({ total: 10 }),
        makeTrip({ total: 20 }),
      ];
      
      const result = StatHelper.getTripsTotal(trips);
      
      expect(result.amountPerTrip).toBe(15);
    });

    it('calculates amount per distance', () => {
      const trips = [
        makeTrip({ distance: 10, total: 20 }),
        makeTrip({ distance: 10, total: 30 }),
      ];
      
      const result = StatHelper.getTripsTotal(trips);
      
      expect(result.amountPerDistance).toBe(50 / 20);
    });

    it('handles zero distance without division error', () => {
      const trips = [makeTrip({ distance: 0, total: 10 })];
      
      const result = StatHelper.getTripsTotal(trips);
      
      expect(result.amountPerDistance).toBe(10);
    });

    it('calculates average amount per time', () => {
      const trips = [
        makeTrip({ amountPerTime: 20 }),
        makeTrip({ amountPerTime: 30 }),
      ];
      
      const result = StatHelper.getTripsTotal(trips);
      
      expect(result.amountPerTime).toBe(25);
    });
  });

  describe('getWeekdayAggregatesFromDaily', () => {
    it('aggregates daily data by weekday', () => {
      const daily = [
        makeDaily({ weekday: 'Monday', total: 100, trips: 10, amountPerTime: 20 }),
        makeDaily({ weekday: 'Monday', total: 150, trips: 15, amountPerTime: 25 }),
        makeDaily({ weekday: 'Tuesday', total: 200, trips: 20, amountPerTime: 30 }),
      ];
      
      const result = StatHelper.getWeekdayAggregatesFromDaily(daily);
      
      expect(result['Monday'].count).toBe(2);
      expect(result['Monday'].total).toBe(250);
      expect(result['Monday'].trips).toBe(25);
      expect(result['Monday'].perTimeSum).toBe(45);
      expect(result['Tuesday'].count).toBe(1);
      expect(result['Tuesday'].total).toBe(200);
    });

    it('filters by date range', () => {
      const daily = [
        makeDaily({ date: '2024-01-01', weekday: 'Monday', total: 100 }),
        makeDaily({ date: '2024-01-15', weekday: 'Monday', total: 150 }),
        makeDaily({ date: '2024-01-31', weekday: 'Wednesday', total: 200 }),
      ];
      
      const result = StatHelper.getWeekdayAggregatesFromDaily(daily, '2024-01-10', '2024-01-20');
      
      expect(result['Monday'].count).toBe(1);
      expect(result['Monday'].total).toBe(150);
      expect(result['Wednesday']).toBeUndefined();
    });

    it('handles missing weekday', () => {
      const daily = [makeDaily({ weekday: '' })];
      
      const result = StatHelper.getWeekdayAggregatesFromDaily(daily);
      
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('getBusiestDayFromDaily', () => {
    it('returns day with most trips', () => {
      const daily = [
        makeDaily({ date: '2024-01-01', trips: 10 }),
        makeDaily({ date: '2024-01-02', trips: 25 }),
        makeDaily({ date: '2024-01-03', trips: 15 }),
      ];
      
      const result = StatHelper.getBusiestDayFromDaily(daily);
      
      expect(result.count).toBe(25);
      expect(result.date).toBe('2024-01-02');
    });

    it('returns most recent on tie', () => {
      const daily = [
        makeDaily({ date: '2024-01-01', trips: 20 }),
        makeDaily({ date: '2024-01-02', trips: 20 }),
      ];
      
      const result = StatHelper.getBusiestDayFromDaily(daily);
      
      expect(result.date).toBe('2024-01-02');
    });

    it('returns placeholder for empty data', () => {
      const result = StatHelper.getBusiestDayFromDaily([]);
      
      expect(result.label).toBe('—');
      expect(result.count).toBe(0);
    });

    it('filters by date range', () => {
      const daily = [
        makeDaily({ date: '2024-01-01', trips: 30 }),
        makeDaily({ date: '2024-01-15', trips: 20 }),
      ];
      
      const result = StatHelper.getBusiestDayFromDaily(daily, '2024-01-10');
      
      expect(result.count).toBe(20);
      expect(result.date).toBe('2024-01-15');
    });
  });

  describe('getHighestEarningDayFromDaily', () => {
    it('returns day with highest total', () => {
      const daily = [
        makeDaily({ date: '2024-01-01', total: 100 }),
        makeDaily({ date: '2024-01-02', total: 250 }),
        makeDaily({ date: '2024-01-03', total: 150 }),
      ];
      
      const result = StatHelper.getHighestEarningDayFromDaily(daily);
      
      expect(result.total).toBe(250);
      expect(result.date).toBe('2024-01-02');
    });

    it('returns most recent on tie', () => {
      const daily = [
        makeDaily({ date: '2024-01-01', total: 200 }),
        makeDaily({ date: '2024-01-02', total: 200 }),
      ];
      
      const result = StatHelper.getHighestEarningDayFromDaily(daily);
      
      expect(result.date).toBe('2024-01-02');
    });

    it('returns placeholder for empty data', () => {
      const result = StatHelper.getHighestEarningDayFromDaily([]);
      
      expect(result.label).toBe('—');
      expect(result.total).toBe(0);
    });

    it('filters by date range', () => {
      const daily = [
        makeDaily({ date: '2024-01-01', total: 300 }),
        makeDaily({ date: '2024-01-15', total: 200 }),
      ];
      
      const result = StatHelper.getHighestEarningDayFromDaily(daily, undefined, '2024-01-10');
      
      expect(result.total).toBe(300);
      expect(result.date).toBe('2024-01-01');
    });
  });
});
