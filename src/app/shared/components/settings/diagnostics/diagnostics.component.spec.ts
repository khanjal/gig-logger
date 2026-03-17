import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagnosticsComponent } from './diagnostics.component';

describe('DiagnosticsComponent', () => {
  let component: DiagnosticsComponent;
  let fixture: ComponentFixture<DiagnosticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagnosticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getSeverityIcon and getSeverityColor map correctly', () => {
    expect(component.getSeverityIcon('error')).toBe('error');
    expect(component.getSeverityIcon('warning')).toBe('warning');
    expect(component.getSeverityIcon('info')).toBe('info');

    expect(component.getSeverityColor('error')).toBe('warn');
    expect(component.getSeverityColor('warning')).toBe('accent');
    expect(component.getSeverityColor('info')).toBe('primary');
  });

  it('findDuplicateShifts groups duplicates and returns groups', () => {
    const shifts: any[] = [
      { key: 'k1', rowId: 1 },
      { key: 'k2', rowId: 2 },
      { key: 'k1', rowId: 3 }
    ];
    const res = (component as any).findDuplicateShifts(shifts);
    expect(res.items.length).toBe(2);
    expect(res.groups.length).toBe(1);
    expect(res.groups[0].length).toBe(2);
  });

  it('findOrphanedTrips returns trips that have key not in shifts and not excluded', () => {
    const trips: any[] = [
      { key: 'k1', id: 1, exclude: false },
      { key: 'k2', id: 2, exclude: false },
      { key: 'k3', id: 3, exclude: true }
    ];
    const shifts: any[] = [ { key: 'k1' } ];
    const res = (component as any).findOrphanedTrips(trips, shifts);
    expect(res.length).toBe(1);
    expect(res[0].key).toBe('k2');
  });

  it('findDuplicatePlaces detects casing and partial matches', () => {
    const places = [
      { place: 'Walmart' },
      { place: 'walmart' },
      { place: 'Wal' },
      { place: 'Starbucks' }
    ];
    const res = (component as any).findDuplicatePlaces(places);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.groups.length).toBeGreaterThan(0);
  });

  it('findDuplicateAddresses skips short addresses and groups duplicates correctly', () => {
    const addresses = [
      { address: '123 Main St, Suite 1' },
      { address: '123 Main St' },
      { address: 'X' },
      { address: '456 Oak Ave' }
    ];
    const res = (component as any).findDuplicateAddresses(addresses);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.groups.some((g: any[]) => g.length > 1)).toBeTrue();
  });

  it('findDuplicateNames finds case-insensitive duplicates', () => {
    const names = [ { name: 'John' }, { name: 'john' }, { name: 'Alice' } ];
    const res = (component as any).findDuplicateNames(names);
    expect(res.items.length).toBe(2);
    expect(res.groups.length).toBe(1);
  });

  it('findShiftsWithoutDuration returns shifts with start and finish but no time', () => {
    const shifts = [
      { start: '08:00', finish: '10:00', time: '' },
      { start: '', finish: '', time: '' },
      { start: '09:00', finish: '10:00', time: '01:00' }
    ];
    const res = (component as any).findShiftsWithoutDuration(shifts);
    expect(res.length).toBe(1);
  });

  it('findTripsWithoutDuration returns trips with pickup/dropoff and no duration', () => {
    const trips = [
      { pickupTime: '08:00', dropoffTime: '09:00', duration: '' },
      { pickupTime: '', dropoffTime: '', duration: '' }
    ];
    const res = (component as any).findTripsWithoutDuration(trips);
    expect(res.length).toBe(1);
  });

  it('runDiagnostics populates dataDiagnostics using service lists', async () => {
    const shiftService = (component as any)['_shiftService'];
    const tripService = (component as any)['_tripService'];
    const addressService = (component as any)['_addressService'];
    const placeService = (component as any)['_placeService'];
    const nameService = (component as any)['_nameService'];

    spyOn(shiftService, 'list').and.returnValue(Promise.resolve([
      { key: 'k1', start: '', finish: '', trips: 0, totalTrips: 0 }
    ]));
    spyOn(tripService, 'list').and.returnValue(Promise.resolve([
      { key: 'k-orphan', exclude: false }
    ]));
    spyOn(addressService, 'list').and.returnValue(Promise.resolve([]));
    spyOn(placeService, 'list').and.returnValue(Promise.resolve([]));
    spyOn(nameService, 'list').and.returnValue(Promise.resolve([]));

    await component.runDiagnostics();

    expect(component.dataDiagnostics.length).toBeGreaterThan(0);
    const orphanEntry = component.dataDiagnostics.find(d => d.name === 'Orphaned Trips');
    expect(orphanEntry).toBeDefined();
    expect((orphanEntry as any).count).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('findDuplicatePlaces ignores single-character place names and matches 2-char duplicates', () => {
    const places = [
      { place: 'A' },
      { place: 'Ab' },
      { place: 'ab' }
    ];
    const res = (component as any).findDuplicatePlaces(places);
    expect(res.items.length).toBe(2);
    expect(res.groups.length).toBe(1);
  });

  it('findDuplicateAddresses skips comparisons when first elements differ but second elements match', () => {
    const addresses = [
      { address: 'X, Same' },
      { address: 'Y, Same' },
      { address: '123 Main St' }
    ];
    const res = (component as any).findDuplicateAddresses(addresses);
    expect(res.items.length).toBe(0);
  });
});
