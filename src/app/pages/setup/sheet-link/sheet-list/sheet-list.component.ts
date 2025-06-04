import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef } from '@angular/material/dialog';

// App Interfaces
import { ISheetProperties } from '@interfaces/sheet-properties.interface';

// App Services
import { GigLoggerService } from '@services/gig-logger.service';
import { TruncatePipe } from "@pipes/truncate.pipe";

@Component({
  selector: 'app-sheet-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TruncatePipe
],
  templateUrl: './sheet-list.component.html',
  styleUrl: './sheet-list.component.scss'
})
export class SheetListComponent implements OnInit {
  sheets: ISheetProperties[] = [];
  selectedSheet: ISheetProperties | null = null;
  loading: boolean = true;

  constructor(
    private _gigLoggerService: GigLoggerService,
    private dialogRef: MatDialogRef<SheetListComponent>
  ) { }
  
  ngOnInit() {
    this.loadSheets();
  }

  async loadSheets() {
    this.loading = true;
    try {
      // Load sheets from your service
      const sheetsData = await this._gigLoggerService.listFiles();
      
      // Sort alphabetically by name
      this.sheets = sheetsData.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        })
      );
    } catch (error) {
      console.error('Error loading sheets:', error);
      // Optionally show error message to user
    } finally {
      this.loading = false;
    }
  }

  selectSheet(sheet: ISheetProperties) {
    this.selectedSheet = sheet;
  }

  confirmSelection() {
    if (this.selectedSheet) {
      // Close dialog and pass selected sheet back to parent
      this.dialogRef.close(this.selectedSheet);
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