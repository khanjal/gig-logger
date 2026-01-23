// Angular core imports
import { ViewportScroller, NgFor, NgIf, CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { VoiceInputComponent } from '@components/voice-input/voice-input.component';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular material imports
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// RxJS imports
import { Observable } from 'rxjs';

// Application-specific imports - Interfaces
import { IAddress } from '@interfaces/address.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IService } from '@interfaces/service.interface';
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

// Application-specific imports - Enums
import { ActionEnum } from '@enums/action.enum';
import { updateAction } from '@utils/action.utils';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { TimeInputComponent } from '@inputs/time-input/time-input.component';
import { MatFabButton, MatButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { TripsTableBasicComponent } from '../trips-table-basic/trips-table-basic.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';

@Component({
    selector: 'trip-form',
    templateUrl: './trip-form.component.html',
    styleUrls: ['./trip-form.component.scss'],
    standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatOption, NgFor, SearchInputComponent, MatFabButton, MatMiniFabButton, MatIcon, MatInput, NgIf, MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, TripsTableBasicComponent, MatButton, MatSlideToggle, CurrencyPipe, DatePipe, ShortAddressPipe, TruncatePipe, TimeInputComponent, VoiceInputComponent]
})
export class TripFormComponent implements OnInit {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @Output("editModeExit") editModeExit: EventEmitter<string | undefined> = new EventEmitter();
  @Input() isInEditMode: boolean = false;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger | undefined;

  tripForm = new FormGroup({
    shift: new FormControl(null),
    service: new FormControl(''),
    region: new FormControl(''),
    place: new FormControl(''),
    type: new FormControl(''),
    name: new FormControl(''),
    distance: new FormControl(),
    startOdometer: new FormControl(),
    endOdometer: new FormControl(),
    pay: new FormControl(),
    tip: new FormControl(),
    bonus: new FormControl(),
    cash: new FormControl(),
    startAddress: new FormControl(''),
    endAddress: new FormControl(''),
    endUnit: new FormControl(''),
    pickupTime: new FormControl(''),
    dropoffTime: new FormControl(''),
    orderNumber: new FormControl(''),
    note: new FormControl(''),
    exclude: new FormControl('')
  });

  isNewShift: boolean = true;
  showAdvancedPay: boolean = false;
  showPickupAddress: boolean = false;
  showOdometer: boolean = false;
  showOrder: boolean = false;
  showTimes: boolean = false;

  selectedAddress: IAddress | undefined;
  selectedAddressDeliveries: IDelivery[] | undefined;

  formDestinationAddress: IAddress | undefined;
  
  selectedName: IName | undefined;
  selectedNameDeliveries: IDelivery[] | undefined;
  
  selectedPlace: IPlace | undefined;
  selectedPlaceAddresses: IAddress[] | undefined;

  filteredServices: Observable<IService[]> | undefined;
  
  sheetTrips: ITrip[] = [];
  shifts: IShift[] = [];
  selectedShift: IShift | undefined;

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
      private _viewportScroller: ViewportScroller
    ) {}

  async ngOnInit(): Promise<void> {
    this.tripForm.controls.service.setValidators([Validators.required]); // Add validation for service
    this.tripForm.controls.service.updateValueAndValidity();

    this.load();
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
    if (!this.tripForm.value.shift || this.tripForm.value.shift == "new") {
      let shifts: IShift[] = [];
      let today: string = DateHelper.toISO();

      shifts.push(...await this._shiftService.query("date", today));
      
      shift = ShiftHelper.createNewShift(this.tripForm.value.service ?? "", shifts);
      shift.region = this.tripForm.value.region ?? "";
      shift.rowId = await this._shiftService.getMaxRowId() + 1;

      await this._shiftService.add(shift);
    }
    else {
      shift = <IShift><unknown>this.tripForm.value.shift;
    }

    return shift;
  }

  private async createTrip(shift: IShift): Promise<ITrip> {
    let trip: ITrip = this.data ?? {} as ITrip;

    trip.key = shift.key;
    trip.date = shift.date;
    trip.service = shift.service;
    trip.number = shift.number ?? 0;

    trip.region = this.tripForm.value.region ?? "";
    trip.startAddress = this.tripForm.value.startAddress ?? "";
    trip.endAddress = this.tripForm.value.endAddress ?? "";
    trip.endUnit = this.tripForm.value.endUnit ?? "";
    trip.distance = NumberHelper.toNullableNumber(this.tripForm.value.distance);

    // Store converted values to avoid redundant calls
    const pay = NumberHelper.toNullableNumber(this.tripForm.value.pay);
    const tip = NumberHelper.toNullableNumber(this.tripForm.value.tip);
    const bonus = NumberHelper.toNullableNumber(this.tripForm.value.bonus);
    trip.pay = pay;
    trip.tip = tip;
    trip.bonus = bonus;
    trip.cash = NumberHelper.toNullableNumber(this.tripForm.value.cash);
    // total is a calculated field, but ensure nulls are handled
    trip.total = (
      NumberHelper.toNumber(pay) +
      NumberHelper.toNumber(tip) +
      NumberHelper.toNumber(bonus)
    );

    trip.startOdometer = this.tripForm.value.startOdometer;
    trip.endOdometer = this.tripForm.value.endOdometer;
    
    trip.name = this.tripForm.value.name ?? "";
    trip.place = this.tripForm.value.place ?? "";
    trip.type = this.tripForm.value.type ?? "";
    trip.note = this.tripForm.value.note ?? "";
    trip.orderNumber = this.tripForm.value.orderNumber?.toLocaleUpperCase() ?? "";
    trip.exclude = this.tripForm.value.exclude ? true : false;
    trip.saved = false;
    
    // Set form properties depending on edit/add
    if (this.data?.id) {
      updateAction(trip, ActionEnum.Update);
      trip.pickupTime = this.tripForm.value.pickupTime ?? "";
      trip.dropoffTime = this.tripForm.value.dropoffTime ?? "";
    }
    else {
      trip.rowId = await this._tripService.getMaxRowId() + 1;
      updateAction(trip, ActionEnum.Add);
      trip.pickupTime = DateHelper.getTimeString(new Date);
    }

    let duration = DateHelper.getDurationSeconds(trip.pickupTime, trip.dropoffTime);
    if (duration)
      trip.duration = DateHelper.getDurationString(duration);

    if (trip.total && duration) {
      trip.amountPerTime = trip.total / DateHelper.getHoursFromSeconds(duration);
    }

    if (trip.total && trip.distance) {
      trip.amountPerDistance = trip.total / trip.distance;
    }

    return trip;
  }

  private async loadForm() {
    if (!this.data) return;
  
    // Set basic form values
    this.setFormValues({
      service: this.data.service,
      region: this.data.region,
      type: this.data.type,
      pay: this.data.pay === 0 ? '' : this.data.pay,
      tip: this.data.tip,
      bonus: this.data.bonus,
      cash: this.data.cash,
      startOdometer: this.data.startOdometer,
      endOdometer: this.data.endOdometer,
      place: this.data.place,
      distance: this.data.distance,
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
    await this.selectPlace();
    await this.showNameAddresses();
    await this.showAddressNames();
  }

  private setFormValues(values: { [key: string]: any }): void {
    Object.keys(values).forEach(key => {
      if (this.tripForm.controls[key as keyof typeof this.tripForm.controls]) {
        (this.tripForm.controls[key as keyof typeof this.tripForm.controls] as FormControl).setValue(values[key]);
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

    if (!this.data?.id) {
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
      }

      const places = await this._placeService.list();
      if (places.length === 1) {
        this.tripForm.controls.place.setValue(places[0].place);
        await this.selectPlace();
      }
    }

    await this.onShiftSelected(this.tripForm.value.shift);
  }

  public async addTrip() {
    try {
      const shift = await this.createShift();
      const trip = await this.createTrip(shift);
      await this._tripService.add(trip);

      await this._gigLoggerService.calculateShiftTotals([shift]);
      await this._gigLoggerService.updateAncillaryInfo();

      this._snackBar.open('Trip Stored to Device');

      await this.formReset();
      this.parentReload.emit();

      await this._timerService.delay(1000);
      this._viewportScroller.scrollToAnchor('todaysTrips');
    } catch (error) {
      this._snackBar.open('Failed to store trip. Please try again.', 'Dismiss', { duration: 5000 });
    }
  }

  public async editTrip() {
    try {
      let shifts: IShift[] = [];

      if (this.selectedShift) {
        shifts.push(this.selectedShift);
      }

      const shift = await this.createShift();
      const trip = await this.createTrip(shift);

      updateAction(shift, ActionEnum.Update);
      this._shiftService.update([shift]);

      shifts.push(shift);

      if (shifts.length > 1) {
        shifts = [...new Set(shifts)];
      }

      await this._tripService.update([trip]);

      await this._gigLoggerService.calculateShiftTotals(shifts);
      await this._gigLoggerService.updateAncillaryInfo();

      this._snackBar.open('Trip Updated');

      if (this.isInEditMode) {
        this.editModeExit.emit(trip.rowId?.toString());
      } else if (this.dialogRef) {
        this.dialogRef.close();
      }
    } catch (error) {
      this._snackBar.open('Failed to update trip. Please try again.', 'Dismiss', { duration: 5000 });
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

  public async onShiftSelected(value: IShift | null | undefined) {
    if (value) {
      this.isNewShift = false;
      this.tripForm.controls.service.clearValidators();
      this.tripForm.controls.service.updateValueAndValidity();
      this.tripForm.controls.region.setValue(this.data.region ?? value.region);
      return;
    }

    this.isNewShift = true;
    this.tripForm.controls.service.setValidators([Validators.required]);

    const shifts = (await this._shiftService.list()).reverse();
    const shift = shifts[0];

    if (!shift) {
      return;
    }

    if (shift.service) {
      this.tripForm.controls.service.setValue(shift.service);
    } else {
      const recentService = shifts.filter(x => x.service)[0];
      this.tripForm.controls.service.setValue(recentService.service);
    }

    if (shift.region) {
      this.tripForm.controls.region.setValue(shift.region);
    } else {
      const recentRegion = shifts.filter(x => x.region)[0];
      this.tripForm.controls.region.setValue(recentRegion?.region);
    }

    this.tripForm.controls.service.updateValueAndValidity();
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
    let address = this.tripForm.value.endAddress;
    if (!address) { this.selectedAddressDeliveries = []; return; }
    this.selectedAddress = await this._addressService.find('address', address);
    this.selectedAddressDeliveries = await this._deliveryService.filter("address", address);
    sort(this.selectedAddressDeliveries, 'name');
  }

  async showNameAddresses() {
    let name = this.tripForm.value.name;
    if (!name) { this.selectedNameDeliveries = []; return; }
    this.selectedName = await this._nameService.find('name', name);
    this.selectedNameDeliveries = await this._deliveryService.filter("name", name);
    sort(this.selectedNameDeliveries, 'address');
  }

  async selectPlace() {
    let place = this.tripForm.value.place;
    if (!place) {
      this.selectedPlace = undefined;
      return;
    }
    this.selectedPlace = await this._placeService.find('place', place);
    if (!this.selectedPlace) {
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

    this.selectedPlaceAddresses = this.selectedPlace?.addresses?.filter(address =>
      new Date(address.lastTrip) >= oneYearAgo
    );

    place = this.selectedPlace.place;

    const recentTrips = (await this._tripService.list()).reverse().filter((x: ITrip) => x.place === place && !x.exclude);
    const recentTrip = recentTrips[0];

    if (!recentTrip) {
      return;
    }

    if (!this.tripForm.controls.startAddress.value) {
      if (recentTrip.startAddress) {
        this.tripForm.controls.startAddress.setValue(recentTrip.startAddress);
      } else {
        const recentAddress = recentTrips.filter((x: ITrip) => x.startAddress)[0];
        this.tripForm.controls.startAddress.setValue(recentAddress?.startAddress ?? '');
      }
    }

    if (recentTrip.type) {
      this.tripForm.controls.type.setValue(recentTrip.type);
    } else {
      const recentType = recentTrips.filter((x: ITrip) => x.type)[0];
      this.tripForm.controls.type.setValue(recentType?.type ?? '');
    }

    if (!this.showPickupAddress) {
      this.togglePickupAddress();
    }
  }

  toggleAdvancedPay() {
    this.showAdvancedPay = !this.showAdvancedPay;

    this.showAdvancedPay ? this._snackBar.open("Showing Additional Payment Fields") : this._snackBar.open("Hiding Additional Payment Fields");
  }

  toggleOdometer() {
    this.showOdometer = !this.showOdometer;

    this.showOdometer ? this._snackBar.open("Showing Odometer Fields") : this._snackBar.open("Hiding Odometer Fields");
  }

  toggleOrder() {
    this.showOrder = !this.showOrder;

    this.showOrder ? this._snackBar.open("Showing Order Fields") : this._snackBar.open("Hiding Order Fields");
  }

  togglePickupAddress() {
    this.showPickupAddress = !this.showPickupAddress;

    this.showPickupAddress ? this._snackBar.open("Showing Pickup Address") : this._snackBar.open("Hiding Pickup Address");
  }
  
  compareShifts(o1: IShift, o2: IShift): boolean {
    return ShiftHelper.compareShifts(o1, o2);
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
    if (result.service) this.tripForm.controls.service.setValue(result.service);

    if (result.pay) this.tripForm.controls.pay.setValue(result.pay);
    if (result.tip) this.tripForm.controls.tip.setValue(result.tip);
    if (result.distance) this.tripForm.controls.distance.setValue(result.distance);
    if (result.type) this.tripForm.controls.type.setValue(result.type);
    if (result.place) {
      this.tripForm.controls.place.setValue(result.place);
      // Ensure type and address are updated when place is set
      this.selectPlace();
    }
    if (result.name) this.setName(result.name);
    if (result.bonus) this.tripForm.controls.bonus.setValue(result.bonus);
    if (result.cash) this.tripForm.controls.cash.setValue(result.cash);

    if (result.pickupAddress) this.setPickupAddress(result.pickupAddress);
    if (result.dropoffAddress) this.setDestinationAddress(result.dropoffAddress);

    if (result.startOdometer) this.tripForm.controls.startOdometer.setValue(result.startOdometer);
    if (result.endOdometer) this.tripForm.controls.endOdometer.setValue(result.endOdometer);
    if (result.unitNumber) this.tripForm.controls.endUnit.setValue(result.unitNumber);
    if (result.orderNumber) this.tripForm.controls.orderNumber.setValue(result.orderNumber);
    // Add more fields as needed
    this._snackBar.open('Voice input applied to form.', '', { duration: 1500 });
  }
}