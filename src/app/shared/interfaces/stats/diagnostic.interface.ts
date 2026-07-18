export type DiagnosticEntityType = 'shift' | 'trip' | 'address' | 'place' | 'name' | 'service' | 'type' | 'region';

/**
 * Flattened view covering every field the diagnostics UI reads across all entity
 * types (shift/trip/address/place/name/service/type/region). A diagnostic item's
 * concrete shape is only known at runtime via `itemType`, and Angular's strict
 * template checker can't narrow a union based on a sibling input, so the display
 * layer works against this superset instead. Real service calls cast back to the
 * concrete entity (IShift/ITrip/etc.) at the point where they need it.
 */
export interface IDiagnosticRecord {
  id?: number;
  rowId?: number;
  date?: string;
  key?: string;
  place?: string;
  name?: string;
  address?: string;
  startAddress?: string;
  service?: string;
  region?: string;
  type?: string;
  trips?: number;
  shifts?: number;
  totalTrips?: number;
  start?: string;
  finish?: string;
  exclude?: boolean;
  pickupTime?: string;
  dropoffTime?: string;
  duration?: string;
  names?: string[];
  addresses?: unknown[];
  fixed?: boolean;
  markedForDelete?: boolean;
  addressApplied?: boolean;
  availableAddresses?: string[];
}

export interface IDiagnosticItem {
  name: string;
  count: number;
  severity: 'info' | 'warning' | 'error';
  description: string;
  itemType?: DiagnosticEntityType;
  items?: IDiagnosticRecord[];
  groups?: IDiagnosticRecord[][];
  fixable?: boolean;
  bulkFixable?: boolean;
  selectedValues?: Map<number, IDiagnosticRecord>;
}

export interface IDuplicateGroup<T> {
  key: string;
  items: T[];
}

export interface IDuplicateResult<T> {
  items: T[];
  groups: T[][];
}
