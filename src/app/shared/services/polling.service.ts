import { EventEmitter, Injectable, OnDestroy, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GigWorkflowService } from './gig-workflow.service';
import { ShiftService } from './sheets/shift.service';
import { TripService } from './sheets/trip.service';
import { SpreadsheetService } from './spreadsheet.service';
import { LoggerService } from './logger.service';
import { ISheet } from '@interfaces/sheet.interface';

const DEFAULT_INTERVAL = 60000; // 1 minute

@Injectable({
  providedIn: 'root'
})
export class PollingService implements OnDestroy {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  private worker: Worker | null = null;
  private fallbackTimer: any = null;
  private enabled = false;
  private processing = false;

  constructor(
    private _snackBar: MatSnackBar,
    private _sheetService: SpreadsheetService,
    private _gigLoggerService: GigWorkflowService,
    private _shiftService: ShiftService,
    private _tripService: TripService,
    private _logger: LoggerService
  ) {
    this.initializeWorker();
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

  async startPolling(interval: number = DEFAULT_INTERVAL) {
    this.enabled = true;
    this._logger.info('Starting polling');

    if (this.worker) {
      this.worker.postMessage({
        type: 'START_POLLING',
        data: { interval }
      });
    } else {
      // Fallback to setInterval
      this.fallbackTimer = setInterval(() => {
        if (this.enabled && !this.processing) {
          this.saveData();
        }
      }, interval);
    }
  }

  stopPolling() {
    this.enabled = false;
    this._logger.info('Stopping polling');

    if (this.worker) {
      this.worker.postMessage({ type: 'STOP_POLLING' });
    }

    if (this.fallbackTimer) {
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
      const postResult = await this._gigLoggerService.postSheetData(sheetData);
      if (!postResult) {
        this._snackBar.open("Error saving data to spreadsheet", undefined, { duration: 5000 });
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
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }
}