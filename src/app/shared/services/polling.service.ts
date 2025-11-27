import { EventEmitter, Injectable, OnDestroy, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpreadsheetService } from './spreadsheet.service';
import { UnsavedDataService } from './unsaved-data.service';
import { TripService } from './sheets/trip.service';
import { ShiftService } from './sheets/shift.service';
import { ExpensesService } from './sheets/expenses.service';
import { LoggerService } from './logger.service';
import { GigWorkflowService } from './gig-workflow.service';
import { SyncStatusService } from './sync-status.service';
import { ISheet } from '@interfaces/sheet.interface';
import { ApiMessageHelper } from '@helpers/api-message.helper';

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
  private visibilityChangeListener: (() => void) | null = null;

  constructor(
    private _snackBar: MatSnackBar,
    private _sheetService: SpreadsheetService,
    private _tripService: TripService,
    private _shiftService: ShiftService,
    private _expensesService: ExpensesService,
    private _unsavedDataService: UnsavedDataService,
    private _gigWorkflowService: GigWorkflowService,
    private _syncStatusService: SyncStatusService,
    private _logger: LoggerService
  ) {
    this.initializeWorker();
    this.setupVisibilityChangeListener();
  }

  private initializeWorker() {
    if (typeof Worker === 'undefined') {
      this._logger.warn('Web Workers not supported, using fallback timer');
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
        this._logger.error('Worker error:', error);
        this.worker = null;
      };

    } catch (error) {
      this._logger.error('Failed to create worker:', error);
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

    this._logger.info(`App resumed. Time since last poll: ${timeSinceLastPoll}ms, remaining interval: ${remainingInterval}ms`);

    if (remainingInterval === 0) {
      // Interval has already passed, give 5 second grace period before syncing
      const gracePeriod = 5000; // 5 seconds
      this._logger.info(`Timer expired while backgrounded, syncing in ${gracePeriod}ms`);
      this.resumePolling(gracePeriod);
    } else {
      // Resume with the remaining interval
      this.resumePolling(remainingInterval);
    }
  }

  private resumePolling(initialDelay: number) {
    this.stopPolling();
    this.enabled = true;

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
      this._logger.warn('Polling already enabled, skipping start');
      return;
    }

    this.enabled = true;
    this.currentInterval = interval;
    this.lastPollTime = Date.now();
    this._logger.info(`Starting polling with interval: ${interval}ms`);

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
      this._logger.warn('Polling already disabled, skipping stop');
      return;
    }

    this.enabled = false;
    this._logger.info('Stopping polling');

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
      return;
    }

    // Check if document is visible before triggering sync
    if (document.visibilityState !== 'visible') {
      this._logger.info('App is not in focus, deferring sync until visible');
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

      this._logger.info(`Auto-saving ${counts.trips} trips, ${counts.shifts} shifts, and ${counts.expenses} expenses`);

      // Get actual unsaved data
      const sheetData = {} as ISheet;
      const defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
      sheetData.properties = { id: defaultSheet.id, name: "" };
      sheetData.trips = await this._tripService.getUnsaved();
      sheetData.shifts = await this._shiftService.getUnsavedShifts();
      sheetData.expenses = await this._expensesService.getUnsaved();

      // Start background sync with status updates
      this._syncStatusService.startSync('auto-save', counts.total);
      this._syncStatusService.addMessage(`Saving ${counts.total} item(s) to Google Sheets...`, 'info');

      // Perform the save operation
      const messages = await this._gigWorkflowService.saveSheetData(sheetData);
      
      // Process the response
      const result = ApiMessageHelper.processSheetSaveResponse(messages);

      if (result.success) {
        this._logger.info('Auto-save completed successfully');
        
        // Mark all items as saved in local database after successful save
        await this._unsavedDataService.markAllAsSaved();
        
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
        
        this._logger.warn('Auto-save completed with errors:', errorMsg);
        this._syncStatusService.failSync(errorMsg);
        
        // Show snackbar for errors
        this._snackBar.open("Auto-save completed with errors", "View Details", { duration: 5000 });
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('Auto-save failed:', error);
      this._syncStatusService.failSync(errorMsg);
      this._snackBar.open("Auto-save failed - data remains unsaved", undefined, { duration: 5000 });
    } finally {
      this.processing = false;
      // Restart countdown for next sync
      this.startCountdown(this.currentInterval);
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