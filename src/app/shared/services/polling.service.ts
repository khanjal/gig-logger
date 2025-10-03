import { EventEmitter, Injectable, OnDestroy, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GigWorkflowService } from './gig-workflow.service';
import { ShiftService } from './sheets/shift.service';
import { TripService } from './sheets/trip.service';
import { SpreadsheetService } from './spreadsheet.service';
import { LoggerService } from './logger.service';
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
    private _gigLoggerService: GigWorkflowService,
    private _shiftService: ShiftService,
    private _tripService: TripService,
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
      // Interval has already passed, save immediately and restart polling
      this.saveData();
      this.restartPolling();
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
        }
      }, initialDelay);
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
    } else {
      // Fallback to setInterval
      this.fallbackTimer = window.setInterval(() => {
        if (this.enabled && !this.processing) {
          this.saveData();
        }
      }, interval);
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
  }

  private async saveData() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      // Get unsaved data
      const sheetData = {} as ISheet;
      const defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
      sheetData.properties = { id: defaultSheet.id, name: "" };
      sheetData.trips = await this._tripService.getUnsaved();
      sheetData.shifts = await this._shiftService.getUnsavedShifts();

      if (sheetData.trips.length === 0 && sheetData.shifts.length === 0) {
        return;
      }

      this._logger.info(`Saving ${sheetData.trips.length} trips and ${sheetData.shifts.length} shifts`);

      // Warm up lambda
      const warmupResult = await this._sheetService.warmUpLambda();
      if (!warmupResult) {
        this._logger.error('Lambda warmup failed');
        return;
      }

      // Save to spreadsheet
      const messages = await this._gigLoggerService.postSheetData(sheetData);
      
      // Process the response using the helper
      const result = ApiMessageHelper.processSheetSaveResponse(messages);
      
      if (!result.success) {
        this._snackBar.open(`Error saving data: ${result.errorMessage}`, undefined, { duration: 5000 });
        return;
      }

      // Mark as saved
      await this._tripService.saveUnsaved(sheetData.trips);
      await this._shiftService.saveUnsavedShifts(sheetData.shifts);

      this._snackBar.open("Data saved to spreadsheet", undefined, { duration: 3000 });
      this.parentReload.emit();
      
      this._logger.info('Data saved successfully');

    } catch (error) {
      this._logger.error('Save failed:', error);
      this._snackBar.open("Save failed - data remains unsaved", undefined, { duration: 5000 });
    } finally {
      this.processing = false;
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