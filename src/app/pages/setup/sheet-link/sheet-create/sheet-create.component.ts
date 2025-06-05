import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFabButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { ISheetProperties } from '@interfaces/sheet-properties.interface';
import { GigWorkflowService } from '@services/gig-workflow.service';

@Component({
  selector: 'app-sheet-create',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatFabButton, MatIcon],
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
      
      // Close modal and pass the result back to parent
      this.dialogRef.close(result);
    } catch (error) {
      console.error('Error creating sheet:', error);
      
      // Close modal and pass error back to parent
      this.dialogRef.close({ error: error });
    } finally {
      this.saving = false;
    }
  }

  closeModal() {
    this.dialogRef.close(null);
  }
}
