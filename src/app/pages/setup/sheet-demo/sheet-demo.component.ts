import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { LoggerService } from '@services/logger.service';
import { ISheetProperties } from '@interfaces/sheet-properties.interface';

@Component({
  selector: 'app-sheet-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule, 
    BaseRectButtonComponent
  ],
  templateUrl: './sheet-demo.component.html',
  styleUrl: './sheet-demo.component.scss'
})

export class SheetDemoComponent {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  creatingDemo: boolean = false;

  constructor(
    private _gigWorkflowService: GigWorkflowService,
    private _spreadsheetService: SpreadsheetService,
    private _snackBar: MatSnackBar,
    private _logger: LoggerService
  ) { }

  async createDemoSheet() {
    this.creatingDemo = true;
    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.CREATING_DEMO_SPREADSHEET, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });

    try {
      // Step 1: Create the file with a unique timestamp-based name
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const sheetProperties: ISheetProperties = {
        id: '',
        name: `RaptorGig Demo - ${timestamp}`
      };

      this._logger.info('Creating demo spreadsheet file...');
      const createdFile = await this._gigWorkflowService.createFile(sheetProperties);

      if (!createdFile || !createdFile.id) {
        throw new Error('Failed to create spreadsheet file');
      }

      this._logger.info(`Demo file created with ID: ${createdFile.id}`);
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DEMO_SPREADSHEET_SETUP_SHEETS, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });

      // Step 2: Create all the sheets
      await this._gigWorkflowService.createSheet(createdFile.id);
      this._logger.info('Sheets created successfully');
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DEMO_SHEETS_INSERTING_DATA, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });

      // Step 3: Insert demo data
      await this._gigWorkflowService.insertDemoData(createdFile.id);
      this._logger.info('Demo data inserted successfully');
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DEMO_DATA_INSERTED_LOADING, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });

      // Step 4: Link the spreadsheet
      await this._spreadsheetService.add({
        id: createdFile.id,
        name: createdFile.name,
        default: "true",
        size: 0
      });

      this._logger.info('Demo spreadsheet linked successfully');

      // Step 5: Trigger parent reload to fetch all the data
      this.parentReload.emit();

      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DEMO_SPREADSHEET_CREATED, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
    } catch (error) {
      this._logger.error('Error creating demo spreadsheet', error);
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DEMO_SPREADSHEET_ERROR, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
    } finally {
      this.creatingDemo = false;
    }
  }
}
