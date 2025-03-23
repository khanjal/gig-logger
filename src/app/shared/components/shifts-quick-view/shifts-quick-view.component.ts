import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { IShift, updateShiftAction } from '@interfaces/shift.interface';
import { NoSecondsPipe } from "@pipes/no-seconds.pipe";
import { ShiftTripsTableComponent } from "@components/shift-trips-table/shift-trips-table.component";
import { ShiftService } from '@services/shift.service';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DataSyncModalComponent } from '@components/data-sync-modal/data-sync-modal.component';
import { ActionEnum } from '@enums/action.enum';

@Component({
  selector: 'app-shifts-quick-view',
  templateUrl: './shifts-quick-view.component.html',
  styleUrl: './shifts-quick-view.component.scss',
  // imports: [CommonModule, MatCardModule, MatIconModule, NoSecondsPipe, ShiftTripsTableComponent]
})
export class ShiftsQuickViewComponent {
  @Input() shift: IShift = {} as IShift;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  duplicateShift: boolean = false;

  constructor(public dialog: MatDialog, private shiftService: ShiftService) {}

  async ngOnInit() {
    await this.checkForDuplicates();
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
        updateShiftAction(shift, ActionEnum.Delete);
        await this.shiftService.updateShift(shift);
        await this.saveSheetDialog('save');
      }
    });
  }

  async saveSheetDialog(inputValue: string) {
    let dialogRef = this.dialog.open(DataSyncModalComponent, {
        height: '400px',
        width: '500px',
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
          await this.shiftService.saveUnsavedShifts();
          this.parentReload.emit(); // Emit the event to notify the parent to reload
      }
    });
  }
}