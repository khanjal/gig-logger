import type { ComponentFixture} from '@angular/core/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoggerService } from '@services/logger.service';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { TripComponent } from './trips.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { BehaviorSubject, of } from 'rxjs';
import { PollingService } from '@services/polling.service';
import { ViewportScroller } from '@angular/common';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { DateHelper } from '@helpers/date.helper';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { IExpense } from '@interfaces/entities/expense.interface';

describe('TripComponent trackByTrip', () => {
  it('returns rowId when present', () => {
    const trip = { rowId: 123 } as unknown as ITrip;
    const res = TripComponent.prototype.trackByTrip.call(null as unknown as TripComponent, 0, trip);
    expect(res).toBe(123);
  });

  it('returns key when rowId absent', () => {
    const trip = { key: 'abc' } as unknown as ITrip;
    const res = TripComponent.prototype.trackByTrip.call(null as unknown as TripComponent, 1, trip);
    expect(res).toBe('abc');
  });

  it('falls back to index', () => {
    const trip = {} as unknown as ITrip;
    const res = TripComponent.prototype.trackByTrip.call(null as unknown as TripComponent, 7, trip);
    expect(res).toBe(7);
  });
});

describe('TripComponent', () => {
  let component: TripComponent;
  let fixture: ComponentFixture<TripComponent>;
  let trips$: BehaviorSubject<ITrip[]>;
  let shifts$: BehaviorSubject<IShift[]>;
  let expenses$: BehaviorSubject<IExpense[]>;
  const mockGigWorkflowService = jasmine.createSpyObj("GigWorkflowService", ["calculateShiftTotals"]);
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["loadSpreadsheetData", "querySpreadsheets"]);
  let mockShiftService: jasmine.SpyObj<ShiftService>;
  let mockTripService: jasmine.SpyObj<TripService>;
  let mockExpensesService: jasmine.SpyObj<ExpensesService>;

  beforeEach(async () => {
    trips$ = new BehaviorSubject<ITrip[]>([]);
    shifts$ = new BehaviorSubject<IShift[]>([]);
    expenses$ = new BehaviorSubject<IExpense[]>([]);
    mockShiftService = jasmine.createSpyObj("ShiftService", ["getByRowId", "getUnsavedShifts", "getPreviousWeekShifts", "query", "queryShiftByKey"], { shifts$: shifts$.asObservable() });
    mockTripService = jasmine.createSpyObj("TripService", ["getByRowId", "getUnsaved", "query", "getMaxRowId"], { trips$: trips$.asObservable() });
    mockExpensesService = jasmine.createSpyObj('ExpensesService', ['getUnsaved', 'saveUnsaved'], { expenses$: expenses$.asObservable() });
    const mockPollingService = jasmine.createSpyObj(
      'PollingService',
      ['startPolling', 'stopPolling', 'isPollingEnabled'],
      {
        pollingEnabled$: new BehaviorSubject(false).asObservable()
      }
    );
    mockPollingService.isPollingEnabled.and.returnValue(false);
    const viewportSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToAnchor']);
    mockSpreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([]));
    mockTripService.getUnsaved.and.returnValue(Promise.resolve([]));
    mockTripService.query.and.returnValue(Promise.resolve([]));
    mockTripService.getMaxRowId.and.returnValue(Promise.resolve(1));
    mockShiftService.getUnsavedShifts.and.returnValue(Promise.resolve([]));
    mockShiftService.getPreviousWeekShifts.and.returnValue(Promise.resolve([]));
    mockShiftService.query.and.returnValue(Promise.resolve([]));
    mockShiftService.queryShiftByKey.and.returnValue(Promise.resolve(undefined as unknown as IShift));
    mockExpensesService.getUnsaved.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, MatDialogModule, MatSnackBarModule, TripComponent],
      providers: [
        ...commonTestingProviders,
        { provide: GigWorkflowService, useValue: mockGigWorkflowService },
        { provide: SpreadsheetService, useValue: mockSpreadsheetService },
        { provide: ShiftService, useValue: mockShiftService },
        { provide: TripService, useValue: mockTripService },
        { provide: ExpensesService, useValue: mockExpensesService },
        { provide: PollingService, useValue: mockPollingService },
        { provide: ViewportScroller, useValue: viewportSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) },
            paramMap: of(convertToParamMap({}))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles yesterday trips visibility', () => {
    component.showYesterdayTrips.set(false);
    component.toggleYesterdayTrips();
    expect(component.showYesterdayTrips()).toBeTrue();
    component.toggleYesterdayTrips();
    expect(component.showYesterdayTrips()).toBeFalse();
  });

  it('shouldShowUpdateMessage returns correct boolean', () => {
    component.todaysTrips.set([]);
    expect(component.shouldShowUpdateMessage()).toBeTrue();
    component.todaysTrips.set([{ id: 1 } as unknown as ITrip]);
    expect(component.shouldShowUpdateMessage()).toBeFalse();
  });

  it('scrollToTrip scrolls to element when exists and falls back otherwise', () => {
    const el = document.createElement('div');
    el.id = 'mytrip';
    el.style.position = 'absolute';
    el.style.top = '500px';
    // provide numeric offsetTop
    Object.defineProperty(el, 'offsetTop', { value: 500 });
    document.body.appendChild(el);

    spyOn(window, 'scrollTo');
    component.scrollToTrip('mytrip');
    expect(window.scrollTo).toHaveBeenCalled();

    document.body.removeChild(el);
    const viewport = TestBed.inject(ViewportScroller);
    component.scrollToTrip('nonexistent');
    expect(viewport.scrollToAnchor).toHaveBeenCalled();
  });

  it('refreshes demoSheetAttached based on default sheet name format', async () => {
    mockSpreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([
      { id: 'any-id', name: 'RaptorGig Demo - Apr 5, 2026, 5:20 PM', default: 'true', size: 0 }
    ]));

    await component.ngOnInit();
    expect(component.demoSheetAttached()).toBeTrue();

    mockSpreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([
      { id: 'any-id', name: 'Production Sheet', default: 'true', size: 0 }
    ]));

    await component.reload();
    expect(component.demoSheetAttached()).toBeFalse();
  });

  it('reactively derives today and yesterday trip lists from the trip stream', async () => {
    await component.ngOnInit();

    const today = DateHelper.toISO(DateHelper.getDateFromDays());
    const yesterday = DateHelper.toISO(DateHelper.getDateFromDays(1));

    trips$.next([
      { id: 1, rowId: 4, date: today },
      { id: 2, rowId: 8, date: today },
      { id: 3, rowId: 2, date: yesterday }
    ] as unknown as ITrip[]);
    await Promise.resolve();

    expect(component.todaysTrips().map(trip => trip.rowId)).toEqual([8, 4]);
    expect(component.yesterdaysTrips().map(trip => trip.rowId)).toEqual([2]);
  });

  it('load shows the spinner immediately and clears it after the transition delay', fakeAsync(() => {
    component.load();
    expect(component.isLoading()).toBeTrue();

    tick(400);
    expect(component.isLoading()).toBeFalse();
    expect(component.hasLoadError()).toBeFalse();
  }));

  it('loadTripForEditing surfaces an error, notifies the user, and redirects on failure', fakeAsync(() => {
    const failure = new Error('boom');
    mockTripService.getByRowId.and.returnValue(Promise.reject(failure));
    const router = TestBed.inject(Router);
    const logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    spyOn(router, 'navigate');

    component.editingTripId.set('5');
    component.loadTripForEditing();
    tick();
    tick(200);

    expect(component.isLoading()).toBeFalse();
    expect(component.hasLoadError()).toBeTrue();
    expect(logger.error).toHaveBeenCalledWith('Error loading trip for editing:', failure);
    expect(router.navigate).toHaveBeenCalledWith(['/trips']);
  }));
});
