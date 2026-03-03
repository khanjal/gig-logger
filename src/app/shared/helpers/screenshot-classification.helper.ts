import { IScreenshotClassification } from '@interfaces/screenshot-classification.interface';

/**
 * Helper class for screenshot classification and parsing logic.
 * Provides methods to classify screenshot types, extract base pay, and split pay for stacked orders.
 */
export class ScreenshotClassificationHelper {
  /**
   * Classifies the screenshot to determine type, service, and whether it's a stacked order.
   * 
   * @param text The OCR-extracted text from the screenshot
   * @param tripCount The detected number of trips from the text
   * @returns Classification containing type, service, and stacked order flag
   * 
   * @example
   * const classification = ScreenshotClassificationHelper.classifyScreenshot(ocrText, 2);
   * // Returns: { type: 'completion', service: 'doordash', isStackedOrder: true }
   */
  static classifyScreenshot(text: string, tripCount: number): IScreenshotClassification {
    const normalized = text.toLowerCase();

    let type: 'completion' | 'earnings-summary' | 'trip-details' | 'offer' | 'unknown' = 'unknown';
    const isOffer = /\baccept\b|\bdecline\b|\bguaranteed\b/i.test(text);
    const isCompletion = /deliver(?:y|ies)\s+completed|\bcompleted\b/i.test(text);

    if (isOffer) {
      type = 'offer';
    } else if (isCompletion) {
      type = 'completion';
    }

    let service: 'doordash' | 'uber' | 'grubhub' | 'unknown' = 'unknown';

    if (type === 'offer') {
      const hasDoorDashOfferSignals = /restaurant\s*pickup|customer\s*dropoff|\bguaranteed\b|\bdeliver\s*by\b|\baccept\b/i.test(text);
      const hasStrongDoorDashSignals = /dasher|dash\s*pay|earn\s*per\s*offer|doordash/i.test(text);
      const hasStrongUberSignals = /uber\s*eats|delivery\s*request/i.test(text);

      if (hasDoorDashOfferSignals || hasStrongDoorDashSignals) {
        service = 'doordash';
      } else if (hasStrongUberSignals) {
        service = 'uber';
      }
    } else {
      if (/doordash|dash\s*pay|dasher|earn\s*per\s*offer/.test(normalized)) {
        service = 'doordash';
      } else if (/uber|uber\s*eats/.test(normalized)) {
        service = 'uber';
      } else if (/grubhub/.test(normalized)) {
        service = 'grubhub';
      }
    }

    return {
      type,
      service,
      isStackedOrder: tripCount > 1
    };
  }

  /**
   * Extracts base pay amount from DoorDash Pay or Base Pay section of screenshot text.
   * 
   * @param text The OCR-extracted text from the screenshot
   * @returns The base pay amount, or null if not found
   * 
   * @example
   * const basePay = ScreenshotClassificationHelper.extractBasePay(ocrText);
   * // Returns: 9.00 (from "DoorDash Pay $9.00")
   */
  static extractBasePay(text: string): number | null {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    
    // Look for "DoorDash Pay" or "Base Pay" section
    const basePayIndex = lines.findIndex(line => 
      /(?:doordash\s*pay|base\s*pay)/i.test(line)
    );
    
    if (basePayIndex < 0) {
      return null;
    }
    
    // Check the line with the header and the next few lines
    for (let i = basePayIndex; i < Math.min(basePayIndex + 3, lines.length); i++) {
      const match = lines[i].match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (match) {
        const value = parseFloat(match[1]);
        if (!Number.isNaN(value) && value > 0) {
          return value;
        }
      }
    }
    
    return null;
  }

