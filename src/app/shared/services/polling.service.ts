import { EventEmitter, Injectable, OnDestroy, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { timer, Subscription } from 'rxjs';
import { GigLoggerService } from './gig-logger.service';
import { ShiftService } from './shift.service';
import { TripService } from './trip.service';
import { SpreadsheetService } from './spreadsheet.service';
import { ISheet } from '@interfaces/sheet.interface';

const INTERVAL = 15000;

@Injectable()
export class PollingService implements OnDestroy {
@Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  private timerSubscription: Subscription | undefined;
  private enablePolling = false;
  private processing = false;

  constructor(
        private _snackBar: MatSnackBar,
        private _sheetService: SpreadsheetService,
        private _gigLoggerService: GigLoggerService,
        private _shiftService: ShiftService,
        private _tripService: TripService,
      ) { }

  async startPolling() {
    // Do intial check to see if there are any unsaved trips or shifts
    this.enablePolling = true;

    this.timerSubscription = timer(0, INTERVAL) // Emit value immediately, then every 1 second
      .subscribe(async () => {
        console.log(`Processing: ${this.processing}`);

        // Failsafe to stop polling if it's disabled
        if (this.timerSubscription && !this.enablePolling) {
          console.log('Forcing timer stop');
          this.timerSubscription.unsubscribe();
        }

        // If already processing, don't do anything
        if (this.processing) {
          return;
        }
        this.processing = true;
        // Functions to call
        await this.saveData();
        console.log('Timer tick');
        this.processing = false;
      });
  }

  stopPolling() {
    this.enablePolling = false;
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      console.log('Timer stopped');
    }
  }

  async saveData() {
    let sheetData = {} as ISheet;
    let defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
    sheetData.properties = {id: defaultSheet.id, name: ""};

    // Get unsaved    
    sheetData.trips = await this._tripService.getUnsavedTrips();
    sheetData.shifts = await this._shiftService.getUnsavedShifts();
    
    console.log('Unsaved trips:', sheetData.trips.length);
    console.log('Unsaved shifts:', sheetData.shifts.length);

    if (sheetData.trips.length == 0 && sheetData.shifts.length == 0) {
      return;
    }

    let warmupResult = await this._sheetService.warmUpLambda();
    if (!warmupResult) {
      return;
    }

    console.log('Saving data');

    // Post data to Google Sheets
    let postResult = await this._gigLoggerService.postSheetData(sheetData);
    if (!postResult) {
      return
    }

    // Save unsaved data
    await this._tripService.saveUnsavedTrips(sheetData.trips);
    await this._shiftService.saveUnsavedShifts(sheetData.shifts);

    this._snackBar.open("Trip(s) Saved to Spreadsheet");
    this.parentReload.emit();
  }

  async verifyData() {
    console.log('Verifying data');
    let result = await this._sheetService.warmUpLambda();
    console.log('Lambda warm up result:', result);
    // Check to make sure all the trips and shifts are stored locally
    
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe(); // Stop the timer when service is destroyed
    }
  }
}