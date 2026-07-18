import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShiftTripsTableComponent } from './shift-trips-table.component';
import type { ITrip } from '@interfaces/entities/trip.interface';

describe('ShiftTripsTableComponent trackByTrip', () => {
  it('returns id when present', () => {
    const t = { id: 'xyz', rowId: 1 } as unknown as ITrip;
    const res = ShiftTripsTableComponent.prototype.trackByTrip.call(null, 0, t);
    expect(res as unknown).toBe('xyz');
  });

  it('returns rowId when id absent', () => {
    const t = { rowId: 99 } as unknown as ITrip;
    const res = ShiftTripsTableComponent.prototype.trackByTrip.call(null, 1, t);
    expect(res).toBe(99);
  });

  it('falls back to index', () => {
    const t = {} as unknown as ITrip;
    const res = ShiftTripsTableComponent.prototype.trackByTrip.call(null, 3, t);
    expect(res).toBe(3);
  });
});

describe('ShiftTripsTableComponent', () => {
  let component: ShiftTripsTableComponent;
  let fixture: ComponentFixture<ShiftTripsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftTripsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftTripsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
