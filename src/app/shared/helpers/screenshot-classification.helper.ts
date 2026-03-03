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
    
    // Service detection
    let service: 'doordash' | 'uber' | 'grubhub' | 'unknown' = 'unknown';
    if (/doordash|dash\s*pay|dasher|earn\s*per\s*offer/.test(normalized)) {
      service = 'doordash';
    } else if (/uber|uber\s*eats/.test(normalized)) {
      service = 'uber';
    } else if (/grubhub/.test(normalized)) {
      service = 'grubhub';
    }
    
    const isStackedOrder = tripCount > 1;
    
    // Type detection
    let type: 'completion' | 'earnings-summary' | 'trip-details' | 'offer' | 'unknown' = 'unknown';
    if (/deliveries completed|completed/i.test(text)) {
      type = 'completion';
    }
    
    return { type, service, isStackedOrder };
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
}
