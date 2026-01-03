import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsTableBasicComponent } from './trips-table-basic.component';
import { DateHelper } from '@helpers/date.helper';
import { ITrip } from '@interfaces/trip.interface';

describe('TripsTableBasicComponent', () => {
  let component: TripsTableBasicComponent;
  let fixture: ComponentFixture<TripsTableBasicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TripsTableBasicComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TripsTableBasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
    id: overrides.id ?? 1,
    date: overrides.date ?? '2024-01-02T00:00:00Z',
    distance: overrides.distance ?? 0,
    endAddress: overrides.endAddress ?? '123 Main',
    endUnit: overrides.endUnit ?? '',
    endOdometer: overrides.endOdometer ?? 0,
    exclude: overrides.exclude ?? false,
    dropoffTime: overrides.dropoffTime ?? '',
    duration: overrides.duration ?? '',
    key: overrides.key ?? 'k1',
    name: overrides.name ?? 'Driver',
    note: overrides.note ?? '',
    number: overrides.number ?? 1,
    orderNumber: overrides.orderNumber ?? '',
    pickupTime: overrides.pickupTime ?? '',
    place: overrides.place ?? 'Airport',
    region: overrides.region ?? 'Region',
    service: overrides.service ?? 'Uber',
    startAddress: overrides.startAddress ?? 'Start',
    startOdometer: overrides.startOdometer ?? 0,
    type: overrides.type ?? 'trip',
    amountPerDistance: overrides.amountPerDistance ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0,
    pay: overrides.pay ?? 0,
    tip: overrides.tip ?? 0,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 0,
    action: overrides.action ?? '',
    actionTime: overrides.actionTime ?? 0,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
  });

  it('initializes displayed columns and time preference', () => {
    const prefersSpy = spyOn(DateHelper, 'prefers24Hour').and.returnValue(true);

    component.prefers24Hour = false;
    component.displayedColumns = [];

    component.ngOnInit();

    expect(prefersSpy).toHaveBeenCalled();
    expect(component.displayedColumns).toEqual(['date', 'service', 'place', 'tips']);
    expect(component.prefers24Hour).toBeTrue();
  });

  it('detects secondary data presence', () => {
    expect(component.hasSecondaryData(makeTrip({ endUnit: '', note: '' }))).toBeFalse();
    expect(component.hasSecondaryData(makeTrip({ endUnit: '12B', note: '' }))).toBeTrue();
    expect(component.hasSecondaryData(makeTrip({ endUnit: '', note: 'Leave at door' }))).toBeTrue();
  });

  it('renders trips rows and secondary row content', () => {
    component.trips = [
      makeTrip({
        id: 2,
        service: 'Lyft',
        place: 'Downtown',
        tip: 5,
        cash: 1,
        endUnit: '12B',
        note: 'Ring twice',
        date: '2024-02-01T00:00:00Z',
      }),
    ];

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2); // main row + secondary row
    expect(rows[0].textContent).toContain('$6.00');
    expect(rows[1].textContent).toContain('12B');
    expect(rows[1].textContent).toContain('Ring twice');
  });

  it('shows empty state when no trips exist', () => {
    component.trips = [];
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.no-trips-message');
    const table = fixture.nativeElement.querySelector('table');

    expect(message).toBeTruthy();
    expect(message.textContent).toContain('No trips to display');
    expect(table).toBeNull();
  });
});
