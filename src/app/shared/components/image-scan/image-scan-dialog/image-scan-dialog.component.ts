import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BaseAccordionComponent } from '@components/base/base-accordion/base-accordion.component';
import { BaseAccordionItemComponent } from '@components/base/base-accordion/base-accordion-item.component';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { ImageScanTrainingDialogComponent } from '@components/image-scan/image-scan-training-dialog/image-scan-training-dialog.component';
import { ScreenshotClassificationHelper } from '@helpers/screenshot-classification.helper';

@Component({
  selector: 'image-scan-dialog',
  templateUrl: './image-scan-dialog.component.html',
  styleUrls: ['./image-scan-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, BaseRectButtonComponent, BaseAccordionComponent, BaseAccordionItemComponent]
})
export class ImageScanDialogComponent {
  text: string | null = null;
  working = false;
  parsed: any = null;
  currentTripIndex = 0;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ImageScanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close() {
    this.dialogRef.close(null);
  }

  async performOcr() {
    this.working = true;
    try {
      let tesseractModule: any = null;
      try {
        tesseractModule = await import('tesseract.js');
      } catch (error) {
        console.warn('tesseract.js not installed; OCR unavailable', error);
      }

      if (tesseractModule?.recognize) {
        const preprocessedUrl = await this.preprocessImage(this.data.url);

        const { data: rawResultData } = await tesseractModule.recognize(this.data.url, 'eng', {
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: '6'
        });

        const { data: enhancedResultData } = await tesseractModule.recognize(preprocessedUrl, 'eng', {
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: '6'
        });

        const rawText = rawResultData?.text ?? '';
        const enhancedText = enhancedResultData?.text ?? '';
        this.text = this.mergeOcrText(rawText, enhancedText);
      } else {
        this.text = 'OCR library not installed. Install tesseract.js to enable scanning.';
      }

      this.parsed = this.extractFields(this.text || '');
      this.currentTripIndex = 0;
    } catch (error) {
      console.error(error);
      this.text = 'Failed to process image.';
    } finally {
      this.working = false;
    }
  }

  extractFields(text: string) {
    const output: any = {};

    const amountRegex = /\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/g;
    let amountMatch: RegExpExecArray | null;
    let lastAmount: string | null = null;
    while ((amountMatch = amountRegex.exec(text)) !== null) {
      lastAmount = amountMatch[1];
    }
    if (lastAmount) {
      output.amount = parseFloat(lastAmount);
    }

    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      output.date = dateMatch[1];
    } else {
      output.date = this.getTodayDateString();
    }

    const detectedTripCount = this.extractTripCount(text);
    if (detectedTripCount > 1) {
      output.tripCount = detectedTripCount;
    }

    // Classify screenshot type
    const classification = ScreenshotClassificationHelper.classifyScreenshot(text, detectedTripCount);
    output.classification = classification;

    if (classification.service === 'doordash') {
      output.service = 'DoorDash';
    } else if (classification.service === 'uber') {
      output.service = 'Uber';
    } else if (classification.service === 'grubhub') {
      output.service = 'Grubhub';
    }

    if (classification.type === 'offer') {
      const guaranteedAmount = ScreenshotClassificationHelper.extractGuaranteedAmount(text);
      if (guaranteedAmount !== null) {
        output.amount = guaranteedAmount;
      }

      const dropoffAddress = ScreenshotClassificationHelper.extractDropoffAddress(text);
      if (dropoffAddress) {
        output.dropoffAddress = dropoffAddress;
      }
    }

    // Extract base pay for stacked order splitting
    const basePay = ScreenshotClassificationHelper.extractBasePay(text);
    if (basePay !== null) {
      output.basePay = basePay;
    }

    const completedTime = this.extractTopTime(text);
    if (completedTime) {
      output.completedTime = completedTime;
    }

    const places = this.extractPlaces(text);
    if (places.length > 0) {
      output.places = places;
      output.place = places[0];
    }

    output.extractedTrips = this.buildExtractedTrips({
      tripCount: output.tripCount,
      places: output.places,
      completedTime: output.completedTime,
      fallbackAmount: output.amount,
      basePay: output.basePay,
      tipAmounts: this.extractTipAmounts(text),
      dropoffAddress: output.dropoffAddress
    });

    return output;
  }

  confirm() {
    this.dialogRef.close({ text: this.text, ...this.parsed });
  }

  get currentTrip(): any | null {
    if (!this.parsed?.extractedTrips?.length) {
      return null;
    }

    return this.parsed.extractedTrips[this.currentTripIndex] ?? null;
  }

  goToPreviousTrip() {
    if (this.currentTripIndex > 0) {
      this.currentTripIndex -= 1;
    }
  }

  goToNextTrip() {
    if (this.parsed?.extractedTrips?.length && this.currentTripIndex < this.parsed.extractedTrips.length - 1) {
      this.currentTripIndex += 1;
    }
  }

  openCorrectionDialog() {
    if (!this.text || !this.parsed) {
      return;
    }

    this.dialog.open(ImageScanTrainingDialogComponent, {
      panelClass: 'custom-modalbox',
      width: 'min(960px, 96vw)',
      maxHeight: '90vh',
      data: {
        text: this.text,
        parsed: this.parsed,
        imageUrl: this.data?.url
      }
    });
  }

  async copyDetectedText() {
    if (!this.text) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(this.text);
        return;
      }
    } catch {
    }

    const textarea = document.createElement('textarea');
    textarea.value = this.text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private getTodayDateString(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private extractTopTime(text: string): string | null {
    const timeRegex = /\b((?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[APMapm]{2})?)\b/;
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const firstLineMatch = lines[0].match(timeRegex);
      if (firstLineMatch) {
        return firstLineMatch[1].replace(/\s+/g, ' ').trim();
      }
    }

    const topLines = lines.slice(0, 4).join(' ');
    const topMatch = topLines.match(timeRegex);
    if (topMatch) {
      return topMatch[1].replace(/\s+/g, ' ').trim();
    }

    const fullMatch = text.match(timeRegex);
    if (fullMatch) {
      return fullMatch[1].replace(/\s+/g, ' ').trim();
    }

    return null;
  }

  private extractPlaces(text: string): string[] {
    const lines = text
      .split('\n')
      .map(line => line.replace(/['']/g, "'").trim())
      .filter(Boolean);

    const blockedPatterns = [
      /doordash\s*pay/i,
      /base\s*pay/i,
      /customer\s*tips/i,
      /deliver(?:y|ies)\s+complet(?:e|ed)/i,
      /earn\s*per\s*offer/i,
      /you\s+won['']t\s+get\s+offers/i,
      /dash\s+paused/i,
      /^total\b/i,
      /^uber$/i,
      /^\-\>$/,
      /^\$?\d+(?:\.\d{2})?$/,
      /^looking\s+for/i,
      /^acceptance/i,
      /^higher\s+than/i,
      /^shown\s+on/i
    ];

    const isBlocked = (line: string) => blockedPatterns.some(pattern => pattern.test(line));
    const hasLetters = (line: string) => /[a-zA-Z]/.test(line);
    const hasMoney = (line: string) => /\$\s*\d/.test(line);

    const places: string[] = [];
    for (let index = 0; index < lines.length; index++) {
      const original = lines[index].replace(/[<>©®]/g, '').replace(/^[)\]-\s]+/, '').trim();
      if (!original || !hasLetters(original) || isBlocked(original)) {
        continue;
      }

      const lineWithoutAmount = original.replace(/\s*\$?\d+(?:\.\d{2})?\s*$/g, '').trim();
      let candidate = lineWithoutAmount;

      // Remove location suffixes in parentheses (e.g., "(Wilmington Rd)", "(9928)")
      candidate = candidate.replace(/\s*\([^)]*\)\s*$/g, '').trim();

      const nextLine = lines[index + 1]?.replace(/[<>©®]/g, '').trim() ?? '';
      const canAppendNext =
        !!nextLine &&
        hasLetters(nextLine) &&
        !hasMoney(nextLine) &&
        !isBlocked(nextLine) &&
        /restaurant|grill|cafe|kitchen|bar|pizza|deli|market/i.test(nextLine);

      if (canAppendNext) {
        candidate = `${candidate} ${nextLine}`.replace(/\s+/g, ' ').trim();
        index += 1;
      }

      // Only keep lines that have a dollar amount on the same line or have possessive form
      const shouldKeep =
        candidate.length >= 3 &&
        !isBlocked(candidate) &&
        (hasMoney(original) || /[A-Za-z]+'s\b/.test(candidate));

      if (shouldKeep) {
        places.push(candidate);
      }
    }

    return [...new Set(places)].slice(0, 6);
  }

  private async preprocessImage(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        const context = canvas.getContext('2d');

        if (!context) {
          resolve(imageUrl);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let index = 0; index < data.length; index += 4) {
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
          const contrastBoosted = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128));

          data[index] = contrastBoosted;
          data[index + 1] = contrastBoosted;
          data[index + 2] = contrastBoosted;
        }

        context.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => resolve(imageUrl);
      image.src = imageUrl;
    });
  }

  private mergeOcrText(primaryText: string, secondaryText: string): string {
    const allLines = [...primaryText.split('\n'), ...secondaryText.split('\n')]
      .map(line => line.trim())
      .filter(Boolean);

    const lineMap = new Map<string, string>();
    for (const line of allLines) {
      const key = this.normalizeLineKey(line);
      if (!key) {
        continue;
      }

      const existing = lineMap.get(key);
      if (!existing || line.length > existing.length) {
        lineMap.set(key, line);
      }
    }

    return Array.from(lineMap.values()).join('\n');
  }

  private normalizeLineKey(line: string): string {
    return line
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[^a-z0-9:$ ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractTripCount(text: string): number {
    const normalized = text.toLowerCase();
    const patterns = [
      /(\d+)\s+deliver(?:y|ies)\s+complet(?:e|ed)/i,
      /(\d+)\s+deliver(?:y|ies)\b/i,
      /(\d+)\s+offers?\b/i,
      /(\d+)\s+completed\s+offers?\b/i,
      /(\d+)\s+trips?\b/i
    ];

    const counts: number[] = [];
    for (const pattern of patterns) {
      const matches = normalized.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        const value = parseInt(match[1], 10);
        if (!Number.isNaN(value) && value > 0 && value < 100) {
          counts.push(value);
        }
      }
    }

    if (counts.length === 0) {
      return 1;
    }

    return Math.max(...counts);
  }

  private extractTipAmounts(text: string): number[] {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const customerTipsIndex = lines.findIndex(line => /customer\s*tips/i.test(line));
    if (customerTipsIndex < 0) {
      return [];
    }

    const totalIndex = lines.findIndex((line, idx) => idx > customerTipsIndex && /^total\b/i.test(line));
    const endIndex = totalIndex > customerTipsIndex ? totalIndex : lines.length;
    const candidateLines = lines.slice(customerTipsIndex + 1, endIndex);

    const amounts: number[] = [];
    for (const line of candidateLines) {
      const match = line.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (!match) {
        continue;
      }

      const value = parseFloat(match[1]);
      if (!Number.isNaN(value) && value > 0) {
        amounts.push(value);
      }
    }

    return amounts;
  }

  private buildExtractedTrips(input: {
    tripCount?: number;
    places?: string[];
    completedTime?: string;
    fallbackAmount?: number;
    basePay?: number;
    tipAmounts?: number[];
    dropoffAddress?: string;
  }): Array<{ place?: string; pay?: number; basePay?: number; tip?: number; dropoffTime?: string; dropoffAddress?: string }> {
    const places = input.places ?? [];
    const tipAmounts = input.tipAmounts ?? [];
    
    // If we have an explicit trip count, trust it and limit places/amounts to that count
    // Otherwise fall back to the max of what we extracted
    let count: number;
    if (input.tripCount && input.tripCount > 1) {
      count = input.tripCount;
    } else {
      count = Math.max(places.length, tipAmounts.length, 1);
    }

    // Split base pay for stacked orders
    let basePayAmounts: number[] = [];
    if (input.basePay && count > 1) {
      basePayAmounts = ScreenshotClassificationHelper.splitBasePay(input.basePay, count);
    } else if (input.basePay && count === 1) {
      basePayAmounts = [input.basePay];
    }

    const trips: Array<{ place?: string; pay?: number; basePay?: number; tip?: number; dropoffTime?: string; dropoffAddress?: string }> = [];
    for (let index = 0; index < count; index++) {
      const basePay = basePayAmounts[index] ?? 0;
      const tip = tipAmounts[index] ?? 0;
      const totalPay = basePay + tip;
      
      trips.push({
        place: places[index] ?? places[0],
        pay: totalPay > 0 ? totalPay : (count === 1 ? input.fallbackAmount : undefined),
        basePay: basePay > 0 ? basePay : undefined,
        tip: tip > 0 ? tip : undefined,
        dropoffTime: input.completedTime,
        dropoffAddress: input.dropoffAddress
      });
    }

    return trips;
  }

}
