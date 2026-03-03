import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BaseAccordionComponent } from '@components/base/base-accordion/base-accordion.component';
import { BaseAccordionItemComponent } from '@components/base/base-accordion/base-accordion-item.component';
import { BaseInputComponent } from '@components/base';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { ImagePreviewDialogComponent } from '@components/image-scan/image-preview-dialog/image-preview-dialog.component';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { IOcrTrainingPayload } from '@interfaces/ocr-training-payload.interface';

interface TrainingTripEdit {
  place?: string;
  pay?: number;
  tip?: number;
  dropoffTime?: string;
  dropoffAddress?: string;
}

@Component({
  selector: 'app-image-scan-training-dialog',
  standalone: true,
  templateUrl: './image-scan-training-dialog.component.html',
  styleUrls: ['./image-scan-training-dialog.component.scss'],
  imports: [CommonModule, FormsModule, BaseInputComponent, SearchInputComponent, BaseRectButtonComponent, BaseAccordionComponent, BaseAccordionItemComponent]
})
export class ImageScanTrainingDialogComponent {
  date = '';
  service = '';
  notes = '';
  trips: TrainingTripEdit[] = [];

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ImageScanTrainingDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      text: string;
      parsed: any;
      imageUrl?: string;
    }
  ) {
    this.date = this.data?.parsed?.date ?? '';
    this.service = this.data?.parsed?.service ?? '';
    this.trips = this.cloneTrips(this.data?.parsed?.extractedTrips);

    if (!this.trips.length) {
      this.trips = [{}];
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  addTrip(): void {
    this.trips.push({});
  }

  removeTrip(index: number): void {
    if (this.trips.length <= 1) {
      return;
    }

    this.trips.splice(index, 1);
  }

  openLargeImage(): void {
    if (!this.data?.imageUrl) {
      return;
    }

    this.dialog.open(ImagePreviewDialogComponent, {
      panelClass: 'custom-modalbox',
      width: 'min(1200px, 98vw)',
      maxHeight: '95vh',
      data: {
        imageUrl: this.data.imageUrl
      }
    });
  }

  async copyTrainingPayload(): Promise<void> {
    const payload: IOcrTrainingPayload = {
      parserVersion: 'ocr-v1',
      generatedAt: new Date().toISOString(),
      screenshotType: this.data?.parsed?.classification?.type ?? 'unknown',
      service: this.service || undefined,
      ocrText: this.data?.text ?? '',
      detected: this.data?.parsed ?? {},
      corrected: {
        date: this.date || undefined,
        service: this.service || undefined,
        trips: this.trips.map(trip => ({
          place: trip.place?.trim() || undefined,
          pay: this.toNumberOrUndefined(trip.pay),
          tip: this.toNumberOrUndefined(trip.tip),
          dropoffTime: trip.dropoffTime?.trim() || undefined,
          dropoffAddress: trip.dropoffAddress?.trim() || undefined
        }))
      },
      notes: this.notes?.trim() || undefined
    };

    const serialized = JSON.stringify(payload, null, 2);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(serialized);
      } else {
        this.copyWithFallback(serialized);
      }
    } catch {
      this.copyWithFallback(serialized);
    }
  }

  private cloneTrips(source: any[]): TrainingTripEdit[] {
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map(trip => ({
      place: trip?.place,
      pay: this.toNumberOrUndefined(trip?.pay),
      tip: this.toNumberOrUndefined(trip?.tip),
      dropoffTime: trip?.dropoffTime,
      dropoffAddress: trip?.dropoffAddress
    }));
  }

  private toNumberOrUndefined(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  private copyWithFallback(value: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
