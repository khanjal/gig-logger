import { SheetSerializerHelper } from './sheet-serializer.helper';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IShift } from '@interfaces/entities/shift.interface';

describe('SheetSerializerHelper', () => {
  it('converts zero input fields to null for a trip and preserves calculated fields', () => {
    const trip = {
      id: 1,
      pay: 0,
      tip: 0,
      bonus: 5,
      cash: 0,
      distance: 0,
      startOdometer: 1200,
      endOdometer: 0,
      total: 100, // calculated
      amountPerDistance: 2, // calculated
      amountPerTime: 0 // calculated - intentionally zero but preserved
    } as unknown as ITrip;

    const serialized = SheetSerializerHelper.serializeTrip(trip);

    expect(serialized.pay).toBeNull();
    expect(serialized.tip).toBeNull();
    expect(serialized.bonus).toBe(5);
    expect(serialized.cash).toBeNull();
    expect(serialized.distance).toBeNull();
    expect(serialized.startOdometer).toBe(1200);
    expect(serialized.endOdometer).toBeNull();
    // Calculated fields unchanged
    expect(serialized.total).toBe(100);
    expect(serialized.amountPerDistance).toBe(2);
    expect(serialized.amountPerTime).toBe(0);
  });

  it('serializes arrays of trips', () => {
    const trips = [
      { id: 1, pay: 0, tip: 1 } as unknown as ITrip,
      { id: 2, pay: 3, tip: 0 } as unknown as ITrip
    ];

    const out = SheetSerializerHelper.serializeTrips(trips);
    expect(out.length).toBe(2);
    expect(out[0].pay).toBeNull();
    expect(out[0].tip).toBe(1);
    expect(out[1].pay).toBe(3);
    expect(out[1].tip).toBeNull();
  });

  it('converts zero input fields to null for a shift and serializes shifts array', () => {
    const shift = {
      id: 1,
      pay: 0,
      tip: 2,
      bonus: 0,
      cash: 0,
      total: 50
    } as unknown as IShift;

    const s = SheetSerializerHelper.serializeShift(shift);
    expect(s.pay).toBeNull();
    expect(s.tip).toBe(2);
    expect(s.bonus).toBeNull();
    expect(s.cash).toBeNull();

    const arr = SheetSerializerHelper.serializeShifts([shift, { id: 2, pay: 10, tip: 0 } as unknown as IShift]);
    expect(arr.length).toBe(2);
    expect(arr[0].pay).toBeNull();
    expect(arr[1].tip).toBeNull();
  });
});

describe('SheetSerializerHelper - Tags pass-through', () => {
  // RaptorSheets 5.0.x added a Tags column to Trips and Shifts, and the backend serializes it as
  // `tags` (camelCase policy, no JsonPropertyName override). The frontend has no tags concept yet,
  // so nothing here declares the field - these tests pin that a value typed directly into the
  // sheet still survives an app-side edit rather than being silently wiped on save.
  it('preserves an undeclared tags field on a trip', () => {
    const trip = {
      id: 1,
      pay: 5,
      tags: 'rain, surge, airport'
    } as unknown as ITrip;

    const serialized = SheetSerializerHelper.serializeTrip(trip) as unknown as Record<string, unknown>;

    expect(serialized['tags']).toBe('rain, surge, airport');
  });

  it('preserves an undeclared tags field on a shift', () => {
    const shift = {
      id: 1,
      pay: 5,
      tags: 'weekend, double'
    } as unknown as IShift;

    const serialized = SheetSerializerHelper.serializeShift(shift) as unknown as Record<string, unknown>;

    expect(serialized['tags']).toBe('weekend, double');
  });

  it('does not invent a tags field when the sheet has none', () => {
    const trip = { id: 1, pay: 5 } as unknown as ITrip;

    const serialized = SheetSerializerHelper.serializeTrip(trip) as unknown as Record<string, unknown>;

    expect('tags' in serialized).toBeFalse();
  });
});
