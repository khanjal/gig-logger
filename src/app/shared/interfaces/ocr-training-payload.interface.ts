/**
 * Payload generated from OCR correction flow for parser refinement.
 * This is copyable JSON intended for feedback/training iterations.
 */
export interface IOcrTrainingPayload {
  parserVersion: string;
  generatedAt: string;
  screenshotType: string;
  service: string | null;
  ocrText: string;
  layout?: {
    id?: string;
    name?: string;
    score?: number | null;
  } | null;
  detected: Record<string, unknown>;
  corrected: {
    date: string | null;
    service: string | null;
    trips: Array<{
      place: string | null;
      pay: number | null;
      tip: number | null;
      distance?: number | null;
      dropoffTime: string | null;
      dropoffAddress: string | null;
    }>;
  };
  notes: string | null;
}
