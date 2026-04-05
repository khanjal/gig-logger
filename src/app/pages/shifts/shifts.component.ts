import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { isDemoSheetName } from '@constants/sheet.constants';
import { UI_MESSAGES } from '@constants/ui-message.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { AuthGoogleService } from '@services/auth-google.service';
import { ActionEnum } from '@enums/action.enum';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from '@services/sheets/shift.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { NgClass, NgIf } from '@angular/common';
import { ShiftsQuickViewComponent } from '@components/shifts/shifts-quick-view/shifts-quick-view.component';
import { ShiftFormComponent } from '@components/shifts/shift-form/shift-form.component';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseFabButtonComponent } from '@components/base/base-fab-button/base-fab-button.component';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import type { ISpreadsheet } from '@interfaces/spreadsheet.interface';

@Component({
    selector: 'app-shifts',
    templateUrl: './shifts.component.html',
    styleUrls: ['./shifts.component.scss'],
    standalone: true,
    imports: [NgClass, NgIf, ShiftsQuickViewComponent, ShiftFormComponent, BaseFabButtonComponent, BaseRectButtonComponent]
})
export class ShiftsComponent implements OnInit {
  private static readonly SCROLL_THRESHOLD_PX = 200;
  protected readonly uiMessages = UI_MESSAGES;
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
  defaultSheet: ISpreadsheet | undefined;
  demoSheetAttached: boolean = false;

  editId: string | null = null; // ID of the shift being edited, if any

  constructor(
    public dialog: MatDialog, 
    private _shiftService: ShiftService,
    private _sheetService: SpreadsheetService,
    private unsavedDataService: UnsavedDataService,
    private _snackBar: MatSnackBar,
    private router: Router, 
    private route: ActivatedRoute,
    protected authService: AuthGoogleService
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
    try {
      // Use 'rowId' as the sort field and 'desc' for reverse order
      const newShifts = await this._shiftService.paginate(this.currentPage, this.pageSize, 'rowId', 'desc');
      if (newShifts.length < this.pageSize) {
        this.noMoreData = true;
      }
      this.shifts = [...this.shifts, ...newShifts]; // Append new shifts to the list
      this.currentPage++;
      this.unsavedData = await this.unsavedDataService.hasUnsavedData();
      this.defaultSheet = (await this._sheetService.querySpreadsheets('default', 'true'))[0];
      this.demoSheetAttached = isDemoSheetName(this.defaultSheet?.name);
      // If there are no shifts at all, open the add form by default so users can create one.
      if ((this.shifts ?? []).length === 0) {
        this.showAddForm = true;
      }
    } finally {
      this.isLoading = false;
    }
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
    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOGIN_TO_SYNC_CHANGES, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    let dialogRef = this.dialog.open(DataSyncModalComponent, {
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
        if (result) {
            // Show success message
            openSnackbar(this._snackBar, SNACKBAR_MESSAGES.CHANGES_SAVED_TO_SPREADSHEET, { action: 'Close', duration: 3000 });
            
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