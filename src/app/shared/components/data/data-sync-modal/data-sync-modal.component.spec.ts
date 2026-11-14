import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { TimerService } from '@services/timer.service';
import { LoggerService } from '@services/logger.service';
import { ApiMessageHelper } from '@helpers/api-message.helper';
import { EMPTY, Subject, of } from 'rxjs';
import { DataSyncModalComponent } from './data-sync-modal.component';
import { SYNC_CLOSE } from '@constants/sync.constants';
import type { ISheetProperties } from '@interfaces/sheets/sheet-properties.interface';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';
import type { ISheet } from '@interfaces/sheets/sheet.interface';
import type { IShift } from '@interfaces/entities/shift.interface';


describe('DataSyncModalComponent', () => {
  let component: DataSyncModalComponent;
  let fixture: ComponentFixture<DataSyncModalComponent>;
  let workflowSpy: jasmine.SpyObj<GigWorkflowService>;
  let sheetSpy: jasmine.SpyObj<SpreadsheetService>;
  let unsavedDataSpy: jasmine.SpyObj<UnsavedDataService>;
  let timerSpy: jasmine.SpyObj<TimerService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DataSyncModalComponent>>;

  beforeEach(async () => {
    workflowSpy = jasmine.createSpyObj('GigWorkflowService', [
      'createFile',
      'createSheet',
      'insertDemoData',
      'saveSheetData',
      'calculateShiftTotals'
    ]);
    sheetSpy = jasmine.createSpyObj('SpreadsheetService', [
      'getSpreadsheets',
      'update',
      'add',
      'warmUpLambda',
      'getSpreadsheetData',
      'appendSpreadsheetData',
      'loadSpreadsheetData',
      'getDefaultSheet'
    ]);
    unsavedDataSpy = jasmine.createSpyObj('UnsavedDataService', [
      'collectUnsavedItems', 'commitSavedItems'
    ]);
    unsavedDataSpy.collectUnsavedItems.and.resolveTo({ unsavedTrips: [], unsavedShifts: [], unsavedExpenses: [] });
    unsavedDataSpy.commitSavedItems.and.resolveTo();
    timerSpy = jasmine.createSpyObj('TimerService', ['delay', 'countdown']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug'], {
      onLog: new Subject<{ level: string; message: string }>()
    });
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    timerSpy.delay.and.resolveTo();
    // Completes without emitting, so the close countdown finishes immediately
    // instead of holding these tests for real seconds.
    timerSpy.countdown.and.returnValue(EMPTY);

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, DataSyncModalComponent],
      providers: [
        ...commonTestingProviders,
        { provide: MAT_DIALOG_DATA, useValue: 'create-demo' },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: GigWorkflowService, useValue: workflowSpy },
        { provide: SpreadsheetService, useValue: sheetSpy },
        { provide: UnsavedDataService, useValue: unsavedDataSpy },
        { provide: TimerService, useValue: timerSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    })
    .compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('create-demo flow should create, link, seed, then load data and close dialog', async () => {
    workflowSpy.createFile.and.resolveTo({ id: 'new-demo-id', name: 'Demo' } as ISheetProperties);
    workflowSpy.createSheet.and.resolveTo();
    workflowSpy.insertDemoData.and.resolveTo();

    sheetSpy.getSpreadsheets.and.returnValues(
      Promise.resolve([{ id: 'old-default', name: 'Old', default: 'true', size: 0 }] as ISpreadsheet[]),
      Promise.resolve([{ id: 'new-demo-id', name: 'Demo', default: 'true', size: 0 }] as ISpreadsheet[])
    );
    sheetSpy.update.and.resolveTo();
    sheetSpy.add.and.resolveTo();
    sheetSpy.warmUpLambda.and.resolveTo({});
    sheetSpy.getSpreadsheetData.and.resolveTo({
      properties: { id: 'new-demo-id', name: 'Demo' },
      messages: []
    } as unknown as ISheet);
    sheetSpy.loadSpreadsheetData.and.resolveTo();

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(workflowSpy.createFile).toHaveBeenCalled();
    expect(workflowSpy.createSheet).toHaveBeenCalledWith('new-demo-id');
    expect(workflowSpy.insertDemoData).toHaveBeenCalledWith('new-demo-id');
    expect(sheetSpy.update).toHaveBeenCalled();
    expect(sheetSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 'new-demo-id',
      default: 'true'
    }));
    expect(sheetSpy.warmUpLambda).toHaveBeenCalled();
    expect(sheetSpy.getSpreadsheetData).toHaveBeenCalled();
    expect(sheetSpy.loadSpreadsheetData).toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('create-demo flow should stop when file creation fails and not close dialog', async () => {
    workflowSpy.createFile.and.resolveTo(null);

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(workflowSpy.createSheet).not.toHaveBeenCalled();
    expect(workflowSpy.insertDemoData).not.toHaveBeenCalled();
    expect(sheetSpy.warmUpLambda).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('create-demo flow should handle unexpected errors and keep modal open', async () => {
    workflowSpy.createFile.and.resolveTo({ id: 'new-demo-id', name: 'Demo' } as ISheetProperties);
    sheetSpy.getSpreadsheets.and.resolveTo([]);
    sheetSpy.add.and.resolveTo();
    workflowSpy.createSheet.and.rejectWith(new Error('create sheet failed'));

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(loggerSpy.error).toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('create-sheet flow should stop when file creation fails and not close dialog', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: { type: 'create-sheet', sheetName: 'My New Sheet' }
    });

    workflowSpy.createFile.and.resolveTo(null);

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(workflowSpy.createSheet).not.toHaveBeenCalled();
    expect(sheetSpy.warmUpLambda).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('create-sheet flow should create, link, and load without demo data insertion', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: { type: 'create-sheet', sheetName: 'My New Sheet' }
    });

    workflowSpy.createFile.and.resolveTo({ id: 'new-sheet-id', name: 'My New Sheet' } as ISheetProperties);
    workflowSpy.createSheet.and.resolveTo();

    sheetSpy.getSpreadsheets.and.returnValues(
      Promise.resolve([{ id: 'old-default', name: 'Old', default: 'true', size: 0 }] as ISpreadsheet[]),
      Promise.resolve([{ id: 'new-sheet-id', name: 'My New Sheet', default: 'true', size: 0 }] as ISpreadsheet[])
    );
    sheetSpy.update.and.resolveTo();
    sheetSpy.add.and.resolveTo();
    sheetSpy.warmUpLambda.and.resolveTo({});
    sheetSpy.getSpreadsheetData.and.resolveTo({
      properties: { id: 'new-sheet-id', name: 'My New Sheet' },
      messages: []
    } as unknown as ISheet);
    sheetSpy.loadSpreadsheetData.and.resolveTo();

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(workflowSpy.createFile).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'My New Sheet' }));
    expect(workflowSpy.createSheet).toHaveBeenCalledWith('new-sheet-id');
    expect(workflowSpy.insertDemoData).not.toHaveBeenCalled();
    expect(sheetSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 'new-sheet-id',
      default: 'true'
    }));
    expect(sheetSpy.warmUpLambda).toHaveBeenCalled();
    expect(sheetSpy.getSpreadsheetData).toHaveBeenCalled();
    expect(sheetSpy.loadSpreadsheetData).toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('save flow with unsaved shifts should calculate totals before saving', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: 'save' });

    const defaultSheet: ISpreadsheet = { id: 'sheet-1', name: 'Default', default: 'true', size: 0 };
    sheetSpy.getDefaultSheet.and.resolveTo(defaultSheet);
    sheetSpy.warmUpLambda.and.resolveTo({});
    unsavedDataSpy.collectUnsavedItems.and.resolveTo({
      unsavedTrips: [],
      unsavedShifts: [{ id: 1, shifts: 5 }] as unknown as IShift[],
      unsavedExpenses: []
    });
    workflowSpy.calculateShiftTotals.and.resolveTo();
    workflowSpy.saveSheetData.and.resolveTo([{ level: 'INFO', message: 'Changes saved', type: 'NETWORK', time: Date.now() }]);

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(workflowSpy.calculateShiftTotals).toHaveBeenCalled();
  });

  it('save flow should capture saveStartedAt after shift recalculation', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: 'save' });

    const defaultSheet: ISpreadsheet = { id: 'sheet-1', name: 'Default', default: 'true', size: 0 };
    let recalculationFinishedAt = 0;
    let apiCallTime = 0;
    spyOn(ApiMessageHelper, 'processSheetSaveResponse').and.returnValue({
      success: true,
      filteredMessages: [],
      allMessages: []
    });

    sheetSpy.getDefaultSheet.and.resolveTo(defaultSheet);
    sheetSpy.warmUpLambda.and.resolveTo({});
    unsavedDataSpy.collectUnsavedItems.and.resolveTo({
      unsavedTrips: [],
      unsavedShifts: [{ id: 7 }] as unknown as IShift[],
      unsavedExpenses: []
    });
    workflowSpy.calculateShiftTotals.and.callFake(async () => {
      await Promise.resolve();
      recalculationFinishedAt = Date.now();
    });
    workflowSpy.saveSheetData.and.callFake(async () => {
      apiCallTime = Date.now();
      return [{ level: 'INFO', message: 'Changes saved', type: 'NETWORK', time: Date.now() }];
    });

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    const [saveStartedAtArg] = unsavedDataSpy.commitSavedItems.calls.mostRecent().args as Parameters<UnsavedDataService['commitSavedItems']>;
    expect(saveStartedAtArg).toBeGreaterThanOrEqual(recalculationFinishedAt);
    expect(saveStartedAtArg).toBeLessThanOrEqual(apiCallTime);
  });

  it('should support new config object format in constructor with all properties', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: { 
        type: 'save', 
        sheetName: 'My Sheet', 
        autoCloseOnError: true, 
        autoCloseTimer: 3000 
      }
    });

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    expect(component.type).toBe('save');
  });

  it('should handle old string config format in constructor', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: 'load' });

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    expect(component.type).toBe('load');
  });

  it('load flow should reach an ERROR state (not hang) when loadSpreadsheetData rejects', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: 'load' });

    const defaultSheet: ISpreadsheet = { id: 'sheet-1', name: 'Default', default: 'true', size: 0 };
    sheetSpy.getDefaultSheet.and.resolveTo(defaultSheet);
    sheetSpy.warmUpLambda.and.resolveTo({});
    sheetSpy.getSpreadsheetData.and.resolveTo({
      properties: { id: 'sheet-1', name: 'Default' },
      messages: []
    } as unknown as ISheet);
    sheetSpy.getSpreadsheets.and.resolveTo([defaultSheet]);
    sheetSpy.loadSpreadsheetData.and.rejectWith(new Error('loadData failed'));

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    // A rejection here previously escaped as an unhandled promise rejection instead of
    // resolving into an ERROR terminal state; awaiting to completion is itself part of the assertion.
    await component.ngOnInit();

    expect(dialogRefSpy.close).not.toHaveBeenCalledWith(true);
    expect(component.terminalMessages().some(m => m.type === 'error')).toBeTrue();
  });

  it('load flow should render logger error messages with error styling, not info', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: 'load' });

    const defaultSheet: ISpreadsheet = { id: 'sheet-1', name: 'Default', default: 'true', size: 0 };
    sheetSpy.getDefaultSheet.and.resolveTo(defaultSheet);
    sheetSpy.warmUpLambda.and.resolveTo({});
    sheetSpy.getSpreadsheetData.and.resolveTo({
      properties: { id: 'sheet-1', name: 'Default' },
      messages: []
    } as unknown as ISheet);
    sheetSpy.getSpreadsheets.and.resolveTo([defaultSheet]);

    // Mirrors DataLoaderService.handleError: log the failure to onLog, then throw.
    sheetSpy.loadSpreadsheetData.and.callFake(async () => {
      (loggerSpy.onLog as Subject<{ level: string; message: string }>).next({ level: 'error', message: 'loadData failed' });
      throw new Error('loadData failed');
    });

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    const forwarded = component.terminalMessages().find(m => m.text.startsWith('loadData failed'));
    expect(forwarded?.type).toBe('error');
  });

  it('should close dialog on cancel', () => {
    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    component.cancelSync();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  describe('close countdown', () => {
    // Drives a create-demo run to completion; the countdown mock decides how it ends.
    async function runCleanSync(): Promise<void> {
      workflowSpy.createFile.and.resolveTo({ id: 'demo', name: 'Demo' } as ISheetProperties);
      workflowSpy.createSheet.and.resolveTo();
      workflowSpy.insertDemoData.and.resolveTo();
      sheetSpy.getSpreadsheets.and.returnValues(
        Promise.resolve([{ id: 'old', name: 'Old', default: 'true', size: 0 }] as ISpreadsheet[]),
        Promise.resolve([{ id: 'demo', name: 'Demo', default: 'true', size: 0 }] as ISpreadsheet[])
      );
      sheetSpy.update.and.resolveTo();
      sheetSpy.add.and.resolveTo();
      sheetSpy.warmUpLambda.and.resolveTo({});
      sheetSpy.getSpreadsheetData.and.resolveTo({
        properties: { id: 'demo', name: 'Demo' },
        messages: warningMessages
      } as unknown as ISheet);
      sheetSpy.loadSpreadsheetData.and.resolveTo();

      fixture = TestBed.createComponent(DataSyncModalComponent);
      component = fixture.componentInstance;

      await component.ngOnInit();
    }

    let warningMessages: { level: string; message: string }[];

    beforeEach(() => {
      warningMessages = [];
    });

    it('uses the standard delay when the run reported nothing but info', async () => {
      await runCleanSync();

      expect(timerSpy.countdown).toHaveBeenCalledWith(SYNC_CLOSE.DEFAULT_DELAY_MS, SYNC_CLOSE.TICK_MS);
    });

    it('extends the delay when the run reported a warning', async () => {
      warningMessages = [{ level: 'WARNING', message: 'Sheet Sheet1 does not match any known sheet name' }];

      await runCleanSync();

      expect(timerSpy.countdown).toHaveBeenCalledWith(SYNC_CLOSE.WARNING_DELAY_MS, SYNC_CLOSE.TICK_MS);
    });

    it('still auto-closes after a warning rather than waiting for the user', async () => {
      warningMessages = [{ level: 'WARNING', message: 'Sheet Sheet1 does not match any known sheet name' }];

      await runCleanSync();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('exposes the remaining seconds while counting down', async () => {
      timerSpy.countdown.and.returnValue(of(3, 2, 1));

      await runCleanSync();

      // of() completes, so the countdown ends and clears itself.
      expect(component.countdownSeconds()).toBeNull();
    });

    it('keepOpen stops the countdown and cancels the close', async () => {
      const ticks = new Subject<number>();
      timerSpy.countdown.and.returnValue(ticks.asObservable());

      // Not awaited: the countdown never completes, so ngOnInit stays pending
      // until keepOpen() resolves it - which is the behaviour under test.
      const run = runCleanSync();
      await Promise.resolve();
      ticks.next(4);

      component.keepOpen();
      await run;

      expect(component.countdownSeconds()).toBeNull();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.terminalMessages().some(m => m.text.includes('Auto-close cancelled'))).toBeTrue();
    });
  });
});
