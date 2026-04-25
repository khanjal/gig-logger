// Angular core imports
import { ViewportScroller, NgFor, NgIf, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnInit, Optional, Output, signal, ViewChild } from '@angular/core';
import { VoiceInputComponent } from '@components/voice-input/voice-input.component';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular material imports
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';

// Application-specific imports - Interfaces
import { IAddress } from '@interfaces/address.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';

// Application-specific imports - Services
import { AddressService } from '@services/sheets/address.service';
import { DeliveryService } from '@services/delivery.service';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';

// Application-specific imports - Helpers
import { sort } from '@helpers/sort.helper';
import { DateHelper } from '@helpers/date.helper';
import { ShiftHelper } from '@helpers/shift.helper';
import { NumberHelper } from '@helpers/number.helper';
import { TripHelper } from '@helpers/trip.helper';
import { getValueOrFallback } from '@helpers/array.helper';

// Application-specific imports - Types
import { TripFormValue } from '@form-types/trip-form.types';

// Application-specific imports - Enums
import { ActionEnum } from '@enums/action.enum';
import { updateAction } from '@utils/action.utils';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { TimeInputComponent } from '@inputs/time-input/time-input.component';
import { TripsTableBasicComponent } from '../trips-table-basic/trips-table-basic.component';
import { BaseInputComponent } from '@components/base/base-input/base-input.component';
import { BaseToggleButtonComponent } from '@components/base/base-toggle-button/base-toggle-button.component';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseAccordionComponent } from '@components/base/base-accordion/base-accordion.component';
import { BaseAccordionItemComponent } from '@components/base/base-accordion/base-accordion-item.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';

interface IShiftSummaryOption {
  shiftKey: string;
  rowId: number;
  dateLabel: string;
  serviceLabel: string;
  numberLabel: string;
  subtitle: string;
}

const NEW_SHIFT_VALUE = 'new';

@Component({
    selector: 'trip-form',
    templateUrl: './trip-form.component.html',
    styleUrls: ['./trip-form.component.scss'],
    standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatSelectTrigger, MatOption, NgFor, SearchInputComponent, NgIf, TripsTableBasicComponent, MatSlideToggle, ShortAddressPipe, TruncatePipe, TimeInputComponent, VoiceInputComponent, BaseInputComponent, BaseToggleButtonComponent, BaseRectButtonComponent, BaseAccordionComponent, BaseAccordionItemComponent]
})
export class TripFormComponent implements OnInit {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @Output("editModeExit") editModeExit: EventEmitter<string | undefined> = new EventEmitter();
  @Input() isInEditMode: boolean = false;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger | undefined;

  // Typed FormGroup for better compile-time safety
  tripForm: FormGroup<{
    shift: FormControl<string | null>;
    service: FormControl<string | null>;
    region: FormControl<string | null>;
    place: FormControl<string | null>;
    type: FormControl<string | null>;
    name: FormControl<string | null>;
    distance: FormControl<number | null | string>;
    startOdometer: FormControl<number | null | string>;
    endOdometer: FormControl<number | null | string>;
    pay: FormControl<number | null | string>;
    tip: FormControl<number | null | string>;
    bonus: FormControl<number | null | string>;
    cash: FormControl<number | null | string>;
    startAddress: FormControl<string | null>;
    endAddress: FormControl<string | null>;
    endUnit: FormControl<string | null>;
    pickupTime: FormControl<string | null>;
    dropoffTime: FormControl<string | null>;
    orderNumber: FormControl<string | null>;
    note: FormControl<string | null>;
    exclude: FormControl<string | null>;
  }> = new FormGroup({
    shift: new FormControl<string | null>(NEW_SHIFT_VALUE),
    service: new FormControl<string | null>(null),
    region: new FormControl<string | null>(null),
    place: new FormControl<string | null>(null),
    type: new FormControl<string | null>(null),
    name: new FormControl<string | null>(null),
    distance: new FormControl<number | null | string>(null),
    startOdometer: new FormControl<number | null | string>(null),
    endOdometer: new FormControl<number | null | string>(null),
    pay: new FormControl<number | null | string>(null),
    tip: new FormControl<number | null | string>(null),
    bonus: new FormControl<number | null | string>(null),
    cash: new FormControl<number | null | string>(null),
    startAddress: new FormControl<string | null>(null),
    endAddress: new FormControl<string | null>(null),
    endUnit: new FormControl<string | null>(null),
    pickupTime: new FormControl<string | null>(null),
    dropoffTime: new FormControl<string | null>(null),
    orderNumber: new FormControl<string | null>(null),
    note: new FormControl<string | null>(null),
    exclude: new FormControl<string | null>(null),
  });

