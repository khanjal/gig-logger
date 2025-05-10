import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsComponent } from './stats.component';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  const mockShiftService = jasmine.createSpyObj("ShiftService", ["getRemoteShiftsBetweenDates"]);
  const mockTripService = jasmine.createSpyObj("TripService", ["getRemoteTripsBetweenDates"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [StatsComponent],
    providers: [
        { provide: ShiftService, useValue: mockShiftService },
        { provide: TripService, useValue: mockTripService },
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
