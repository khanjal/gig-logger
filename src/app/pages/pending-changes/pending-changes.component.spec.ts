import { PendingChangesComponent } from './pending-changes.component';

describe('PendingChangesComponent trackBy helpers', () => {
  it('trackByShift returns rowId when present', () => {
    const s = { rowId: 42 } as any;
    const res = (PendingChangesComponent.prototype as any).trackByShift.call(null, 0, s);
    expect(res).toBe(42);
  });

  it('trackByShift returns key when rowId absent', () => {
    const s = { key: 'k1' } as any;
    const res = (PendingChangesComponent.prototype as any).trackByShift.call(null, 1, s);
    expect(res).toBe('k1');
  });

  it('trackByShift falls back to index', () => {
    const s = {} as any;
    const res = (PendingChangesComponent.prototype as any).trackByShift.call(null, 7, s);
    expect(res).toBe(7);
  });

  it('trackByTrip returns rowId when present', () => {
    const t = { rowId: 100 } as any;
    const res = (PendingChangesComponent.prototype as any).trackByTrip.call(null, 0, t);
    expect(res).toBe(100);
  });

  it('trackByTrip returns key when rowId absent', () => {
    const t = { key: 'trip-key' } as any;
    const res = (PendingChangesComponent.prototype as any).trackByTrip.call(null, 2, t);
    expect(res).toBe('trip-key');
  });

  it('trackByTrip falls back to index', () => {
    const t = {} as any;
    const res = (PendingChangesComponent.prototype as any).trackByTrip.call(null, 9, t);
    expect(res).toBe(9);
  });
});