  isNewShift = signal<boolean>(true);
  showAdvancedPay: boolean = false;
  showPickupAddress: boolean = false;
  showOdometer: boolean = false;
  showOrder: boolean = false;
  showTimes: boolean = false;

  selectedAddress: IAddress | undefined;
  selectedAddressDeliveries: IDelivery[] = [];
  
  selectedName: IName | undefined;
  selectedNameDeliveries: IDelivery[] = [];
  
  selectedPlace: IPlace | undefined;
  selectedPlaceAddresses: IAddress[] = [];

  shifts: IShift[] = [];
  shiftOptions = signal<IShiftSummaryOption[]>([]);
  selectedShift: IShift | undefined;
  selectedShiftOption = signal<IShiftSummaryOption | undefined>(undefined);

  title: string = "Add Trip";

  constructor(
      @Optional() public dialogRef: MatDialogRef<TripFormComponent>,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
      private _snackBar: MatSnackBar,
      private _addressService: AddressService,
      private _deliveryService: DeliveryService,
      private _gigLoggerService: GigWorkflowService,
      private _nameService: NameService,
      private _placeService: PlaceService,
      private _shiftService: ShiftService,
      private _timerService: TimerService,
      private _tripService: TripService,
      private _viewportScroller: ViewportScroller,
      private cdr: ChangeDetectorRef
    ) {}

  async ngOnInit(): Promise<void> {
    this.tripForm.controls.service.setValidators([Validators.required]); // Add validation for service
    this.tripForm.controls.service.updateValueAndValidity();

    // Defer initial hydration one macrotask so template bindings aren't
    // mutated during the same check cycle in dev mode.
    setTimeout(() => {
      void this.load().finally(() => this.cdr.markForCheck());
    }, 0);
  }

  public async load() {
    // Don't reload if user is actively entering data (form is dirty)
    if (this.tripForm.dirty) {
      return;
    }

    if (this.data?.id) {
      this.title = `Edit Trip - #${ this.data.rowId }`;
      // Load form with passed in data.
      await this.loadForm()
    }
    else {
      this.data = {} as ITrip; // Reset data if not editing. Need to do this to prevent expanded form fields from showing.
      await this.setDefaultShift();
    }
  }

  private async createShift(): Promise<IShift> {
    let shift: IShift = {} as IShift;
    const selectedShiftKey = this.tripForm.value.shift;

    if (!selectedShiftKey || selectedShiftKey === NEW_SHIFT_VALUE) {
      let shifts: IShift[] = [];
      let today: string = DateHelper.toISO();

      shifts.push(...await this._shiftService.query("date", today));
      
      shift = ShiftHelper.createNewShift(this.tripForm.value.service ?? "", shifts);
      shift.region = this.tripForm.value.region ?? "";
      shift.rowId = await this._shiftService.getMaxRowId() + 1;

      await this._shiftService.add(shift);
    }
    else {
      shift = this.selectedShift ?? this.shifts.find(existingShift => existingShift.key === selectedShiftKey) ?? ({} as IShift);
    }

    return shift;
  }

