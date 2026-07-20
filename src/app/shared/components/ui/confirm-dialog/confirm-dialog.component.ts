import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { IConfirmDialog } from '@interfaces/ui/confirm-dialog.interface';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    standalone: true,
    imports: [BaseRectButtonComponent]
})
export class ConfirmDialogComponent {
  public dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef);
  public data = inject<IConfirmDialog>(MAT_DIALOG_DATA);

  public title!: string;
  public message!: string;
  public trueIcon: string | undefined;
  public trueText! :string;
  public trueColor: string;
  public falseIcon: string | undefined;
  public falseText! :string;
  public falseColor: string;

  constructor() {
    const data = this.data;

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

  public onConfirm(): void {
    // Close the dialog, return true
    this.dialogRef.close(true);
  }

  public onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }
}
