import { Component, OnInit, signal } from '@angular/core';
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
import { ShiftHelper } from '@helpers/shift.helper';
import { firstValueFrom } from 'rxjs';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly destroyRef = inject(DestroyRef);
  private allShifts: IShift[] = [];
  shifts = signal<IShift[]>([]);
  duplicateShiftKeys = signal<Set<string>>(new Set());
  actionEnum = ActionEnum;
  saving = signal(false);
  unsavedShifts: IShift[] = [];
  unsavedData = signal(false);
  pageSize: number = 20; // Number of shifts to load per request
  currentPage = signal(0); // Current page index
  isLoading = signal(false); // Prevent multiple simultaneous requests
  noMoreData = signal(false); // Stop loading if all data is loaded
  showAddForm = signal(false); // Control the visibility of the add form
  defaultSheet = signal<ISpreadsheet | undefined>(undefined);
  demoSheetAttached = signal(false);

  editId = signal<string | null>(null); // ID of the shift being edited, if any

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
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.editId.set(params.get('id'));
    });

    this._shiftService.shifts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(shifts => {
        void this.syncShiftState(shifts);
      });

    this.unsavedDataService.unsavedData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hasUnsaved => this.unsavedData.set(hasUnsaved));

    await this.refreshDefaultSheetState();
  }

  async loadShifts(): Promise<void> {
    if (this.isLoading() || this.noMoreData()) return;

    this.isLoading.set(true);
    try {
      this.currentPage.update(page => page + 1);
      this.updateVisibleShifts();
    } finally {
      this.isLoading.set(false);
    }
  }

  private async syncShiftState(shifts: IShift[]): Promise<void> {
    this.allShifts = [...shifts].sort((left, right) => (right.rowId ?? 0) - (left.rowId ?? 0));
    this.duplicateShiftKeys.set(ShiftHelper.getDuplicateShiftKeys(this.allShifts));
    this.updateVisibleShifts();

    if (this.allShifts.length === 0 && !this.showAddForm() && !this.editId()) {
      setTimeout(() => {
        this.showAddForm.set(true);
      });
    }
  }

  private updateVisibleShifts(): void {
    const visiblePages = Math.max(this.currentPage(), 1);
    const visibleCount = visiblePages * this.pageSize;
    this.shifts.set(this.allShifts.slice(0, visibleCount));
    this.noMoreData.set(this.allShifts.length > 0 && visibleCount >= this.allShifts.length);
  }

  private async refreshDefaultSheetState(): Promise<void> {
    this.defaultSheet.set((await this._sheetService.querySpreadsheets('default', 'true'))[0]);
    this.demoSheetAttached.set(isDemoSheetName(this.defaultSheet()?.name));
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const threshold = ShiftsComponent.SCROLL_THRESHOLD_PX;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    if ((scrollTop + clientHeight >= scrollHeight - threshold || scrollPercentage >= 0.8) && !this.isLoading() && !this.noMoreData()) {
      void this.loadShifts();
    }
  }

  handleParentReload() {
    this.shifts.set([]); // Clear the shifts array
    this.currentPage.set(0); // Reset pagination
    this.noMoreData.set(false); // Reset noMoreData flag
    this.showAddForm.set(false);
    void this.loadShifts();
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

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.saveSheetDialog('save');
    }
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

    const dialogRef = this.dialog.open(DataSyncModalComponent, {
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
        // Show success message
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.CHANGES_SAVED_TO_SPREADSHEET, { action: 'Close', duration: 3000 });
    }
  }

  exitEditMode(shiftId?: string) {
    this.editId.set(null);
    this.router.navigate(['/shifts']);
    this.handleParentReload();
  }

  hideAddForm() {
    this.showAddForm.set(false);
  }
}