  private async loadForm() {
    if (!this.data) return;
  
    // Set basic form values (convert 0 → empty string for better UX on numeric inputs)
    this.setFormValues({
      service: this.data.service,
      region: this.data.region,
      type: this.data.type,
      pay: this.data.pay === 0 ? '' : this.data.pay,
      tip: this.data.tip === 0 ? '' : this.data.tip,
      bonus: this.data.bonus === 0 ? '' : this.data.bonus,
      cash: this.data.cash === 0 ? '' : this.data.cash,
      startOdometer: this.data.startOdometer === 0 ? '' : this.data.startOdometer,
      endOdometer: this.data.endOdometer === 0 ? '' : this.data.endOdometer,
      place: this.data.place,
      distance: this.data.distance === 0 ? '' : this.data.distance,
      name: this.data.name,
      startAddress: this.data.startAddress,
      endAddress: this.data.endAddress,
      pickupTime: DateHelper.removeSeconds(this.data.pickupTime),
      dropoffTime: DateHelper.removeSeconds(this.data.dropoffTime),
      note: this.data.note,
      endUnit: this.data.endUnit,
      orderNumber: this.data.orderNumber,
      exclude: this.data.exclude ? 'true' : ''
    });
  
    // Toggle UI states
    this.showAdvancedPay = true;
    this.showOdometer = true;
    this.showPickupAddress = true;
    this.showTimes = true;
    this.showOrder = true;
  
    // Handle dependent logic
    this.selectedShift = await this._shiftService.queryShiftByKey(this.data.key);
    this.selectedShiftOption.set(this.selectedShift ? this.toShiftSummaryOption(this.selectedShift) : undefined);
    this.tripForm.controls.shift.setValue(this.selectedShift?.key ?? null, { emitEvent: false });
    await this.selectPlace();
    await this.showNameAddresses();
    await this.showAddressNames();
  }

  private setFormValues(values: Partial<TripFormValue>): void {
    Object.keys(values).forEach(key => {
      const controlKey = key as keyof typeof this.tripForm.controls;
      if (this.tripForm.controls[controlKey]) {
        (this.tripForm.controls[controlKey] as FormControl<any>).setValue((values as any)[key]);
      }
    });
  }
  private async setDefaultShift() {
    this.shifts = await this._shiftService.getPreviousWeekShifts();
    if (this.shifts.length > 0) {
      sort(this.shifts, '-key');
    }

    if (this.data?.key) {
      const tripShift = await this._shiftService.queryShiftByKey(this.data.key);
      if (tripShift && !this.shifts.some(s => s.key === tripShift.key)) {
        this.shifts.push(tripShift);
        sort(this.shifts, '-key');
      }
    }

    this.shiftOptions.set(this.shifts.map(shift => this.toShiftSummaryOption(shift)));

    if (!this.data?.id) {
      this.resetSelectedShiftState();

      const today = DateHelper.toISO();
      const todaysTrips = await this._tripService.query('date', today);
      sort(todaysTrips, '-id');
      const lastTrip = todaysTrips[0];
      let lastUsedShift: IShift | undefined = undefined;
      if (lastTrip) {
        lastUsedShift = this.shifts.find(x => x.key === lastTrip.key);
      }
      if (lastUsedShift) {
        this.selectedShift = lastUsedShift;
        this.selectedShiftOption.set(this.toShiftSummaryOption(lastUsedShift));
        this.tripForm.controls.shift.setValue(lastUsedShift.key, { emitEvent: false });
      }

      const places = await this._placeService.list();
      if (places.length === 1) {
        this.tripForm.controls.place.setValue(places[0].place);
        await this.selectPlace();
      }
    }

    const formShift = this.tripForm.value.shift;
    await this.onShiftSelected(formShift);
  }

