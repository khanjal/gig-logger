import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { ShiftsComponent } from './shifts.component';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

describe('ShiftsComponent', () => {
  let component: ShiftsComponent;
  let fixture: ComponentFixture<ShiftsComponent>;
  let shiftSpy: jasmine.SpyObj<ShiftService>;
  let tripSpy: jasmine.SpyObj<TripService>;
  let expenseSpy: jasmine.SpyObj<ExpensesService>;
  let unsavedSpy: jasmine.SpyObj<UnsavedDataService>;
  let sheetSpy: jasmine.SpyObj<SpreadsheetService>;
  let shifts$: BehaviorSubject<any[]>;
  let trips$: BehaviorSubject<any[]>;
  let expenses$: BehaviorSubject<any[]>;

  beforeEach(async () => {
    shifts$ = new BehaviorSubject<any[]>([]);
    trips$ = new BehaviorSubject<any[]>([]);
    expenses$ = new BehaviorSubject<any[]>([]);
    shiftSpy = jasmine.createSpyObj('ShiftService', ['query', 'getMaxRowId', 'getLastShift'], { shifts$: shifts$.asObservable() });
    tripSpy = jasmine.createSpyObj('TripService', [], { trips$: trips$.asObservable() });
    expenseSpy = jasmine.createSpyObj('ExpensesService', [], { expenses$: expenses$.asObservable() });
    unsavedSpy = jasmine.createSpyObj('UnsavedDataService', ['hasUnsavedData']);
    sheetSpy = jasmine.createSpyObj('SpreadsheetService', ['querySpreadsheets']);

    shiftSpy.query.and.resolveTo([] as any);
    shiftSpy.getMaxRowId.and.resolveTo(1 as any);
    shiftSpy.getLastShift.and.resolveTo(undefined as any);
    unsavedSpy.hasUnsavedData.and.resolveTo(false);
    sheetSpy.querySpreadsheets.and.resolveTo([] as any);

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, ShiftsComponent],
      providers: [
        ...commonTestingProviders,
        { provide: ShiftService, useValue: shiftSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: ExpensesService, useValue: expenseSpy },
        { provide: UnsavedDataService, useValue: unsavedSpy },
        { provide: SpreadsheetService, useValue: sheetSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})), snapshot: { paramMap: convertToParamMap({}) } } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets demoSheetAttached based on default sheet name format', async () => {
    sheetSpy.querySpreadsheets.and.resolveTo([
      { id: 'any-id', name: 'RaptorGig Demo - Apr 5, 2026, 5:20 PM', default: 'true', size: 0 }
    ] as any);

    await component['refreshDefaultSheetState']();
    expect(component.demoSheetAttached()).toBeTrue();

    sheetSpy.querySpreadsheets.and.resolveTo([
      { id: 'any-id', name: 'Production Sheet', default: 'true', size: 0 }
    ] as any);

    await component['refreshDefaultSheetState']();
    expect(component.demoSheetAttached()).toBeFalse();
  });

  it('reactively updates visible shifts from the shift stream', async () => {
    shifts$.next([{ id: '1', rowId: 3 }, { id: '2', rowId: 7 }] as any);
    await Promise.resolve();
    await fixture.whenStable();

    expect(component.shifts()).toEqual([{ id: '2', rowId: 7 }, { id: '1', rowId: 3 }] as any);
  });

  it('resets pagination state and triggers a reload on handleParentReload', () => {
    const loadSpy = spyOn(component, 'loadShifts').and.resolveTo();
    component.shifts.set([{ id: 'existing-shift' }] as any);
    component.currentPage.set(3);
    component.noMoreData.set(true);
    component.showAddForm.set(true);

    component.handleParentReload();

    expect(component.shifts()).toEqual([] as any);
    expect(component.currentPage()).toBe(0);
    expect(component.noMoreData()).toBeFalse();
    expect(component.showAddForm()).toBeFalse();
    expect(loadSpy).toHaveBeenCalled();
  });
});
