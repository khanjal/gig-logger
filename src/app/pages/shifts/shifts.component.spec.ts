import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { ShiftsComponent } from './shifts.component';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';

describe('ShiftsComponent trackByShift', () => {
  it('returns rowId when present', () => {
    const s = { rowId: 10 } as unknown as IShift;
    const res = ShiftsComponent.prototype.trackByShift.call(null, 0, s);
    expect(res).toBe(10);
  });

  it('returns key when rowId absent', () => {
    const s = { key: 'k' } as unknown as IShift;
    const res = ShiftsComponent.prototype.trackByShift.call(null, 2, s);
    expect(res).toBe('k');
  });

  it('falls back to index', () => {
    const s = {} as unknown as IShift;
    const res = ShiftsComponent.prototype.trackByShift.call(null, 5, s);
    expect(res).toBe(5);
  });
});

describe('ShiftsComponent', () => {
  let component: ShiftsComponent;
  let fixture: ComponentFixture<ShiftsComponent>;
  let shiftSpy: jasmine.SpyObj<ShiftService>;
  let tripSpy: jasmine.SpyObj<TripService>;
  let expenseSpy: jasmine.SpyObj<ExpensesService>;
  let unsavedSpy: jasmine.SpyObj<UnsavedDataService>;
  let sheetSpy: jasmine.SpyObj<SpreadsheetService>;
  let shifts$: BehaviorSubject<IShift[]>;
  let trips$: BehaviorSubject<unknown[]>;
  let expenses$: BehaviorSubject<unknown[]>;
  let unsaved$: BehaviorSubject<boolean>;

  beforeEach(async () => {
    shifts$ = new BehaviorSubject<IShift[]>([]);
    trips$ = new BehaviorSubject<unknown[]>([]);
    expenses$ = new BehaviorSubject<unknown[]>([]);
    unsaved$ = new BehaviorSubject<boolean>(false);
    shiftSpy = jasmine.createSpyObj('ShiftService', ['query', 'getMaxRowId', 'getLastShift'], { shifts$: shifts$.asObservable() });
    tripSpy = jasmine.createSpyObj('TripService', [], { trips$: trips$.asObservable() });
    expenseSpy = jasmine.createSpyObj('ExpensesService', [], { expenses$: expenses$.asObservable() });
    unsavedSpy = jasmine.createSpyObj('UnsavedDataService', [], { unsavedData$: unsaved$.asObservable() });
    sheetSpy = jasmine.createSpyObj('SpreadsheetService', ['querySpreadsheets']);

    shiftSpy.query.and.resolveTo([]);
    shiftSpy.getMaxRowId.and.resolveTo(1);
    shiftSpy.getLastShift.and.resolveTo(undefined);
    sheetSpy.querySpreadsheets.and.resolveTo([]);

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
      { id: 'any-id', name: 'RaptorGig Demo - Apr 5, 2026, 5:20 PM', default: 'true', size: 0 } as ISpreadsheet
    ]);

    await component['refreshDefaultSheetState']();
    expect(component.demoSheetAttached()).toBeTrue();

    sheetSpy.querySpreadsheets.and.resolveTo([
      { id: 'any-id', name: 'Production Sheet', default: 'true', size: 0 } as ISpreadsheet
    ]);

    await component['refreshDefaultSheetState']();
    expect(component.demoSheetAttached()).toBeFalse();
  });

  it('reactively updates visible shifts from the shift stream', async () => {
    shifts$.next([{ id: '1', rowId: 3 }, { id: '2', rowId: 7 }] as unknown as IShift[]);
    await Promise.resolve();
    await fixture.whenStable();

    expect(component.shifts()).toEqual([{ id: '2', rowId: 7 }, { id: '1', rowId: 3 }] as unknown as IShift[]);
  });

  it('resets pagination state and triggers a reload on handleParentReload', () => {
    const loadSpy = spyOn(component, 'loadShifts').and.resolveTo();
    component.shifts.set([{ id: 'existing-shift' }] as unknown as IShift[]);
    component.currentPage.set(3);
    component.noMoreData.set(true);
    component.showAddForm.set(true);

    component.handleParentReload();

    expect(component.shifts()).toEqual([] as unknown as IShift[]);
    expect(component.currentPage()).toBe(0);
    expect(component.noMoreData()).toBeFalse();
    expect(component.showAddForm()).toBeFalse();
    expect(loadSpy).toHaveBeenCalled();
  });
});
