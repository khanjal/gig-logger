import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { BackToTopComponent } from '@components/ui/back-to-top/back-to-top.component';
import { DurationFormatPipe } from '@pipes/duration-format.pipe';
import { DateHelper } from '@helpers/date.helper';
import { ShiftHelper } from '@helpers/shift.helper';
import { updateAction } from '@utils/action.utils';
import { ActionEnum } from '@enums/action.enum';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { AddressService } from '@services/sheets/address.service';
import { PlaceService } from '@services/sheets/place.service';
import { NameService } from '@services/sheets/name.service';
import { ServiceService } from '@services/sheets/service.service';
import { RegionService } from '@services/sheets/region.service';
import { LoggerService } from '@services/logger.service';
import { GigCalculatorService } from '@services/calculations/gig-calculator.service';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { IAddress } from '@interfaces/address.interface';
import { IPlace } from '@interfaces/place.interface';
import { IName } from '@interfaces/name.interface';
import { IService } from '@interfaces/service.interface';
import { IRegion } from '@interfaces/region.interface';

interface DiagnosticItem {
  name: string;
  count: number;
  severity: 'info' | 'warning' | 'error';
  description: string;
  itemType?: 'shift' | 'trip' | 'address' | 'place' | 'name' | 'service' | 'region';
  items?: any[];
  groups?: any[][];
  fixable?: boolean;
  bulkFixable?: boolean;
  selectedValues?: Map<number, any>;
}

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatButtonModule, MatExpansionModule, MatRadioModule, MatTooltipModule, MatProgressSpinnerModule, FormsModule, BackToTopComponent, DurationFormatPipe],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.scss'
})
export class DiagnosticsComponent implements OnInit {
  dataDiagnostics: DiagnosticItem[] = [];
  isLoading = false;
  isBulkFixing = false;
  selectedValue: any[] = [];
  selectedAddress: { [key: number]: string } = {};
  selectedShiftToDelete: { [key: number]: number } = {};

  constructor(
    private _shiftService: ShiftService,
    private _tripService: TripService,
    private _addressService: AddressService,
    private _placeService: PlaceService,
    private _nameService: NameService,
    private _serviceService: ServiceService,
    private _regionService: RegionService,
    private _logger: LoggerService,
    private _gigCalculator: GigCalculatorService,
    private _gigWorkflow: GigWorkflowService
  ) { }

  ngOnInit() {
    // Automatically run diagnostics on page load
    this.runDiagnostics();
  }

  async runDiagnostics() {
    this.isLoading = true;
    this.dataDiagnostics = [];
    this.selectedValue = [];

    try {
      await this.checkDataIntegrity();
    } finally {
      this.isLoading = false;
    }
  }

  private async checkDataIntegrity() {
    const shifts = await this._shiftService.list();
    const trips = await this._tripService.list();
    const addresses = await this._addressService.list();
    const places = await this._placeService.list();
    const names = await this._nameService.list();
    const services = await this._serviceService.list();
    const regions = await this._regionService.list();



    // Duplicate shifts via shared utility (same key)
    const shiftGroups = await this._shiftService.findDuplicates('key', { mode: 'equals', caseInsensitive: false, normalize: true });
    const duplicateShiftsResult = { items: shiftGroups.flatMap(g => g.items), groups: shiftGroups.map(g => g.items) };
    this._logger.debug('Duplicate shifts found:', duplicateShiftsResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Shifts',
      count: duplicateShiftsResult.items.length,
      severity: duplicateShiftsResult.items.length > 0 ? 'warning' : 'info',
      description: 'Shifts with identical keys',
      itemType: 'shift',
      items: duplicateShiftsResult.items,
      groups: duplicateShiftsResult.groups
    });

    // Check for empty shifts
    const emptyShifts = shifts.filter((s: IShift) => !s.start && !s.finish && s.trips === 0 && s.totalTrips === 0);
    this._logger.debug('Empty shifts found:', emptyShifts);

    this.dataDiagnostics.push({
      name: 'Empty Shifts',
      count: emptyShifts.length,
      severity: emptyShifts.length > 0 ? 'warning' : 'info',
      description: 'Shifts with zero trips and no start/finish times',
      itemType: 'shift',
      items: emptyShifts
    });

    // Check for orphaned trips
    const orphanedTrips = this.findOrphanedTrips(trips, shifts);
    this._logger.debug('Orphaned trips found:', orphanedTrips);

    this.dataDiagnostics.push({
      name: 'Orphaned Trips',
      count: orphanedTrips.length,
      severity: orphanedTrips.length > 0 ? 'error' : 'info',
      description: 'Trips not associated with any shift',
      itemType: 'trip',
      items: orphanedTrips
    });

