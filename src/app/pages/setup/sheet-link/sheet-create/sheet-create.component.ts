import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseInputComponent } from '@components/base/base-input/base-input.component';

@Component({
  selector: 'app-sheet-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, BaseRectButtonComponent, BaseInputComponent],
  templateUrl: './sheet-create.component.html',
  styleUrl: './sheet-create.component.scss'
})
export class SheetCreateComponent {
  saving: boolean = false;

  sheetCreate = new FormGroup({
    sheetName: new FormControl('')
  });

  constructor(private dialogRef: MatDialogRef<SheetCreateComponent>) { }

  async createSheet() {
    this.dialogRef.close({
      sheetName: this.sheetCreate.value.sheetName?.trim() || 'New Sheet'
    });
  }

  closeModal() {
    this.dialogRef.close(null);
  }
}
