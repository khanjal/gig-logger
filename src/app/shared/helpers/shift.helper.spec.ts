import { ShiftHelper } from './shift.helper';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { DateHelper } from './date.helper';
import { ActionEnum } from '@enums/action.enum';

describe('ShiftHelper', () => {
  const makeShift = (overrides: Partial<IShift> = {}): IShift => ({
    id: overrides.id ?? 1,
    date: overrides.date ?? '2024-01-01',
    service: overrides.service ?? 'Uber',
    number: overrides.number ?? 1,
    key: overrides.key ?? '2024-01-01_1',
    region: overrides.region ?? 'Downtown',
    start: overrides.start ?? '08:00:00',
    finish: overrides.finish ?? '',
    time: overrides.time ?? '',
    active: overrides.active ?? '',
    trips: overrides.trips ?? 0,
    distance: overrides.distance ?? 0,
    pay: overrides.pay ?? 0,
    tip: overrides.tip ?? 0,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 0,
    totalActive: overrides.totalActive ?? '',
    totalTime: overrides.totalTime ?? '',
    totalTrips: overrides.totalTrips ?? 0,
    totalDistance: overrides.totalDistance ?? 0,
    totalPay: overrides.totalPay ?? 0,
    totalTips: overrides.totalTips ?? 0,
    totalBonus: overrides.totalBonus ?? 0,
    grandTotal: overrides.grandTotal ?? 0,
    totalCash: overrides.totalCash ?? 0,
    note: overrides.note ?? '',
    omit: overrides.omit ?? false,
    amountPerTrip: overrides.amountPerTrip ?? 0,
    amountPerDistance: overrides.amountPerDistance ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0,
    action: overrides.action ?? '',
    actionTime: overrides.actionTime ?? 0,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
  });

  const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
    id: overrides.id ?? 1,
    key: overrides.key ?? '2024-01-01_1',
    date: overrides.date ?? '2024-01-01',
    service: overrides.service ?? 'Uber',
    number: overrides.number ?? 1,
    region: overrides.region ?? 'Downtown',
    pickupTime: overrides.pickupTime ?? '08:00:00',
    dropoffTime: overrides.dropoffTime ?? '',
    duration: overrides.duration ?? '',
    place: overrides.place ?? 'Airport',
    name: overrides.name ?? '',
    startAddress: overrides.startAddress ?? '',
    endAddress: overrides.endAddress ?? '',
    endUnit: overrides.endUnit ?? '',
    distance: overrides.distance ?? 0,
    startOdometer: overrides.startOdometer ?? 0,
    endOdometer: overrides.endOdometer ?? 0,
    pay: overrides.pay ?? 0,
    tip: overrides.tip ?? 0,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 0,
    type: overrides.type ?? 'Pickup',
    orderNumber: overrides.orderNumber ?? '',
    note: overrides.note ?? '',
    exclude: overrides.exclude ?? false,
    amountPerDistance: overrides.amountPerDistance ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0,
    action: overrides.action ?? '',
    actionTime: overrides.actionTime ?? 0,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
  });

  describe('compareShifts', () => {
    it('returns true for matching shifts', () => {
      const s1 = makeShift({ date: '2024-01-01', service: 'Uber', number: 1 });
      const s2 = makeShift({ date: '2024-01-01', service: 'Uber', number: 1 });
      
      expect(ShiftHelper.compareShifts(s1, s2)).toBeTrue();
    });

    it('returns false for different dates', () => {
      const s1 = makeShift({ date: '2024-01-01' });
      const s2 = makeShift({ date: '2024-01-02' });
      
      expect(ShiftHelper.compareShifts(s1, s2)).toBeFalse();
    });

    it('returns false for different services', () => {
      const s1 = makeShift({ service: 'Uber' });
      const s2 = makeShift({ service: 'Lyft' });
      
      expect(ShiftHelper.compareShifts(s1, s2)).toBeFalse();
    });

    it('returns false for different numbers', () => {
      const s1 = makeShift({ number: 1 });
      const s2 = makeShift({ number: 2 });
      
      expect(ShiftHelper.compareShifts(s1, s2)).toBeFalse();
    });
  });

  describe('getUniqueShifts', () => {
    it('removes duplicate shifts', () => {
      const shifts = [
        makeShift({ date: '2024-01-01', service: 'Uber', number: 1 }),
        makeShift({ date: '2024-01-01', service: 'Uber', number: 1 }),
        makeShift({ date: '2024-01-01', service: 'Lyft', number: 1 }),
      ];
      
      const unique = ShiftHelper.getUniqueShifts(shifts);
      
      expect(unique.length).toBe(2);
    });

    it('handles empty array', () => {
      const unique = ShiftHelper.getUniqueShifts([]);
      
      expect(unique.length).toBe(0);
    });

    it('preserves all unique shifts', () => {
      const shifts = [
        makeShift({ date: '2024-01-01', service: 'Uber', number: 1 }),
        makeShift({ date: '2024-01-01', service: 'Uber', number: 2 }),
        makeShift({ date: '2024-01-02', service: 'Uber', number: 1 }),
      ];
      
      const unique = ShiftHelper.getUniqueShifts(shifts);
      
      expect(unique.length).toBe(3);
    });
  });

  describe('getNextShiftNumber', () => {
    it('returns 1 for first shift of a service', () => {
      const shifts = [makeShift({ service: 'Lyft', number: 1 })];
      
      const next = ShiftHelper.getNextShiftNumber('Uber', shifts);
      
      expect(next).toBe(1);
    });

    it('returns next number for existing service', () => {
      const shifts = [
        makeShift({ service: 'Uber', number: 1 }),
        makeShift({ service: 'Uber', number: 2 }),
      ];
      
      const next = ShiftHelper.getNextShiftNumber('Uber', shifts);
      
      expect(next).toBe(3);
    });

    it('returns 1 for empty shifts array', () => {
      const next = ShiftHelper.getNextShiftNumber('Uber', []);
      
      expect(next).toBe(1);
    });

    it('handles duplicates correctly', () => {
      const shifts = [
        makeShift({ date: '2024-01-01', service: 'Uber', number: 2 }),
        makeShift({ date: '2024-01-01', service: 'Uber', number: 2 }),
      ];
      
      const next = ShiftHelper.getNextShiftNumber('Uber', shifts);
      
      expect(next).toBe(3);
    });
  });

  describe('createNewShift', () => {
    it('creates shift with correct service', () => {
      spyOn(DateHelper, 'getDays').and.returnValue(123);
      spyOn(DateHelper, 'toISO').and.returnValue('2024-01-01');
      spyOn(DateHelper, 'getDateFromDays').and.returnValue(new Date('2024-01-01'));
      
      const shift = ShiftHelper.createNewShift('Uber', []);
      
      expect(shift.service).toBe('Uber');
      expect(shift.number).toBe(1);
      expect(shift.key).toBe('123-1-Uber');
      expect(shift.action).toBe(ActionEnum.Add);
    });

    it('uses next shift number', () => {
      spyOn(DateHelper, 'getDays').and.returnValue(123);
      spyOn(DateHelper, 'toISO').and.returnValue('2024-01-01');
      spyOn(DateHelper, 'getDateFromDays').and.returnValue(new Date('2024-01-01'));
      
      const existing = [makeShift({ service: 'Uber', number: 2 })];
      const shift = ShiftHelper.createNewShift('Uber', existing);
      
      expect(shift.number).toBe(3);
      expect(shift.key).toBe('123-3-Uber');
    });
  });

  describe('createShiftFromTrip', () => {
    it('creates shift with trip properties', () => {
      const trip = makeTrip({
        key: '2024-01-01_2',
        date: '2024-01-01',
        service: 'Lyft',
        number: 2,
        region: 'Suburbs',
        pickupTime: '09:30:00',
      });
      
      const shift = ShiftHelper.createShiftFromTrip(trip);
      
      expect(shift.key).toBe('2024-01-01_2');
      expect(shift.date).toBe('2024-01-01');
      expect(shift.service).toBe('Lyft');
      expect(shift.number).toBe(2);
      expect(shift.region).toBe('Suburbs');
      expect(shift.start).toBe('09:30:00');
      expect(shift.total).toBe(0);
      expect(shift.action).toBe(ActionEnum.Add);
    });

    it('handles trip without pickupTime', () => {
      const trip = makeTrip({ pickupTime: '' });
      
      const shift = ShiftHelper.createShiftFromTrip(trip);
      
      expect(shift.start).toBe('');
    });
  });

  describe('removeDuplicateShifts', () => {
    it('removes shifts with duplicate keys', () => {
      const shifts = [
        makeShift({ key: 'k1', date: '2024-01-01' }),
        makeShift({ key: 'k1', date: '2024-01-02' }),
        makeShift({ key: 'k2', date: '2024-01-01' }),
      ];
      
      const result = ShiftHelper.removeDuplicateShifts(shifts);
      
      expect(result.length).toBe(2);
      expect(result[0].key).toBe('k1');
      expect(result[1].key).toBe('k2');
    });

    it('handles empty array', () => {
      const result = ShiftHelper.removeDuplicateShifts([]);
      
      expect(result.length).toBe(0);
    });

    it('preserves all unique keys', () => {
      const shifts = [
        makeShift({ key: 'k1' }),
        makeShift({ key: 'k2' }),
        makeShift({ key: 'k3' }),
      ];
      
      const result = ShiftHelper.removeDuplicateShifts(shifts);
      
      expect(result.length).toBe(3);
    });
  });

  describe('getTodaysShifts', () => {
    it('returns empty when no shifts are tracked internally', () => {
      spyOn(DateHelper, 'toISO').and.callThrough();

      const result = ShiftHelper.getTodaysShifts();

      expect(result.length).toBe(0);
    });
  });
});
