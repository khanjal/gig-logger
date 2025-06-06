import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsTableGroupComponent } from './trips-table-group.component';
import { DailyService } from '@services/sheets/daily.service';
import { TripService } from '@services/sheets/trip.service';
import { WeekdayService } from '@services/sheets/weekday.service';

describe('TripsTableGroupComponent', () => {
  let component: TripsTableGroupComponent;
  let fixture: ComponentFixture<TripsTableGroupComponent>;
  const mockDailyService = jasmine.createSpyObj("DailyService", ["queryDaily"]);
  const mockTripService = jasmine.createSpyObj("TripService", ["getRemoteTripsPreviousDays"]);
  const mockWeekdayService = jasmine.createSpyObj("WeekdayService", ["queryWeekdays"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TripsTableGroupComponent],
    providers: [
        { provide: DailyService, useValue: mockDailyService },
        { provide: TripService, useValue: mockTripService },
        { provide: WeekdayService, useValue: mockWeekdayService }
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(TripsTableGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
