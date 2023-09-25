import { Component, OnInit, ViewChild } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import { QuickFormComponent } from './quick-form/quick-form.component';
import { TripService } from '@services/trip.service';
import { ShiftService } from '@services/shift.service';
import { TripHelper } from '@helpers/trip.helper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ITrip } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';
import { CurrentAverageComponent } from '@components/current-average/current-average.component';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { WeekdayService } from '@services/weekday.service';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ViewportScroller } from '@angular/common';
import { GigLoggerService } from '@services/gig-logger.service';
import { ISheet } from '@interfaces/sheet.interface';

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit {
  @ViewChild(QuickFormComponent) form:QuickFormComponent | undefined;
  @ViewChild(CurrentAverageComponent) average:CurrentAverageComponent | undefined;

  clearing: boolean = false;
  reloading: boolean = false;
  saving: boolean = false;

  savedTrips: ITrip[] = [];
  sheetTrips: ITrip[] = [];
  unsavedTrips: ITrip[] = [];

  defaultSheet: ISpreadsheet | undefined;

  constructor(
      public dialog: MatDialog,
      private _snackBar: MatSnackBar,
      private _gigLoggerService: GigLoggerService,
      private _sheetService: SpreadsheetService,
      private _shiftService: ShiftService,
      private _tripService: TripService,
      private _weekdayService: WeekdayService,
      private _viewportScroller: ViewportScroller
    ) { }

  async ngOnInit(): Promise<void> {
    await this.load();
    this.defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
  }

  async saveAllTrips() {
    if (!this.defaultSheet?.id) {
      this._snackBar.open("Please Reload Manually");
      return;
    }

    console.time("saving");
    console.log('Saving...');
    
    this.saving = true;
    // await this._googleService.commitUnsavedShifts();
    // await this._googleService.commitUnsavedTrips();
    let sheetData = {} as ISheet;
    sheetData.shifts = await this._shiftService.getUnsavedLocalShifts();
    sheetData.trips = await this._tripService.getUnsavedLocalTrips();

    // TODO: Look into sending to AWS SQS
    (await this._gigLoggerService.warmupLambda(this.defaultSheet.id)).subscribe(async () => { // Warmup lambda to use less time to save.
      (await this._gigLoggerService.postSheetData(sheetData, this.defaultSheet!.id))
        .subscribe(async () => {
          await this._tripService.saveUnsavedTrips();
          await this._shiftService.saveUnsavedShifts();

          console.log('Saved!');
          console.timeEnd("saving");

          this._viewportScroller.scrollToAnchor("savedLocalTrips");
          this._snackBar.open("Trip(s) Saved to Spreadsheet");

          await this._sheetService.loadSpreadsheetData();
          await this.load();
          this.saving = false;
        });
      }
    );
  }

  public async load() {
    this.sheetTrips = TripHelper.sortTripsDesc((await this._tripService.getRemoteTripsPreviousDays(7)));
    this.unsavedTrips = (await this._tripService.getUnsavedLocalTrips()).reverse();
    this.savedTrips = (await this._tripService.getSavedLocalTrips()).reverse();

    // console.log(this.form);

    await this.average?.load();
    await this.form?.load();
  }

  async saveLocalTrip(trip: ITrip) {
    this.saving = true;
    // await this._googleService.commitUnsavedTrips();
    await this.reload();
    this.saving = false;
  }

  async editUnsavedLocalTrip(trip: ITrip) {
    let dialogRef = this.dialog.open(QuickFormComponent, {
      data: trip,
      height: '600px',
      width: '500px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(async result => {
      await this.load();
      await this.form?.load();
    });
  }
  
  async confirmDeleteTripDialog(trip: ITrip) {
    const message = `This may not be saved to your spreadsheet. Are you sure you want to delete this?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Delete";
    dialogData.message = message;
    dialogData.trueText = "Delete";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async dialogResult => {
      let result = dialogResult;

      if(result) {
        await this.deleteUnsavedLocalTrip(trip);
      }
    });
  }
  
  async confirmSaveTripsDialog() {
    const message = `This will save all trips to your spreadsheet and you will have to make further changes there. Are you sure you want to save?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Save";
    dialogData.message = message;
    dialogData.trueText = "Save";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async dialogResult => {
      let result = dialogResult;

      if(result) {
        await this.saveAllTrips();
      }
    });
  }

  async confirmUnsaveTripsDialog() {
    const message = `This will revert all local saved trips to unsaved status. If you save these trips again they may cause duplicates. Do you want to reset to unsaved status?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Unsaved Status";
    dialogData.message = message;
    dialogData.trueText = "Set Unsaved";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async dialogResult => {
      let result = dialogResult;

      if(result) {
        await this.unsaveLocalData();
      }
    });
  }

  async confirmClearTripsDialog() {
    const message = `This will clear all local saved trips. Only clear these if you have confirmed they are in your spreadheet. Are you sure you want to clear?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Clear";
    dialogData.message = message;
    dialogData.trueText = "Clear";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async dialogResult => {
      let result = dialogResult;

      if(result) {
        await this.clearSavedLocalData();
      }
    });
  }

  async setDropoffTime(trip: ITrip) {
    let dropOffTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.queryLocalShifts("key", trip.key))[0];
    if (shift) {
      shift.finish = dropOffTime;
      shift.time = DateHelper.getDuration(shift.start, shift.finish);
      await this._shiftService.updateLocalShift(shift);
    }

    trip.dropoffTime = dropOffTime;
    trip.duration = DateHelper.getDuration(trip.pickupTime, trip.dropoffTime);
    await this._tripService.updateLocalTrip(trip);
  }

  async cloneUnsavedLocalTrip(trip: ITrip) {
    delete trip.id;
    await this._tripService.addTrip(trip);
    await this.load();
    this._viewportScroller.scrollToAnchor("unsavedTrips");
    this._snackBar.open("Cloned Trip");
  }

  async deleteUnsavedLocalTrip(trip: ITrip) {
    await this._tripService.deleteLocal(trip.id!);

    // Update shift numbers & weekday current amount.
    await this._gigLoggerService.calculateTotals();

    await this.load();
    await this.form?.load();
  }

  async clearSavedLocalData() {
    let savedShifts = await this._shiftService.getSavedLocalShifts();
    savedShifts.forEach(shift => {
      this._shiftService.deleteLocal(shift.id!);
    });

    let savedTrips = await this._tripService.getSavedLocalTrips();
    savedTrips.forEach(trip => {
      this._tripService.deleteLocal(trip.id!);
    });

    await this.load();
  }

  async unsaveLocalData() {
    let savedTrips = await this._tripService.getSavedLocalTrips();

    savedTrips.forEach(async trip => {
      trip.saved = false;
      await this._tripService.updateLocalTrip(trip);
    });

    await this.load();
  }

  async reload() {
    let sheetId = this.defaultSheet?.id;
    if (!sheetId) {
      return;
    }

    this.reloading = true;

    await this._sheetService.loadSpreadsheetData();

    // Update shift numbers & weekday current amount.
    await this._gigLoggerService.calculateTotals();
    
    await this.load();

    this.reloading = false;
    this._viewportScroller.scrollToAnchor("addTrip");
  }
}
