import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { CommonModule } from '@angular/common';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    standalone: true,
    imports: [CommonModule, BaseRectButtonComponent]
})
export class ConfirmDialogComponent {
  title!: string;
  message!: string;
  trueIcon: string | undefined;
  trueText! :string;
  trueColor: string;
  falseIcon: string | undefined;
  falseText! :string;
  falseColor: string;

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IConfirmDialog) {
    // Update view with given values
    this.title = data.title;
    this.message = data.message;
    this.trueText = data.trueText;
    this.trueIcon = data.trueIcon;
    this.trueColor = data.trueColor ?? "primary";
    this.falseText = data.falseText;
    this.falseIcon = data.falseIcon;
    this.falseColor = data.falseColor ?? "accent";
  }

  onConfirm(): void {
    // Close the dialog, return true
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }
}
