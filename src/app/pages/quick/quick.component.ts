import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DateHelper } from '@helpers/date.helper';

import { ActionEnum } from '@enums/action.enum';

import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ITrip, updateTripAction } from '@interfaces/trip.interface';

import { GigLoggerService } from '@services/gig-logger.service';
import { PollingService } from '@services/polling.service';
import { TripService } from '@services/trip.service';
import { ShiftService } from '@services/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

import { CurrentAverageComponent } from '@components/current-average/current-average.component';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { QuickFormComponent } from './quick-form/quick-form.component';
import { TripsTableGroupComponent } from '@components/trips-table-group/trips-table-group.component';
import { LoadModalComponent } from '@components/load-modal/load-modal.component';
import { SaveModalComponent } from '@components/save-modal/save-modal.component';

import { environment } from 'src/environments/environment';
import { Observable, Subscription } from 'rxjs';
import { updateShiftAction } from '@interfaces/shift.interface';

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit, OnDestroy {
  @ViewChild(QuickFormComponent) form:QuickFormComponent | undefined;
  @ViewChild(CurrentAverageComponent) average:CurrentAverageComponent | undefined;
  @ViewChild(TripsTableGroupComponent) tripsTable:TripsTableGroupComponent | undefined;

  demoSheetId = environment.demoSheet;

  clearing: boolean = false;
  reloading: boolean = false;
  saving: boolean = false;
  pollingEnabled: boolean = false;

  savedTrips: ITrip[] = [];
  recentTrips: ITrip[] = [];
  unsavedTrips: ITrip[] = [];

  defaultSheet: ISpreadsheet | undefined;
  actionEnum = ActionEnum;
  parentReloadSubscription!: Subscription;

  constructor(
      public dialog: MatDialog,
      private _snackBar: MatSnackBar,
      private _gigLoggerService: GigLoggerService,
      private _sheetService: SpreadsheetService,
      private _shiftService: ShiftService,
      private _tripService: TripService,
      private _viewportScroller: ViewportScroller,
      private _pollingService: PollingService
    ) { }

  ngOnDestroy(): void {
    this._pollingService.stopPolling();
  }

  async ngOnInit(): Promise<void> {
    await this.load();
    this.defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
    this.parentReloadSubscription = this._pollingService.parentReload.subscribe(async () => {
      await this.reload();
    });
  }

  public async load() {
    this.unsavedTrips = (await this._tripService.getUnsavedTrips()).reverse();
    this.recentTrips = (await this._tripService.getTripsPreviousDays(1)).reverse();
    // this.savedTrips = (await this._tripService.getSavedTrips()).reverse();

    // console.log(this.form);

    await this.average?.load();
    await this.form?.load();
    await this.tripsTable?.load();
  }

  async saveTrip(trip: ITrip) {
    this.saving = true;
    // await this._googleService.commitUnsavedTrips();
    await this.reload("recentTrips");
    this.saving = false;
  }

  async editUnsavedTrip(trip: ITrip) {
    this.stopPolling();
    let dialogRef = this.dialog.open(QuickFormComponent, {
      data: trip,
      height: '600px',
      width: '500px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(async result => {
      await this.load();
      await this.form?.load();
      this._viewportScroller.scrollToAnchor(trip.rowId.toString());
      
      if (this.pollingEnabled) {
        await this.startPolling();
      }
    });
    }

    async loadSheetDialog() {
        let dialogRef = this.dialog.open(LoadModalComponent, {
            height: '400px',
            width: '500px',
            panelClass: 'custom-modalbox'
        });

        dialogRef.afterClosed().subscribe(async result => {

            if (result) {
                await this.reload("recentTrips");
            }
        });
    }

    async saveSheetDialog() {
        let dialogRef = this.dialog.open(SaveModalComponent, {
            height: '400px',
            width: '500px',
            panelClass: 'custom-modalbox'
        });

        dialogRef.afterClosed().subscribe(async result => {

            if (result) {
                await this._tripService.saveUnsavedTrips();
                await this._shiftService.saveUnsavedShifts();
                this._snackBar.open("Trip(s) Saved to Spreadsheet");

                await this.reload("recentTrips");
                this._viewportScroller.scrollToAnchor("recentTrips");
            }
        });
    }
  
  async confirmDeleteTripDialog(trip: ITrip) {
    const message = `Trip may not be saved to your spreadsheet. Are you sure you want to delete this?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Delete";
    dialogData.message = message;
    dialogData.trueText = "Delete";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.deleteUnsavedTrip(trip);
      }
    });
  }
  
  async confirmSaveTripsDialog() {
    const message = `This will save all changes to your spreadsheet. This process will take less than a minute.`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Save";
    dialogData.message = message;
    dialogData.trueText = "Save";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.saveSheetDialog();
      }
    });
  }

  async confirmLoadTripsDialog() {
    this.stopPolling();
    const message = `This will load all changes from your spreadsheet. This process will take less than a minute.`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Load";
    dialogData.message = message;
    dialogData.trueText = "Load";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.loadSheetDialog();
      }

      if (this.pollingEnabled) {
        await this.startPolling();
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

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.unsaveData();
      }
    });
  }

  async setPickupTime(trip: ITrip) {
    let pickupTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.queryShifts("key", trip.key))[0];
    if (shift) {
      shift.finish = pickupTime;
      updateShiftAction(shift, ActionEnum.Update);
      await this._shiftService.updateShift(shift);
    }

    trip.pickupTime = pickupTime;
    updateTripAction(trip, ActionEnum.Update);
    await this._tripService.updateTrip(trip);
    this.reload();
  }

  async setDropoffTime(trip: ITrip) {
    let dropOffTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.queryShifts("key", trip.key))[0];
    if (shift) {
      shift.finish = dropOffTime;
      updateShiftAction(shift, ActionEnum.Update);
      await this._shiftService.updateShift(shift);
    }

    trip.dropoffTime = dropOffTime;
    let duration = DateHelper.getDurationSeconds(trip.pickupTime, trip.dropoffTime);
    trip.duration = DateHelper.getDurationString(duration);

    if (trip.total && duration) {
      trip.amountPerTime = trip.total / DateHelper.getHoursFromSeconds(duration);
    }
    updateTripAction(trip, ActionEnum.Update);
    await this._tripService.updateTrip(trip);

    this.reload();
  }

  async cloneUnsavedTrip(trip: ITrip) {
    delete trip.id;
    trip.rowId = await this._tripService.getMaxTripId() + 1;
    updateTripAction(trip, ActionEnum.Add);
    await this._tripService.addTrip(trip);
    await this.load();
    this._viewportScroller.scrollToAnchor("unsavedTrips");
    this._snackBar.open("Cloned Trip");
  }

  async nextUnsavedTrip(trip: ITrip) {
    let nextTrip = {} as ITrip;
    updateTripAction(nextTrip, ActionEnum.Add);
    nextTrip.rowId = await this._tripService.getMaxTripId() + 1;
    nextTrip.key = trip.key;
    nextTrip.date = trip.date;
    nextTrip.region = trip.region;
    nextTrip.service = trip.service;
    nextTrip.number = trip.number;
    nextTrip.place = trip.place;
    nextTrip.type = trip.type;
    nextTrip.startAddress = trip.startAddress;
    nextTrip.pickupTime = trip.dropoffTime;
    await this._tripService.addTrip(nextTrip);
    await this.load();
    this._viewportScroller.scrollToAnchor("unsavedTrips");
    this._snackBar.open("Added Next Trip");
  }

  async deleteUnsavedTrip(trip: ITrip) {
    if (trip.action === ActionEnum.Add) {
      await this._tripService.deleteTrip(trip.id!);
      await this._tripService.updateTripRowIds(trip.rowId);
    }
    else {
      updateTripAction(trip, ActionEnum.Delete);
      trip.saved = false;
      await this._tripService.updateTrip(trip);
    }

    const shift = await this._shiftService.queryShiftByKey(trip.key);
    await this._gigLoggerService.calculateShiftTotals([shift]);

    await this.load();
    await this.form?.load();
  }

  async unsaveData() {
    let savedTrips = await this._tripService.getSavedTrips();

    for (let trip of savedTrips) {
      trip.saved = false;
      await this._tripService.updateTrip(trip);
    };

    await this.load();
  }

  async reload(anchor?: string) {
    let sheetId = this.defaultSheet?.id;
    if (!sheetId) {
      return;
    }

    this.reloading = true;

    await this.load();
    await this._gigLoggerService.calculateShiftTotals();

    this.reloading = false;

    if (anchor) {
      this._viewportScroller.scrollToAnchor(anchor);
    }
  }

  async changePolling() {
    this.pollingEnabled = !this.pollingEnabled;

    if (this.pollingEnabled) {
      await this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  async startPolling() {
    console.log('Starting polling');
    this._pollingService.stopPolling();
    await this._pollingService.startPolling();
  }

  stopPolling() {
    console.log('Stopping polling');
    this._pollingService.stopPolling();
  }
}
