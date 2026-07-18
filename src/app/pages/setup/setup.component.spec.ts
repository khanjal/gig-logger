import { SetupComponent } from './setup.component';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '@services/common.service';
import { LoggerService } from '@services/logger.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { TimerService } from '@services/timer.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { VersionService } from '@services/version.service';
import { of } from 'rxjs';

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

  function createComponent(): SetupComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackSpy },
        { provide: CommonService, useValue: commonService },
        { provide: LoggerService, useValue: logger },
        { provide: SpreadsheetService, useValue: spreadsheetService },
        { provide: ShiftService, useValue: shiftService },
        { provide: TripService, useValue: tripService },
        { provide: TimerService, useValue: timerService },
        { provide: AuthGoogleService, useValue: authService },
        { provide: VersionService, useValue: versionService }
      ]
    });
    return TestBed.runInInjectionContext(() => new SetupComponent());
  }

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
      update: jasmine.createSpy('update'),
      deleteSpreadsheet: jasmine.createSpy('deleteSpreadsheet')
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

    const comp = createComponent();
    await comp.ngOnInit();
    // authenticated and no sheets -> template condition (show setup) should be true
    expect(comp.isAuthenticated()).toBeTrue();
    expect((comp.spreadsheets() ?? []).length).toBe(0);
  });

  it('hides setup card when signed out and no spreadsheets', async () => {
    authService.canSync.and.returnValue(Promise.resolve(false));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = createComponent();
    await comp.ngOnInit();
    // signed out and no sheets -> setup card should be hidden
    expect(comp.isAuthenticated()).toBeFalse();
    expect((comp.spreadsheets() ?? []).length).toBe(0);
  });

  it('shows local-only info when signed out but has spreadsheets', async () => {
    authService.canSync.and.returnValue(Promise.resolve(false));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([{ id: '1', name: 'S', default: 'true' }]));
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([{ id: '1', name: 'S', default: 'true' }]));

    const comp = createComponent();
    await comp.ngOnInit();
    expect(comp.isAuthenticated()).toBeFalse();
    expect((comp.spreadsheets() ?? []).length).toBeGreaterThan(0);
  });

  it('setDefault sets spreadsheet as default and calls update/load/reload', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    const defaultSheet = { id: 'd1', name: 'Default', default: 'true' } as any;
    spreadsheetService.querySpreadsheets.and.returnValue(Promise.resolve([defaultSheet]));
    spreadsheetService.update.and.returnValue(Promise.resolve());

    const comp = createComponent();
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

    const comp = createComponent();
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

    const comp = createComponent();

    await comp.unlinkSpreadsheet({ id: '1', name: 'S1', default: 'true' } as any);

    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('deleteLocalData clears storage and shows snackbar', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = createComponent();

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

    const comp = createComponent();

    await comp.loadSheetDialog('load');

    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('confirmDeleteAndReloadDialog shows snackbar when not authenticated', async () => {
    authService.canSync.and.returnValue(Promise.resolve(false));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = createComponent();

    await comp.confirmDeleteAndReloadDialog();

    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('confirmDeleteAndReloadDialog opens dialog when authenticated', (done: DoneFn) => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false) });
    dialogSpy.open.and.returnValue(dialogRefSpyObj);

    const comp = createComponent();

    comp.confirmDeleteAndReloadDialog().then(() => {
      expect(dialogSpy.open).toHaveBeenCalled();
      done();
    });
  });

  it('confirmDeleteAndReloadDialog calls deleteAndReload when user confirms', (done: DoneFn) => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true) });
    dialogSpy.open.and.returnValue(dialogRefSpyObj);

    const comp = createComponent();
    spyOn(comp, 'deleteAndReload').and.returnValue(Promise.resolve());

    comp.confirmDeleteAndReloadDialog().then(() => {
      // Give async operation time to complete
      setTimeout(() => {
        expect((comp.deleteAndReload as any)).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  it('unlinkSpreadsheet calls deleteSpreadsheet for non-default sheet', async () => {
    const allSheets = [
      { id: '1', name: 'S1', default: 'false' },
      { id: '2', name: 'S2', default: 'true' }
    ];
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve(allSheets));
    spreadsheetService.deleteSpreadsheet.and.returnValue(Promise.resolve());

    const comp = createComponent();
    spyOn(comp, 'load').and.returnValue(Promise.resolve());

    const nonDefaultSheet = { id: '1', name: 'S1', default: 'false' };
    await comp.unlinkSpreadsheet(nonDefaultSheet as any);

    expect(spreadsheetService.deleteSpreadsheet).toHaveBeenCalledWith(nonDefaultSheet);
    expect((comp.load as any)).toHaveBeenCalled();
  });

  it('handleParentReload calls load for load-only and reload otherwise', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = createComponent();
    spyOn(comp, 'load').and.returnValue(Promise.resolve());
    spyOn(comp, 'reload').and.returnValue(Promise.resolve());

    await comp.handleParentReload({ mode: 'load-only' });
    expect((comp.load as any)).toHaveBeenCalled();

    await comp.handleParentReload({ mode: 'reload' });
    expect((comp.reload as any)).toHaveBeenCalled();
  });

  it('getDataSize returns placeholder string and updateHeader calls commonService', () => {
    const comp = createComponent();
    expect(comp.getDataSize()).toBe('0 bytes');
    (comp as any).updateHeader();
    expect(commonService.updateHeaderLink).toHaveBeenCalled();
  });

  it('confirmDeleteAllDialog calls deleteAllData when user confirms', (done: DoneFn) => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true) });
    dialogSpy.open.and.returnValue(dialogRefSpyObj);

    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = createComponent();
    spyOn(comp, 'deleteAllData').and.returnValue(Promise.resolve());

    comp.confirmDeleteAllDialog().then(() => {
      setTimeout(() => {
        expect((comp.deleteAllData as any)).toHaveBeenCalled();
        done();
      }, 20);
    });
  });

  it('confirmDeleteAllDialog does nothing when user cancels', async () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false) });
    dialogSpy.open.and.returnValue(dialogRefSpyObj);

    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

    const comp = createComponent();
    spyOn(comp, 'deleteAllData').and.returnValue(Promise.resolve());

    await comp.confirmDeleteAllDialog();
    expect((comp.deleteAllData as any)).not.toHaveBeenCalled();
  });

  it('confirmUnlinkSpreadsheetDialog shows snackbar when default and other sheets exist', async () => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([
      { id: '1', name: 'S1', default: 'true' },
      { id: '2', name: 'S2', default: 'false' }
    ]));

    const comp = createComponent();

    await comp.confirmUnlinkSpreadsheetDialog({ id: '1', name: 'S1', default: 'true' } as any);
    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('confirmUnlinkSpreadsheetDialog calls unlinkSpreadsheet when confirmed', (done: DoneFn) => {
    authService.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([{ id: '1', name: 'S1', default: 'true' }]));

    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true) });
    dialogSpy.open.and.returnValue(dialogRefSpyObj);

    const comp = createComponent();
    spyOn(comp, 'unlinkSpreadsheet').and.returnValue(Promise.resolve());

    comp.confirmUnlinkSpreadsheetDialog({ id: '1', name: 'S1', default: 'true' } as any).then(() => {
      setTimeout(() => {
        expect((comp.unlinkSpreadsheet as any)).toHaveBeenCalled();
        done();
      }, 20);
    });
  });
});
import { ComponentFixture } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { commonTestingImports, commonTestingProviders } from '@test-harness';

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
