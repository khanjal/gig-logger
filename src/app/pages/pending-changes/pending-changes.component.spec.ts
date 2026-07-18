import { PendingChangesComponent } from './pending-changes.component';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';

describe('PendingChangesComponent trackBy helpers', () => {
  it('trackByShift returns rowId when present', () => {
    const s = { rowId: 42 } as unknown as IShift;
    const res = PendingChangesComponent.prototype.trackByShift.call(null, 0, s);
    expect(res).toBe(42);
  });

  it('trackByShift returns key when rowId absent', () => {
    const s = { key: 'k1' } as unknown as IShift;
    const res = PendingChangesComponent.prototype.trackByShift.call(null, 1, s);
    expect(res).toBe('k1');
  });

  it('trackByShift falls back to index', () => {
    const s = {} as unknown as IShift;
    const res = PendingChangesComponent.prototype.trackByShift.call(null, 7, s);
    expect(res).toBe(7);
  });

  it('trackByTrip returns rowId when present', () => {
    const t = { rowId: 100 } as unknown as ITrip;
    const res = PendingChangesComponent.prototype.trackByTrip.call(null, 0, t);
    expect(res).toBe(100);
  });

  it('trackByTrip returns key when rowId absent', () => {
    const t = { key: 'trip-key' } as unknown as ITrip;
    const res = PendingChangesComponent.prototype.trackByTrip.call(null, 2, t);
    expect(res).toBe('trip-key');
  });

  it('trackByTrip falls back to index', () => {
    const t = {} as unknown as ITrip;
    const res = PendingChangesComponent.prototype.trackByTrip.call(null, 9, t);
    expect(res).toBe(9);
  });
});
