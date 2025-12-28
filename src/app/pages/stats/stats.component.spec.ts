import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { StatsComponent } from './stats.component';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { DailyService } from '@services/sheets/daily.service';
import { commonTestingImports, commonTestingProviders, createShiftServiceMock, createTripServiceMock } from '../../../test-harness';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  const dailySubject = new BehaviorSubject([]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, StatsComponent],
      providers: [
        ...commonTestingProviders,
        { provide: ShiftService, useValue: createShiftServiceMock() },
        { provide: TripService, useValue: createTripServiceMock() },
        { provide: DailyService, useValue: { daily$: dailySubject.asObservable() } }
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
