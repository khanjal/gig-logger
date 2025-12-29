import { DiagnosticHelper } from './diagnostic.helper';
import { ITrip } from '@interfaces/trip.interface';
import { IShift } from '@interfaces/shift.interface';
import { IPlace } from '@interfaces/place.interface';
import { IDuplicateGroup } from '@interfaces/diagnostic.interface';

describe('DiagnosticHelper', () => {
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
    dropoffTime: overrides.dropoffTime ?? '',
    duration: overrides.duration ?? '',
    name: overrides.name ?? '',
    note: overrides.note ?? '',
    number: overrides.number ?? 1,
    orderNumber: overrides.orderNumber ?? '',
    pickupTime: overrides.pickupTime ?? '',
    place: overrides.place ?? '',
    region: overrides.region ?? '',
    service: overrides.service ?? '',
    startAddress: overrides.startAddress ?? '',
    startOdometer: overrides.startOdometer ?? 0,
    type: overrides.type ?? '',
    amountPerDistance: overrides.amountPerDistance ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0,
    pay: overrides.pay ?? 0,
    tip: overrides.tip ?? 0,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 0,
  });

  const makeShift = (overrides: Partial<IShift> = {}): IShift => ({
    key: overrides.key ?? 'k1',
    region: overrides.region ?? '',
    service: overrides.service ?? '',
    start: overrides.start ?? '',
    finish: overrides.finish ?? '',
    time: overrides.time ?? '',
  } as IShift);

  const makePlace = (overrides: Partial<IPlace> = {}): IPlace => ({
    place: overrides.place ?? 'Store A',
    lastTrip: overrides.lastTrip ?? '',
    addresses: overrides.addresses ?? [],
  } as IPlace);

  it('finds orphaned trips without matching shifts and not excluded', () => {
    const trips = [
      makeTrip({ key: 'shift-1' }),
      makeTrip({ key: 'missing', id: 2 }),
      makeTrip({ key: 'missing-excluded', id: 3, exclude: true }),
    ];
    const shifts = [makeShift({ key: 'shift-1' })];

    const result = DiagnosticHelper.findOrphanedTrips(trips, shifts);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  it('finds shifts with times but missing duration', () => {
    const shifts = [
      makeShift({ start: '10:00', finish: '11:00', time: '' }),
      makeShift({ start: '', finish: '', time: '' }),
    ];

    const result = DiagnosticHelper.findShiftsWithoutDuration(shifts);

    expect(result.length).toBe(1);
    expect(result[0].start).toBe('10:00');
  });

  it('finds trips with pickup/dropoff but missing duration', () => {
    const trips = [
      makeTrip({ pickupTime: '10:00', dropoffTime: '10:20', duration: '' }),
      makeTrip({ pickupTime: '', dropoffTime: '', duration: '' }),
    ];

    const result = DiagnosticHelper.findTripsWithoutDuration(trips);

    expect(result.length).toBe(1);
    expect(result[0].pickupTime).toBe('10:00');
  });

  it('throws when selectedAddress is invalid', () => {
    const trips = [makeTrip({ place: 'Store A', startAddress: '' })];
    const places = [makePlace({ place: 'Store A' })];

    expect(() => DiagnosticHelper.findTripsWithPlaceNoAddress(trips, places, null as any))
      .toThrowError('selectedAddress parameter must be a valid object');
  });

  it('auto-selects address when only one available', () => {
    const trips = [makeTrip({ rowId: 5, place: 'Store A', startAddress: '' })];
    const places = [makePlace({ place: 'Store A', addresses: [{ address: '123 Main', lastTrip: '' }] })];
    const selected: Record<number, string> = {};

    const result = DiagnosticHelper.findTripsWithPlaceNoAddress(trips, places, selected);

    expect(result[0].availableAddresses).toEqual(['123 Main']);
    expect(selected[5]).toBe('123 Main');
  });

  it('merges duplicate groups without duplication', () => {
    const primary: IDuplicateGroup<any>[] = [
      { items: [{ id: 1 }, { id: 2 }] },
    ];
    const secondary: IDuplicateGroup<any>[] = [
      { items: [{ id: 2 }, { id: 1 }] },
      { items: [{ id: 3 }] },
    ];

    const result = DiagnosticHelper.mergeDuplicateGroups(primary, secondary);

    expect(result.groups.length).toBe(2);
    expect(result.items.length).toBe(3);
  });

  it('matches addresses ignoring store prefix and country', () => {
    const comparator = DiagnosticHelper.createAddressComparator();
    const a = 'Target, 123 Main St, Springfield, IL';
    const b = '123 Main St, Springfield, IL, USA';

    expect(comparator(a, b)).toBeTrue();
  });

  it('fails address match when city/state differ', () => {
    const comparator = DiagnosticHelper.createAddressComparator();
    const a = '123 Main St, Springfield, IL';
    const b = '123 Main St, Shelbyville, IL';

    expect(comparator(a, b)).toBeFalse();
  });
});
