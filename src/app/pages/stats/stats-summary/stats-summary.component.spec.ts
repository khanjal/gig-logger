import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { StatsSummaryComponent } from './stats-summary.component';
import { ITrip } from '@interfaces/trip.interface';
import { IDaily } from '@interfaces/daily.interface';
import { BehaviorSubject } from 'rxjs';
import { DailyService } from '@services/sheets/daily.service';
import { commonTestingImports, commonTestingProviders, createDialogSpy } from '../../../../test-harness';

describe('StatsSummaryComponent', () => {
  let component: StatsSummaryComponent;
  let fixture: ComponentFixture<StatsSummaryComponent>;
  let dialogSpy: MatDialog;
  let dailySubject: BehaviorSubject<IDaily[]>;

  const trips: ITrip[] = [
    { pay: 10, bonus: 0, tip: 2, total: 12, distance: 3, date: '2023-01-01', cash: 0 } as unknown as ITrip,
    { pay: 0, bonus: 0, tip: 0, total: 0, distance: 0, date: '2023-01-02', cash: 5 } as unknown as ITrip,
    { pay: 20, bonus: 5, tip: 3, total: 28, distance: 4, date: '2023-01-03', cash: 0 } as unknown as ITrip
  ];

  const dailyData: IDaily[] = [
    { date: '2023-01-01', weekday: 'Sunday', trips: 5, total: 100, amountPerTime: 20 } as unknown as IDaily,
    { date: '2023-01-03', weekday: 'Tuesday', trips: 3, total: 90, amountPerTime: 15 } as unknown as IDaily
  ];

  beforeEach(async () => {
    dialogSpy = createDialogSpy() as unknown as MatDialog;
    dailySubject = new BehaviorSubject<IDaily[]>(dailyData);

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, StatsSummaryComponent],
      providers: [
        ...commonTestingProviders,
        { provide: MatDialog, useValue: dialogSpy },
        { provide: DailyService, useValue: { daily$: dailySubject.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatsSummaryComponent);
    component = fixture.componentInstance;
    component.trips = trips;
    component.ngOnInit();
    component.ngOnChanges({
      trips: { previousValue: [], currentValue: trips, firstChange: true, isFirstChange: () => true }
    });
    fixture.detectChanges();
  });

  it('should calculate core statistics', () => {
    expect(component.totalEarnings).toBe(40);
    expect(component.medianTip).toBe(2);
    expect(component.lowestPay).toBe(10);
    expect(component.shortestTrip).toBe(3);
  });

  it('should build summary cards once inputs change', () => {
    expect(component.summaryCards.length).toBeGreaterThan(0);
  });

  it('should open dialog for highest tip trips', () => {
    expect(() => component.showTripsWithHighestTip()).not.toThrow();
  });
});
