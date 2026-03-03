/**
 * Payload generated from OCR correction flow for parser refinement.
 * This is copyable JSON intended for feedback/training iterations.
 */
export interface IOcrTrainingPayload {
  parserVersion: string;
  generatedAt: string;
  screenshotType: string;
  service?: string;
  ocrText: string;
  detected: Record<string, unknown>;
  corrected: {
    date?: string;
    service?: string;
    trips: Array<{
      place?: string;
      pay?: number;
      tip?: number;
      dropoffTime?: string;
      dropoffAddress?: string;
    }>;
  };
  notes?: string;
}
