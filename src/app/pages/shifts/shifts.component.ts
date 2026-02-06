import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { ActionEnum } from '@enums/action.enum';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from '@services/sheets/shift.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgClass, NgIf } from '@angular/common';
import { ShiftsQuickViewComponent } from '@components/shifts/shifts-quick-view/shifts-quick-view.component';
import { ShiftFormComponent } from '@components/shifts/shift-form/shift-form.component';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-shifts',
    templateUrl: './shifts.component.html',
    styleUrls: ['./shifts.component.scss'],
    standalone: true,
    imports: [MatMiniFabButton, MatIcon, NgClass, NgIf, ShiftsQuickViewComponent, ShiftFormComponent]
})
export class ShiftsComponent implements OnInit {
  private static readonly SCROLL_THRESHOLD_PX = 200;
  shifts: IShift[] = [];
  actionEnum = ActionEnum;
  saving: boolean = false;
  unsavedShifts: IShift[] = [];
  unsavedData: boolean = false;
  pageSize: number = 20; // Number of shifts to load per request
  currentPage: number = 0; // Current page index
  isLoading: boolean = false; // Prevent multiple simultaneous requests
  noMoreData: boolean = false; // Stop loading if all data is loaded
  showAddForm = false; // Control the visibility of the add form

  editId: string | null = null; // ID of the shift being edited, if any

  constructor(
    public dialog: MatDialog, 
    private _shiftService: ShiftService,
    private unsavedDataService: UnsavedDataService,
    private _snackBar: MatSnackBar,
    private router: Router, 
    private route: ActivatedRoute
  ) { }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(params => {
      this.editId = params.get('id');
    });
    await this.loadShifts();
  }

  async loadShifts(): Promise<void> {
    if (this.isLoading || this.noMoreData) return;

    this.isLoading = true;
    // Use 'rowId' as the sort field and 'desc' for reverse order
    const newShifts = await this._shiftService.paginate(this.currentPage, this.pageSize, 'rowId', 'desc');
    if (newShifts.length < this.pageSize) {
      this.noMoreData = true;
    }
    this.shifts = [...this.shifts, ...newShifts]; // Append new shifts to the list
    this.currentPage++;
    this.isLoading = false;
    this.unsavedData = await this.unsavedDataService.hasUnsavedData();
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const threshold = ShiftsComponent.SCROLL_THRESHOLD_PX;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    if ((scrollTop + clientHeight >= scrollHeight - threshold || scrollPercentage >= 0.8) && !this.isLoading && !this.noMoreData) {
      this.loadShifts();
    }
  }

  handleParentReload() {
    this.shifts = []; // Clear the shifts array
    this.currentPage = 0; // Reset pagination
    this.noMoreData = false; // Reset noMoreData flag
    this.showAddForm = false;
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
    this.router.navigate(['/shifts/edit', 'new']); // 'new' for creating a new shift
  }

  editShift(shiftId: string) {
    this.router.navigate(['/shifts/edit', shiftId]); // Navigate to edit route with shift ID
  }

  async saveSheetDialog(inputValue: string) {
    let dialogRef = this.dialog.open(DataSyncModalComponent, {
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
        if (result) {
            // Show success message
            this._snackBar.open("Changes Saved to Spreadsheet", "Close", { duration: 3000 });
            
            // Refresh the page to show updated state
            this.handleParentReload();
        }
    });
  }

  exitEditMode(shiftId?: string) {
    this.editId = null;
    this.router.navigate(['/shifts']);
    this.handleParentReload();
  }

  hideAddForm() {
    this.showAddForm = false;
  }
}