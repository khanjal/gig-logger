import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';

@Component({
  selector: 'app-split-dialog',
  standalone: true,
  imports: [MatRadioModule, FormsModule, BaseRectButtonComponent],
  templateUrl: './split-dialog.component.html',
  styleUrl: './split-dialog.component.scss'
})
export class SplitDialogComponent {
  private dialogRef = inject<MatDialogRef<SplitDialogComponent>>(MatDialogRef);

  public selection: 'both' | 'place' | 'customer' | 'neither' = 'both';

  public cancel() {
    this.dialogRef.close();
  }

  public confirm() {
    this.dialogRef.close(this.selection);
  }
}
