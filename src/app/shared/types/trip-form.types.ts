import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';

/**
 * Form value type for the trip form component.
 * 
 * Based on Partial<ITrip> but overrides fields that are string-backed in the UI.
 * Form inputs allow null to represent "not provided" state, which helps with UX
 * (empty fields instead of showing "0"). These are converted to numbers at the
 * boundary when creating domain entities using NumberHelper.toNumber().
 */
export type TripFormValue = Omit<Partial<ITrip>, 'distance'|'startOdometer'|'endOdometer'|'pay'|'tip'|'bonus'|'cash'|'pickupTime'|'dropoffTime'|'exclude'> & {
  shift?: IShift | 'new' | null;
  // Numeric fields are represented as strings in the form inputs
  distance?: string | number | null;
  startOdometer?: string | number | null;
  endOdometer?: string | number | null;
  pay?: string | number | null;
  tip?: string | number | null;
  bonus?: string | number | null;
  cash?: string | number | null;
  // Time fields
  pickupTime?: string | null;
  dropoffTime?: string | null;
  // exclude is stored as a string in the form ('true' | undefined)
  exclude?: string | null;
};
