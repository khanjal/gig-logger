import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TripsModalComponent } from './trips-modal.component';
import type { ITrip } from '@interfaces/entities/trip.interface';

describe('TripsModalComponent trackByTrip', () => {
  it('returns rowId when present', () => {
    const trip = { rowId: 77 } as unknown as ITrip;
    const res = TripsModalComponent.prototype.trackByTrip.call(null, 0, trip);
    expect(res).toBe(77);
  });

  it('returns id when rowId absent', () => {
    const trip = { id: 11 } as unknown as ITrip;
    const res = TripsModalComponent.prototype.trackByTrip.call(null, 2, trip);
    expect(res).toBe(11);
  });

  it('falls back to index', () => {
    const trip = {} as unknown as ITrip;
    const res = TripsModalComponent.prototype.trackByTrip.call(null, 6, trip);
    expect(res).toBe(6);
  });
});

describe('TripsModalComponent', () => {
  let component: TripsModalComponent;
  let fixture: ComponentFixture<TripsModalComponent>;
  const dialogRefSpy = { close: jasmine.createSpy('close') };
  const dialogData = { title: 'Test', trips: [] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsModalComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
