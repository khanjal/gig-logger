import { TestBed } from '@angular/core/testing';
import { MetricsComponent } from './metrics.component';
import { ShiftService } from '@services/sheets/shift.service';
import { ThemeService } from '@services/theme.service';
import { BehaviorSubject } from 'rxjs';

describe('MetricsComponent', () => {
  let component: MetricsComponent;
  let shiftSpy: any;
  let themeSpy: any;

  beforeEach(async () => {
    shiftSpy = jasmine.createSpyObj('ShiftService', ['getShiftsBetweenDates'], { shifts$: new BehaviorSubject<any[]>([]) });
    shiftSpy.getShiftsBetweenDates.and.returnValue(Promise.resolve([]));

    themeSpy = jasmine.createSpyObj('ThemeService', ['activeTheme$'], { activeTheme: 'light', activeTheme$: new BehaviorSubject('light').asObservable() });

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
    expect((component as any).getTextColor()).toBe('#e5e7eb');
    expect((component as any).getGridColor()).toBe('#374151');

    (component as any).themeService = { activeTheme: 'light' } as any;
    expect((component as any).getTextColor()).toBe('#222');
    expect((component as any).getGridColor()).toBe('#eee');
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
});

