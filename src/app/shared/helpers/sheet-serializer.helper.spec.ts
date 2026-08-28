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

describe('SheetSerializerHelper - Tags', () => {
  // The sheet stores tags as one comma-delimited text cell (RaptorSheets treats it as opaque and
  // leaves the convention to us); the app models them as an array. These pin the conversion in
  // both directions, including the messy input a person actually types.
  describe('parseTags', () => {
    it('splits a comma-delimited cell', () => {
      expect(SheetSerializerHelper.parseTags('rain, surge, airport')).toEqual(['rain', 'surge', 'airport']);
    });

    it('trims whitespace and drops empty entries', () => {
      expect(SheetSerializerHelper.parseTags(' rain ,, surge , ')).toEqual(['rain', 'surge']);
    });

    it('returns an empty array for an empty or missing cell', () => {
      expect(SheetSerializerHelper.parseTags('')).toEqual([]);
      expect(SheetSerializerHelper.parseTags(undefined)).toEqual([]);
      expect(SheetSerializerHelper.parseTags(null)).toEqual([]);
    });

    it('passes an array through, still cleaning it', () => {
      // Re-loading already-parsed data must not mangle it.
      expect(SheetSerializerHelper.parseTags([' rain ', '', 'surge'])).toEqual(['rain', 'surge']);
    });
  });

  describe('formatTags', () => {
    it('joins tags for the sheet', () => {
      expect(SheetSerializerHelper.formatTags(['rain', 'surge'])).toBe('rain, surge');
    });

    it('writes an empty cell rather than a stray separator', () => {
      expect(SheetSerializerHelper.formatTags([])).toBe('');
      expect(SheetSerializerHelper.formatTags(undefined)).toBe('');
      expect(SheetSerializerHelper.formatTags(null)).toBe('');
    });
  });

  describe('round trip', () => {
    it('survives sheet -> app -> sheet unchanged', () => {
      const fromSheet = { id: 1, pay: 5, tags: 'rain, surge' } as unknown as ITrip;

      const app = SheetSerializerHelper.deserializeTrip(fromSheet);
      expect(app.tags).toEqual(['rain', 'surge']);

      const backToSheet = SheetSerializerHelper.serializeTrip(app);
      expect(backToSheet.tags).toBe('rain, surge');
    });

    it('leaves a trip with no tags as an empty cell, not "undefined"', () => {
      const app = SheetSerializerHelper.deserializeTrip({ id: 1, pay: 5 } as unknown as ITrip);
      expect(app.tags).toEqual([]);
      expect(SheetSerializerHelper.serializeTrip(app).tags).toBe('');
    });

    it('survives the same round trip for a shift', () => {
      const fromSheet = { id: 1, pay: 5, tags: 'weekend, double' } as unknown as IShift;

      const app = SheetSerializerHelper.deserializeShift(fromSheet);
      expect(app.tags).toEqual(['weekend', 'double']);
      expect(SheetSerializerHelper.serializeShift(app).tags).toBe('weekend, double');
    });
  });
});
