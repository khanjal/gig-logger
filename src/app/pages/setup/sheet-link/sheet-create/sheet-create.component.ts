import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFabButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ISheetProperties } from '@interfaces/sheet-properties.interface';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { LoggerService } from '@services/logger.service';

@Component({
  selector: 'app-sheet-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatFabButton, MatIcon, MatProgressSpinnerModule],
  templateUrl: './sheet-create.component.html',
  styleUrl: './sheet-create.component.scss'
})
export class SheetCreateComponent {
  saving: boolean = false;

  sheetCreate = new FormGroup({
    sheetName: new FormControl('')
  });

  constructor(
    private _gigLoggerService: GigWorkflowService,
    private _logger: LoggerService,
    private dialogRef: MatDialogRef<SheetCreateComponent>
  ) { }

  async createSheet() {
    this.saving = true;

    const properties: ISheetProperties = {
      id: "",
      name: this.sheetCreate.value.sheetName ?? "New Sheet",
    };

    try {
      // Create a new sheet from gig logger
      const result = await this._gigLoggerService.createFile(properties);

      if (result?.id)
        await this._gigLoggerService.createSheet(result!.id);
      
      // Close modal and pass the result back to parent
      this.dialogRef.close(result);
    } catch (error) {
      this._logger.error('Error creating sheet', { error, sheetName: this.sheetCreate.value.sheetName });
      
      // Close modal and pass error back to parent
      this.dialogRef.close({ error: error });
    }
  }

  closeModal() {
    this.dialogRef.close(null);
  }
}
