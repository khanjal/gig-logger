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
  const mockGigWorkflowService = jasmine.createSpyObj("GigWorkflowService", ["calculateShiftTotals"]);
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["loadSpreadsheetData", "querySpreadsheets"]);
  const mockShiftService = jasmine.createSpyObj("ShiftService", ["deleteService", "getUnsavedShifts", "queryShifts", "saveUnsavedShifts", "updateShift"]);
  const mockTripService = jasmine.createSpyObj("TripService", ["addTrip", "deleteTrip", "getSavedTrips", "getUnsavedTrips", "saveUnsavedTrips", "updateTrip", "getByDate", "getUnsaved"]);
  const mockExpensesService = jasmine.createSpyObj('ExpensesService', ['getUnsaved', 'saveUnsaved']);

  beforeEach(async () => {
    const mockPollingService = jasmine.createSpyObj(
      'PollingService',
      ['startPolling', 'stopPolling', 'isPollingEnabled'],
      {
        pollingEnabled$: new BehaviorSubject(false).asObservable(),
        parentReload: new Subject<void>().asObservable()
      }
    );
    mockPollingService.isPollingEnabled.and.returnValue(false);
    const viewportSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToAnchor']);
    mockSpreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([] as any));
    mockTripService.getByDate.and.returnValue(Promise.resolve([] as any));
    mockTripService.getUnsaved.and.returnValue(Promise.resolve([] as any));
    mockShiftService.getUnsavedShifts.and.returnValue(Promise.resolve([] as any));
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
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles yesterday trips visibility', () => {
    component.showYesterdayTrips = false;
    component.toggleYesterdayTrips();
    expect(component.showYesterdayTrips).toBeTrue();
    component.toggleYesterdayTrips();
    expect(component.showYesterdayTrips).toBeFalse();
  });

  it('shouldShowUpdateMessage returns correct boolean', () => {
    component.todaysTrips = [] as any;
    expect(component.shouldShowUpdateMessage()).toBeTrue();
    component.todaysTrips = [{ id: 1 } as any];
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
    expect(component.demoSheetAttached).toBeTrue();

    mockSpreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([
      { id: 'any-id', name: 'Production Sheet', default: 'true', size: 0 }
    ] as any));

    await component.reload();
    expect(component.demoSheetAttached).toBeFalse();
  });
});
