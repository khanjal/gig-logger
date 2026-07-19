import type { OnInit} from '@angular/core';
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { BaseRectButtonComponent, BaseFabButtonComponent } from '@components/base';
import { BackToTopComponent } from '@components/ui/back-to-top/back-to-top.component';
import { DateHelper } from '@helpers/date.helper';
import { ShiftHelper } from '@helpers/shift.helper';
import { DiagnosticHelper } from '@helpers/diagnostic.helper';
import { createAsyncOperationState } from '@helpers/async-operation-state.helper';
import { updateAction } from '@utils/action.utils';
import { openSnackbar } from '@utils/snackbar.util';
import { ActionEnum } from '@enums/action.enum';
import { SNACKBAR_MESSAGES } from '@constants/snackbar.constants';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { AddressService } from '@services/sheets/address.service';
import { PlaceService } from '@services/sheets/place.service';
import { NameService } from '@services/sheets/name.service';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { RegionService } from '@services/sheets/region.service';
import { LoggerService } from '@services/logger.service';
import { GigCalculatorService } from '@services/calculations/gig-calculator.service';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { UiPreferencesService } from '@services/ui-preferences.service';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IDiagnosticItem, IDiagnosticRecord, DiagnosticEntityType } from '@interfaces/stats/diagnostic.interface';
import { DiagnosticGroupComponent } from './diagnostic-group/diagnostic-group.component';
import { DiagnosticItemComponent } from './diagnostic-item/diagnostic-item.component';

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, BaseRectButtonComponent, BaseFabButtonComponent, MatExpansionModule, MatRadioModule, MatFormFieldModule, MatSelectModule, MatTooltipModule, MatProgressSpinnerModule, FormsModule, BackToTopComponent, DiagnosticGroupComponent, DiagnosticItemComponent],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.scss'
})

export class DiagnosticsComponent implements OnInit {
  private _shiftService = inject(ShiftService);
  private _tripService = inject(TripService);
  private _addressService = inject(AddressService);
  private _placeService = inject(PlaceService);
  private _nameService = inject(NameService);
  private _serviceService = inject(ServiceService);
  private _typeService = inject(TypeService);
  private _regionService = inject(RegionService);
  private _logger = inject(LoggerService);
  private _gigCalculator = inject(GigCalculatorService);
  private _gigWorkflow = inject(GigWorkflowService);
  private _uiPreferences = inject(UiPreferencesService);
  private _snackBar = inject(MatSnackBar);

  private readonly _diagnosticsState = createAsyncOperationState();
  public readonly isLoading = this._diagnosticsState.isLoading;
  public readonly hasError = this._diagnosticsState.hasError;

  public dataDiagnostics = signal<IDiagnosticItem[]>([]);
  public isBulkFixing = signal(false);
  public selectedValue: (IDiagnosticRecord | undefined)[] = [];
  public selectedAddress: Record<number, string> = {};
  public selectedShiftToDelete: Record<number, number | undefined> = {};

  public trackByDiagnostic(index: number, item: IDiagnosticItem): string | number {
    return item.name ?? index;
  }

  public trackByGroup(_index: number, group: IDiagnosticRecord[]): string | number {
    const first = group?.[0];
    return first?.rowId ?? first?.id ?? first?.key ?? first?.name ?? group.length;
  }

  public trackByProblemItem(index: number, item: IDiagnosticRecord): string | number {
    // Prefer rowId, id, key, or fallback to index
    return item?.rowId ?? item?.id ?? item?.key ?? index;
  }

  public ngOnInit() {
    // Automatically run diagnostics on page load
    this.runDiagnostics();
  }

