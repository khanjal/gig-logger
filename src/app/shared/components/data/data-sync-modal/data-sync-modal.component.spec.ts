import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import { TimerService } from '@services/timer.service';
import { LoggerService } from '@services/logger.service';
import { Subject } from 'rxjs';
import { DataSyncModalComponent } from './data-sync-modal.component';

describe('DataSyncModalComponent', () => {
  let component: DataSyncModalComponent;
  let fixture: ComponentFixture<DataSyncModalComponent>;
  let workflowSpy: jasmine.SpyObj<GigWorkflowService>;
  let sheetSpy: jasmine.SpyObj<SpreadsheetService>;
  let shiftSpy: jasmine.SpyObj<ShiftService>;
  let tripSpy: jasmine.SpyObj<TripService>;
  let expensesSpy: jasmine.SpyObj<ExpensesService>;
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
    shiftSpy = jasmine.createSpyObj('ShiftService', ['getUnsavedShifts', 'saveUnsavedShifts']);
    tripSpy = jasmine.createSpyObj('TripService', ['getUnsaved', 'saveUnsaved']);
    expensesSpy = jasmine.createSpyObj('ExpensesService', ['getUnsaved', 'saveUnsaved']);
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
        { provide: ShiftService, useValue: shiftSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: ExpensesService, useValue: expensesSpy },
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
});
