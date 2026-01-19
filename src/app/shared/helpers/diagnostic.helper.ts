import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { IPlace } from '@interfaces/place.interface';
import { IDuplicateGroup, IDuplicateResult, DiagnosticEntityType } from '@interfaces/diagnostic.interface';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';

export class DiagnosticHelper {
  /**
   * Find trips that don't have a corresponding shift
   */
  static findOrphanedTrips(trips: ITrip[], shifts: IShift[]): ITrip[] {
    const shiftKeys = new Set(shifts.map(s => s.key));
    return trips.filter(t => t.key && !shiftKeys.has(t.key) && !t.exclude);
  }

  /**
   * Find shifts with start/end times but no calculated duration
   */
  static findShiftsWithoutDuration(shifts: IShift[]): IShift[] {
    return shifts.filter(shift => {
      const hasStartTime = shift.start && shift.start.trim().length > 0;
      const hasEndTime = shift.finish && shift.finish.trim().length > 0;
      const hasDuration = shift.time && shift.time.trim().length > 0;

      return hasStartTime && hasEndTime && !hasDuration;
    });
  }

  /**
   * Find trips with pickup/dropoff times but no calculated duration
   */
  static findTripsWithoutDuration(trips: ITrip[]): ITrip[] {
    return trips.filter(trip => {
      const hasPickupTime = trip.pickupTime && trip.pickupTime.trim().length > 0;
      const hasDropoffTime = trip.dropoffTime && trip.dropoffTime.trim().length > 0;
      const hasDuration = trip.duration && trip.duration.trim().length > 0;

      return hasPickupTime && hasDropoffTime && !hasDuration;
    });
  }

  /**
   * Find trips with a place but no start address
   */
  static findTripsWithPlaceNoAddress(
    trips: ITrip[], 
    places: IPlace[], 
    selectedAddress: { [key: number]: string }
  ): any[] {
    // Validate selectedAddress parameter
    if (!selectedAddress || typeof selectedAddress !== 'object') {
      throw new Error('selectedAddress parameter must be a valid object');
    }

    const placeMap = new Map<string, IPlace>();
    places.forEach(p => placeMap.set(p.place, p));

    return trips.filter(trip => {
      const hasPlace = trip.place && trip.place.trim().length > 0;
      const hasStartAddress = trip.startAddress && trip.startAddress.trim().length > 0;
      return hasPlace && !hasStartAddress;
    }).map(trip => {
      const place = placeMap.get(trip.place);
      const availableAddresses = place?.addresses?.map(a => a.address) || [];
      
      // Auto-select if only one address available
      if (availableAddresses.length === 1) {
        selectedAddress[trip.rowId] = availableAddresses[0];
      }
      
      return {
        ...trip,
        availableAddresses
      };
    });
  }

  /**
   * Merge duplicate groups from multiple detection strategies (equals + contains)
   */
  static mergeDuplicateGroups<T>(
    primary: IDuplicateGroup<T>[],
    secondary: IDuplicateGroup<T>[]
  ): IDuplicateResult<T> {
    const groups: T[][] = [];
    const items: T[] = [];

    const getId = (x: any): string | number =>
      (x?.id ?? x?.rowId ?? x?.place ?? x?.name ?? x?.address ?? x?.service ?? x?.region ?? JSON.stringify(x));

    const groupKey = (g: T[]) =>
      g.map(i => getId(i))
        .sort((a: any, b: any) => ('' + a).localeCompare('' + b))
        .join('|');

    const seenGroupKeys = new Set<string>();
    const seenItemIds = new Set<string | number>();

    const pushGroup = (g: T[]) => {
      const key = groupKey(g);
      if (seenGroupKeys.has(key)) return;
      seenGroupKeys.add(key);
      groups.push(g);
      for (const item of g) {
        const id = getId(item);
        if (!seenItemIds.has(id)) {
          seenItemIds.add(id);
          items.push(item);
        }
      }
    };

    for (const g of primary) pushGroup(g.items);
    for (const g of secondary) pushGroup(g.items);

    return { items, groups };
  }