  /**
   * Splits base pay evenly across trips, rounding to nearest quarter for odd amounts.
   * Used for stacked orders where one base pay needs to be distributed across multiple trips.
   * 
   * @param basePay The total base pay to split
   * @param tripCount The number of trips to split across
   * @returns Array of base pay amounts per trip
   * 
   * @example
   * // Even split
   * ScreenshotClassificationHelper.splitBasePay(9.00, 2);
   * // Returns: [4.50, 4.50]
   * 
   * @example
   * // Quarter rounding for odd splits
   * ScreenshotClassificationHelper.splitBasePay(10.00, 3);
   * // Returns: [3.25, 3.25, 3.50]
   * 
   * @example
   * // Odd amount with quarter rounding
   * ScreenshotClassificationHelper.splitBasePay(2.25, 2);
   * // Returns: [1.00, 1.25]
   */
  static splitBasePay(basePay: number, tripCount: number): number[] {
    if (tripCount <= 1) {
      return [basePay];
    }
    
    const perTrip = basePay / tripCount;
    
    // Check if we can split evenly without rounding
    const evenSplit = Math.round(perTrip * 100) / 100;
    if (Math.abs(evenSplit * tripCount - basePay) < 0.01) {
      return Array(tripCount).fill(evenSplit);
    }
    
    // Split to nearest quarter
    const amounts: number[] = [];
    let remaining = basePay;
    
    for (let i = 0; i < tripCount; i++) {
      if (i === tripCount - 1) {
        // Last trip gets remaining (rounded to nearest quarter)
        amounts.push(Math.round(remaining * 4) / 4);
      } else {
        // Round to nearest quarter
        const amount = Math.round(perTrip * 4) / 4;
        amounts.push(amount);
        remaining -= amount;
      }
    }
    
    return amounts;
  }

  /**
   * Extracts the destination/dropoff address from offer screenshots.
   * Looks for standalone street-address patterns.
   */
  static extractDropoffAddress(text: string): string | null {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (/^\d{2,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,5}\s+(Road|Rd|Street|St|Avenue|Ave|Drive|Dr|Lane|Ln|Court|Ct|Way|Boulevard|Blvd)\b/i.test(line)) {
        return line;
      }
    }

    return null;
  }

  /**
   * Extracts the guaranteed offer amount from offer screenshots.
   */
  static extractGuaranteedAmount(text: string): number | null {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (/guaranteed/i.test(line)) {
        const match = line.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
        if (match) {
          const value = parseFloat(match[1]);
          if (!Number.isNaN(value) && value > 0) {
            return value;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extracts the restaurant name from offer screenshots by looking for
   * text after "Restaurant pickup" label.
   */
  static extractOfferRestaurantName(text: string): string | null {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    // Find the "Restaurant pickup" or similar label
    let restaurantNameIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/restaurant\s*pickup/i.test(lines[i])) {
        restaurantNameIndex = i + 1;
        break;
      }
    }

    // If not found, search for common restaurant indicators followed by a name
    if (restaurantNameIndex === -1) {
      for (let i = 0; i < lines.length; i++) {
        if (/^(?:Restaurant|Pickup|From):\s*(.+)$/i.test(lines[i])) {
          const match = lines[i].match(/^(?:Restaurant|Pickup|From):\s*(.+)$/i);
          if (match && match[1]?.trim()) {
            return match[1].trim();
          }
        }
      }
      return null;
    }

    // Extract the restaurant name - it should be the next non-empty line after the label
    // Filter out lines that are clearly not restaurant names (common blocklist)
    const blockedKeywords = ['customer', 'delivery', 'guaranteed', 'accept', 'decline', 'address', 'road', 'street', 'way'];
    
    while (restaurantNameIndex < lines.length) {
      const candidate = lines[restaurantNameIndex].trim();
      
      // Skip empty lines and lines that are too short
      if (!candidate || candidate.length < 2) {
        restaurantNameIndex++;
        continue;
      }

      // Skip lines that contain blocked keywords
      if (blockedKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(candidate))) {
        restaurantNameIndex++;
        continue;
      }

      // Skip lines that are just numbers, money, or addresses
      if (/^\d+$|^\$|^\d+\s+\w+\s+(?:Road|Rd|Street|St|Avenue|Ave|Drive|Dr|Lane|Ln)/i.test(candidate)) {
        restaurantNameIndex++;
        continue;
      }

      // This is likely the restaurant name
      return candidate;
    }

    return null;
  }
}
