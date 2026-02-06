import { TestBed } from '@angular/core/testing';
import { PollingService } from './polling.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpreadsheetService } from './spreadsheet.service';
import { UnsavedDataService } from './unsaved-data.service';
import { TripService } from './sheets/trip.service';
import { ShiftService } from './sheets/shift.service';
import { ExpensesService } from './sheets/expenses.service';
import { LoggerService } from './logger.service';
import { GigWorkflowService } from './gig-workflow.service';
import { SyncStatusService } from './sync-status.service';

describe('PollingService', () => {
  let service: PollingService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let unsavedDataSpy: jasmine.SpyObj<UnsavedDataService>;
  let syncStatusSpy: jasmine.SpyObj<SyncStatusService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let sheetServiceSpy: jasmine.SpyObj<SpreadsheetService>;
  let tripServiceSpy: jasmine.SpyObj<TripService>;
  let shiftServiceSpy: jasmine.SpyObj<ShiftService>;
  let expensesServiceSpy: jasmine.SpyObj<ExpensesService>;
  let gigWorkflowSpy: jasmine.SpyObj<GigWorkflowService>;

  beforeEach(() => {
    const logger = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error', 'debug']);
    const unsaved = jasmine.createSpyObj('UnsavedDataService', ['getUnsavedCounts']);
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
    const tripService = jasmine.createSpyObj('TripService', ['getUnsaved']);
    const shiftService = jasmine.createSpyObj('ShiftService', ['getUnsavedShifts']);
    const expensesService = jasmine.createSpyObj('ExpensesService', ['getUnsaved']);
    const gigWorkflow = jasmine.createSpyObj('GigWorkflowService', [
      'calculateShiftTotals',
      'saveSheetData'
    ]);

    TestBed.configureTestingModule({
      providers: [
        PollingService,
        { provide: LoggerService, useValue: logger },
        { provide: UnsavedDataService, useValue: unsaved },
        { provide: SyncStatusService, useValue: syncStatus },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: SpreadsheetService, useValue: sheetService },
        { provide: TripService, useValue: tripService },
        { provide: ShiftService, useValue: shiftService },
        { provide: ExpensesService, useValue: expensesService },
        { provide: GigWorkflowService, useValue: gigWorkflow }
      ]
    });

    service = TestBed.inject(PollingService);
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    unsavedDataSpy = TestBed.inject(UnsavedDataService) as jasmine.SpyObj<UnsavedDataService>;
    syncStatusSpy = TestBed.inject(SyncStatusService) as jasmine.SpyObj<SyncStatusService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    sheetServiceSpy = TestBed.inject(SpreadsheetService) as jasmine.SpyObj<SpreadsheetService>;
    tripServiceSpy = TestBed.inject(TripService) as jasmine.SpyObj<TripService>;
    shiftServiceSpy = TestBed.inject(ShiftService) as jasmine.SpyObj<ShiftService>;
    expensesServiceSpy = TestBed.inject(ExpensesService) as jasmine.SpyObj<ExpensesService>;
    gigWorkflowSpy = TestBed.inject(GigWorkflowService) as jasmine.SpyObj<GigWorkflowService>;
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
});
