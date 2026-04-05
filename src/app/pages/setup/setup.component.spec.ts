import { SetupComponent } from './setup.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('SetupComponent (class-only)', () => {
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackSpy: jasmine.SpyObj<MatSnackBar>;
  let authService: any;
  let spreadsheetService: any;
  let tripService: any;
  let shiftService: any;
  let timerService: any;
  let versionService: any;
  let commonService: any;
  let logger: any;

  beforeEach(() => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    authService = {
      canSync: jasmine.createSpy('canSync')
    };

    spreadsheetService = {
      getSpreadsheets: jasmine.createSpy('getSpreadsheets'),
      querySpreadsheets: jasmine.createSpy('querySpreadsheets'),
      deleteData: jasmine.createSpy('deleteData'),
      deleteLocalData: jasmine.createSpy('deleteLocalData'),
      update: jasmine.createSpy('update')
    };

    tripService = { getUnsaved: jasmine.createSpy('getUnsaved').and.returnValue(Promise.resolve([])) };
    shiftService = { getUnsavedShifts: jasmine.createSpy('getUnsavedShifts').and.returnValue(Promise.resolve([])) };
    timerService = { delay: jasmine.createSpy('delay').and.returnValue(Promise.resolve()) };
    versionService = { getFormattedVersion: jasmine.createSpy('getFormattedVersion').and.returnValue(Promise.resolve('1.0.0')) };
    commonService = { updateHeaderLink: jasmine.createSpy('updateHeaderLink') };
    logger = { info: jasmine.createSpy('info') };
  });

  it('shows setup card when authenticated and no spreadsheets', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);
    await comp.ngOnInit();
    // authenticated and no sheets -> template condition (show setup) should be true
    expect(comp.isAuthenticated).toBeTrue();
    expect((comp.spreadsheets ?? []).length).toBe(0);
  });

  it('hides setup card when signed out and no spreadsheets', async () => {
    authService.canSync.and.returnValue(Promise.resolve(false));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);
    await comp.ngOnInit();
    // signed out and no sheets -> setup card should be hidden
    expect(comp.isAuthenticated).toBeFalse();
    expect((comp.spreadsheets ?? []).length).toBe(0);
  });

  it('shows local-only info when signed out but has spreadsheets', async () => {
    authService.canSync.and.returnValue(Promise.resolve(false));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([{ id: '1', name: 'S', default: 'true' }]));
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([{ id: '1', name: 'S', default: 'true' }]));

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);
    await comp.ngOnInit();
    expect(comp.isAuthenticated).toBeFalse();
    expect((comp.spreadsheets ?? []).length).toBeGreaterThan(0);
  });

  it('setDefault sets spreadsheet as default and calls update/load/reload', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    const defaultSheet = { id: 'd1', name: 'Default', default: 'true' } as any;
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([defaultSheet]));
    spreadsheetService.update.and.returnValue(Promise.resolve());

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);
    await comp.ngOnInit();

    const sheetToSet = { id: 's2', name: 'Other', default: 'false' } as any;

    spyOn(comp, 'load').and.returnValue(Promise.resolve());
    spyOn(comp, 'reload').and.returnValue(Promise.resolve());

    await comp.setDefault(sheetToSet);

    expect(sheetToSet.default).toBe('true');
    expect(spreadsheetService.update).toHaveBeenCalled();
    expect((comp.load as any)).toHaveBeenCalled();
    expect((comp.reload as any)).toHaveBeenCalled();
  });

  it('unlinkSpreadsheet will call deleteAllData when default and only sheet', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([{ id: '1', name: 'S', default: 'true' }]));
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([{ id: '1', name: 'S', default: 'true' }]));

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);
    spyOn(comp, 'deleteAllData').and.returnValue(Promise.resolve());

    await comp.unlinkSpreadsheet({ id: '1', name: 'S', default: 'true' } as any);

    expect((comp.deleteAllData as any)).toHaveBeenCalled();
  });

  it('unlinkSpreadsheet shows snackbar when default and other sheets exist', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([
      { id: '1', name: 'S1', default: 'true' },
      { id: '2', name: 'S2', default: 'false' }
    ]));

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);

    await comp.unlinkSpreadsheet({ id: '1', name: 'S1', default: 'true' } as any);

    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('deleteLocalData clears storage and shows snackbar', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);

    spyOn(comp, 'load').and.returnValue(Promise.resolve());
    const clearSpy = spyOn(localStorage, 'clear');

    await comp.deleteLocalData();

    expect(clearSpy).toHaveBeenCalled();
    expect(snackSpy.open).toHaveBeenCalled();
    expect((comp.load as any)).toHaveBeenCalled();
  });

  it('loadSheetDialog shows snackbar when not authenticated', async () => {
    authService.canSync.and.returnValue(Promise.resolve(false));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = new SetupComponent(dialogSpy as any, snackSpy as any, commonService, logger, spreadsheetService, shiftService, tripService, timerService, authService, versionService);

    await comp.loadSheetDialog('load');

    expect(snackSpy.open).toHaveBeenCalled();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';

describe('SheetSetupComponent', () => {
  let component: SetupComponent;
  let fixture: ComponentFixture<SetupComponent>;
  const mockCommonService = jasmine.createSpyObj("CommonService", ["updateHeaderLink"]);
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["getSpreadsheets", "querySpreadsheets", "update", "deleteSpreadsheet", "deleteData"]);
  const mockTimerService = jasmine.createSpyObj("TimerService", ["delay"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, MatSnackBarModule, SetupComponent],
      providers: [
        ...commonTestingProviders,
        { provide: CommonService, useValue: mockCommonService },
        { provide: SpreadsheetService, useValue: mockSpreadsheetService },
        { provide: TimerService, useValue: mockTimerService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
