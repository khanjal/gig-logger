import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { BaseAccordionComponent } from '@components/base/base-accordion/base-accordion.component';
import { BaseAccordionItemComponent } from '@components/base/base-accordion/base-accordion-item.component';
import { BaseInputComponent } from '@components/base';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { ImagePreviewDialogComponent } from '@components/image-scan/image-preview-dialog/image-preview-dialog.component';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { IOcrTrainingPayload } from '@interfaces/ocr-training-payload.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ScreenshotLayouts } from '@helpers/screenshot-layouts';

type TrainingTripEdit = Partial<ITrip>;

@Component({
  selector: 'app-image-scan-training-dialog',
  standalone: true,
  templateUrl: './image-scan-training-dialog.component.html',
  styleUrls: ['./image-scan-training-dialog.component.scss'],
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatOptionModule, BaseInputComponent, SearchInputComponent, BaseRectButtonComponent, BaseAccordionComponent, BaseAccordionItemComponent]
})
export class ImageScanTrainingDialogComponent {
  date = '';
  service = '';
  screenType = '';
  notes = '';
  trips: TrainingTripEdit[] = [];

  readonly screenTypes = ['offer', 'completion', 'earnings-summary', 'trip-details', 'unknown'];
  layouts = ScreenshotLayouts;
  selectedLayoutId: string | null = null;

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
    this.screenType = this.data?.parsed?.classification?.type ?? 'unknown';
    this.selectedLayoutId = this.data?.parsed?.layout?.layoutId ?? null;
    this.trips = this.cloneTrips(this.data?.parsed?.extractedTrips);

    if (!this.trips.length) {
      this.trips = [{ place: '', pay: undefined, tip: undefined, distance: undefined, dropoffTime: '', endAddress: '' } as any];
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
      width: '720px',
      height: '90vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        imageUrl: this.data.imageUrl
      }
    });
  }

  async copyTrainingPayload(): Promise<void> {
    const payload: IOcrTrainingPayload = {
      parserVersion: 'ocr-v1',
      generatedAt: new Date().toISOString(),
      screenshotType: this.screenType || 'unknown',
      service: this.service || null,
      ocrText: this.data?.text ?? '',
      layout: this.selectedLayoutId
        ? { id: this.selectedLayoutId, name: this.layouts.find(l => l.id === this.selectedLayoutId)?.name ?? undefined, score: this.data?.parsed?.layout?.score ?? null }
        : (this.data?.parsed?.layout ? (this.data.parsed.layout as any) : null),
      detected: this.data?.parsed ?? {},
      corrected: {
        date: this.date || null,
        service: this.service || null,
        trips: this.trips.map(trip => ({
          place: (trip.place as string | undefined)?.trim() || null,
          pay: this.toNumberOrUndefined(trip.pay),
          tip: this.toNumberOrUndefined(trip.tip),
          distance: this.toNumberOrUndefined((trip as any).distance ?? (trip as any).dropoffDistance),
          dropoffTime: (trip.dropoffTime as string | undefined)?.trim() || null,
          dropoffAddress: ((trip as any).endAddress as string | undefined)?.trim() || null
        }))
      },
      notes: this.notes?.trim() || null
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
      place: trip?.place ?? '',
      pay: (this.toNumberOrUndefined(trip?.pay) ?? undefined) as number | undefined,
      tip: (this.toNumberOrUndefined(trip?.tip) ?? undefined) as number | undefined,
      distance: (this.toNumberOrUndefined(trip?.dropoffDistance ?? trip?.distance) ?? undefined) as number | undefined,
      dropoffTime: trip?.dropoffTime ?? '',
      endAddress: (trip as any)?.dropoffAddress ?? (trip as any)?.endAddress ?? ''
    }));
  }

  private toNumberOrUndefined(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
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
