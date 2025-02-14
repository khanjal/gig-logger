import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { timer, Subscription } from 'rxjs';
import { GigLoggerService } from './gig-logger.service';
import { ShiftService } from './shift.service';
import { TripService } from './trip.service';
import { SpreadsheetService } from './spreadsheet.service';

const INTERVAL = 60000;

@Injectable()
export class PollingService implements OnDestroy {

  private timerSubscription: Subscription | undefined;
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
    this.processing = true;
    await this.saveData();
    await this.verifyData();
    this.processing = false;

    this.timerSubscription = timer(0, INTERVAL) // Emit value immediately, then every 1 second
      .subscribe(async () => {
        console.log(`Processing: ${this.processing}`);

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
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      console.log('Timer stopped');
    }
  }

  async saveData() {
    let maxShiftId = await this._shiftService.getMaxShiftId();
    let maxTripId = await this._tripService.getMaxTripId();

    console.log('Max shift ID:', maxShiftId);
    console.log('Max trip ID:', maxTripId);

    // Get unsaved trips    
    let unsavedTrips = (await this._tripService.getUnsavedTrips());
    console.log('Unsaved trips:', unsavedTrips.length);

    // Save new, updated, and then deleted trips

    // Save unsaved trips
    // await this._tripService.saveUnsavedTrips();

    // Get unsaved shifts
    let unsavedShifts = (await this._shiftService.getUnsavedShifts());
    console.log('Unsaved shifts:', unsavedShifts.length);

    // Save unsaved shifts
    // await this._shiftService.saveUnsavedShifts();

    this._snackBar.open("Trip(s) Saved to Spreadsheet");
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