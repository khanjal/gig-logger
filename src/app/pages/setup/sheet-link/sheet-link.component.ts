import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { SheetCreateComponent } from './sheet-create/sheet-create.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ISheet } from '@interfaces/sheet.interface';
import { SheetListComponent } from './sheet-list/sheet-list.component';
import { LoggerService } from '@services/logger.service';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-sheet-link',
  standalone: true,
    imports: [
    CommonModule,
    BaseRectButtonComponent
    ],
  templateUrl: './sheet-link.component.html',
  styleUrl: './sheet-link.component.scss'
})
export class SheetLinkComponent {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  constructor(
    private _spreadsheetService: SpreadsheetService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
    private _logger: LoggerService
  ) { }

  async openCreateSheetDialog() {
    const dialogRef = this.dialog.open(SheetCreateComponent, {
      width: '400px',
      height: '200px',
      panelClass: 'custom-modalbox',
      position: {
        top: '125px' // Adjust this value to position the dialog higher
      }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result?.sheetName) {
      return;
    }

    const syncDialogRef = this.dialog.open(DataSyncModalComponent, {
      panelClass: 'custom-modalbox',
      data: {
        type: 'create-sheet',
        sheetName: result.sheetName
      }
    });

    const syncResult = await firstValueFrom(syncDialogRef.afterClosed());
    if (syncResult) {
      this._logger.info('Sheet created successfully', { sheetName: result.sheetName });
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.SHEET_CREATED_SUCCESS, { action: 'Close' });
      // create-sheet flow already loaded data in sync modal; only refresh setup state
      this.parentReload.emit({ mode: 'load-only' });
      return;
    }

    this._logger.error('Sheet creation failed', { sheetName: result.sheetName });
    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.SHEET_ERROR_CREATING, { action: 'Close' });
  }

  async openListSheetsDialog() {
    const dialogRef = this.dialog.open(SheetListComponent, {
      width: '400px',
      height: '400px',
      panelClass: 'custom-modalbox'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) {
      return;
    }

    // User selected a sheet
    this._logger.info('Selected sheet', { result });

    const sheetData = {
      properties: {
        id: result.id,
        name: result.name
      }
    } as ISheet;

    await this.linkSheet(sheetData);
  }

  async linkSheet(sheet: ISheet): Promise<void> {
    const existingSheet = await this._spreadsheetService.findSheet(sheet.properties.id);
    if (existingSheet) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.SHEET_ALREADY_LINKED, { action: 'Close' });
      return;
    }

    try {
      await this._spreadsheetService.add({
        id: sheet.properties.id,
        name: sheet.properties.name,
        default: "true",
        size: 0
      });
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.SHEET_LINKED_SUCCESS, { action: 'Close' });
      this.parentReload.emit({ mode: 'reload' });
    } catch (error) {
      this._logger.error('Error linking sheet', { error });
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.SHEET_ERROR_LINKING, { action: 'Close' });
    }
  }
}
