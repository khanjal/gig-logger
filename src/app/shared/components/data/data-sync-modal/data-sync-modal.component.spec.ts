import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { TimerService } from '@services/timer.service';
import { LoggerService } from '@services/logger.service';
import { ApiMessageHelper } from '@helpers/api-message.helper';
import { Subject } from 'rxjs';
import { DataSyncModalComponent } from './data-sync-modal.component';

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
    timerSpy = jasmine.createSpyObj('TimerService', ['delay']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug'], {
      onLog: new Subject<any>()
    });
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    timerSpy.delay.and.resolveTo();

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
    workflowSpy.createFile.and.resolveTo({ id: 'new-demo-id', name: 'Demo' } as any);
    workflowSpy.createSheet.and.resolveTo();
    workflowSpy.insertDemoData.and.resolveTo();

    sheetSpy.getSpreadsheets.and.returnValues(
      Promise.resolve([{ id: 'old-default', name: 'Old', default: 'true', size: 0 }] as any),
      Promise.resolve([{ id: 'new-demo-id', name: 'Demo', default: 'true', size: 0 }] as any)
    );
    sheetSpy.update.and.resolveTo();
    sheetSpy.add.and.resolveTo();
    sheetSpy.warmUpLambda.and.resolveTo({});
    sheetSpy.getSpreadsheetData.and.resolveTo({
      properties: { id: 'new-demo-id', name: 'Demo' },
      messages: []
    } as any);
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
    workflowSpy.createFile.and.resolveTo(null as any);

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(workflowSpy.createSheet).not.toHaveBeenCalled();
    expect(workflowSpy.insertDemoData).not.toHaveBeenCalled();
    expect(sheetSpy.warmUpLambda).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('create-demo flow should handle unexpected errors and keep modal open', async () => {
    workflowSpy.createFile.and.resolveTo({ id: 'new-demo-id', name: 'Demo' } as any);
    sheetSpy.getSpreadsheets.and.resolveTo([] as any);
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

    workflowSpy.createFile.and.resolveTo(null as any);

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

    workflowSpy.createFile.and.resolveTo({ id: 'new-sheet-id', name: 'My New Sheet' } as any);
    workflowSpy.createSheet.and.resolveTo();

    sheetSpy.getSpreadsheets.and.returnValues(
      Promise.resolve([{ id: 'old-default', name: 'Old', default: 'true', size: 0 }] as any),
      Promise.resolve([{ id: 'new-sheet-id', name: 'My New Sheet', default: 'true', size: 0 }] as any)
    );
    sheetSpy.update.and.resolveTo();
    sheetSpy.add.and.resolveTo();
    sheetSpy.warmUpLambda.and.resolveTo({});
    sheetSpy.getSpreadsheetData.and.resolveTo({
      properties: { id: 'new-sheet-id', name: 'My New Sheet' },
      messages: []
    } as any);
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

    const defaultSheet = { id: 'sheet-1', name: 'Default', default: 'true', size: 0 } as any;
    sheetSpy.getDefaultSheet.and.resolveTo(defaultSheet);
    sheetSpy.warmUpLambda.and.resolveTo({});
    unsavedDataSpy.collectUnsavedItems.and.resolveTo({
      unsavedTrips: [],
      unsavedShifts: [{ id: 1, shifts: 5 } as any],
      unsavedExpenses: []
    });
    workflowSpy.calculateShiftTotals.and.resolveTo();
    workflowSpy.saveSheetData.and.resolveTo([{ level: 'INFO', message: 'Changes saved' }]);

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    expect(workflowSpy.calculateShiftTotals).toHaveBeenCalled();
  });

  it('save flow should capture saveStartedAt after shift recalculation', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: 'save' });

    const defaultSheet = { id: 'sheet-1', name: 'Default', default: 'true', size: 0 } as any;
    let recalculationFinishedAt = 0;
    let apiCallTime = 0;
    spyOn(ApiMessageHelper, 'processSheetSaveResponse').and.returnValue({
      success: true,
      filteredMessages: []
    } as any);

    sheetSpy.getDefaultSheet.and.resolveTo(defaultSheet);
    sheetSpy.warmUpLambda.and.resolveTo({});
    unsavedDataSpy.collectUnsavedItems.and.resolveTo({
      unsavedTrips: [],
      unsavedShifts: [{ id: 7 } as any],
      unsavedExpenses: []
    });
    workflowSpy.calculateShiftTotals.and.callFake(async () => {
      await Promise.resolve();
      recalculationFinishedAt = Date.now();
    });
    workflowSpy.saveSheetData.and.callFake(async () => {
      apiCallTime = Date.now();
      return [{ level: 'INFO', message: 'Changes saved' }];
    });

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();

    const [saveStartedAtArg] = unsavedDataSpy.commitSavedItems.calls.mostRecent().args as [number, ...any[]];
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

  it('should close dialog on cancel', () => {
    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;

    component.cancelSync();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
