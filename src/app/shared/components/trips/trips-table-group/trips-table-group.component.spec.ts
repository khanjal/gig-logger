import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsTableGroupComponent } from './trips-table-group.component';
import { TripService } from '@services/sheets/trip.service';
import { WeekdayService } from '@services/sheets/weekday.service';

describe('TripsTableGroupComponent', () => {
  let component: TripsTableGroupComponent;
  let fixture: ComponentFixture<TripsTableGroupComponent>;
  const mockTripService = jasmine.createSpyObj("TripService", ["getPreviousDays"]);
  const mockWeekdayService = jasmine.createSpyObj("WeekdayService", ["query"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TripsTableGroupComponent],
    providers: [
        { provide: TripService, useValue: mockTripService },
        { provide: WeekdayService, useValue: mockWeekdayService }
    ]
})
    .compileComponents();

    mockTripService.getPreviousDays.and.returnValue(Promise.resolve([]));
    mockWeekdayService.query.and.returnValue(Promise.resolve([]));

    fixture = TestBed.createComponent(TripsTableGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
