import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'split-dialog',
  standalone: true,
  imports: [CommonModule, MatRadioModule, MatButtonModule, FormsModule],
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
