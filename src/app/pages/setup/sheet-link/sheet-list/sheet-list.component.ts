import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef } from '@angular/material/dialog';
import { ISheetProperties } from '@interfaces/sheet-properties.interface';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { LoggerService } from '@services/logger.service';
import { TruncatePipe } from "@pipes/truncate.pipe";
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';

@Component({
  selector: 'app-sheet-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TruncatePipe,
    BaseRectButtonComponent
],
  templateUrl: './sheet-list.component.html',
  styleUrl: './sheet-list.component.scss'
})
export class SheetListComponent implements OnInit {
  sheets = signal<ISheetProperties[]>([]);
  selectedSheet = signal<ISheetProperties | null>(null);
  loading = signal(true);

  constructor(
    private _gigLoggerService: GigWorkflowService,
    private _logger: LoggerService,
    private dialogRef: MatDialogRef<SheetListComponent>
  ) { }
  
  ngOnInit() {
    this.loadSheets();
  }

  async loadSheets() {
    this.loading.set(true);
    try {
      // Load sheets from your service
      const sheetsData = await this._gigLoggerService.listFiles();
      
      // Sort alphabetically by name
      this.sheets.set(sheetsData.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        })
      ));
    } catch (error) {
      this._logger.error('Error loading sheets', { error });
      // Optionally show error message to user
    } finally {
      this.loading.set(false);
    }
  }

  selectSheet(sheet: ISheetProperties) {
    this.selectedSheet.set(sheet);
  }

  confirmSelection() {
    const selectedSheet = this.selectedSheet();
    if (selectedSheet) {
      // Close dialog and pass selected sheet back to parent
      this.dialogRef.close(selectedSheet);
    }
  }

  cancel() {
    // Close dialog without returning anything
    this.dialogRef.close(null);
  }

  trackBySheetId(index: number, sheet: ISheetProperties): string {
    return sheet.id;
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}