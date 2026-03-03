/**
 * Classification result for screenshots to determine screenshot type, service, and order structure.
 * Used by OCR parser to apply appropriate extraction strategies.
 */
export interface IScreenshotClassification {
  /** The type of screenshot (completion screen, earnings summary, etc.) */
  type: 'completion' | 'earnings-summary' | 'trip-details' | 'offer' | 'unknown';
  
  /** The gig service provider (DoorDash, Uber, Grubhub, etc.) */
  service: 'doordash' | 'uber' | 'grubhub' | 'unknown';
  
  /** Whether this is a stacked order (multiple trips in one order) */
  isStackedOrder: boolean;
}
