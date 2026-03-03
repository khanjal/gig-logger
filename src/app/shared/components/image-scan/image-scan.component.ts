import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ImageScanDialogComponent } from '@components/image-scan/image-scan-dialog/image-scan-dialog.component';

@Component({
  selector: 'image-scan',
  templateUrl: './image-scan.component.html',
  styleUrls: ['./image-scan.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule]
})
export class ImageScanComponent {
  @Output() scanResult = new EventEmitter<any>();

  private fileInput: HTMLInputElement | null = null;

  constructor(private dialog: MatDialog) {}

  openFilePicker() {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/*';
    }

    this.fileInput.onchange = async (ev: Event) => {
      const target = ev.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        return;
      }

      const url = URL.createObjectURL(file);
      const dialogRef = this.dialog.open(ImageScanDialogComponent, {
        data: { url },
        panelClass: 'custom-modalbox',
        width: '420px'
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (result) {
        this.scanResult.emit(result);
      }

      URL.revokeObjectURL(url);
      this.fileInput!.value = '';
    };

    this.fileInput.click();
  }
}
