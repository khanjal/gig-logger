import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgIf, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from '@services/sheets/shift.service';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { ActionEnum } from '@enums/action.enum';
import { updateAction } from '@utils/action.utils';
import { ShiftTripsTableComponent } from '../shift-trips-table/shift-trips-table.component';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { DurationFormatPipe } from '@pipes/duration-format.pipe';
import { DateHelper } from '@helpers/date.helper';
import { UnitHelper } from '@helpers/unit.helper';

@Component({
    selector: 'app-shifts-quick-view',
    templateUrl: './shifts-quick-view.component.html',
    styleUrl: './shifts-quick-view.component.scss',
    standalone: true,
    imports: [
        MatIcon,
        NgClass,
        NgIf,
        ShiftTripsTableComponent,
        DecimalPipe,
        CurrencyPipe,
        DatePipe,
        NoSecondsPipe,
        DurationFormatPipe,
    ],
})
export class ShiftsQuickViewComponent {
  ActionEnum = ActionEnum;
  @Input() shift: IShift = {} as IShift;
  @Input() index!: number;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @Output() edit = new EventEmitter<IShift>();

  duplicateShift: boolean = false;
  isExpanded: boolean = false;
  prefers24Hour: boolean = false;

  constructor(
    public dialog: MatDialog,
    private shiftService: ShiftService,
    private _router: Router
  ) {}

  async ngOnInit() {
    await this.checkForDuplicates();
    this.prefers24Hour = DateHelper.prefers24Hour();
  }

  toggleExpansion() {
    this.isExpanded = !this.isExpanded;
  }

  async checkForDuplicates() {
    let shifts = await this.shiftService.queryShifts("key", this.shift.key);
    this.duplicateShift = shifts.length > 1;
  }

  async confirmDeleteShiftDialog(shift: IShift) {
    const message = `Shift will be deleted from your spreadsheet. Associated trips will not be deleted. Are you sure you want to delete this?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Delete";
    dialogData.message = message;
    dialogData.trueText = "Delete";
    dialogData.trueColor = "warn";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.deleteShift(shift);
      }
    });
  }

  async deleteShift(shift: IShift) {
    if (shift.action === ActionEnum.Add) {
      await this.shiftService.delete(shift.id!);
      await this.shiftService.updateShiftRowIds(shift.rowId);
    }
    else {
      updateAction(shift, ActionEnum.Delete);
      shift.saved = false;
      await this.shiftService.update([shift]);
    }

    this.parentReload.emit();
  }

  /**
   * Format distance for display with appropriate unit
   */
  formatDistance(distance: number): string {
    return UnitHelper.formatDistance(distance);
  }

  canDeleteShift(): boolean {
    // Enable delete if duplicateShift is true, or if both grandTotal and totalTrips are 0 or falsy
    return !!this.duplicateShift || (((this.shift.grandTotal === 0 || !this.shift.grandTotal) && (this.shift.totalTrips === 0 || !this.shift.totalTrips)));
  }

  canEditShift(): boolean {
    // Only allow edit if not deleted
    return this.shift && this.shift.action !== ActionEnum.Delete;
  }

  async editShift() {
    // Navigate to shift page with edit mode and shift rowId
    this._router.navigate(['/shifts/edit', this.shift.rowId]);
  }
}