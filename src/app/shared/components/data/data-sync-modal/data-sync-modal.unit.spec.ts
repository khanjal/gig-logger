import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DateHelper } from '@helpers/date.helper';
import { DataSyncModalComponent } from './data-sync-modal.component';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { TimerService } from '@services/timer.service';
import { LoggerService } from '@services/logger.service';
import type { ISheet } from '@interfaces/sheets/sheet.interface';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';

type SyncType = 'save' | 'load' | 'create-demo' | 'create-sheet';

interface DataSyncConfig {
  type: SyncType;
  sheetName?: string;
  autoCloseOnError?: boolean;
  autoCloseTimer?: number;
}

type MessageType = 'info' | 'warning' | 'error';

interface SyncState {
  isPaused: boolean;
  isAutoClose: boolean;
  canContinue: boolean;
  forceLoad: boolean;
  hasNonInfoMessage: boolean;
}

// Exposes the component's private/protected test-only surface without using `any`.
interface DataSyncModalTestAccess {
  appendToTerminal: (text: string, type?: MessageType) => void;
  appendToLastMessage: (text: string) => void;
  data: ISheet | null;
  warmup: (startFrom?: number) => Promise<void>;
  processFailure: (message: string) => Promise<void>;
  syncState: () => SyncState;
}

function asTestAccess(component: DataSyncModalComponent): DataSyncModalTestAccess {
  return component as unknown as DataSyncModalTestAccess;
}

describe('DataSyncModalComponent (lightunit)', () => {
  let component: DataSyncModalComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DataSyncModalComponent>>;
  let mockSheetService: jasmine.SpyObj<SpreadsheetService>;
  let mockGigService: jasmine.SpyObj<GigWorkflowService>;
  let mockUnsaved: jasmine.SpyObj<UnsavedDataService>;
  let mockTimer: jasmine.SpyObj<TimerService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  function createComponent(config: DataSyncConfig | SyncType): DataSyncModalComponent {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: config },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: GigWorkflowService, useValue: mockGigService },
        { provide: SpreadsheetService, useValue: mockSheetService },
        { provide: UnsavedDataService, useValue: mockUnsaved },
        { provide: TimerService, useValue: mockTimer },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });
    return TestBed.runInInjectionContext(() => new DataSyncModalComponent());
  }

  beforeEach(() => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<DataSyncModalComponent>>('MatDialogRef', ['close']);

    mockSheetService = jasmine.createSpyObj<SpreadsheetService>('SpreadsheetService', [
      'getDefaultSheet', 'warmUpLambda', 'getSpreadsheetData', 'getSpreadsheets', 'loadSpreadsheetData'
    ]);
    mockSheetService.getDefaultSheet.and.returnValue(Promise.resolve({ id: 's1' } as ISpreadsheet));
    mockSheetService.warmUpLambda.and.returnValue(Promise.resolve(true));
    mockSheetService.getSpreadsheetData.and.returnValue(Promise.resolve({ messages: [] } as unknown as ISheet));
    mockSheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));
    mockSheetService.loadSpreadsheetData.and.returnValue(Promise.resolve());

    mockGigService = jasmine.createSpyObj<GigWorkflowService>('GigWorkflowService', [
      'calculateShiftTotals', 'saveSheetData', 'createFile', 'createSheet', 'insertDemoData'
    ]);
    mockGigService.calculateShiftTotals.and.returnValue(Promise.resolve());
    mockGigService.saveSheetData.and.returnValue(Promise.resolve([]));
    mockGigService.createFile.and.returnValue(Promise.resolve({ id: 'new-id', name: 'file' }));
    mockGigService.createSheet.and.returnValue(Promise.resolve());
    mockGigService.insertDemoData.and.returnValue(Promise.resolve());

    mockUnsaved = jasmine.createSpyObj<UnsavedDataService>('UnsavedDataService', [
      'collectUnsavedItems', 'commitSavedItems'
    ]);
    mockUnsaved.collectUnsavedItems.and.returnValue(Promise.resolve({ unsavedTrips: [], unsavedShifts: [], unsavedExpenses: [] }));
    mockUnsaved.commitSavedItems.and.returnValue(Promise.resolve());

    mockTimer = jasmine.createSpyObj<TimerService>('TimerService', ['delay']);
    mockTimer.delay.and.returnValue(Promise.resolve());

    mockLogger = jasmine.createSpyObj<LoggerService>('LoggerService', ['error'], { onLog: of() });

    // stable time formatting
    spyOn(DateHelper, 'getMinutesAndSeconds').and.returnValue('00:00');

    component = createComponent('save');
  });

  it('syncStatusLabel returns saved for save type', () => {
    component = createComponent('save');
    expect(component.syncStatusLabel).toBe('saved');
  });

  it('appendToTerminal and appendToLastMessage update terminalMessages', () => {
    asTestAccess(component).appendToTerminal('first');
    expect(component.terminalMessages().length).toBe(1);
    asTestAccess(component).appendToLastMessage(' appended');
    expect(component.terminalMessages()[0].text).toContain('first');
    expect(component.terminalMessages()[0].text).toContain('appended');
  });

  it('cancelSync closes dialog with false', () => {
    component.cancelSync();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('continueLoad with no data appends error message', async () => {
    // ensure data is null
    asTestAccess(component).data = null;
    await component.continueLoad();
    expect(component.terminalMessages().some(m => m.text.includes('No data to continue with'))).toBeTrue();
  });

  it('processFailure sets error type and respects autoCloseOnError when true', async () => {
    // set autoCloseOnError true via constructor config
    component = createComponent({ type: 'save', autoCloseOnError: true });
    await asTestAccess(component).warmup(0); // ensure timer started then stopped internally
    await asTestAccess(component).processFailure('ERROR');
    expect(component.terminalMessages().some(m => /auto-close/i.test(m.text))).toBeTrue();
    // use test-access cast to access protected syncState for assertion
    expect(asTestAccess(component).syncState().isAutoClose).toBeTrue();
  });
});
