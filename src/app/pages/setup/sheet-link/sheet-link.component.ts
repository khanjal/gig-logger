import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { SheetCreateComponent } from './sheet-create/sheet-create.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ISheet } from '@interfaces/sheet.interface';
import { SheetListComponent } from './sheet-list/sheet-list.component';

@Component({
  selector: 'app-sheet-link',
  standalone: true,
    imports: [
    CommonModule,
    MatFabButton,
    MatIconModule
    ],
  templateUrl: './sheet-link.component.html',
  styleUrl: './sheet-link.component.scss'
})
export class SheetLinkComponent {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  constructor(
    private _gigLoggerService: GigWorkflowService,
    private _spreadsheetService: SpreadsheetService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  openCreateSheetDialog() {
    const dialogRef = this.dialog.open(SheetCreateComponent, {
      width: '400px',
      height: '150px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.error) {
          // Handle error
          console.error('Sheet creation failed:', result.error);
          this._snackBar.open('Error creating sheet', 'Close');
        } else {
          // Handle success
          this.linkSheet(result);
          console.log('Sheet created successfully:', result);
          this._snackBar.open('Sheet created successfully', 'Close');
          this.parentReload.emit(); // Emit event to reload parent component
        }
      }
      // result is null if dialog was cancelled
    });
  }

  openListSheetsDialog() {
    const dialogRef = this.dialog.open(SheetListComponent, {
      width: '400px',
      height: '400px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User selected a sheet
        console.log('Selected sheet:', result);
        
        let sheetData = {} as ISheet;
        sheetData.properties = {
          id: result.id,
          name: result.name
        };

        this.linkSheet(sheetData);
      }
    });
  }

  linkSheet(sheet: ISheet) {
    this._spreadsheetService.findSheet(sheet.properties.id).then((existingSheet) => {
      if (existingSheet) {
        this._snackBar.open('Sheet already linked', 'Close');
      } else {
        this._spreadsheetService.add({
          id: sheet.properties.id,
          name: sheet.properties.name,
          default: "true",
          size: 0
        }).then(() => {
          this._snackBar.open('Sheet linked successfully', 'Close');
          this.parentReload.emit(); // Emit event to reload parent component
        }).catch((error) => {
          console.error('Error linking sheet:', error);
          this._snackBar.open('Error linking sheet', 'Close');
        });
      }
    });
  }
}