  /**
   * Recompute trip/shift counts for a group after merging duplicates
   */
  static async recomputeGroupCounts(
    itemType: DiagnosticEntityType,
    group: any[],
    tripService: TripService,
    shiftService: ShiftService
  ): Promise<void> {
    const trips = await tripService.list();
    const shifts = itemType === 'service' || itemType === 'region' 
      ? await shiftService.list() 
      : [];

    for (const item of group) {
      switch (itemType) {
        case 'place':
          item.trips = trips.filter((t: ITrip) => t.place === item.place).length;
          break;

        case 'name':
          const nameTrips = trips.filter((t: ITrip) => t.name === item.name);
          item.trips = nameTrips.length;
          item.addresses = [...new Set(nameTrips.map(t => t.endAddress).filter(a => a))];
          break;

        case 'address':
          item.trips = trips.filter((t: ITrip) => 
            t.startAddress === item.address || t.endAddress === item.address
          ).length;
          break;

        case 'service':
          item.trips = trips.filter((t: ITrip) => t.service === item.service).length;
          item.shifts = shifts.filter((s: IShift) => s.service === item.service).length;
          break;

        case 'region':
          item.trips = trips.filter((t: ITrip) => t.region === item.region).length;
          item.shifts = shifts.filter((s: IShift) => s.region === item.region).length;
          break;
      }

      // Mark as fixed if all counts are zero
      // For types without shifts (place, name, address), only check trips
      const allZero = itemType === 'place' || itemType === 'name' || itemType === 'address'
        ? item.trips === 0
        : item.trips === 0 && item.shifts === 0;
      
      if (allZero) {
        (item as any).fixed = true;
      }
    }
  }

  /**
   * Custom address comparator for finding duplicates with variations
   */
  static createAddressComparator(): (a: string, b: string) => boolean {
    return (a: string, b: string): boolean => {
      const stripCountry = (s: string) => s.replace(/,\s*usa$/i, '');
      const normalize = (s: string) => stripCountry(s).trim().replace(/\s+/g, ' ');
      const sa = normalize(a);
      const sb = normalize(b);

      // Split by comma to get potential store name prefix + address parts
      const splitParts = (s: string) => s.split(',').map(p => p.trim());
      const pa = splitParts(sa);
      const pb = splitParts(sb);

      // Extract City/State/Zip (always the last parts joined)
      const extractCityStateZip = (parts: string[]): string => {
        if (parts.length < 2) return '';
        return parts.slice(-2).join(', ');
      };

      const aCSZ = extractCityStateZip(pa);
      const bCSZ = extractCityStateZip(pb);

      // City/State/Zip must match exactly
      if (!aCSZ || !bCSZ || aCSZ !== bCSZ) return false;

      // Extract street address (remove store name prefix and city/state/zip)
      const extractStreet = (parts: string[]): string => {
        if (parts.length <= 2) return parts[0];
        return parts.slice(0, -2).join(', ');
      };

      const aStreet = extractStreet(pa);
      const bStreet = extractStreet(pb);

      // Strip store prefix - find first number, everything from that point is the address
      const stripStorePrefix = (s: string): string => {
        const match = s.match(/\d+.*$/);
        return match ? match[0] : s;
      };

      const aCore = stripStorePrefix(aStreet);
      const bCore = stripStorePrefix(bStreet);

      // Check if house numbers differ
      const extractNumber = (s: string) => (s.match(/^\d+/)?.[0] ?? '');
      const numA = extractNumber(aCore);
      const numB = extractNumber(bCore);
      
      if (numA && numB && numA !== numB) return false;

      // After stripping store prefix, they should match
      return aCore === bCore;
    };
  }

  /**
   * Mark orphaned-trip diagnostic items as fixed for the provided shift keys
   */
  static markOrphanedTripsFixed(diagnostic: any | undefined, keys: string[]) {
    if (!diagnostic || !diagnostic.items || !Array.isArray(keys) || keys.length === 0) return;

    for (const key of keys) {
      const matched = diagnostic.items.filter((t: ITrip) => t.key === key);
      matched.forEach((t: ITrip) => (t as any).fixed = true);
      diagnostic.count = Math.max(0, diagnostic.count - matched.length);
    }
  }
}
