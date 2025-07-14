import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { ActionEnum } from '@enums/action.enum';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from '@services/sheets/shift.service';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgClass, DatePipe, NgIf } from '@angular/common';
import { ShiftsQuickViewComponent } from '@components/shifts/shifts-quick-view/shifts-quick-view.component';
import { ShiftFormComponent } from '@components/shifts/shift-form/shift-form.component';

@Component({
    selector: 'app-shifts',
    templateUrl: './shifts.component.html',
    styleUrls: ['./shifts.component.scss'],
    standalone: true,
    imports: [MatMiniFabButton, MatIcon, NgClass, DatePipe, NgIf, ShiftsQuickViewComponent, ShiftFormComponent]
})
export class ShiftsComponent implements OnInit {
  private static readonly SCROLL_THRESHOLD_PX = 200;
  shifts: IShift[] = [];
  actionEnum = ActionEnum;
  saving: boolean = false;
  unsavedShifts: IShift[] = [];
  pageSize: number = 20; // Number of shifts to load per request
  currentPage: number = 0; // Current page index
  isLoading: boolean = false; // Prevent multiple simultaneous requests
  noMoreData: boolean = false; // Stop loading if all data is loaded
  showAddForm = false; // Control the visibility of the add form

  // Floating date for the shift currently at the top of the list
  currentVisibleDate: string | null = null;

  constructor(public dialog: MatDialog, private _shiftService: ShiftService) { }

  async ngOnInit(): Promise<void> {
    await this.loadShifts();
    this.setCurrentVisibleDate();
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
    this.setCurrentVisibleDate();
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    // Check if the user has scrolled to near the bottom (within threshold or 80% of the way)
    const threshold = ShiftsComponent.SCROLL_THRESHOLD_PX;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    if ((scrollTop + clientHeight >= scrollHeight - threshold || scrollPercentage >= 0.8) && !this.isLoading && !this.noMoreData) {
      this.loadShifts();
    }
    this.setCurrentVisibleDate();
  }

  setCurrentVisibleDate(): void {
    // Find the first shift whose card is visible in the scrollable container
    setTimeout(() => {
      const container = document.querySelector('.shifts-scrollable');
      if (!container) return;
      const cards = Array.from(container.querySelectorAll('[id]')) as HTMLElement[];
      const containerRect = container.getBoundingClientRect();
      let found = null;
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (rect.bottom > containerRect.top + 40) { // 40px offset for sticky bar
          found = card;
          break;
        }
      }
      if (found) {
        const idx = cards.indexOf(found);
        const shift = this.shifts[idx];
        this.currentVisibleDate = shift?.date ? shift.date : null;
      } else {
        this.currentVisibleDate = null;
      }
    }, 10);
  }

  handleParentReload() {
    this.shifts = []; // Clear the shifts array
    this.currentPage = 0; // Reset pagination
    this.noMoreData = false; // Reset noMoreData flag
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
            // Future: Implement save to spreadsheet functionality
        }
    });
  }

  exitEditMode(event?: any) {
    // No edit mode for shifts yet, but this resolves the template error.
    // You can implement edit logic here if needed.
  }

  hideAddForm() {
    this.showAddForm = false;
  }
}