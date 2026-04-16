import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { TripComponent } from './trips.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { PollingService } from '@services/polling.service';
import { ViewportScroller } from '@angular/common';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

describe('TripComponent', () => {
  let component: TripComponent;
  let fixture: ComponentFixture<TripComponent>;
  let trips$: BehaviorSubject<any[]>;
  let shifts$: BehaviorSubject<any[]>;
  let expenses$: BehaviorSubject<any[]>;
  const mockGigWorkflowService = jasmine.createSpyObj("GigWorkflowService", ["calculateShiftTotals"]);
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["loadSpreadsheetData", "querySpreadsheets"]);
  let mockShiftService: jasmine.SpyObj<ShiftService>;
  let mockTripService: jasmine.SpyObj<TripService>;
  let mockExpensesService: jasmine.SpyObj<ExpensesService>;

  beforeEach(async () => {
    trips$ = new BehaviorSubject<any[]>([]);
    shifts$ = new BehaviorSubject<any[]>([]);
    expenses$ = new BehaviorSubject<any[]>([]);
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
    mockSpreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([] as any));
    mockTripService.getUnsaved.and.returnValue(Promise.resolve([] as any));
    mockTripService.query.and.returnValue(Promise.resolve([] as any));
    mockTripService.getMaxRowId.and.returnValue(Promise.resolve(1));
    mockShiftService.getUnsavedShifts.and.returnValue(Promise.resolve([] as any));
    mockShiftService.getPreviousWeekShifts.and.returnValue(Promise.resolve([] as any));
    mockShiftService.query.and.returnValue(Promise.resolve([] as any));
    mockShiftService.queryShiftByKey.and.returnValue(Promise.resolve(undefined as any));
    mockExpensesService.getUnsaved.and.returnValue(Promise.resolve([] as any));

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
    component.todaysTrips.set([{ id: 1 } as any]);
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
    ] as any));

    await component.ngOnInit();
    expect(component.demoSheetAttached()).toBeTrue();

    mockSpreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([
      { id: 'any-id', name: 'Production Sheet', default: 'true', size: 0 }
    ] as any));

    await component.reload();
    expect(component.demoSheetAttached()).toBeFalse();
  });

  it('reactively derives today and yesterday trip lists from the trip stream', async () => {
    await component.ngOnInit();

    trips$.next([
      { id: 1, rowId: 4, date: new Date().toISOString().slice(0, 10) },
      { id: 2, rowId: 8, date: new Date().toISOString().slice(0, 10) },
      { id: 3, rowId: 2, date: new Date(Date.now() - 86400000).toISOString().slice(0, 10) }
    ] as any);
    await Promise.resolve();

    expect(component.todaysTrips().map(trip => trip.rowId)).toEqual([8, 4]);
    expect(component.yesterdaysTrips().map(trip => trip.rowId)).toEqual([2]);
  });
});
