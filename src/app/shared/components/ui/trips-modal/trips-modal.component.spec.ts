import { TripsModalComponent } from './trips-modal.component';

describe('TripsModalComponent trackByTrip', () => {
  it('returns rowId when present', () => {
    const trip = { rowId: 77 } as any;
    const res = (TripsModalComponent.prototype as any).trackByTrip.call(null, 0, trip);
    expect(res).toBe(77);
  });

  it('returns id when rowId absent', () => {
    const trip = { id: 11 } as any;
    const res = (TripsModalComponent.prototype as any).trackByTrip.call(null, 2, trip);
    expect(res).toBe(11);
  });

  it('falls back to index', () => {
    const trip = {} as any;
    const res = (TripsModalComponent.prototype as any).trackByTrip.call(null, 6, trip);
    expect(res).toBe(6);
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
