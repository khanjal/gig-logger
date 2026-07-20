import type { OnInit, OnChanges, SimpleChanges} from '@angular/core';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgClass, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { SplitDialogComponent } from '@components/trips/split-dialog/split-dialog.component';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { MatChipsModule } from '@angular/material/chips';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseButtonDirective } from '@directives/base-button.directive';

import { ActionEnum } from '@enums/action.enum';
import type { IConfirmDialog } from '@interfaces/ui/confirm-dialog.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DateHelper } from '@helpers/date.helper';
import { DATE_FORMATS } from '@constants/date.constants';
import { UnitHelper } from '@helpers/unit.helper';
import { updateAction } from '@utils/action.utils';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';

import { DurationFormatPipe } from '@pipes/duration-format.pipe';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { AddressLineBreakPipe } from '@pipes/address-line-break.pipe';

@Component({
    selector: 'app-trips-quick-view',
    templateUrl: './trips-quick-view.component.html',
    styleUrls: ['./trips-quick-view.component.scss'],
    standalone: true,
    imports: [MatIcon, NgClass, MatMenuTrigger, MatMenu, MatMenuItem, DecimalPipe, CurrencyPipe, DatePipe, NoSecondsPipe, ShortAddressPipe, TruncatePipe, DurationFormatPipe, MatChipsModule, BaseRectButtonComponent, BaseButtonDirective, AddressLineBreakPipe]
})

export class TripsQuickViewComponent implements OnInit, OnChanges {
  public dialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  private _gigLoggerService = inject(GigWorkflowService);
  private _tripService = inject(TripService);
  private _shiftService = inject(ShiftService);
  private _router = inject(Router);

  @Input() public trip: ITrip = {} as ITrip;
  @Input() public showActions = true;
  @Input() public inlineMode = false;
  @Input() public index = 0;
  @Input() public stripeEven?: boolean;
  @Output() public parentReload = new EventEmitter<void>();
  @Output() public pollingToggle = new EventEmitter<boolean>();
  @Output() public scrollToTrip = new EventEmitter<string | undefined>();
  @Output() public editClicked = new EventEmitter<ITrip>();
  public actionEnum = ActionEnum;
  public isExpanded = false;
  public prefers24Hour = false;
  // Parsed date and computed format for display
  public parsedTripDate: Date | null = null;
  public dateFormat: string = DATE_FORMATS.SHORT_DATE;
  
  // Distance unit properties
  public get distanceUnit(): string {
    return UnitHelper.getPreferredDistanceUnit();
  }
  
  public get distanceDisplay(): string {
    return UnitHelper.formatDistance(this.trip.distance);
  }
      
  /**
   * Convert distance value based on unit preference
   * Delegates to UnitHelper for consistency across the app
   */
  public convertDistance(distance: number): number {
    return UnitHelper.convertDistance(distance);
  }
  
  /**
   * Format distance for display with appropriate unit
   */
  public formatDistance(distance: number): string {
    return UnitHelper.formatDistance(distance);
  }
  
  /**
   * Demo method to toggle between units (for future use)
   * This shows how unit switching would work when user preferences are implemented
   */
  public toggleDistanceUnit(): void {
    const currentUnit = UnitHelper.getPreferredDistanceUnit();
    const newUnit = currentUnit === 'mi' ? 'km' : 'mi';
    UnitHelper.setPreferredDistanceUnit(newUnit);
    // Note: This won't persist yet since user preferences aren't implemented
    // but it demonstrates the intended functionality
  }

  public ngOnInit() {
    this.setExpansionState();
    this.prefers24Hour = DateHelper.prefers24Hour();
    this.updateDateFormat();
  }

  public ngOnChanges(changes: SimpleChanges) {
    // Re-evaluate expansion state when trip data changes
    if (changes['trip'] && changes['trip'].currentValue) {
      this.setExpansionState();
      this.updateDateFormat();
    }
  }

  private updateDateFormat() {
    if (!this.trip || !this.trip.date) {
      this.parsedTripDate = null;
      return;
    }

    // Trip dates are stored as YYYY-MM-DD; parse locally to avoid timezone shifts
    try {
      this.parsedTripDate = DateHelper.parseLocalDate(this.trip.date);
      const tripYear = this.parsedTripDate.getFullYear();
      const now = new Date();
      this.dateFormat = tripYear === now.getFullYear() ? DATE_FORMATS.SHORT_DATE : DATE_FORMATS.SHORT_DATE_WITH_YEAR;
    } catch {
      this.parsedTripDate = null;
      this.dateFormat = DATE_FORMATS.SHORT_DATE;
    }
  }

  private setExpansionState() {
    this.isExpanded = (!this.trip.dropoffTime && !this.trip.exclude);
  }

  /**
   * Determine stripe parity: external override → loop index → rowId fallback
   */
  public get isEvenStripe(): boolean {
    if (this.stripeEven !== undefined) {
      return this.stripeEven;
    }

    if (this.index !== undefined && this.index !== null) {
      return this.index % 2 === 0;
    }

    const rowId = this.trip?.rowId ?? 0;
    return rowId % 2 === 0;
  }

  public toggleExpansion() {
    this.isExpanded = !this.isExpanded;
  }

  public async restoreTrip() {
    updateAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);

    const shift = await this._shiftService.queryShiftByKey(this.trip.key);
    if (shift) {
      updateAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }
  }

  public confirmDeleteTripDialog() {
    const message = `Trip may not be saved to your spreadsheet. Are you sure you want to delete this?`;

    const dialogData: IConfirmDialog = {} as IConfirmDialog;
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
  
  public async cloneUnsavedTrip() {
  await this._tripService.clone(this.trip);
   this.parentReload.emit();
    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.CLONED_TRIP);
   // Scroll to today's trips section
   this.scrollToTrip.emit(undefined);
  }

  public async splitTrip() {
    const dialogRef = this.dialog.open(SplitDialogComponent, { 
      width: '360px',
      panelClass: 'split-trip-dialog'
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) return;
    await this._tripService.split(this.trip, result);
    await this._gigLoggerService.calculateShiftTotalsByKey(this.trip.key);

    this.parentReload.emit();
    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.TRIP_SPLIT);
    this.scrollToTrip.emit(undefined);
  }
  
  public async nextStopTrip() {
    await this._tripService.addNext(this.trip);
    this.parentReload.emit();
    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.ADDED_NEXT_TRIP);
    // Scroll to today's trips section
    this.scrollToTrip.emit(undefined);
  }

  public async setDropoffTime() {
    const dropOffTime = DateHelper.getTimeString(new Date);

    const shift = (await this._shiftService.query("key", this.trip.key))[0];
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

  public async setPickupTime() {
    const pickupTime = DateHelper.getTimeString(new Date);

    const shift = (await this._shiftService.query("key", this.trip.key))[0];
    if (shift) {
      shift.finish = pickupTime;
      updateAction(shift, ActionEnum.Update);
      await this._shiftService.update([shift]);
    }

    this.trip.pickupTime = pickupTime;
    updateAction(this.trip, ActionEnum.Update);
    await this._tripService.update([this.trip]);
  }

  
  public async deleteTrip() {
    await this._tripService.deleteItem(this.trip);
    await this._gigLoggerService.calculateShiftTotalsByKey(this.trip.key);

    this.parentReload.emit();
  }

  public async editTrip() {
    // Emit edit event for parent components to handle (e.g., closing dialogs)
    this.editClicked.emit(this.trip);
    // Only navigate when not embedded inline
    if (!this.inlineMode) {
      this._router.navigate(['/trips/edit', this.trip.rowId]);
    }
  }
}
