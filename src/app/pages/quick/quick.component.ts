import { Component, OnInit, ViewChild } from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TripModel } from '@models/trip.model';
import { AddressHelper } from '@helpers/address.helper';
import { GoogleSheetService } from '@services/googleSheet.service';
import { QuickFormComponent } from './quick-form/quick-form.component';
import { TripService } from '@services/trip.service';
import { ShiftService } from '@services/shift.service';
import { TripHelper } from '@helpers/trip.helper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ITrip } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';
import { CurrentDayAverageComponent } from '@components/current-day-average/current-day-average.component';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit {
  @ViewChild(QuickFormComponent) form:QuickFormComponent | undefined;
  @ViewChild(CurrentDayAverageComponent) average:CurrentDayAverageComponent | undefined;

  clearing: boolean = false;
  reloading: boolean = false;
  saving: boolean = false;

  savedTrips: TripModel[] = [];
  sheetTrips: TripModel[] = [];
  unsavedTrips: TripModel[] = [];

  sheetId: string = "";

  constructor(
      public dialog: MatDialog,
      private _snackBar: MatSnackBar,
      private _router: Router, 
      private _googleService: GoogleSheetService,
      private _sheetService: SpreadsheetService,
      private _shiftService: ShiftService,
      private _tripService: TripService
    ) { }

  async ngOnInit(): Promise<void> {
    await this.load();
    this.sheetId = (await this._sheetService.querySpreadsheets("default", "true"))[0].id;
  }

  async saveAllTrips() {
    console.time("saving");
    console.log('Saving...');
    
    this.saving = true;
    await this._googleService.commitUnsavedShifts();
    await this._googleService.commitUnsavedTrips();
    // await this._googleService.loadRemoteData();
    await this.reload();
    this.saving = false;

    console.log('Saved!');
    console.timeEnd("saving");

    this._snackBar.open("Trip(s) saved to spreadsheet");
  }

  public async load() {
    this.sheetTrips = TripHelper.sortTripsDesc(await this._tripService.getRemoteTripsPreviousDays(7));
    this.unsavedTrips = (await this._tripService.queryLocalTrips("saved", "false")).reverse();
    this.savedTrips = (await this._tripService.queryLocalTrips("saved", "true")).reverse();

    // console.log(this.form);

    await this.average?.load();
  }

  async saveLocalTrip(trip: ITrip) {
    this.saving = true;
    await this._googleService.commitUnsavedTrips();
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
      this.form?.load();
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
      height: "175px",
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
      height: "200px",
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

  async setDropoffTime(trip: ITrip) {
    // TODO: Check if dropoff time is already set and prompt to overwrite
    trip.dropoffTime = DateHelper.getTimeString(new Date);
    await this._tripService.updateLocalTrip(trip);
  }

  async deleteUnsavedLocalTrip(trip: ITrip) {
    await this._tripService.deleteLocal(trip.id!);

    // TODO: Delete local shifts with no trips.

    await this.load();
    this.form?.load();
  }

  async clearSavedLocalData() {
    let savedShifts = await this._shiftService.queryLocalShifts("saved", "true");
    savedShifts.forEach(shift => {
      this._shiftService.deleteLocal(shift.id!);
    });

    let savedTrips = await this._tripService.queryLocalTrips("saved", "true");
    savedTrips.forEach(trip => {
      this._tripService.deleteLocal(trip.id!);
    });

    this.load();
  }

  async reload() {
    this.reloading = true;
    await this._googleService.loadRemoteData();

    await this.load();
    this.reloading = false;
    // window.location.reload();
  }

  public getShortAddress(address: string): string {
    return AddressHelper.getShortAddress(address);
  }

  

}
