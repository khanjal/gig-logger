import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass, NgIf, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { ActionEnum } from '@enums/action.enum';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DateHelper } from '@helpers/date.helper';
import { UnitHelper } from '@helpers/unit.helper';
import { updateAction } from '@utils/action.utils';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';

import { DurationFormatPipe } from '@pipes/duration-format.pipe';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';

@Component({
    selector: 'trips-quick-view',
    templateUrl: './trips-quick-view.component.html',
    styleUrls: ['./trips-quick-view.component.scss'],
    standalone: true,
    imports: [MatIcon, NgClass, NgIf, MatMenuTrigger, MatMenu, MatMenuItem, DecimalPipe, CurrencyPipe, DatePipe, NoSecondsPipe, ShortAddressPipe, TruncatePipe, DurationFormatPipe, MatChipsModule]
})

export class TripsQuickViewComponent implements OnInit, OnChanges {
  @Input() trip: ITrip = {} as ITrip;
  @Input() showActions: boolean = true;
  @Input() index: number = 0;
  @Input() stripeEven?: boolean;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @Output("pollingToggle") pollingToggle: EventEmitter<boolean> = new EventEmitter();
  @Output("scrollToTrip") scrollToTrip: EventEmitter<string | undefined> = new EventEmitter();
  @Output("editClicked") editClicked: EventEmitter<ITrip> = new EventEmitter();
  actionEnum = ActionEnum;
  isExpanded: boolean = false;
  prefers24Hour: boolean = false;
  
  // Distance unit properties
  get distanceUnit(): string {
    return UnitHelper.getPreferredDistanceUnit();
  }
  
  get distanceDisplay(): string {
    return UnitHelper.formatDistance(this.trip.distance);
  }
  
  constructor(
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private _gigLoggerService: GigWorkflowService,
        private _tripService: TripService,
        private _shiftService: ShiftService,
        private _router: Router,
      ) { }
      
  /**
   * Convert distance value based on unit preference
   * Delegates to UnitHelper for consistency across the app
   */
  convertDistance(distance: number): number {
    return UnitHelper.convertDistance(distance);
  }
  
  /**
   * Format distance for display with appropriate unit
   */
  formatDistance(distance: number): string {
    return UnitHelper.formatDistance(distance);
  }
  
  /**
   * Demo method to toggle between units (for future use)
   * This shows how unit switching would work when user preferences are implemented
   */
  toggleDistanceUnit(): void {
    const currentUnit = UnitHelper.getPreferredDistanceUnit();
    const newUnit = currentUnit === 'mi' ? 'km' : 'mi';
    UnitHelper.setPreferredDistanceUnit(newUnit);
    // Note: This won't persist yet since user preferences aren't implemented
    // but it demonstrates the intended functionality
  }

  ngOnInit() {
    this.setExpansionState();
    this.prefers24Hour = DateHelper.prefers24Hour();
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

  /**
   * Determine stripe parity: external override → loop index → rowId fallback
   */
  get isEvenStripe(): boolean {
    if (this.stripeEven !== undefined) {
      return this.stripeEven;
    }

    if (this.index !== undefined && this.index !== null) {
      return this.index % 2 === 0;
    }

    const rowId = this.trip?.rowId ?? 0;
    return rowId % 2 === 0;
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

    let shift = (await this._shiftService.query("key", this.trip.key))[0];
    if (shift) {
      shift.finish = dropOffTime;
      updateAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }

    this.trip.dropoffTime = dropOffTime;
    await this._gigLoggerService.updateTripDuration(this.trip);
    
    this.isExpanded = false;
    
    // Emit the trip rowId to scroll to this specific trip (matches the HTML id attribute)
    this.scrollToTrip.emit(this.trip.rowId?.toString());
    // Notify parent to reload and update unsaved state
    this.parentReload.emit();
  }

  async setPickupTime() {
    let pickupTime = DateHelper.getTimeString(new Date);

    let shift = (await this._shiftService.query("key", this.trip.key))[0];
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
    await this._tripService.deleteItem(this.trip);

    const shift = await this._shiftService.queryShiftByKey(this.trip.key);
    if (shift) {
      await this._gigLoggerService.calculateShiftTotals([shift]);
    }

    this.parentReload.emit();
  }

  async editTrip() {
    // Emit edit event for parent components to handle (e.g., closing dialogs)
    this.editClicked.emit(this.trip);
    
    // Navigate to trips page with edit mode and trip rowId
    this._router.navigate(['/trips/edit', this.trip.rowId]);
  }
}
