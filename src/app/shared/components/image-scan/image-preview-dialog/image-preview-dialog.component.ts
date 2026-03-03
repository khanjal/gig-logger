import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  templateUrl: './image-preview-dialog.component.html',
  styleUrls: ['./image-preview-dialog.component.scss'],
  imports: [CommonModule, BaseRectButtonComponent]
})
export class ImagePreviewDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ImagePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
