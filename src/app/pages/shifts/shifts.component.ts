import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data-sync-modal/data-sync-modal.component';
import { ActionEnum } from '@enums/action.enum';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from '@services/sheets/shift.service';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent implements OnInit {
  shifts: IShift[] = [];
  actionEnum = ActionEnum;
  saving: boolean = false;
  unsavedShifts: IShift[] = [];
  pageSize: number = 20; // Number of shifts to load per request
  currentPage: number = 0; // Current page index
  isLoading: boolean = false; // Prevent multiple simultaneous requests

  constructor(public dialog: MatDialog, private _shiftService: ShiftService) { }

  async ngOnInit(): Promise<void> {
    await this.loadShifts();
  }

  async loadShifts(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    const newShifts = await this._shiftService.paginate(this.currentPage, this.pageSize);
    this.shifts = [...this.shifts, ...newShifts]; // Append new shifts to the list
    this.currentPage++;
    this.isLoading = false;
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;

    // Check if the user has scrolled to the bottom
    if (target.scrollTop + target.clientHeight >= target.scrollHeight-100) {
      this.loadShifts();
    }
  }

  handleParentReload() {
    this.shifts = []; // Clear the shifts array
    this.currentPage = 0; // Reset pagination
    this.loadShifts();
  }

  async confirmSaveDialog() {
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

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if(result) {
        await this.saveSheetDialog('save');
      }
    });
  }
  
  addShift() {
    throw new Error('Method not implemented.');
  }

  async saveSheetDialog(inputValue: string) {
    let dialogRef = this.dialog.open(DataSyncModalComponent, {
        height: '400px',
        width: '500px',
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {

        if (result) {
            // await this._tripService.saveUnsavedTrips();
            // await this._shiftService.saveUnsavedShifts();
            // this._snackBar.open("Trip(s) Saved to Spreadsheet");

            // await this.reload("todaysTrips");
            // this._viewportScroller.scrollToAnchor("todaysTrips");
        }
    });
  }
}