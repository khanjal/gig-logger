import { TestBed } from '@angular/core/testing';
import { MetricsComponent } from './metrics.component';
import { ShiftService } from '@services/sheets/shift.service';
import { ThemeService } from '@services/theme.service';
import { BehaviorSubject } from 'rxjs';

describe('MetricsComponent', () => {
  let component: MetricsComponent;
  let shiftSpy: any;
  let themeSpy: any;
  let shiftSubject: BehaviorSubject<any[]>;
  let themeSubject: BehaviorSubject<'light' | 'dark'>;

  beforeEach(async () => {
    shiftSubject = new BehaviorSubject<any[]>([]);
    shiftSpy = jasmine.createSpyObj('ShiftService', ['getShiftsBetweenDates'], { shifts$: shiftSubject });
    shiftSpy.getShiftsBetweenDates.and.returnValue(Promise.resolve([]));

    themeSubject = new BehaviorSubject<'light' | 'dark'>('light');
    themeSpy = jasmine.createSpyObj('ThemeService', [], { activeTheme: 'light', activeTheme$: themeSubject.asObservable() });

    await TestBed.configureTestingModule({
      imports: [MetricsComponent],
      providers: [
        { provide: ShiftService, useValue: shiftSpy },
        { provide: ThemeService, useValue: themeSpy }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('returns correct text and grid colors based on theme', () => {
    // Replace injected themeService with a simple mock object to control activeTheme
    (component as any).themeService = { activeTheme: 'dark' } as any;
    // Make CSS variable values deterministic in the test environment (avoid hardcoded hex)
    document.documentElement.style.setProperty('--color-text-primary', 'test-dark-text');
    document.documentElement.style.setProperty('--color-border', 'test-dark-border');
    expect((component as any).getTextColor()).toBe('test-dark-text');
    expect((component as any).getGridColor()).toBe('test-dark-border');

    (component as any).themeService = { activeTheme: 'light' } as any;
    document.documentElement.style.setProperty('--color-text-primary', 'test-light-text');
    document.documentElement.style.setProperty('--color-border', 'test-light-border');
    expect((component as any).getTextColor()).toBe('test-light-text');
    expect((component as any).getGridColor()).toBe('test-light-border');
  });

  it('updateCharts aggregates simple shift data', () => {
    const sample = [{ date: '2024-01-01', totalTrips: 2, totalDistance: 10, totalPay: 20, totalTips: 5, totalBonus: 0, totalCash: 0 }];
    component.shifts = sample as any;
    component.updateCharts(sample as any, 'day');

    expect(component.tripsData.labels && component.tripsData.labels.length).toBeGreaterThan(0);
    expect((component.tripsData.datasets[0].data as number[])[0]).toBe(2);
    expect((component.distanceData.datasets[0].data as number[])[0]).toBe(10);
    expect((component.payData.datasets[0].data as number[])[0]).toBe(20);
  });

  it('rebuilds chart data when the theme changes', async () => {
    const filterSpy = spyOn(component, 'filterByDate').and.returnValue(Promise.resolve());

    themeSubject.next('dark');

    expect(filterSpy).toHaveBeenCalled();
  });

  it('updates chart colors and refilters when the theme changes', async () => {
    const colorsSpy = spyOn<any>(component as any, 'updateChartColors').and.callThrough();
    const filterSpy = spyOn(component, 'filterByDate').and.returnValue(Promise.resolve());

    themeSubject.next('dark');

    expect(colorsSpy).toHaveBeenCalled();
    expect(filterSpy).toHaveBeenCalled();
  });

});

