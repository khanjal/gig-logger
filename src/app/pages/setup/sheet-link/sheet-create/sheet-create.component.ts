import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseInputComponent } from '@components/base/base-input/base-input.component';

@Component({
  selector: 'app-sheet-create',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, BaseRectButtonComponent, BaseInputComponent],
  templateUrl: './sheet-create.component.html',
  styleUrl: './sheet-create.component.scss'
})
export class SheetCreateComponent {
  private dialogRef = inject<MatDialogRef<SheetCreateComponent>>(MatDialogRef);

  sheetCreate = new FormGroup({
    sheetName: new FormControl('')
  });

  createSheet() {
    this.dialogRef.close({
      sheetName: this.sheetCreate.value.sheetName?.trim() || 'New Sheet'
    });
  }

  closeModal() {
    this.dialogRef.close(null);
  }
}
