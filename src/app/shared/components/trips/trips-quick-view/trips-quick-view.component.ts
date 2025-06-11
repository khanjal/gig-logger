import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';
import { ActionEnum } from '@enums/action.enum'; 
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TripFormComponent } from '@components/trips/trip-form/trip-form.component';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { DateHelper } from '@helpers/date.helper';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { updateAction } from '@utils/action.utils';
import { MatIcon } from '@angular/material/icon';
import { NgClass, NgIf, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { MatFabButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';

@Component({
    selector: 'trips-quick-view',
    templateUrl: './trips-quick-view.component.html',
    styleUrls: ['./trips-quick-view.component.scss'],    standalone: true,
    imports: [MatIcon, NgClass, NgIf, MatFabButton, MatMenuTrigger, MatMenu, MatMenuItem, DecimalPipe, CurrencyPipe, DatePipe, NoSecondsPipe, ShortAddressPipe, TruncatePipe]
})

export class TripsQuickViewComponent implements OnInit, OnChanges {
  @Input() trip: ITrip = {} as ITrip;
  @Input() showActions: boolean = true;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @Output("pollingToggle") pollingToggle: EventEmitter<boolean> = new EventEmitter();
  @Output("scrollToTrip") scrollToTrip: EventEmitter<string | undefined> = new EventEmitter();
  actionEnum = ActionEnum;
  isExpanded: boolean = false;
  
  constructor(
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private _gigLoggerService: GigWorkflowService,
        private _tripService: TripService,
        private _shiftService: ShiftService,
      ) { }  ngOnInit() {
    this.setExpansionState();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Re-evaluate expansion state when trip data changes
    if (changes['trip'] && changes['trip'].currentValue) {
      this.setExpansionState();
    }
  }

  private setExpansionState() {
    this.isExpanded = (!this.trip.dropoffTime && !this.trip.exclude);
  }

  toggleExpansion() {
    this.isExpanded = !this.isExpanded;
  }

  async restoreTrip() {
    updateAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);

    const shift = await this._shiftService.queryShiftByKey(this.trip.key);
    if (shift) {
      updateAction(shift, ActionEnum.Update);
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
   // Scroll to today's trips section
   this.scrollToTrip.emit(undefined);
  }
  
  async nextStopTrip() {
    await this._tripService.addNext(this.trip);
    this.parentReload.emit();
    this._snackBar.open("Added Next Trip");
    // Scroll to today's trips section
    this.scrollToTrip.emit(undefined);
  }

  async setDropoffTime() {
    let dropOffTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.queryShifts("key", this.trip.key))[0];
    if (shift) {
      shift.finish = dropOffTime;
      updateAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }

    this.trip.dropoffTime = dropOffTime;
    let duration = DateHelper.getDurationSeconds(this.trip.pickupTime, this.trip.dropoffTime);
    this.trip.duration = DateHelper.getDurationString(duration);

    if (this.trip.total && duration) {
      this.trip.amountPerTime = this.trip.total / DateHelper.getHoursFromSeconds(duration);
    }
    
    updateAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);
    this.isExpanded = false;
    
    // Emit the trip ID to scroll to this specific trip
    this.scrollToTrip.emit(this.trip.id?.toString());
  }

  async setPickupTime() {
    let pickupTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.queryShifts("key", this.trip.key))[0];
    if (shift) {
      shift.finish = pickupTime;
      updateAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }

    this.trip.pickupTime = pickupTime;
    updateAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);
  }

  
  async deleteTrip() {
    if (this.trip.action === ActionEnum.Add) {
      await this._tripService.delete(this.trip.id!);
      await this._tripService.updateRowIds(this.trip.rowId);
    }
    else {
      updateAction(this.trip, ActionEnum.Delete);
      this.trip.saved = false;
      await this._tripService.update([this.trip]);
    }

    const shift = await this._shiftService.queryShiftByKey(this.trip.key);
    if (shift) {
      await this._gigLoggerService.calculateShiftTotals([shift]);
    }

    this.parentReload.emit();
  }

  async openTripDialog() {
    this.pollingToggle.emit(false);
    let dialogRef = this.dialog.open(TripFormComponent, {
      data: this.trip,
      height: '600px',
      width: '500px',
      panelClass: 'custom-modalbox',
      position: {
        top: '25px' // Adjust this value to position the dialog higher
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      this.pollingToggle.emit(true);
      this.parentReload.emit();
    });
  }
}
