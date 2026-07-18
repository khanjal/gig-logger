/**
 * Result interface for parsed voice input data.
 * Contains all possible fields that can be extracted from speech recognition.
 */
export interface IVoiceParseResult {
  service?: string;
  type?: string;
  place?: string;
  name?: string;
  pay?: number;
  tip?: number;
  bonus?: number;
  cash?: number;
  distance?: number;
  startOdometer?: number;
  endOdometer?: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  unitNumber?: string;
  orderNumber?: string;
}
