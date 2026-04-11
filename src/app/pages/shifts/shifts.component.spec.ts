import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { ShiftsComponent } from './shifts.component';
import { ShiftService } from '@services/sheets/shift.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

describe('ShiftsComponent', () => {
  let component: ShiftsComponent;
  let fixture: ComponentFixture<ShiftsComponent>;
  let shiftSpy: jasmine.SpyObj<ShiftService>;
  let unsavedSpy: jasmine.SpyObj<UnsavedDataService>;
  let sheetSpy: jasmine.SpyObj<SpreadsheetService>;

  beforeEach(async () => {
    shiftSpy = jasmine.createSpyObj('ShiftService', ['paginate']);
    unsavedSpy = jasmine.createSpyObj('UnsavedDataService', ['hasUnsavedData']);
    sheetSpy = jasmine.createSpyObj('SpreadsheetService', ['querySpreadsheets']);

    shiftSpy.paginate.and.resolveTo([] as any);
    unsavedSpy.hasUnsavedData.and.resolveTo(false);
    sheetSpy.querySpreadsheets.and.resolveTo([] as any);

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, ShiftsComponent],
      providers: [
        ...commonTestingProviders,
        { provide: ShiftService, useValue: shiftSpy },
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
    component.shifts.set([]);
    component.currentPage.set(0);
    component.isLoading.set(false);
    component.noMoreData.set(false);
    sheetSpy.querySpreadsheets.and.resolveTo([
      { id: 'any-id', name: 'RaptorGig Demo - Apr 5, 2026, 5:20 PM', default: 'true', size: 0 }
    ] as any);

    await component.loadShifts();
    expect(component.demoSheetAttached()).toBeTrue();

    sheetSpy.querySpreadsheets.and.resolveTo([
      { id: 'any-id', name: 'Production Sheet', default: 'true', size: 0 }
    ] as any);

    component.shifts.set([]);
    component.currentPage.set(0);
    component.noMoreData.set(false);
    await component.loadShifts();
    expect(component.demoSheetAttached()).toBeFalse();
  });

  it('resets isLoading when loadShifts throws', async () => {
    component.shifts.set([]);
    component.currentPage.set(0);
    component.isLoading.set(false);
    component.noMoreData.set(false);
    shiftSpy.paginate.and.resolveTo([{ id: '1' }] as any);
    unsavedSpy.hasUnsavedData.and.rejectWith(new Error('unsaved lookup failed'));

    await expectAsync(component.loadShifts()).toBeRejected();

    expect(component.isLoading()).toBeFalse();
  });
});
