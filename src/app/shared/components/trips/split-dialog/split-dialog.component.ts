import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';

@Component({
  selector: 'split-dialog',
  standalone: true,
  imports: [CommonModule, MatRadioModule, FormsModule, BaseRectButtonComponent],
  templateUrl: './split-dialog.component.html',
  styleUrl: './split-dialog.component.scss'
})
export class SplitDialogComponent {
  selection: 'both' | 'place' | 'customer' | 'neither' = 'both';

  constructor(private dialogRef: MatDialogRef<SplitDialogComponent>) {}

  cancel() {
    this.dialogRef.close();
  }

  confirm() {
    this.dialogRef.close(this.selection);
  }
}
