import { SheetSerializerHelper } from './sheet-serializer.helper';

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
    } as any;

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
      { id: 1, pay: 0, tip: 1 } as any,
      { id: 2, pay: 3, tip: 0 } as any
    ];

    const out = SheetSerializerHelper.serializeTrips(trips as any);
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
    } as any;

    const s = SheetSerializerHelper.serializeShift(shift);
    expect(s.pay).toBeNull();
    expect(s.tip).toBe(2);
    expect(s.bonus).toBeNull();
    expect(s.cash).toBeNull();

    const arr = SheetSerializerHelper.serializeShifts([shift as any, { id: 2, pay: 10, tip: 0 } as any]);
    expect(arr.length).toBe(2);
    expect(arr[0].pay).toBeNull();
    expect(arr[1].tip).toBeNull();
  });
});
