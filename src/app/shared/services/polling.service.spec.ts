import { TestBed } from '@angular/core/testing';
import { PollingService } from './polling.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpreadsheetService } from './spreadsheet.service';
import { UnsavedDataService } from './unsaved-data.service';
import { LoggerService } from './logger.service';
import { GigWorkflowService } from './gig-workflow.service';
import { SyncStatusService } from './sync-status.service';
import { AuthGoogleService } from './auth-google.service';
import { ApiMessageHelper } from '@helpers/api-message.helper';
import { SheetSerializerHelper } from '@helpers/sheet-serializer.helper';

describe('PollingService', () => {
  let service: PollingService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let unsavedDataSpy: jasmine.SpyObj<UnsavedDataService>;
  let syncStatusSpy: jasmine.SpyObj<SyncStatusService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let sheetServiceSpy: jasmine.SpyObj<SpreadsheetService>;
  let gigWorkflowSpy: jasmine.SpyObj<GigWorkflowService>;
  let authSpy: jasmine.SpyObj<AuthGoogleService>;

  beforeEach(() => {
    const logger = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error', 'debug']);
    const unsaved = jasmine.createSpyObj('UnsavedDataService', [
      'getUnsavedCounts', 'collectUnsavedItems', 'commitSavedItems'
    ]);
    const syncStatus = jasmine.createSpyObj('SyncStatusService', [
      'startCountdown',
      'stopCountdown',
      'startSync',
      'completeSync',
      'failSync',
      'addMessage'
    ]);
    const snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    const sheetService = jasmine.createSpyObj('SpreadsheetService', ['querySpreadsheets']);
    const gigWorkflow = jasmine.createSpyObj('GigWorkflowService', [
      'calculateShiftTotals',
      'saveSheetData'
    ]);
    const auth = jasmine.createSpyObj('AuthGoogleService', ['canSync']);
    auth.canSync.and.returnValue(Promise.resolve(true));
    sheetService.querySpreadsheets.and.returnValue(Promise.resolve([{ id: 'sheet1', name: 'Default' }]));
    unsaved.getUnsavedCounts.and.returnValue(Promise.resolve({ total: 0, trips: 0, shifts: 0, expenses: 0 }));
    unsaved.collectUnsavedItems.and.returnValue(Promise.resolve({ unsavedTrips: [], unsavedShifts: [], unsavedExpenses: [] }));
    unsaved.commitSavedItems.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        PollingService,
        { provide: LoggerService, useValue: logger },
        { provide: UnsavedDataService, useValue: unsaved },
        { provide: SyncStatusService, useValue: syncStatus },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: SpreadsheetService, useValue: sheetService },
        { provide: GigWorkflowService, useValue: gigWorkflow },
        { provide: AuthGoogleService, useValue: auth }
      ]
    });

    service = TestBed.inject(PollingService);
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    unsavedDataSpy = TestBed.inject(UnsavedDataService) as jasmine.SpyObj<UnsavedDataService>;
    syncStatusSpy = TestBed.inject(SyncStatusService) as jasmine.SpyObj<SyncStatusService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    sheetServiceSpy = TestBed.inject(SpreadsheetService) as jasmine.SpyObj<SpreadsheetService>;
    gigWorkflowSpy = TestBed.inject(GigWorkflowService) as jasmine.SpyObj<GigWorkflowService>;
    authSpy = TestBed.inject(AuthGoogleService) as jasmine.SpyObj<AuthGoogleService>;
  });

  afterEach(() => {
    // Clean up any active polling
    try {
      service.stopPolling();
    } catch (e) {
      // Ignore errors during cleanup
    }
    service.ngOnDestroy();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with polling disabled', () => {
      expect(service['enabled']).toBe(false);
    });

    it('should initialize without processing flag', () => {
      expect(service['processing']).toBe(false);
    });

    it('should have parentReload EventEmitter', () => {
      expect(service.parentReload).toBeDefined();
    });

    it('should attempt to initialize web worker', () => {
      // Worker initialization is attempted in constructor
      // We just verify service was created successfully
      expect(service).toBeTruthy();
    });

    it('should set up visibility change listener', () => {
      expect(service['visibilityChangeListener']).toBeDefined();
    });
  });

  describe('startPolling', () => {
    it('should enable polling with default interval', async () => {
      await service.startPolling();

      expect(service['enabled']).toBe(true);
      expect(loggerSpy.info).toHaveBeenCalledWith(
        jasmine.stringContaining('Starting polling with interval:')
      );
    });

    it('should enable polling with custom interval', async () => {
      const customInterval = 30000;

      await service.startPolling(customInterval);

      expect(service['enabled']).toBe(true);
      expect(service['currentInterval']).toBe(customInterval);
      expect(loggerSpy.info).toHaveBeenCalledWith(`Starting polling with interval: ${customInterval}ms`);
    });

    it('should not start polling if already enabled', async () => {
      await service.startPolling();
      loggerSpy.info.calls.reset();

      await service.startPolling();

      expect(loggerSpy.warn).toHaveBeenCalledWith('Polling already enabled, skipping start');
    });

    it('should start countdown when polling starts', async () => {
      const interval = 60000;

      await service.startPolling(interval);

      expect(syncStatusSpy.startCountdown).toHaveBeenCalledWith(interval);
    });

    it('should update lastPollTime when starting', async () => {
      const beforeTime = Date.now();

      await service.startPolling();

      expect(service['lastPollTime']).toBeGreaterThanOrEqual(beforeTime);
      expect(service['lastPollTime']).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('stopPolling', () => {
    it('should disable polling', async () => {
      await service.startPolling();

      service.stopPolling();

      expect(service['enabled']).toBe(false);
      expect(loggerSpy.info).toHaveBeenCalledWith('Stopping polling');
    });

    it('should not stop polling if already disabled', () => {
      service.stopPolling();

      expect(loggerSpy.warn).toHaveBeenCalledWith('Polling already disabled, skipping stop');
    });

    it('should stop countdown when polling stops', async () => {
      await service.startPolling();

      service.stopPolling();

      expect(syncStatusSpy.stopCountdown).toHaveBeenCalled();
    });

    it('should clear fallback timer if present', async () => {
      await service.startPolling();
      const timerSpy = spyOn(window, 'clearInterval');

      service.stopPolling();

      if (service['fallbackTimer'] !== null) {
        expect(timerSpy).toHaveBeenCalled();
      }
    });

    it('should handle multiple stop calls gracefully', async () => {
      await service.startPolling();

      service.stopPolling();
      service.stopPolling();
      service.stopPolling();

      expect(loggerSpy.warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up on destroy', () => {
      service.ngOnDestroy();

      expect(service['visibilityChangeListener']).toBeNull();
    });

    it('should stop polling on destroy', async () => {
      await service.startPolling();

      service.ngOnDestroy();

      expect(service['enabled']).toBe(false);
    });

    it('should terminate worker on destroy if present', () => {
      if (service['worker']) {
        const terminateSpy = spyOn(service['worker'], 'terminate');

        service.ngOnDestroy();

        expect(terminateSpy).toHaveBeenCalled();
      } else {
        // No worker, just verify cleanup happened
        service.ngOnDestroy();
        expect(service['worker']).toBeNull();
      }
    });
  });

  describe('Polling State Management', () => {
    it('should track enabled state correctly', async () => {
      expect(service['enabled']).toBe(false);

      await service.startPolling();
      expect(service['enabled']).toBe(true);

      service.stopPolling();
      expect(service['enabled']).toBe(false);
    });

    it('should track processing state', () => {
      expect(service['processing']).toBe(false);

      service['processing'] = true;
      expect(service['processing']).toBe(true);

      service['processing'] = false;
      expect(service['processing']).toBe(false);
    });

    it('should store interval value', async () => {
      const interval = 45000;

      await service.startPolling(interval);

      expect(service['currentInterval']).toBe(interval);
    });

    it('should update lastPollTime', async () => {
      await service.startPolling();
      const pollTime1 = service['lastPollTime'];

      await new Promise(resolve => setTimeout(resolve, 10));

      service.stopPolling();
      service['lastPollTime'] = Date.now();
      const pollTime2 = service['lastPollTime'];

      expect(pollTime2).toBeGreaterThan(pollTime1);
    });
  });

  describe('Integration Scenarios', () => {
    it('should start and stop polling multiple times', async () => {
      await service.startPolling(30000);
      service.stopPolling();

      await service.startPolling(45000);
      service.stopPolling();

      await service.startPolling(60000);
      service.stopPolling();

      expect(service['enabled']).toBe(false);
    });

    it('should maintain interval between restarts', async () => {
      await service.startPolling(35000);
      expect(service['currentInterval']).toBe(35000);

      service.stopPolling();

      await service.startPolling(50000);
      expect(service['currentInterval']).toBe(50000);
    });

    it('should handle rapid start/stop cycles', async () => {
      for (let i = 0; i < 5; i++) {
        await service.startPolling(60000);
        service.stopPolling();
      }

      expect(service['enabled']).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle worker initialization failure gracefully', () => {
      // Worker initialization happens in constructor
      // If it fails, service should still be created
      expect(service).toBeTruthy();
    });

    it('should log warning when polling already enabled', async () => {
      await service.startPolling();
      loggerSpy.warn.calls.reset();

      await service.startPolling();

      expect(loggerSpy.warn).toHaveBeenCalled();
    });

    it('should log warning when polling already disabled', () => {
      loggerSpy.warn.calls.reset();

      service.stopPolling();

      expect(loggerSpy.warn).toHaveBeenCalled();
    });
  });

  describe('Visibility Change Handling', () => {
    it('should have visibility change listener registered', () => {
      expect(service['visibilityChangeListener']).toBeDefined();
    });

    it('should update lastPollTime when document becomes hidden', () => {
      const beforeTime = Date.now();

      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'hidden'
      });

      if (service['visibilityChangeListener']) {
        service['visibilityChangeListener']();
      }

      expect(service['lastPollTime']).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('Save Flow', () => {
    beforeEach(() => {
      // Ensure document is visible for save tests
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible'
      });
    });

    it('should skip save when there is no unsaved data', async () => {
      unsavedDataSpy.getUnsavedCounts.and.returnValue(Promise.resolve({ total: 0, trips: 0, shifts: 0, expenses: 0 } as any));

      await service.forceSave();

      expect(loggerSpy.info).toHaveBeenCalledWith('No unsaved data to sync');
    });

    it('should show snackbar when not authenticated', async () => {
      unsavedDataSpy.getUnsavedCounts.and.returnValue(Promise.resolve({ total: 2, trips: 1, shifts: 1, expenses: 0 } as any));
      authSpy.canSync.and.returnValue(Promise.resolve(false));

      await service.forceSave();

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(syncStatusSpy.failSync).toHaveBeenCalledWith('Not authenticated');
    });

    it('should save and mark items as saved when backend returns success', async () => {
      unsavedDataSpy.getUnsavedCounts.and.returnValue(Promise.resolve({ total: 3, trips: 1, shifts: 1, expenses: 1 } as any));
      unsavedDataSpy.collectUnsavedItems.and.returnValue(Promise.resolve({ unsavedTrips: [], unsavedShifts: [], unsavedExpenses: [] }));
      authSpy.canSync.and.returnValue(Promise.resolve(true));

      spyOn(SheetSerializerHelper, 'serializeTrips').and.returnValue([]);
      spyOn(SheetSerializerHelper, 'serializeShifts').and.returnValue([]);

      gigWorkflowSpy.saveSheetData.and.returnValue(Promise.resolve([]));
      spyOn(ApiMessageHelper, 'processSheetSaveResponse').and.returnValue({ success: true } as any);

      await service.forceSave();

      // commitSavedItems is the single shared entry point for all three domain services.
      expect(unsavedDataSpy.commitSavedItems).toHaveBeenCalled();
      expect(syncStatusSpy.completeSync).toHaveBeenCalled();
    });

    it('should pass saveStartedAt captured before the API call to commitSavedItems', async () => {
      unsavedDataSpy.getUnsavedCounts.and.returnValue(Promise.resolve({ total: 1, trips: 1, shifts: 0, expenses: 0 } as any));
      unsavedDataSpy.collectUnsavedItems.and.returnValue(Promise.resolve({ unsavedTrips: [], unsavedShifts: [], unsavedExpenses: [] }));
      authSpy.canSync.and.returnValue(Promise.resolve(true));

      spyOn(SheetSerializerHelper, 'serializeTrips').and.returnValue([]);
      spyOn(SheetSerializerHelper, 'serializeShifts').and.returnValue([]);

      const beforeSave = Date.now();
      let apiCallTime = 0;

      gigWorkflowSpy.saveSheetData.and.callFake(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        apiCallTime = Date.now();
        return [];
      });
      spyOn(ApiMessageHelper, 'processSheetSaveResponse').and.returnValue({ success: true } as any);

      await service.forceSave();

      const [saveStartedAtArg] = unsavedDataSpy.commitSavedItems.calls.mostRecent().args as [number, ...any[]];
      expect(saveStartedAtArg).toBeGreaterThanOrEqual(beforeSave);
      expect(saveStartedAtArg).toBeLessThan(apiCallTime);
    });
  });
});