    // Duplicate places via shared utility (equals + contains)
    const placeEqualsGroups = await this._placeService.findDuplicates('place', { mode: 'equals', caseInsensitive: true, normalize: true });
    const placeContainsGroups = await this._placeService.findDuplicates('place', { mode: 'contains', caseInsensitive: true, normalize: true, minLength: 2 });
    const duplicatePlacesResult = this.mergeDuplicateGroups(placeEqualsGroups, placeContainsGroups);
    // Recompute trip counts per place using case-sensitive matching
    for (const group of duplicatePlacesResult.groups ?? []) {
      await this.recomputeGroupCounts('place', group);
    }
    this._logger.debug('Duplicate places found:', duplicatePlacesResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Places',
      count: duplicatePlacesResult.items.length,
      severity: duplicatePlacesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Places with different casing or variations',
      itemType: 'place',
      items: duplicatePlacesResult.items,
      groups: duplicatePlacesResult.groups
    });

    // Duplicate addresses via shared utility with address-specific rules
    const addressComparator = (a: string, b: string): boolean => {
      const stripCountry = (s: string) => s.replace(/,\s*usa$/i, '');
      const normalize = (s: string) => stripCountry(s).trim().replace(/\s+/g, ' ');
      const sa = normalize(a), sb = normalize(b);

      // Split by comma to get potential store name prefix + address parts
      const splitParts = (s: string) => s.split(',').map(p => p.trim());
      const pa = splitParts(sa), pb = splitParts(sb);

      // City/State/Zip is always the last parts joined; find where it starts
      // It contains city name and PA/state abbreviation
      const extractCityStateZip = (parts: string[]): string => {
        // City is typically 2nd to last part; state+zip is last part
        if (parts.length < 2) return '';
        return parts.slice(-2).join(', ');
      };

      const aCSZ = extractCityStateZip(pa);
      const bCSZ = extractCityStateZip(pb);

      // City/State/Zip must match exactly
      if (!aCSZ || !bCSZ || aCSZ !== bCSZ) return false;

      // Extract street address (remove store name prefix and city/state/zip)
      // Street is everything before the city+state portion
      const extractStreet = (parts: string[]): string => {
        if (parts.length <= 2) return parts[0];
        // All parts except last 2 (city, state+zip) are street/store prefix
        return parts.slice(0, -2).join(', ');
      };

      const aStreet = extractStreet(pa);
      const bStreet = extractStreet(pb);

      // After extracting street, one might be a store name prefix of the other
      // e.g., "Wingstop, 1700 Wilmington Rd Ste 950" vs "1700 Wilmington Rd Ste 950"
      // Extract the numeric house+street part (remove any leading store name)
      const stripStorePrefix = (s: string): string => {
        // Find the first number; everything from that point is the address
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

    const addressEqualsGroups = await this._addressService.findDuplicates('address', {
      mode: 'equals', caseInsensitive: true, normalize: true,
      comparator: addressComparator,
      keyNormalizer: (s: string) => s.replace(/,\s*usa$/i, '').trim().replace(/\s+/g, ' ')
    });
    const addressContainsGroups = await this._addressService.findDuplicates('address', {
      mode: 'contains', caseInsensitive: true, normalize: true, minLength: 5,
      comparator: addressComparator,
      keyNormalizer: (s: string) => s.replace(/,\s*usa$/i, '').trim().replace(/\s+/g, ' ')
    });
    const duplicateAddressesResult = this.mergeDuplicateGroups(addressEqualsGroups, addressContainsGroups);
    // Recompute trip counts per address
    for (const group of duplicateAddressesResult.groups ?? []) {
      await this.recomputeGroupCounts('address', group);
    }
    this._logger.debug('Duplicate addresses found:', duplicateAddressesResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Addresses',
      count: duplicateAddressesResult.items.length,
      severity: duplicateAddressesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Addresses with different casing or partial matches',
      itemType: 'address',
      items: duplicateAddressesResult.items,
      groups: duplicateAddressesResult.groups
    });

    // Duplicate names via shared utility (equals only)
    const nameEqualsGroups = await this._nameService.findDuplicates('name', { mode: 'equals', caseInsensitive: true, normalize: true });
    const duplicateNamesResult = this.mergeDuplicateGroups(nameEqualsGroups, []);
    // Recompute name trip counts and addresses
    for (const group of duplicateNamesResult.groups ?? []) {
      await this.recomputeGroupCounts('name', group);
    }
    this._logger.debug('Duplicate names found:', duplicateNamesResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Names',
      count: duplicateNamesResult.items.length,
      severity: duplicateNamesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Names with different casing',
      itemType: 'name',
      items: duplicateNamesResult.items,
      groups: duplicateNamesResult.groups
    });

    // Duplicate services via shared utility (case-insensitive equals)
    const serviceEqualsGroups = await this._serviceService.findDuplicates('service', { mode: 'equals', caseInsensitive: true, normalize: true });
    const serviceContainsGroups = await this._serviceService.findDuplicates('service', { mode: 'contains', caseInsensitive: true, normalize: true, minLength: 2 });
    const duplicateServicesResult = this.mergeDuplicateGroups(serviceEqualsGroups, serviceContainsGroups);
    // Recompute trip counts per service
    for (const group of duplicateServicesResult.groups ?? []) {
      await this.recomputeGroupCounts('service', group);
    }
    this._logger.debug('Duplicate services found:', duplicateServicesResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Services',
      count: duplicateServicesResult.items.length,
      severity: duplicateServicesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Services with different casing or variations (e.g., DoorDash vs Doordash)',
      itemType: 'service',
      items: duplicateServicesResult.items,
      groups: duplicateServicesResult.groups
    });

    // Duplicate regions via shared utility (case-insensitive equals only)
    const regionEqualsGroups = await this._regionService.findDuplicates('region', { mode: 'equals', caseInsensitive: true, normalize: true });
    const duplicateRegionsResult = this.mergeDuplicateGroups(regionEqualsGroups, []);
    // Recompute trip counts per region
    for (const group of duplicateRegionsResult.groups ?? []) {
      await this.recomputeGroupCounts('region', group);
    }
    this._logger.debug('Duplicate regions found:', duplicateRegionsResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Regions',
      count: duplicateRegionsResult.items.length,
      severity: duplicateRegionsResult.items.length > 0 ? 'warning' : 'info',
      description: 'Regions with different casing',
      itemType: 'region',
      items: duplicateRegionsResult.items,
      groups: duplicateRegionsResult.groups
    });

    // Check for shifts with start/end times but no duration
    const shiftsWithoutDuration = this.findShiftsWithoutDuration(shifts);
    this._logger.debug('Shifts without duration found:', shiftsWithoutDuration);
    this.dataDiagnostics.push({
      name: 'Shifts Missing Time Duration',
      count: shiftsWithoutDuration.length,
      severity: shiftsWithoutDuration.length > 0 ? 'warning' : 'info',
      description: 'Shifts with start/end times but no calculated duration',
      itemType: 'shift',
      items: shiftsWithoutDuration
    });

    // Check for trips with pickup/dropoff times but no duration
    const tripsWithoutDuration = this.findTripsWithoutDuration(trips);
    this._logger.debug('Trips without duration found:', tripsWithoutDuration);
    this.dataDiagnostics.push({
      name: 'Trips Missing Duration',
      count: tripsWithoutDuration.length,
      severity: tripsWithoutDuration.length > 0 ? 'warning' : 'info',
      description: 'Trips with pickup/dropoff times but no calculated duration',
      itemType: 'trip',
      items: tripsWithoutDuration
    });

    // Check for trips with place but no start address
    const tripsWithPlaceNoAddress = this.findTripsWithPlaceNoAddress(trips, places);
    this._logger.debug('Trips with place but no address found:', tripsWithPlaceNoAddress);
    this.dataDiagnostics.push({
      name: 'Trip Places Missing Address',
      count: tripsWithPlaceNoAddress.length,
      severity: tripsWithPlaceNoAddress.length > 0 ? 'warning' : 'info',
      description: 'Trips with a place but no start address',
      itemType: 'trip',
      items: tripsWithPlaceNoAddress
    });

    this._logger.info('Final dataDiagnostics:', this.dataDiagnostics);
  }

  private findOrphanedTrips(trips: ITrip[], shifts: IShift[]): ITrip[] {
    const shiftKeys = new Set(shifts.map(s => s.key));
    return trips.filter(t => t.key && !shiftKeys.has(t.key) && !t.exclude);
  }

  private mergeDuplicateGroups<T>(
    primary: { key: string; items: T[] }[],
    secondary: { key: string; items: T[] }[]
  ): { items: T[]; groups: T[][] } {
    const groups: T[][] = [];
    const items: T[] = [];

    const getId = (x: any): string | number =>
      (x?.id ?? x?.rowId ?? x?.place ?? x?.name ?? x?.address ?? x?.service ?? x?.region ?? JSON.stringify(x));

    const groupKey = (g: T[]) =>
      g.map(i => getId(i)).sort((a: any, b: any) => ('' + a).localeCompare('' + b)).join('|');

    const seenGroupKeys = new Set<string>();
    const seenItemIds = new Set<string | number>();

    const pushGroup = (g: T[]) => {
      const key = groupKey(g);
      if (seenGroupKeys.has(key)) return;
      seenGroupKeys.add(key);
      groups.push(g);
      for (const it of g) {
        const id = getId(it);
        if (!seenItemIds.has(id)) {
          seenItemIds.add(id);
          items.push(it);
        }
      }
    };

    for (const g of primary) pushGroup(g.items);
    for (const g of secondary) pushGroup(g.items);

    return { items, groups };
  }

  private findShiftsWithoutDuration(shifts: IShift[]): IShift[] {
    return shifts.filter(shift => {
      // Check if shift has start and end times but no duration
      const hasStartTime = shift.start && shift.start.trim().length > 0;
      const hasEndTime = shift.finish && shift.finish.trim().length > 0;
      const hasDuration = shift.time && shift.time.trim().length > 0;

      return hasStartTime && hasEndTime && !hasDuration;
    });
  }

  private findTripsWithoutDuration(trips: ITrip[]): ITrip[] {
    return trips.filter(trip => {
      // Check if trip has pickup and dropoff times but no duration
      const hasPickupTime = trip.pickupTime && trip.pickupTime.trim().length > 0;
      const hasDropoffTime = trip.dropoffTime && trip.dropoffTime.trim().length > 0;
      const hasDuration = trip.duration && trip.duration.trim().length > 0;

      return hasPickupTime && hasDropoffTime && !hasDuration;
    });
  }

  private findTripsWithPlaceNoAddress(trips: ITrip[], places: IPlace[]): any[] {
    const placeMap = new Map<string, IPlace>();
    places.forEach(p => placeMap.set(p.place, p));

    return trips.filter(trip => {
      const hasPlace = trip.place && trip.place.trim().length > 0;
      const hasStartAddress = trip.startAddress && trip.startAddress.trim().length > 0;
      return hasPlace && !hasStartAddress;
    }).map(trip => {
      const place = placeMap.get(trip.place);
      const availableAddresses = place?.addresses?.map(a => a.address) || [];
      if (availableAddresses.length === 1) {
        this.selectedAddress[trip.rowId] = availableAddresses[0];
      }
      return {
        ...trip,
        availableAddresses
      };
    });
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'error': return 'warn';
      case 'warning': return 'accent';
      default: return 'primary';
    }
  }

  getCountBySeverity(severity: 'info' | 'warning' | 'error'): number {
    return this.dataDiagnostics
      .filter(item => item.severity === severity)
      .reduce((sum, item) => sum + item.count, 0);
  }

  getTotalIssues(): number {
    return this.dataDiagnostics.reduce((sum, item) => sum + item.count, 0);
  }

  async mergeDuplicates(group: any[], selectedItem: any, itemType: 'place' | 'name' | 'address' | 'service' | 'region') {
    const trips = await this._tripService.list();
    
    for (const item of group) {
      if (item === selectedItem) continue;
      
      let affectedTrips: ITrip[] = [];
      if (itemType === 'place') {
        affectedTrips = trips.filter(t => t.place === item.place);
      } else if (itemType === 'name') {
        affectedTrips = trips.filter(t => t.name === item.name);
      } else if (itemType === 'address') {
        affectedTrips = trips.filter(t => t.startAddress === item.address || t.endAddress === item.address);
      } else if (itemType === 'service') {
        affectedTrips = trips.filter(t => t.service === item.service);
      } else if (itemType === 'region') {
        affectedTrips = trips.filter(t => t.region === item.region);
      }
      
      for (const trip of affectedTrips) {
        if (itemType === 'place') {
          trip.place = selectedItem.place;
        } else if (itemType === 'name') {
          trip.name = selectedItem.name;
        } else if (itemType === 'address') {
          if (trip.startAddress === item.address) trip.startAddress = selectedItem.address;
          if (trip.endAddress === item.address) trip.endAddress = selectedItem.address;
        } else if (itemType === 'service') {
          trip.service = selectedItem.service;
        } else if (itemType === 'region') {
          trip.region = selectedItem.region;
        }
        updateAction(trip, ActionEnum.Update);
        await this._tripService.update([trip]);
      }
      
      item.trips = 0;
    }

    await this.recomputeGroupCounts(itemType, group);
  }

  private async recomputeGroupCounts(itemType: 'place' | 'name' | 'address' | 'service' | 'region', group: any[]) {
    const trips = await this._tripService.list();
    for (const item of group) {
      if (itemType === 'place') {
        item.trips = trips.filter((t: ITrip) => t.place === item.place).length;
      } else if (itemType === 'name') {
        const nameTrips = trips.filter((t: ITrip) => t.name === item.name);
        item.trips = nameTrips.length;
        item.addresses = [...new Set(nameTrips.map(t => t.endAddress).filter(a => a))];
      } else if (itemType === 'address') {
        item.trips = trips.filter((t: ITrip) => t.startAddress === item.address || t.endAddress === item.address).length;
      } else if (itemType === 'service') {
        item.trips = trips.filter((t: ITrip) => t.service === item.service).length;
      } else if (itemType === 'region') {
        item.trips = trips.filter((t: ITrip) => t.region === item.region).length;
      }
      if (item.trips === 0) {
        (item as any).fixed = true;
      }
    }
  }

  async fixShiftDuration(shift: IShift) {
    if (!shift.start || !shift.finish) return;
    const duration = DateHelper.getDurationSeconds(shift.start, shift.finish);
    shift.time = DateHelper.getDurationString(duration);
    updateAction(shift, ActionEnum.Update);
    await this._shiftService.update([shift]);
    (shift as any).fixed = true;
    this.decrementDiagnosticCount('Shifts Missing Time Duration');
  }

  async fixTripDuration(trip: ITrip) {
    await this._gigCalculator.updateTripDuration(trip);
    
    (trip as any).fixed = true;
    this.decrementDiagnosticCount('Trips Missing Duration');
  }

  async bulkFixShiftDurations() {
    this.isBulkFixing = true;
    try {
      const shifts = await this._shiftService.list();
      const shiftsToFix = this.findShiftsWithoutDuration(shifts);
      
      for (const shift of shiftsToFix) {
        if (shift.start && shift.finish) {
          const duration = DateHelper.getDurationSeconds(shift.start, shift.finish);
          shift.time = DateHelper.getDurationString(duration);
          updateAction(shift, ActionEnum.Update);
          await this._shiftService.update([shift]);
        }
      }
      
      await this.runDiagnostics();
    } finally {
      this.isBulkFixing = false;
    }
  }

  async bulkFixTripDurations() {
    this.isBulkFixing = true;
    try {
      const trips = await this._tripService.list();
      const tripsToFix = this.findTripsWithoutDuration(trips);
      
      for (const trip of tripsToFix) {
        await this._gigCalculator.updateTripDuration(trip);
      }
      
      await this.runDiagnostics();
    } finally {
      this.isBulkFixing = false;
    }
  }

  async applyAddressToTrip(trip: any, address: string) {
    trip.startAddress = address;
    trip.addressApplied = true;
    updateAction(trip, ActionEnum.Update);
    await this._tripService.update([trip]);
  }

  async createShiftFromTrip(trip: ITrip) {
    const newShift = ShiftHelper.createShiftFromTrip(trip);
    newShift.rowId = await this._shiftService.getMaxRowId() + 1;
    
    await this._gigWorkflow.calculateShiftTotals([newShift]);
    await this._shiftService.add(newShift);
    
    const diagnostic = this.dataDiagnostics.find(d => d.name === 'Orphaned Trips');
    if (diagnostic && diagnostic.items) {
      const tripsWithSameKey = diagnostic.items.filter((t: ITrip) => t.key === trip.key);
      tripsWithSameKey.forEach((t: ITrip) => (t as any).fixed = true);
      diagnostic.count -= tripsWithSameKey.length;
    }
  }

  private decrementDiagnosticCount(diagnosticName: string) {
    const diagnostic = this.dataDiagnostics.find(d => d.name === diagnosticName);
    if (diagnostic && diagnostic.count > 0) {
      diagnostic.count--;
    }
  }

  hasMarkedForDelete(group: IShift[]): boolean {
    return group.some(s => (s as any).markedForDelete);
  }



  async markShiftForDelete(group: IShift[], rowId: number, groupIndex: number) {
    const shift = group.find(s => s.rowId === rowId);
    if (!shift) return;
    
    if (shift.action === ActionEnum.Add) {
      await this._shiftService.delete(shift.id!);
    } else {
      updateAction(shift, ActionEnum.Delete);
      await this._shiftService.update([shift]);
    }
    
    (shift as any).markedForDelete = true;
    this.selectedShiftToDelete[groupIndex] = undefined as any;
  }
}
