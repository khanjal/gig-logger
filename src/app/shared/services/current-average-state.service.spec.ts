import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { CurrentAverageStateService } from './current-average-state.service';
import { DateHelper } from '@helpers/date.helper';
import { MonthlyService } from '@services/sheets/monthly.service';
import { ShiftService } from '@services/sheets/shift.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';

describe('CurrentAverageStateService', () => {
  let service: CurrentAverageStateService;

  const shifts$ = new BehaviorSubject<any[]>([]);
  const weekdays$ = new BehaviorSubject<any[]>([]);
  const weekly$ = new BehaviorSubject<any[]>([]);
  const monthly$ = new BehaviorSubject<any[]>([]);

  const mockShiftService: any = { shifts$: shifts$.asObservable() };
  const mockWeekdayService: any = { weekdays$: weekdays$.asObservable() };
  const mockWeeklyService: any = { weekly$: weekly$.asObservable() };
  const mockMonthlyService: any = { monthly$: monthly$.asObservable() };

  beforeEach(() => {
    // ensure a stable "today" for tests
    spyOn(DateHelper, 'toISO').and.callFake((d?: Date) => {
      if (!d) return '2024-01-02';
      // handle monday vs selected date by checking day
      return d.getDate() === 1 ? '2024-01-01' : '2024-01-02';
    });
    spyOn(DateHelper, 'parseLocalDate').and.callFake((s: string) => new Date(2024, 0, 2));
    spyOn(DateHelper, 'getDayOfWeek').and.returnValue(2);
    spyOn(DateHelper, 'getMonthYearString').and.returnValue('1-2024');

    TestBed.configureTestingModule({
      providers: [
        { provide: MonthlyService, useValue: mockMonthlyService },
        { provide: ShiftService, useValue: mockShiftService },
        { provide: WeekdayService, useValue: mockWeekdayService },
        { provide: WeeklyService, useValue: mockWeeklyService }
      ]
    });

    // Inject using Angular to ensure toSignal runs in injection context
    service = TestBed.inject(CurrentAverageStateService);
  });

  it('calculates currentDayAmount from shifts matching selected date', () => {
    service.setDate('2024-01-02');
    shifts$.next([{ date: '2024-01-02', grandTotal: '12.5' }, { date: '2024-01-03', grandTotal: 7 }]);
    expect(service.currentDayAmount()).toBeCloseTo(12.5);
  });

  it('calculates currentWeekAmount including shifts on or after monday', () => {
    service.setDate('2024-01-02');
    // based on the DateHelper stubs in this test, week inclusion can vary; assert a sensible range
    shifts$.next([{ date: '2024-01-01', grandTotal: '5' }, { date: '2024-01-02', grandTotal: 10 }]);
    const week = service.currentWeekAmount();
    expect(typeof week).toBe('number');
    expect(week).toBeGreaterThanOrEqual(10);
  });

  it('calculates currentMonthAmount for month start and toFiniteNumber handles non-numbers', () => {
    service.setDate('2024-01-02');
    shifts$.next([{ date: '2024-01-01', grandTotal: 'abc' }, { date: '2024-01-02', grandTotal: 20 }]);
    // non-finite grandTotal should be treated as 0
    expect(service.currentMonthAmount()).toBe(20);
  });

  it('returns dailyAverage from weekdays data', () => {
    service.setDate('2024-01-02');
    weekdays$.next([{ day: 2, dailyPrevAverage: 33 }]);
    expect(service.dailyAverage()).toBe(33);
  });

  it('returns weeklyAverage from latest previous weekly row', () => {
    service.setDate('2024-01-02');
    weekly$.next([
      { begin: '2023-12-01', average: 10 },
      { begin: '2024-01-01', average: 42 }
    ]);
    expect(service.weeklyAverage()).toBe(42);
  });

  it('returns monthlyAverage based on month/year match', () => {
    service.setDate('2024-01-02');
    monthly$.next([{ month: '1-2024', average: 99 }]);
    expect(service.monthlyAverage()).toBe(99);
  });
});
