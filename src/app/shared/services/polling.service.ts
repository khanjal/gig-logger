import { EventEmitter, Injectable, OnDestroy, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { SpreadsheetService } from './spreadsheet.service';
import { UnsavedDataService } from './unsaved-data.service';
import { LoggerService } from './logger.service';
import { GigWorkflowService } from './gig-workflow.service';
import { SyncStatusService } from './sync-status.service';
import { ISheetSavePayload } from '@interfaces/sheet-save-payload.interface';
import { ApiMessageHelper } from '@helpers/api-message.helper';
import { SheetSerializerHelper } from '@helpers/sheet-serializer.helper';
import { BehaviorSubject } from 'rxjs';
import { AuthGoogleService } from './auth-google.service';

const DEFAULT_INTERVAL = 60000; // 1 minute

@Injectable({
  providedIn: 'root'
})
export class PollingService implements OnDestroy {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  private worker: Worker | null = null;
  private fallbackTimer: number | null = null;
  private enabled = false;
  private processing = false;
  private currentInterval = DEFAULT_INTERVAL;
  private lastPollTime = 0;
  private lastSnackbarTime = 0;
  private visibilityChangeListener: (() => void) | null = null;
  private enabledState = new BehaviorSubject<boolean>(false);

  pollingEnabled$ = this.enabledState.asObservable();

  constructor(
    private _snackBar: MatSnackBar,
    private _sheetService: SpreadsheetService,
    private _unsavedDataService: UnsavedDataService,
    private _gigWorkflowService: GigWorkflowService,
    private _syncStatusService: SyncStatusService,
    private _logger: LoggerService,
    protected authService: AuthGoogleService
  ) {
    this.initializeWorker();
    this.setupVisibilityChangeListener();
  }

  // Use safe logging in case tests provide a partial/mock logger without all methods
  private safeLog(level: 'info' | 'warn' | 'error' | 'debug', ...args: any[]) {
    try {
      const fn = (this._logger as any)?.[level];
      if (typeof fn === 'function') {
        fn.apply(this._logger, args);
        return;
      }
    } catch (e) {
      // fall through to console fallback
    }

    // Fallback to console if LoggerService is missing the method (common in unit spies)
    switch (level) {
      case 'warn': console.warn(...args); break;
      case 'error': console.error(...args); break;
      case 'debug': console.debug(...args); break;
      default: console.info(...args); break;
    }
  }

  private initializeWorker() {
    if (typeof Worker === 'undefined') {
      this.safeLog('warn', 'Web Workers not supported, using fallback timer');
      return;
    }

    try {
      this.worker = new Worker('/assets/js/polling.worker.js');
      
      this.worker.onmessage = (event) => {
        const { type } = event.data;
        
        if (type === 'POLL_TRIGGER') {
          this.saveData();
        } else if (type === 'WORKER_READY') {
          this._logger.info('Polling worker ready');
        }
      };

      this.worker.onerror = (error) => {
        this.safeLog('error', 'Worker error:', error);
        this.worker = null;
      };

    } catch (error) {
      this.safeLog('error', 'Failed to create worker:', error);
      this.worker = null;
    }
  }

  private setupVisibilityChangeListener() {
    this.visibilityChangeListener = () => {
      if (document.visibilityState === 'visible') {
        this.handleVisibilityChange();
      } else {
        // App is being backgrounded, record the current time
        this.lastPollTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeListener);
  }

  private handleVisibilityChange() {
    if (!this.enabled || !this.lastPollTime) {
      return;
    }

    const now = Date.now();
    const timeSinceLastPoll = now - this.lastPollTime;
    const remainingInterval = Math.max(0, this.currentInterval - timeSinceLastPoll);

    this.safeLog('info', `App resumed. Time since last poll: ${timeSinceLastPoll}ms, remaining interval: ${remainingInterval}ms`);

    if (remainingInterval === 0) {
      // Interval has already passed, give 5 second grace period before syncing
      const gracePeriod = 5000; // 5 seconds
      this.safeLog('info', `Timer expired while backgrounded, syncing in ${gracePeriod}ms`);
      this.resumePolling(gracePeriod);
    } else {
      // Resume with the remaining interval
      this.resumePolling(remainingInterval);
    }
  }

  private resumePolling(initialDelay: number) {
    this.stopPolling();
    this.enabled = true;
    this.enabledState.next(true);

    if (this.worker) {
      // For web worker, we need to restart with the remaining delay
      this.worker.postMessage({
        type: 'START_POLLING',
        data: { interval: this.currentInterval, initialDelay }
      });
      this.startCountdown(initialDelay);
    } else {
      // For fallback timer, start with the remaining delay, then use normal interval
      setTimeout(() => {
        if (this.enabled && !this.processing) {
          this.saveData();
        }
        if (this.enabled) {
          this.fallbackTimer = window.setInterval(() => {
            if (this.enabled && !this.processing) {
              this.saveData();
            }
          }, this.currentInterval);
          this.startCountdown(this.currentInterval);
        }
      }, initialDelay);
      this.startCountdown(initialDelay);
    }
  }

  private restartPolling() {
    this.stopPolling();
    this.startPolling(this.currentInterval);
  }

  async startPolling(interval: number = DEFAULT_INTERVAL) {
    // Guard against multiple starts
    if (this.enabled) {
      this.safeLog('warn', 'Polling already enabled, skipping start');
      return;
    }

    this.enabled = true;
    this.currentInterval = interval;
    this.lastPollTime = Date.now();
    this.enabledState.next(true);
    this.safeLog('info', `Starting polling with interval: ${interval}ms`);

    if (this.worker) {
      this.worker.postMessage({
        type: 'START_POLLING',
        data: { interval }
      });
      this.startCountdown(interval);
    } else {
      // Fallback to setInterval
      this.fallbackTimer = window.setInterval(() => {
        if (this.enabled && !this.processing) {
          this.saveData();
        }
      }, interval);
      this.startCountdown(interval);
    }
  }

  stopPolling() {
    // Guard against multiple stops
    if (!this.enabled) {
      this.safeLog('warn', 'Polling already disabled, skipping stop');
      return;
    }

    this.enabled = false;
    this.enabledState.next(false);
    this.safeLog('info', 'Stopping polling');

    if (this.worker) {
      this.worker.postMessage({ type: 'STOP_POLLING' });
    }

    if (this.fallbackTimer !== null) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    this._syncStatusService.stopCountdown();
  }

  // Countdown logic for next sync
  private startCountdown(ms: number) {
    this._syncStatusService.startCountdown(ms);
  }

  private async saveData() {
    if (this.processing) {
      this.safeLog('info', 'Save already in progress, skipping');
      return;
    }

    // Check if document is visible before triggering sync
    if (document.visibilityState !== 'visible') {
      this.safeLog('info', 'App is not in focus, deferring sync until visible');
      return;
    }

    this.processing = true;

    try {
      // Get unsaved data counts first
      const counts = await this._unsavedDataService.getUnsavedCounts();
      
      if (counts.total === 0) {
        this._logger.info('No unsaved data to sync');
        return;
      }

      // Ensure we're authenticated and able to sync before attempting autosave
      try {
        const canSync = await this.authService.canSync();
        if (!canSync) {
          this.safeLog('info', 'Not authenticated - skipping autosave');
          // Throttle repeated snackbars so users aren't spammed if autosave runs frequently
          try {
            const now = Date.now();
            const THROTTLE_MS = 15 * 60 * 1000; // 15 minutes
            if (now - this.lastSnackbarTime > THROTTLE_MS) {
              this.lastSnackbarTime = now;
              openSnackbar(this._snackBar, SNACKBAR_MESSAGES.AUTO_SAVE_SKIPPED_NOT_AUTHENTICATED);
            }
          } catch (e) {
            // swallow snackbar errors to avoid breaking autosave
          }
          this._syncStatusService.failSync('Not authenticated');
          return;
        }
      } catch (err) {
        this.safeLog('warn', 'Auth check failed, skipping autosave', err);
        this._syncStatusService.failSync('Auth check failed');
        return;
      }

      this.safeLog('info', `Auto-saving ${counts.trips} trips, ${counts.shifts} shifts, and ${counts.expenses} expenses`);

      // Collect unsaved items once — reused for shift calculation, payload, and synced-ID tracking.
      const { unsavedTrips, unsavedShifts, unsavedExpenses } = await this._unsavedDataService.collectUnsavedItems();

      // Pre-calculate totals for unsaved shifts before saving
      if (unsavedShifts.length > 0) {
        try {
          await this._gigWorkflowService.calculateShiftTotals(unsavedShifts);
        } catch (e) {
          this.safeLog('warn', 'Pre-save shift calculation failed; proceeding with save');
        }
      }

      // Capture the save boundary after pre-save local mutations so records
      // recalculated for this save can still be marked saved on success.
      const saveStartedAt = Date.now();

      // Build the IDs that are included in this save cycle so the
      // post-save cleanup can promote Add→Update for any mid-flight edits.
      const syncedTripIds = new Set(unsavedTrips.filter(t => t.id !== undefined).map(t => t.id!));
      const syncedShiftIds = new Set(unsavedShifts.filter(s => s.id !== undefined).map(s => s.id!));
      const syncedExpenseIds = new Set(unsavedExpenses.filter(e => e.id !== undefined).map(e => e.id!));

      // Get actual unsaved data (use save payload wire-format)
      const sheetData = {} as ISheetSavePayload;
      const defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
      sheetData.properties = { id: defaultSheet.id, name: "" };
      
      // Apply serialization to convert 0 → null for input fields
      sheetData.trips = SheetSerializerHelper.serializeTrips(unsavedTrips);
      sheetData.shifts = SheetSerializerHelper.serializeShifts(unsavedShifts);
      sheetData.expenses = unsavedExpenses;

      // Start background sync with status updates
      this._syncStatusService.startSync('auto-save', counts.total);
      this._syncStatusService.addMessage(`Saving ${counts.total} item(s) to Google Sheets...`, 'info');

      // Perform the save operation
      const messages = await this._gigWorkflowService.saveSheetData(sheetData);
      
      // Process the response
      const result = ApiMessageHelper.processSheetSaveResponse(messages);

      if (result.success) {
        this.safeLog('info', 'Auto-save completed successfully');
        
        // Mark saved items using the save boundary so records edited during
        // the API call are not incorrectly cleared.
        await this._unsavedDataService.commitSavedItems(saveStartedAt, syncedTripIds, syncedShiftIds, syncedExpenseIds);
        
        // Add detailed success messages
        if (counts.trips > 0) {
          this._syncStatusService.addMessage(`Saved ${counts.trips} trip(s)`, 'info');
        }
        if (counts.shifts > 0) {
          this._syncStatusService.addMessage(`Saved ${counts.shifts} shift(s)`, 'info');
        }
        if (counts.expenses > 0) {
          this._syncStatusService.addMessage(`Saved ${counts.expenses} expense(s)`, 'info');
        }
        
        this._syncStatusService.completeSync(`Saved ${counts.total} item(s) successfully`);
        
        // Emit reload event for parent components
        this.parentReload.emit();
      } else {
        const errorMsg = result.errorMessage || 'Unknown error during save';
        
        this.safeLog('warn', 'Auto-save completed with errors:', errorMsg);
        this._syncStatusService.failSync(errorMsg);
        
        // Show snackbar for errors
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.AUTO_SAVE_COMPLETED_WITH_ERRORS, { action: "View Details" });
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.safeLog('error', 'Auto-save failed:', error);
      this._syncStatusService.failSync(errorMsg);
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.AUTO_SAVE_FAILED_UNSAVED);
    } finally {
      this.processing = false;
      // Only restart countdown if polling is still enabled
      if (this.enabled) {
        this.startCountdown(this.currentInterval);
      }
    }
  }

  // Public methods
  isPollingEnabled(): boolean {
    return this.enabled;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  async forceSave(): Promise<boolean> {
    const wasProcessing = this.processing;
    await this.saveData();
    return !wasProcessing;
  }

  ngOnDestroy() {
    this.stopPolling();
    
    if (this.visibilityChangeListener) {
      document.removeEventListener('visibilitychange', this.visibilityChangeListener);
      this.visibilityChangeListener = null;
    }
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.fallbackTimer !== null) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }
}