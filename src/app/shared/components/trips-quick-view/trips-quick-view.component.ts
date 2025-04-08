import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ITrip, updateTripAction } from '@interfaces/trip.interface';
import { ActionEnum } from '@enums/action.enum'; 
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TripFormComponent } from '@components/trip-form/trip-form.component';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { updateShiftAction } from '@interfaces/shift.interface';
import { DateHelper } from '@helpers/date.helper';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { GigLoggerService } from '@services/gig-logger.service';

@Component({
  selector: 'trips-quick-view',
  templateUrl: './trips-quick-view.component.html',
  styleUrls: ['./trips-quick-view.component.scss']
})

export class TripsQuickViewComponent {
  @Input() trip: ITrip = {} as ITrip;
  @Input() showActions: boolean = true;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @Output("pollingToggle") pollingToggle: EventEmitter<boolean> = new EventEmitter();

  actionEnum = ActionEnum;

  constructor(
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private _gigLoggerService: GigLoggerService,
        private _tripService: TripService,
        private _shiftService: ShiftService,
      ) { }

  async restoreTrip() {
    updateTripAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);

    const shift = await this._shiftService.queryShiftByKey(this.trip.key);
    if (shift) {
      updateShiftAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }
  }

  confirmDeleteTripDialog() {
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
        await this.deleteTrip();
      }
    });
  }

  async cloneUnsavedTrip() {
   await this._tripService.clone(this.trip);
   this.parentReload.emit();
   this._snackBar.open("Cloned Trip");
  }

  async nextUnsavedTrip() {
    await this._tripService.addNext(this.trip);
    this.parentReload.emit();
    this._snackBar.open("Added Next Trip");
  }

  async setDropoffTime() {
    let dropOffTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.queryShifts("key", this.trip.key))[0];
    if (shift) {
      shift.finish = dropOffTime;
      updateShiftAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }

    this.trip.dropoffTime = dropOffTime;
    let duration = DateHelper.getDurationSeconds(this.trip.pickupTime, this.trip.dropoffTime);
    this.trip.duration = DateHelper.getDurationString(duration);

    if (this.trip.total && duration) {
      this.trip.amountPerTime = this.trip.total / DateHelper.getHoursFromSeconds(duration);
    }
    updateTripAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);
  }

  async setPickupTime() {
    let pickupTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.queryShifts("key", this.trip.key))[0];
    if (shift) {
      shift.finish = pickupTime;
      updateShiftAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }

    this.trip.pickupTime = pickupTime;
    updateTripAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);
  }

  
  async deleteTrip() {
    if (this.trip.action === ActionEnum.Add) {
      await this._tripService.delete(this.trip.id!);
      await this._tripService.updateRowIds(this.trip.rowId);
    }
    else {
      updateTripAction(this.trip, ActionEnum.Delete);
      this.trip.saved = false;
      await this._tripService.update([this.trip]);
    }

    const shift = await this._shiftService.queryShiftByKey(this.trip.key);
    if (shift) {
      await this._gigLoggerService.calculateShiftTotals([shift]);
    }

    this.parentReload.emit();
  }

  async editTrip() {
    this.pollingToggle.emit(false);
    let dialogRef = this.dialog.open(TripFormComponent, {
      data: this.trip,
      height: '600px',
      width: '500px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(async result => {
      this.pollingToggle.emit(true);
      this.parentReload.emit();
    });
  }
}
