import { TestBed } from '@angular/core/testing';
import { MetricsComponent } from './metrics.component';
import { ShiftService } from '@services/sheets/shift.service';
import { ThemeService } from '@services/theme.service';
import type { ResolvedTheme } from '@interfaces/ui/theme.interface';
import type { IShift } from '@interfaces/entities/shift.interface';
import { BehaviorSubject } from 'rxjs';

interface MetricsComponentInternals {
  updateChartColors(): void;
  applyChartData(filtered: IShift[], aggType: 'day' | 'week' | 'month' | 'quarter' | 'year'): void;
}

describe('MetricsComponent', () => {
  let component: MetricsComponent;
  let shiftSpy: jasmine.SpyObj<ShiftService>;
  let themeSpy: jasmine.SpyObj<ThemeService>;
  let shiftSubject: BehaviorSubject<IShift[]>;
  let themeSubject: BehaviorSubject<ResolvedTheme>;

  beforeEach(async () => {
    shiftSubject = new BehaviorSubject<IShift[]>([]);
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
    component['themeService'] = { activeTheme: 'dark' } as ThemeService;
    // Make CSS variable values deterministic in the test environment (avoid hardcoded hex)
    document.documentElement.style.setProperty('--color-text-primary', 'test-dark-text');
    document.documentElement.style.setProperty('--color-border', 'test-dark-border');
    expect(component['getTextColor']()).toBe('test-dark-text');
    expect(component['getGridColor']()).toBe('test-dark-border');

    component['themeService'] = { activeTheme: 'light' } as ThemeService;
    document.documentElement.style.setProperty('--color-text-primary', 'test-light-text');
    document.documentElement.style.setProperty('--color-border', 'test-light-border');
    expect(component['getTextColor']()).toBe('test-light-text');
    expect(component['getGridColor']()).toBe('test-light-border');
  });

  it('updateCharts aggregates simple shift data', () => {
    const sample: IShift[] = [{ date: '2024-01-01', totalTrips: 2, totalDistance: 10, totalPay: 20, totalTips: 5, totalBonus: 0, totalCash: 0 } as IShift];
    component.shifts.set(sample);
    component.updateCharts(sample, 'day');

    expect(component.tripsData().labels && component.tripsData().labels!.length).toBeGreaterThan(0);
    expect((component.tripsData().datasets[0].data as number[])[0]).toBe(2);
    expect((component.distanceData().datasets[0].data as number[])[0]).toBe(10);
    expect((component.payData().datasets[0].data as number[])[0]).toBe(20);
  });

  it('rebuilds chart data when the theme changes', async () => {
    const colorsSpy = spyOn(component as unknown as MetricsComponentInternals, 'updateChartColors');

    themeSubject.next('dark');

    expect(colorsSpy).toHaveBeenCalled();
  });

  it('updates chart colors and refilters when the theme changes', async () => {
    const colorsSpy = spyOn(component as unknown as MetricsComponentInternals, 'updateChartColors').and.callThrough();
    const applyChartSpy = spyOn(component as unknown as MetricsComponentInternals, 'applyChartData');

    themeSubject.next('dark');

    expect(colorsSpy).toHaveBeenCalled();
    expect(applyChartSpy).toHaveBeenCalled();
  });

});

