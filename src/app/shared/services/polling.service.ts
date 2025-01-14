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

  constructor(
        private _snackBar: MatSnackBar,
        private _sheetService: SpreadsheetService,
        private _gigLoggerService: GigLoggerService,
        private _shiftService: ShiftService,
        private _tripService: TripService,
      ) { }

  async startPolling() {
    await this.saveData();
    await this.verifyData();
    this.timerSubscription = timer(0, INTERVAL) // Emit value immediately, then every 1 second
      .subscribe(async () => {
        // Functions to call
        await this.saveData();
        console.log('Timer tick');
      });
  }

  stopPolling() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      console.log('Timer stopped');
    }
  }

  async saveData() {
    // Get unsaved trips    
    let unsavedTrips = (await this._tripService.getUnsavedTrips());
    console.log('Unsaved trips:', unsavedTrips.length);

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