  public async addTrip() {
    try {
      // Ensure pickupTime defaults to now when adding a new trip if not provided
      if (!this.tripForm.controls.pickupTime.value) {
        this.tripForm.controls.pickupTime.setValue(DateHelper.getTimeString());
      }

      const shift = await this.createShift();
      const maxRowId = await this._tripService.getMaxRowId();
      const trip = await TripHelper.createFromFormValue(
        this.tripForm.value as TripFormValue,
        shift,
        undefined,
        maxRowId
      );
      
      await this._tripService.add(trip);

      await this._gigLoggerService.calculateShiftTotals([shift]);
      await this._gigLoggerService.updateAncillaryInfo();

      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.TRIP_STORED);

      await this.formReset();
      this.parentReload.emit();

      await this._timerService.delay(1000);
      this._viewportScroller.scrollToAnchor('todaysTrips');
    } catch (error) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.TRIP_STORE_FAILED, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
    }
  }

  public async editTrip() {
    try {
      let shifts: IShift[] = [];

      if (this.selectedShift) {
        shifts.push(this.selectedShift);
      }

      const shift = await this.createShift();
      const trip = await TripHelper.createFromFormValue(
        this.tripForm.value as TripFormValue,
        shift,
        this.data
      );

      updateAction(shift, ActionEnum.Update);
      this._shiftService.update([shift]);

      shifts.push(shift);

      if (shifts.length > 1) {
        shifts = [...new Set(shifts)];
      }

      await this._tripService.update([trip]);

      await this._gigLoggerService.calculateShiftTotals(shifts);
      await this._gigLoggerService.updateAncillaryInfo();

      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.TRIP_UPDATED);

      if (this.isInEditMode) {
        this.editModeExit.emit(trip.rowId?.toString());
      } else if (this.dialogRef) {
        this.dialogRef.close();
      }
    } catch (error) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.TRIP_UPDATE_FAILED, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
    }
  }

  public async formReset() {
    await this._timerService.delay(100); // Need a delay for blur events to fire.

    this.data = {} as ITrip;
    this.tripForm.reset();

    // Reset all selections
    await this.setDestinationAddress("");
    await this.setName("");
    await this.selectPlace();

    // Reset all show fields
    this.showAdvancedPay = false;
    this.showPickupAddress = false;
    this.showOdometer = false;
    this.showOrder = false;
   
    this.setDefaultShift();
    this._viewportScroller.scrollToAnchor("addTrip");
  }

  public async onShiftSelected(shiftKey: string | null | undefined) {
    if (shiftKey && shiftKey !== NEW_SHIFT_VALUE) {
      const value = this.shifts.find(shift => shift.key === shiftKey);
      if (!value) {
        // The previously selected shift key may disappear after reactive list updates.
        // Reset to "new" to keep mat-select selection state stable across CD cycles.
        this.resetSelectedShiftState();
        return;
      }

      this.isNewShift.set(false);
      this.selectedShift = value;
      this.selectedShiftOption.set(this.toShiftSummaryOption(value));
      this.tripForm.controls.service.clearValidators();
      this.tripForm.controls.service.updateValueAndValidity();
      this.tripForm.controls.region.setValue(this.data.region ?? value.region);
      return;
    }

    this.resetSelectedShiftState();
    this.tripForm.controls.service.setValidators([Validators.required]);

    const shifts = (await this._shiftService.list()).reverse();
    const shift = shifts[0];

    if (!shift) {
      this.tripForm.controls.service.updateValueAndValidity();
      return;
    }

    // Use helper to get value from shift or fallback to recent shift with that value
    const service = getValueOrFallback(shift, shifts, 'service');
    const region = getValueOrFallback(shift, shifts, 'region');
    
    this.tripForm.controls.service.setValue(service);
    this.tripForm.controls.region.setValue(region);

    this.tripForm.controls.service.updateValueAndValidity();
  }

  private resetSelectedShiftState(): void {
    this.isNewShift.set(true);
    this.selectedShift = undefined;
    this.selectedShiftOption.set(undefined);
    this.tripForm.controls.shift.setValue(NEW_SHIFT_VALUE, { emitEvent: false });
  }

  setPickupAddress(address: string) {
    this.tripForm.controls.startAddress.setValue(address);
  }

  setDropoffAddress(address: string) {
    this.tripForm.get('endAddress')?.setValue(address);
  }

  async setDestinationAddress(address: string) {
    this.tripForm.controls.endAddress.setValue(address);
    await this.showAddressNames();
  }

  async setName(name: string) {
    this.tripForm.controls.name.setValue(name);
    await this.showNameAddresses();
  }

  async showAddressNames() {
    const address = this.tripForm.value.endAddress;
    if (!address) {
      await this.deferListBindingUpdate(() => {
        this.selectedAddress = undefined;
        this.selectedAddressDeliveries = [];
      });
      return;
    }

    const nextSelectedAddress = await this._addressService.find('address', address);
    const nextAddressDeliveries = await this._deliveryService.filter("address", address);
    sort(nextAddressDeliveries, 'name');

    await this.deferListBindingUpdate(() => {
      this.selectedAddress = nextSelectedAddress;
      this.selectedAddressDeliveries = nextAddressDeliveries;
    });
  }

  async showNameAddresses() {
    const name = this.tripForm.value.name;
    if (!name) {
      await this.deferListBindingUpdate(() => {
        this.selectedName = undefined;
        this.selectedNameDeliveries = [];
      });
      return;
    }

    const nextSelectedName = await this._nameService.find('name', name);
    const nextNameDeliveries = await this._deliveryService.filter("name", name);
    sort(nextNameDeliveries, 'address');

    await this.deferListBindingUpdate(() => {
      this.selectedName = nextSelectedName;
      this.selectedNameDeliveries = nextNameDeliveries;
    });
  }

  async selectPlace() {
    let place = this.tripForm.value.place;
    if (!place) {
      await this.deferListBindingUpdate(() => {
        this.selectedPlace = undefined;
        this.selectedPlaceAddresses = [];
      });
      return;
    }

    const nextSelectedPlace = await this._placeService.find('place', place);
    await this.deferListBindingUpdate(() => {
      this.selectedPlace = nextSelectedPlace;
    });

    if (!nextSelectedPlace) {
      if (this.tripForm.controls.type.value) {
        return;
      }

      const recentTrips = (await this._tripService.list()).reverse();
      const recentTrip = recentTrips[0];
      if (recentTrip) {
        this.tripForm.controls.type.setValue(recentTrip.type);
      } else {
        this.tripForm.controls.type.setValue('Pickup');
      }
      return;
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const nextSelectedPlaceAddresses = nextSelectedPlace?.addresses?.filter(address =>
      new Date(address.lastTrip) >= oneYearAgo
    ) ?? [];

    await this.deferListBindingUpdate(() => {
      this.selectedPlaceAddresses = nextSelectedPlaceAddresses;
    });

    place = nextSelectedPlace.place;

    const recentTrips = (await this._tripService.list()).reverse().filter((x: ITrip) => x.place === place && !x.exclude);
    const recentTrip = recentTrips[0];

    if (!recentTrip) {
      return;
    }

    // Use helper to get values with fallback
    if (!this.tripForm.controls.startAddress.value) {
      const startAddress = getValueOrFallback(recentTrip, recentTrips, 'startAddress');
      this.tripForm.controls.startAddress.setValue(startAddress);
    }

    const type = getValueOrFallback(recentTrip, recentTrips, 'type');
    this.tripForm.controls.type.setValue(type);

    if (!this.showPickupAddress) {
      this.togglePickupAddress();
    }
  }

  private async deferListBindingUpdate(update: () => void): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        update();
        this.cdr.markForCheck();
        resolve();
      }, 0);
    });
  }

  private toggleSection(section: 'showAdvancedPay' | 'showOdometer' | 'showOrder' | 'showPickupAddress', showMsg: string, hideMsg: string) {
    this[section] = !this[section];
    openSnackbar(this._snackBar, this[section] ? showMsg : hideMsg);
  }

  toggleAdvancedPay() {
    this.toggleSection('showAdvancedPay', 'Showing Additional Payment Fields', 'Hiding Additional Payment Fields');
  }

  toggleOdometer() {
    this.toggleSection('showOdometer', 'Showing Odometer Fields', 'Hiding Odometer Fields');
  }

  toggleOrder() {
    this.toggleSection('showOrder', 'Showing Order Fields', 'Hiding Order Fields');
  }

  togglePickupAddress() {
    this.toggleSection('showPickupAddress', 'Showing Pickup Address', 'Hiding Pickup Address');
  }

  private toShiftSummaryOption(shift: IShift): IShiftSummaryOption {
    const shiftNumberSuffix = shift.number === 0 ? '' : ` #${shift.number}`;

    return {
      shiftKey: shift.key,
      rowId: shift.rowId,
      dateLabel: DateHelper.getDateFromISO(shift.date).toDateString().slice(0, 10),
      serviceLabel: shift.service,
      numberLabel: shiftNumberSuffix,
      subtitle: `Trips: ${shift.totalTrips || 0} | Total: $${NumberHelper.formatNumber(shift.grandTotal || 0)}`
    };
  }


  setPickupTime() {
    this.tripForm.controls.pickupTime.setValue(DateHelper.getTimeString());
  }

  setDropoffTime() {
    this.tripForm.controls.dropoffTime.setValue(DateHelper.getTimeString());
  }

  close() {
    if (this.isInEditMode) {
      // We're in edit mode on the trips page, emit event to exit edit mode
      this.editModeExit.emit(undefined);
    } else if (this.dialogRef) {
      // We're in a dialog, close it
      this.dialogRef.close();
    }
  }

  // Remove keyboard handling - now handled by focus-scroll directive
  keyboardPadding: boolean = false;

  // --- Voice input result handler ---
  async onVoiceResult(result: any) {
    if (!result) return;

    // Mapping of voice fields to form controls and their handlers
    const fieldMap: Array<{key: string, handler: (val: any) => void | Promise<void>}> = [
      { key: 'service', handler: (v) => this.tripForm.controls.service.setValue(v) },
      { key: 'pay', handler: (v) => this.tripForm.controls.pay.setValue(v) },
      { key: 'tip', handler: (v) => this.tripForm.controls.tip.setValue(v) },
      { key: 'distance', handler: (v) => this.tripForm.controls.distance.setValue(v) },
      { key: 'type', handler: (v) => this.tripForm.controls.type.setValue(v) },
      { key: 'place', handler: async (v) => { this.tripForm.controls.place.setValue(v); await this.selectPlace(); }},
      { key: 'name', handler: (v) => this.setName(v) },
      { key: 'bonus', handler: (v) => this.tripForm.controls.bonus.setValue(v) },
      { key: 'cash', handler: (v) => this.tripForm.controls.cash.setValue(v) },
      { key: 'pickupAddress', handler: (v) => this.setPickupAddress(v) },
      { key: 'dropoffAddress', handler: (v) => this.setDestinationAddress(v) },
      { key: 'startOdometer', handler: (v) => this.tripForm.controls.startOdometer.setValue(v) },
      { key: 'endOdometer', handler: (v) => this.tripForm.controls.endOdometer.setValue(v) },
      { key: 'unitNumber', handler: (v) => this.tripForm.controls.endUnit.setValue(v) },
      { key: 'orderNumber', handler: (v) => this.tripForm.controls.orderNumber.setValue(v) },
    ];

    // Apply all fields from result that exist in the map
    for (const { key, handler } of fieldMap) {
      if (result[key] !== undefined) {
        await handler(result[key]);
      }
    }

    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.VOICE_INPUT_APPLIED, { action: '', duration: 1500 });
  }
}