  public async runDiagnostics() {
    this._diagnosticsState.setLoading();
    this.dataDiagnostics.set([]);
    this.selectedValue = [];

    try {
      await this.checkDataIntegrity();
      this._diagnosticsState.setSuccess();
    } catch (error) {
      this._logger.error('Failed to run diagnostics', error);
      this._diagnosticsState.setError();
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DIAGNOSTICS_CHECK_FAILED);
    }
  }

  private async checkDataIntegrity() {
    const diagnostics: IDiagnosticItem[] = [];
    const shifts = await this._shiftService.list();
    const trips = await this._tripService.list();
    const places = await this._placeService.list();

    // Duplicate shifts via shared utility (same key)
    const shiftGroups = await this._shiftService.findDuplicates('key', { mode: 'equals', caseInsensitive: false, normalize: true });
    const duplicateShiftsResult = { items: shiftGroups.flatMap(g => g.items), groups: shiftGroups.map(g => g.items) };
    this._logger.debug('Duplicate shifts found:', duplicateShiftsResult);
    diagnostics.push({
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

    diagnostics.push({
      name: 'Empty Shifts',
      count: emptyShifts.length,
      severity: emptyShifts.length > 0 ? 'warning' : 'info',
      description: 'Shifts with zero trips and no start/finish times',
      itemType: 'shift',
      items: emptyShifts
    });

    // Check for orphaned trips
    const orphanedTrips = DiagnosticHelper.findOrphanedTrips(trips, shifts);
    this._logger.debug('Orphaned trips found:', orphanedTrips);

    diagnostics.push({
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
    const duplicatePlacesResult = DiagnosticHelper.mergeDuplicateGroups(placeEqualsGroups, placeContainsGroups);
    // Recompute trip counts per place using case-sensitive matching
    for (const group of duplicatePlacesResult.groups ?? []) {
      await DiagnosticHelper.recomputeGroupCounts('place', group, this._tripService, this._shiftService);
    }
    this._logger.debug('Duplicate places found:', duplicatePlacesResult);
    diagnostics.push({
      name: 'Duplicate Places',
      count: duplicatePlacesResult.items.length,
      severity: duplicatePlacesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Places with different casing or variations',
      itemType: 'place',
      items: duplicatePlacesResult.items,
      groups: duplicatePlacesResult.groups
    });

    // Duplicate addresses via shared utility with address-specific rules
    const addressComparator = DiagnosticHelper.createAddressComparator();

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
    const duplicateAddressesResult = DiagnosticHelper.mergeDuplicateGroups(addressEqualsGroups, addressContainsGroups);
    // Recompute trip counts per address
    for (const group of duplicateAddressesResult.groups ?? []) {
      await DiagnosticHelper.recomputeGroupCounts('address', group, this._tripService, this._shiftService);
    }
    this._logger.debug('Duplicate addresses found:', duplicateAddressesResult);
    diagnostics.push({
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
    const duplicateNamesResult = DiagnosticHelper.mergeDuplicateGroups(nameEqualsGroups, []);
    // Recompute name trip counts and addresses
    for (const group of duplicateNamesResult.groups ?? []) {
      await DiagnosticHelper.recomputeGroupCounts('name', group, this._tripService, this._shiftService);
    }
    this._logger.debug('Duplicate names found:', duplicateNamesResult);
    diagnostics.push({
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
    const duplicateServicesResult = DiagnosticHelper.mergeDuplicateGroups(serviceEqualsGroups, serviceContainsGroups);
    // Recompute trip counts per service
    for (const group of duplicateServicesResult.groups ?? []) {
      await DiagnosticHelper.recomputeGroupCounts('service', group, this._tripService, this._shiftService);
    }
    this._logger.debug('Duplicate services found:', duplicateServicesResult);
    diagnostics.push({
      name: 'Duplicate Services',
      count: duplicateServicesResult.items.length,
      severity: duplicateServicesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Services with different casing or variations (e.g., DoorDash vs Doordash)',
      itemType: 'service',
      items: duplicateServicesResult.items,
      groups: duplicateServicesResult.groups
    });

    // Duplicate types via shared utility (normalized: collapses hyphens/spaces before comparing)
    const typeEqualsGroups = await this._typeService.findDuplicates('type', { mode: 'normalized' });
    const duplicateTypesResult = DiagnosticHelper.mergeDuplicateGroups(typeEqualsGroups, []);
    // Recompute trip counts per type
    for (const group of duplicateTypesResult.groups ?? []) {
      await DiagnosticHelper.recomputeGroupCounts('type', group, this._tripService, this._shiftService);
    }
    this._logger.debug('Duplicate types found:', duplicateTypesResult);
    diagnostics.push({
      name: 'Duplicate Types',
      count: duplicateTypesResult.items.length,
      severity: duplicateTypesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Types with different casing or variations (e.g., Delivery vs delivery)',
      itemType: 'type',
      items: duplicateTypesResult.items,
      groups: duplicateTypesResult.groups
    });

    // Duplicate regions via shared utility (case-insensitive equals only)
    const regionEqualsGroups = await this._regionService.findDuplicates('region', { mode: 'equals', caseInsensitive: true, normalize: true });
    const duplicateRegionsResult = DiagnosticHelper.mergeDuplicateGroups(regionEqualsGroups, []);
    // Recompute trip counts per region
    for (const group of duplicateRegionsResult.groups ?? []) {
      await DiagnosticHelper.recomputeGroupCounts('region', group, this._tripService, this._shiftService);
    }
    this._logger.debug('Duplicate regions found:', duplicateRegionsResult);
    diagnostics.push({
      name: 'Duplicate Regions',
      count: duplicateRegionsResult.items.length,
      severity: duplicateRegionsResult.items.length > 0 ? 'warning' : 'info',
      description: 'Regions with different casing',
      itemType: 'region',
      items: duplicateRegionsResult.items,
      groups: duplicateRegionsResult.groups
    });

    // Check for shifts with start/end times but no duration
    const shiftsWithoutDuration = DiagnosticHelper.findShiftsWithoutDuration(shifts);
    this._logger.debug('Shifts without duration found:', shiftsWithoutDuration);
    diagnostics.push({
      name: 'Shifts Missing Time Duration',
      count: shiftsWithoutDuration.length,
      severity: shiftsWithoutDuration.length > 0 ? 'warning' : 'info',
      description: 'Shifts with start/end times but no calculated duration',
      itemType: 'shift',
      items: shiftsWithoutDuration
    });

    // Check for trips with pickup/dropoff times but no duration
    const tripsWithoutDuration = DiagnosticHelper.findTripsWithoutDuration(trips);
    this._logger.debug('Trips without duration found:', tripsWithoutDuration);
    diagnostics.push({
      name: 'Trips Missing Duration',
      count: tripsWithoutDuration.length,
      severity: tripsWithoutDuration.length > 0 ? 'warning' : 'info',
      description: 'Trips with pickup/dropoff times but no calculated duration',
      itemType: 'trip',
      items: tripsWithoutDuration
    });

    // Check for trips with place but no start address
    const tripsWithPlaceNoAddress = DiagnosticHelper.findTripsWithPlaceNoAddress(trips, places, this.selectedAddress);
    this._logger.debug('Trips with place but no address found:', tripsWithPlaceNoAddress);
    diagnostics.push({
      name: 'Trip Places Missing Address',
      count: tripsWithPlaceNoAddress.length,
      severity: tripsWithPlaceNoAddress.length > 0 ? 'warning' : 'info',
      description: 'Trips with a place but no start address',
      itemType: 'trip',
      items: tripsWithPlaceNoAddress
    });

    this.dataDiagnostics.set(diagnostics);
    this._logger.info('Final dataDiagnostics:', diagnostics);
  }



  public getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  public getSeverityColor(severity: string): string {
    switch (severity) {
      case 'error': return 'warn';
      case 'warning': return 'accent';
      default: return 'primary';
    }
  }

  public getCountBySeverity(severity: 'info' | 'warning' | 'error'): number {
    return this.dataDiagnostics()
      .filter(item => item.severity === severity)
      .reduce((sum, item) => sum + item.count, 0);
  }

  public getTotalIssues(): number {
    return this.dataDiagnostics().reduce((sum, item) => sum + item.count, 0);
  }

  public async mergeDuplicates(group: IDiagnosticRecord[], selectedItem: IDiagnosticRecord, itemType: DiagnosticEntityType) {
    const trips = await this._tripService.list();
    const shifts = await this._shiftService.list();

    // Collect all updates in batches
    const tripsToUpdate: ITrip[] = [];
    const shiftsToUpdate: IShift[] = [];

    for (const item of group) {
      if (item === selectedItem) continue;

      let affectedTrips: ITrip[] = [];
      let affectedShifts: IShift[] = [];

      if (itemType === 'place') {
        affectedTrips = trips.filter(t => t.place === item.place);
      } else if (itemType === 'name') {
        affectedTrips = trips.filter(t => t.name === item.name);
      } else if (itemType === 'address') {
        affectedTrips = trips.filter(t => t.startAddress === item.address || t.endAddress === item.address);
      } else if (itemType === 'service') {
        affectedTrips = trips.filter(t => t.service === item.service);
        affectedShifts = shifts.filter(s => s.service === item.service);
      } else if (itemType === 'region') {
        affectedTrips = trips.filter(t => t.region === item.region);
        affectedShifts = shifts.filter(s => s.region === item.region);
      } else if (itemType === 'type') {
        affectedTrips = trips.filter(t => t.type === item.type);
      }

      for (const trip of affectedTrips) {
        if (itemType === 'place') {
          trip.place = selectedItem.place ?? '';
        } else if (itemType === 'name') {
          trip.name = selectedItem.name ?? '';
        } else if (itemType === 'address') {
          if (trip.startAddress === item.address) trip.startAddress = selectedItem.address ?? '';
          if (trip.endAddress === item.address) trip.endAddress = selectedItem.address ?? '';
        } else if (itemType === 'service') {
          trip.service = selectedItem.service ?? '';
        } else if (itemType === 'region') {
          trip.region = selectedItem.region ?? '';
        } else if (itemType === 'type') {
          trip.type = selectedItem.type ?? '';
        }
        updateAction(trip, ActionEnum.Update);
        tripsToUpdate.push(trip);
      }

      for (const shift of affectedShifts) {
        if (itemType === 'service') {
          shift.service = selectedItem.service ?? '';
        } else if (itemType === 'region') {
          shift.region = selectedItem.region ?? '';
        }
        updateAction(shift, ActionEnum.Update);
        shiftsToUpdate.push(shift);
      }

      item.trips = 0;
      if (itemType === 'service' || itemType === 'region') {
        item.shifts = 0;
      }
    }

    // Perform batch updates
    if (tripsToUpdate.length > 0) {
      await this._tripService.update(tripsToUpdate);
    }
    if (shiftsToUpdate.length > 0) {
      await this._shiftService.update(shiftsToUpdate);
    }

    await DiagnosticHelper.recomputeGroupCounts(itemType, group, this._tripService, this._shiftService);

    // Disable autosave after making data fixes to avoid unintended background syncs
    this.disableAutoSave();
    this.touchDiagnostics();
  }

  public async fixShiftDuration(record: IDiagnosticRecord) {
    const shift = record as unknown as IShift;
    if (!shift.start || !shift.finish) return;
    const duration = DateHelper.getDurationSeconds(shift.start, shift.finish);
    shift.time = DateHelper.getDurationString(duration);
    updateAction(shift, ActionEnum.Update);
    await this._shiftService.update([shift]);
    record.fixed = true;
    this.decrementDiagnosticCount('Shifts Missing Time Duration');
    this.disableAutoSave();
    this.touchDiagnostics();
  }

  public async fixTripDuration(record: IDiagnosticRecord) {
    const trip = record as unknown as ITrip;
    await this._gigCalculator.updateTripDuration(trip);

    record.fixed = true;
    this.decrementDiagnosticCount('Trips Missing Duration');
    this.disableAutoSave();
    this.touchDiagnostics();
  }

  public async bulkFixShiftDurations() {
    this.isBulkFixing.set(true);
    try {
      // Ensure autosave is disabled before long-running batch updates
      this.disableAutoSave();
      const shifts = await this._shiftService.list();
      const shiftsToFix = DiagnosticHelper.findShiftsWithoutDuration(shifts);
      
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
      this.isBulkFixing.set(false);
    }
  }

  public async bulkFixTripDurations() {
    this.isBulkFixing.set(true);
    try {
      // Ensure autosave is disabled before long-running batch updates
      this.disableAutoSave();
      const trips = await this._tripService.list();
      const tripsToFix = DiagnosticHelper.findTripsWithoutDuration(trips);
      
      for (const trip of tripsToFix) {
        await this._gigCalculator.updateTripDuration(trip);
      }
      
      await this.runDiagnostics();
    } finally {
      this.isBulkFixing.set(false);
    }
  }

  public async applyAddressToTrip(record: IDiagnosticRecord, address: string) {
    record.startAddress = address;
    record.addressApplied = true;
    const trip = record as unknown as ITrip;
    updateAction(trip, ActionEnum.Update);
    await this._tripService.update([trip]);
    this.disableAutoSave();
    this.touchDiagnostics();
  }

  public async createShiftFromTrip(record: IDiagnosticRecord) {
    // Delegate to the batch flow so single-create reuses same logic
    await this.createShiftsFromTrips([record]);
  }

  /**
   * Create shifts for multiple trips in a single batch.
   * - Groups trips by `key` and creates one shift per group (uses first trip)
   * - Assigns sequential `rowId`s starting from getMaxRowId()+1
   * - Persists all new shifts, then calls `calculateShiftTotals` once with the array
   * - Marks matching orphaned trips as fixed in diagnostics
   */
  public async createShiftsFromTrips(records: IDiagnosticRecord[]) {
    if (!records || records.length === 0) return;
    const trips = records as unknown as ITrip[];

    this.isBulkFixing.set(true);
    try {
      // Ensure autosave is disabled during batch operation
      this.disableAutoSave();

      // Group by key and pick one trip per key
      const map = new Map<string, ITrip>();
      for (const t of trips) {
        if (!map.has(t.key)) map.set(t.key, t);
      }

      const reps = Array.from(map.values());
      if (reps.length === 0) return;

      let nextRowId = await this._shiftService.getMaxRowId() + 1;
      const newShifts: IShift[] = [];

      for (const trip of reps) {
        // Skip if a shift with this key already exists
        const existing = await this._shiftService.queryShiftByKey(trip.key);
        if (existing) {
          // mark diagnostic item fixed for this trip
          const diagnostic = this.dataDiagnostics().find(d => d.name === 'Orphaned Trips');
          DiagnosticHelper.markOrphanedTripsFixed(diagnostic, [trip.key]);
          continue;
        }

        const shift = ShiftHelper.createShiftFromTrip(trip);
        shift.rowId = nextRowId++;
        delete shift.id;
        await this._shiftService.add(shift);
        newShifts.push(shift);
      }

      // Calculate totals for all new shifts in one call
      await this._gigWorkflow.calculateShiftTotals(newShifts);

      if (newShifts.length > 1) {
        await this.runDiagnostics();
      }

      // Update diagnostics: mark orphaned trips as fixed for each created shift
      const diagnostic = this.dataDiagnostics().find(d => d.name === 'Orphaned Trips');
      DiagnosticHelper.markOrphanedTripsFixed(diagnostic, newShifts.map(s => s.key));
      this.touchDiagnostics();
    } finally {
      this.isBulkFixing.set(false);
    }
  }

  private decrementDiagnosticCount(diagnosticName: string) {
    const diagnostic = this.dataDiagnostics().find(d => d.name === diagnosticName);
    if (diagnostic && diagnostic.count > 0) {
      diagnostic.count--;
    }
  }

  public hasMarkedForDelete(group: IDiagnosticRecord[]): boolean {
    return group.some(s => s.markedForDelete);
  }



  public async markShiftForDelete(group: IDiagnosticRecord[], rowId: number, groupIndex: number) {
    const record = group.find(s => s.rowId === rowId);
    if (!record) return;
    const shift = record as unknown as IShift;

    if (shift.action === ActionEnum.Add) {
      await this._shiftService.delete(shift.id!);
    } else {
      updateAction(shift, ActionEnum.Delete);
      await this._shiftService.update([shift]);
    }

    record.markedForDelete = true;
    this.selectedShiftToDelete[groupIndex] = undefined;
    this.disableAutoSave();
    this.touchDiagnostics();
  }

  private touchDiagnostics(): void {
    this.dataDiagnostics.update(items => [...items]);
  }

  /**
   * Stop runtime polling and persist preference disabled, wrapped in safe try/catch.
   */
  private disableAutoSave(): void {
    try {
      // setPolling may be async; handle rejection explicitly
      this._uiPreferences.setPolling(false).catch((err: unknown) => {
        this._logger.warn('Failed to persist/stop polling when disabling autosave', err);
      });
    } catch (e) {
      this._logger.warn('Failed to disable autosave', e);
    }
  }
}
