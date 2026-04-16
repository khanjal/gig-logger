import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentAverageComponent } from './current-average.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MonthlyService } from '@services/sheets/monthly.service';
import { ShiftService } from '@services/sheets/shift.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';

describe('CurrentAverageComponent', () => {
  let component: CurrentAverageComponent;
  let fixture: ComponentFixture<CurrentAverageComponent>;
  const mockMonthlyService = jasmine.createSpyObj('MonthlyService', ['find']);
  const mockShiftService = jasmine.createSpyObj('ShiftService', ['query', 'getShiftsByStartDate']);
  const mockWeekdayService = jasmine.createSpyObj('WeekdayService', ['query']);
  const mockWeeklyService = jasmine.createSpyObj("WeeklyService", ["getLastWeekFromDay"]);

  beforeEach(async () => {
    mockShiftService.query.and.resolveTo([] as any);
    mockShiftService.getShiftsByStartDate.and.resolveTo([] as any);
    mockWeekdayService.query.and.resolveTo([] as any);
    mockWeeklyService.getLastWeekFromDay.and.resolveTo(undefined as any);
    mockMonthlyService.find.and.resolveTo(undefined as any);

    await TestBed.configureTestingModule({
    imports: [MatSnackBarModule, CurrentAverageComponent],
    providers: [
        { provide: MonthlyService, useValue: mockMonthlyService },
        { provide: ShiftService, useValue: mockShiftService },
        { provide: WeekdayService, useValue: mockWeekdayService },
        { provide: WeeklyService, useValue: mockWeeklyService }
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(CurrentAverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('normalizes invalid numeric values to zero when loading averages', async () => {
    mockShiftService.query.and.resolveTo([{ grandTotal: undefined }] as any);
    mockShiftService.getShiftsByStartDate.and.resolveTo([{ grandTotal: 'bad' }] as any);
    mockWeekdayService.query.and.resolveTo([{ dailyPrevAverage: NaN }] as any);
    mockWeeklyService.getLastWeekFromDay.and.resolveTo({ average: 'bad' } as any);
    mockMonthlyService.find.and.resolveTo({ average: undefined } as any);

    await component.load();

    expect(component.currentDayAmount).toBe(0);
    expect(component.currentWeekAmount).toBe(0);
    expect(component.currentMonthAmount).toBe(0);
    expect(component.dailyAverage).toBe(0);
    expect(component.weeklyAverage).toBe(0);
    expect(component.monthlyAverage).toBe(0);
  });
});
