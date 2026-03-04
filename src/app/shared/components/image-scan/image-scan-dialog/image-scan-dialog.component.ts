import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BaseAccordionComponent } from '@components/base/base-accordion/base-accordion.component';
import { BaseAccordionItemComponent } from '@components/base/base-accordion/base-accordion-item.component';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseIconButtonComponent } from '@components/base/base-icon-button/base-icon-button.component';
import { ImageScanTrainingDialogComponent } from '@components/image-scan/image-scan-training-dialog/image-scan-training-dialog.component';
import { ScreenshotClassificationHelper } from '@helpers/screenshot-classification.helper';
import { getLayoutHandler } from '@helpers/screenshot-layout-handlers';
import { ServiceService } from '@services/sheets/service.service';
import { PlaceService } from '@services/sheets/place.service';

@Component({
  selector: 'image-scan-dialog',
  templateUrl: './image-scan-dialog.component.html',
  styleUrls: ['./image-scan-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, BaseRectButtonComponent, BaseIconButtonComponent, BaseAccordionComponent, BaseAccordionItemComponent]
})
export class ImageScanDialogComponent {
  text: string | null = null;
  working = false;
  parsed: any = null;
  currentTripIndex = 0;
  
  private knownServices: string[] = [];
  private knownPlaces: string[] = [];

  constructor(
    private dialog: MatDialog,
    private serviceService: ServiceService,
    private placeService: PlaceService,
    public dialogRef: MatDialogRef<ImageScanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.loadDataLists();
  }

  private async loadDataLists() {
    try {
      const services = await this.serviceService.list();
      this.knownServices = services.map((s: any) => s.service).filter(Boolean);
      
      const places = await this.placeService.list();
      this.knownPlaces = places.map((p: any) => p.place).filter(Boolean);
    } catch (error) {
      console.warn('Failed to load service/place data for fuzzy matching', error);
    }
  }

  /**
   * Fuzzy match a value against a list of known values using Levenshtein distance.
   * Returns the closest match if similarity is >= 80%, otherwise returns original value.
   * @param value The value to match
   * @param knownValues Array of known valid values
   * @param minSimilarity Minimum similarity threshold (0-1). Default: 0.8
   * @returns Best match or original value
   */
  private fuzzyMatch(value: string | null | undefined, knownValues: string[], minSimilarity: number = 0.8): string | null {
    if (!value || !knownValues.length) {
      return value ?? null;
    }

    const valueLower = value.toLowerCase().trim();
    let bestMatch = value;
    let bestSimilarity = 0;

    for (const known of knownValues) {
      const knownLower = known.toLowerCase().trim();
      const similarity = this.calculateSimilarity(valueLower, knownLower);
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = known;
      }
    }

    return bestSimilarity >= minSimilarity ? bestMatch : value;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance.
   * Returns a value between 0 and 1, where 1 is an exact match.
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const shorter = str1.length <= str2.length ? str1 : str2;
    const longer = str1.length > str2.length ? str1 : str2;

    // Quick win: exact match
    if (shorter === longer) {
      return 1;
    }

    // Substring match (one contains the other)
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }

    const maxDistance = longer.length;
    const distance = this.levenshteinDistance(shorter, longer);

    return 1 - distance / maxDistance;
  }

  /**
   * Calculate Levenshtein distance between two strings.
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Persist a detected service name as an unsaved service for later review.
   */
  private async persistUnknownService(name: string): Promise<void> {
    if (!name || !name.trim()) {
      return;
    }

    const normalized = name.trim();
    try {
      const existing = await this.serviceService.find('service', normalized);
      if (existing) {
        // already present
        if (!this.knownServices.some(k => k.toLowerCase() === normalized.toLowerCase())) {
          this.knownServices.push(existing.service);
        }
        return;
      }

      const newService: any = {
        service: normalized,
        pay: 0,
        tip: 0,
        bonus: 0,
        cash: 0,
        total: 0,
        trips: 0,
        rowId: 0,
        saved: false
      };

      await this.serviceService.append([newService]);
      this.knownServices.push(normalized);
    } catch (error) {
      console.warn('Failed to persist unknown service', name, error);
    }
  }

  /**
   * Persist a detected place name as an unsaved place for later review.
   */
  private async persistUnknownPlace(name: string): Promise<void> {
    if (!name || !name.trim()) {
      return;
    }

    const normalized = name.trim();
    try {
      const existing = await this.placeService.find('place', normalized);
      if (existing) {
        if (!this.knownPlaces.some(k => k.toLowerCase() === normalized.toLowerCase())) {
          this.knownPlaces.push(existing.place);
        }
        return;
      }

      const newPlace: any = {
        place: normalized,
        addresses: [],
        types: [],
        pay: 0,
        tip: 0,
        bonus: 0,
        cash: 0,
        total: 0,
        trips: 0,
        rowId: 0,
        saved: false
      };

      await this.placeService.append([newPlace]);
      this.knownPlaces.push(normalized);
    } catch (error) {
      console.warn('Failed to persist unknown place', name, error);
    }
  }

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

    // last amount seen
    const amountRegex = /\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/g;
    let amountMatch: RegExpExecArray | null;
    let lastAmount: string | null = null;
    while ((amountMatch = amountRegex.exec(text)) !== null) {
      lastAmount = amountMatch[1];
    }
    if (lastAmount) {
      output.amount = parseFloat(lastAmount);
    }

    // date
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    output.date = dateMatch ? dateMatch[1] : this.getTodayDateString();

    const detectedTripCount = this.extractTripCount(text);
    if (detectedTripCount > 1) {
      output.tripCount = detectedTripCount;
    }

    // classification & layout
    const classification = ScreenshotClassificationHelper.classifyScreenshot(text, detectedTripCount);
    output.classification = classification;

    try {
      const layout = ScreenshotClassificationHelper.detectLayout(text || '');
      if (layout && layout.score > 0) {
        output.layout = layout;
      }
    } catch (e) {
      // ignore
    }

    // allow layout handlers to short-circuit
    try {
      const layoutId = output.layout?.layoutId as string | undefined;
      if (layoutId) {
        const handler = getLayoutHandler(layoutId);
        if (handler) {
          const handled = handler.extract(text, output);
          if (handled) {
            // ensure we persist any unknown places/services discovered by handler's extraction
            if (output.service) {
              const originalService = output.service;
              const matched = this.knownServices.length ? this.fuzzyMatch(originalService, this.knownServices) : null;
              if ((!matched || matched === originalService) && !this.knownServices.some(k => k.toLowerCase() === (originalService || '').toLowerCase())) {
                this.persistUnknownService(originalService).catch(() => {});
              }
            }

            if (output.places && Array.isArray(output.places)) {
              for (const p of output.places) {
                const originalPlace = p;
                const matchedPlace = this.knownPlaces.length ? this.fuzzyMatch(originalPlace, this.knownPlaces) : null;
                if ((!matchedPlace || matchedPlace === originalPlace) && !this.knownPlaces.some(k => k.toLowerCase() === (originalPlace || '').toLowerCase())) {
                  this.persistUnknownPlace(originalPlace).catch(() => {});
                }
              }
            }

            return output;
          }
        }
      }
    } catch (e) {
      // fall back to heuristics below
    }

    // service mapping
    if (classification.service === 'doordash') {
      output.service = 'DoorDash';
    } else if (classification.service === 'uber') {
      output.service = 'Uber';
    } else if (classification.service === 'grubhub') {
      output.service = 'Grubhub';
    }

    // fuzzy match / persist unknown service
    if (output.service) {
      const originalService = output.service;
      const matched = this.knownServices.length ? this.fuzzyMatch(originalService, this.knownServices) : null;
      output.service = matched ?? originalService;
      const isKnown = this.knownServices.some(k => k.toLowerCase() === (originalService || '').toLowerCase());
      if ((!matched || matched === originalService) && !isKnown) {
        this.persistUnknownService(originalService).catch(() => {});
      }
    }

    // offer-specific extraction
    if (classification.type === 'offer') {
      const guaranteedAmount = ScreenshotClassificationHelper.extractGuaranteedAmount(text);
      if (guaranteedAmount !== null) {
        output.amount = guaranteedAmount;
      }
      const dropoffAddress = ScreenshotClassificationHelper.extractDropoffAddress(text);
      if (dropoffAddress) {
        output.dropoffAddress = dropoffAddress;
      }
      const restaurantName = ScreenshotClassificationHelper.extractOfferRestaurantName(text);
      if (restaurantName) {
        output.places = [restaurantName];
        output.place = restaurantName;
      }
    }

    // base pay, completed time, distance
    const basePay = ScreenshotClassificationHelper.extractBasePay(text);
    if (basePay !== null) {
      output.basePay = basePay;
    }
    const completedTime = this.extractTopTime(text);
    if (completedTime) {
      output.completedTime = completedTime;
    }
    const distanceMatch = text.match(/(\d{1,3}(?:\.\d+)?)\s*(?:mi|miles)\b/i);
    if (distanceMatch) {
      const d = parseFloat(distanceMatch[1]);
      if (!Number.isNaN(d)) {
        output.distance = d;
      }
    }

    // earnings-summary: prefer explicit place+amount pairs, then multiline pairs, then places
    if (classification.type === 'earnings-summary') {
      const pairs = this.extractPlaceAmountPairs(text);
      if (pairs.length > 0) {
        output.places = pairs.map(p => p.place);
        output.perOfferAmounts = pairs.map(p => p.amount);
        output.place = output.places[0];
      } else {
        const multi = this.extractPlaceMultiLinePairs(text);
        if (multi.length > 0) {
          output.places = multi.map(p => p.place);
          output.perOfferAmounts = multi.map(p => p.amount);
          output.place = output.places[0];
        } else {
          const places = this.extractPlaces(text);
          if (places.length > 0) {
            output.places = places;
            output.place = places[0];
          }
        }
      }
    } else {
      if (classification.type !== 'offer' || !output.place) {
        const places = this.extractPlaces(text);
        if (places.length > 0) {
          output.places = places;
          output.place = places[0];
        }
      }
    }

    // persist unknown places (fuzzy match)
    if (output.places && Array.isArray(output.places)) {
      const normalizedPlaces: string[] = [];
      for (const originalPlace of output.places) {
        const matchedPlace = this.knownPlaces.length ? this.fuzzyMatch(originalPlace, this.knownPlaces) : null;
        const finalPlace = matchedPlace ?? originalPlace;
        normalizedPlaces.push(finalPlace);
        const isKnownPlace = this.knownPlaces.some(k => k.toLowerCase() === (originalPlace || '').toLowerCase());
        if ((!matchedPlace || matchedPlace === originalPlace) && !isKnownPlace) {
          this.persistUnknownPlace(originalPlace).catch(() => {});
        }
      }
      output.places = normalizedPlaces;
      output.place = output.place ?? output.places[0];
    }

    output.extractedTrips = this.buildExtractedTrips({
      tripCount: output.tripCount,
      places: output.places,
      completedTime: output.completedTime,
      fallbackAmount: output.amount,
      basePay: output.basePay,
      tipAmounts: this.extractTipAmounts(text),
      dropoffAddress: output.dropoffAddress,
      dropoffDistance: output.distance,
      perOfferAmounts: output.perOfferAmounts,
      isEarningsSummary: classification.type === 'earnings-summary'
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
      width: '720px',
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

      // Try to match abbreviated time format like "458" → "4:58"
      const abbreviatedTimeMatch = lines[0].match(/^(\d{3})([A-Z@]?)/);
      if (abbreviatedTimeMatch) {
        const digits = abbreviatedTimeMatch[1];
        if (digits.length === 3) {
          const hours = digits[0];
          const minutes = digits.slice(1);
          return `${hours}:${minutes}`;
        }
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
      /doordash\s*tips/i,
      /start\s*time/i,
      /end\s*time/i,
      /deliver(?:y|ies)\s+complet(?:e|ed)/i,
      /earn\s*per\s*offer/i,
      /you\s+won['']t\s+get\s+offers/i,
      /dash\s+paused/i,
      /total\b.*higher\s+than/i,
      /higher\s+than.*shown\s+on/i,
      /^total\b/i,
      /^uber$/i,
      /^\-\>$/,
      /^\$?\d+(?:\.\d{2})?$/,
      /^looking\s+for/i,
      /\boffers?\b/i,
      /\bdeliveries?\b/i,
      /^acceptance/i
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

      // Remove leading special characters (pipes, brackets, etc.)
      candidate = candidate.replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();

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
      // Also filter out short garbage text - real places should be longer or match business keywords
      const looksLikeBusiness = /shop|store|restaurant|cafe|bar|grill|market|general|dollar|subway|pizza|deli|kitchen/i.test(candidate);
      const longEnough = candidate.length >= 5;
      const hasProperNoun = /[A-Z][a-z]/.test(candidate);
      const shouldKeep =
        !isBlocked(candidate) &&
        (hasMoney(original) || /[A-Za-z]+'s\b/.test(candidate)) &&
        (looksLikeBusiness || (longEnough && hasProperNoun));

      if (shouldKeep) {
        places.push(candidate);
      }
    }

    return [...new Set(places)].slice(0, 6);
  }

  /**
   * Extract lines that contain a place name and an explicit dollar amount on the same line.
   * Returns array of { place, amount } in the order found.
   */
  private extractPlaceAmountPairs(text: string): Array<{ place: string; amount: number }> {
    const lines = text
      .split('\n')
      .map(line => line.replace(/[<>©®]/g, '').trim())
      .filter(Boolean);

    const results: Array<{ place: string; amount: number }> = [];
    // Block common header/summary labels that should not be considered places
    const blockedLabelRegex = /doordash\s*pay|doordash\s*tips|customer\s*tips|earn\s*per\s*offer|start\s*time|end\s*time|base\s*pay|offers?\b|deliveries?\b|total\b/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match: [Place name ...] $X.XX  (allow amount before or after parentheses)
      const match = line.match(/^(.+?)\s*\(?\d*\)?\s*\$\s*([0-9]+(?:\.[0-9]{1,2})?)$/);
      if (match) {
        let candidate = match[1].trim();
        candidate = candidate.replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();
        // remove trailing parentheses content like (2327)
        candidate = candidate.replace(/\s*\([^)]*\)\s*$/g, '').trim();
        const amount = parseFloat(match[2]);

        // Skip header labels or garbage candidates
        if (!candidate || candidate.length < 2) {
          continue;
        }
        // Skip header labels like "Base Pay" which are not places
        if (blockedLabelRegex.test(candidate)) {
          continue;
        }
        if (/^base\s*pay$/i.test(candidate)) {
          continue;
        }
        if (/[<>@\|]/.test(candidate)) {
          continue;
        }

        if (candidate && !Number.isNaN(amount)) {
          results.push({ place: candidate, amount });
        }
      } else {
        // also support: Place (123) $8.25 with extra tokens
        const altMatch = line.match(/^(.+?)\s*\$\s*([0-9]+(?:\.[0-9]{1,2})?)$/);
        if (altMatch) {
          let candidate = altMatch[1].trim();
          candidate = candidate.replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();
          candidate = candidate.replace(/\s*\([^)]*\)\s*$/g, '').trim();
          const amount = parseFloat(altMatch[2]);

          if (!candidate || candidate.length < 2) {
            continue;
          }
          if (blockedLabelRegex.test(candidate)) {
            continue;
          }
          if (/[<>@\|]/.test(candidate)) {
            continue;
          }

          if (candidate && !Number.isNaN(amount)) {
            results.push({ place: candidate, amount });
          }
        }
      }
    }

    // Dedupe by normalized place name while preserving order
    const seen = new Set<string>();
    const deduped: Array<{ place: string; amount: number }> = [];
    for (const r of results) {
      const key = r.place.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }

    return deduped;
  }

  /**
   * Extract place + amount pairs where the place is on one line and the amount on the following line.
   * Handles patterns like:
   * Bill's Sandwich Shop
   * (Wilmington Rd) $7.00
   */
  private extractPlaceMultiLinePairs(text: string): Array<{ place: string; amount: number }> {
    const lines = text
      .split('\n')
      .map(line => line.replace(/[<>©®]/g, '').trim())
      .filter(Boolean);

    const results: Array<{ place: string; amount: number }> = [];
    const blockedLabelRegex = /doordash\s*pay|doordash\s*tips|customer\s*tips|earn\s*per\s*offer|start\s*time|end\s*time|base\s*pay|offers?\b|deliveries?\b|total\b/i;

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const next = lines[i + 1];

      if (blockedLabelRegex.test(line) || blockedLabelRegex.test(next)) {
        continue;
      }

      // If current line looks like a place (has letters) and next line has an amount, combine
      const hasLetters = /[a-zA-Z]/.test(line);
      const amountMatch = next.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (hasLetters && amountMatch) {
        let candidate = line.replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();
        candidate = candidate.replace(/\s*\([^)]*\)\s*$/g, '').trim();

        // Skip obvious non-place lines
        if (!candidate || candidate.length < 2) {
          continue;
        }

        const amount = parseFloat(amountMatch[1]);
        if (!Number.isNaN(amount)) {
          results.push({ place: candidate, amount });
          i += 1; // skip next line
        }
      }
    }

    // Deduplicate preserving order
    const seen = new Set<string>();
    const deduped: Array<{ place: string; amount: number }> = [];
    for (const r of results) {
      const key = r.place.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }

    return deduped;
  }

  /**
   * Apply layout-aware extraction rules. Returns true if the layout handler processed the output.
   */
  private applyLayoutExtraction(layoutId: string, text: string, output: any): boolean {
    if (!layoutId) {
      return false;
    }

    // DoorDash earnings summary: prefer explicit place+amount pairs and build trips from them
    if (layoutId === 'doordash-earnings-summary') {
      const pairs = this.extractPlaceAmountPairs(text);
      if (pairs.length > 0) {
        output.places = pairs.map(p => p.place);
        output.perOfferAmounts = pairs.map(p => p.amount);
        output.place = output.places[0];

        const tipAmounts = this.extractTipAmounts(text);

        output.extractedTrips = this.buildExtractedTrips({
          tripCount: output.tripCount,
          places: output.places,
          completedTime: output.completedTime,
          fallbackAmount: output.amount,
          basePay: output.basePay,
          tipAmounts,
          dropoffAddress: output.dropoffAddress,
          dropoffDistance: output.distance,
          perOfferAmounts: output.perOfferAmounts,
          isEarningsSummary: true
        });

        return true;
      }

      // If no explicit pairs, fall back to extracting places normally but still mark layout
      const places = this.extractPlaces(text);
      if (places.length > 0) {
        output.places = places;
        output.place = places[0];

        output.extractedTrips = this.buildExtractedTrips({
          tripCount: output.tripCount,
          places: output.places,
          completedTime: output.completedTime,
          fallbackAmount: output.amount,
          basePay: output.basePay,
          tipAmounts: this.extractTipAmounts(text),
          dropoffAddress: output.dropoffAddress,
          dropoffDistance: output.distance,
          perOfferAmounts: output.perOfferAmounts,
          isEarningsSummary: true
        });

        return true;
      }

      return false;
    }

    // Future layout-specific handlers go here

    return false;
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
    dropoffDistance?: number;
    perOfferAmounts?: number[];
    isEarningsSummary?: boolean;
  }): Array<{ place?: string; pay?: number; basePay?: number; tip?: number; dropoffTime?: string; dropoffAddress?: string; dropoffDistance?: number }> {
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

    // Split base pay for stacked orders (fallback)
    let basePayAmounts: number[] = [];
    if (input.basePay && count > 1) {
      basePayAmounts = ScreenshotClassificationHelper.splitBasePay(input.basePay, count);
    } else if (input.basePay && count === 1) {
      basePayAmounts = [input.basePay];
    }

    const perOffer = input.perOfferAmounts ?? [];

    const trips: Array<{ place?: string; pay?: number; basePay?: number; tip?: number; dropoffTime?: string; dropoffAddress?: string; dropoffDistance?: number }> = [];
    for (let index = 0; index < count; index++) {
      // Determine tip handling: only trust tipAmounts for per-offer tips when they align
      if (perOffer.length >= count) {
        // Prefer explicit per-offer amounts when available (earnings-summary)
        const offerPay = perOffer[index];
        const tipForOffer = (tipAmounts.length === perOffer.length && (tipAmounts[index] ?? 0) > 0)
          ? tipAmounts[index]
          : undefined;

        trips.push({
          place: places[index] ?? places[0],
          pay: offerPay,
          basePay: undefined,
          tip: tipForOffer,
          dropoffTime: input.isEarningsSummary ? undefined : input.completedTime,
          dropoffAddress: input.dropoffAddress,
          dropoffDistance: input.dropoffDistance
        });
      } else {
        const tip = tipAmounts[index] ?? 0;
        const basePay = basePayAmounts[index] ?? 0;
        const totalPay = basePay + tip;

        trips.push({
          place: places[index] ?? places[0],
          pay: totalPay > 0 ? totalPay : (count === 1 ? input.fallbackAmount : undefined),
          basePay: basePay > 0 ? basePay : undefined,
          tip: tip > 0 ? tip : undefined,
          dropoffTime: input.isEarningsSummary ? undefined : input.completedTime,
          dropoffAddress: input.dropoffAddress,
          dropoffDistance: input.dropoffDistance
        });
      }
    }

    return trips;
  }

}
