import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    BaseButtonComponent
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
    this._snackBar.open("Creating demo spreadsheet...", "Dismiss", { duration: 3000 });

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
      this._snackBar.open("Spreadsheet created, setting up sheets...", "Dismiss", { duration: 3000 });

      // Step 2: Create all the sheets
      await this._gigWorkflowService.createSheet(createdFile.id);
      this._logger.info('Sheets created successfully');
      this._snackBar.open("Sheets created, inserting demo data...", "Dismiss", { duration: 3000 });

      // Step 3: Insert demo data
      await this._gigWorkflowService.insertDemoData(createdFile.id);
      this._logger.info('Demo data inserted successfully');
      this._snackBar.open("Demo data inserted, loading...", "Dismiss", { duration: 3000 });

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

      this._snackBar.open("Demo spreadsheet created successfully!", "Dismiss", { duration: 5000 });
    } catch (error) {
      this._logger.error('Error creating demo spreadsheet', error);
      this._snackBar.open("Error creating demo spreadsheet. Please try again.", "Dismiss", { duration: 5000 });
    } finally {
      this.creatingDemo = false;
    }
  }
}
