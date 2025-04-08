// Angular core imports
import { ViewportScroller } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

// Angular material imports
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// RxJS imports
import { Observable } from 'rxjs';

// Application-specific imports - Interfaces
import { IAddress } from '@interfaces/address.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IService } from '@interfaces/service.interface';
import { IShift, updateShiftAction } from '@interfaces/shift.interface';
import { ITrip, updateTripAction } from '@interfaces/trip.interface';

// Application-specific imports - Services
import { AddressService } from '@services/sheets/address.service';
import { DeliveryService } from '@services/delivery.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';

// Application-specific imports - Helpers
import { sort } from '@helpers/sort.helper';
import { DateHelper } from '@helpers/date.helper';
import { ShiftHelper } from '@helpers/shift.helper';

// Application-specific imports - Enums
import { ActionEnum } from '@enums/action.enum';

@Component({
  selector: 'trip-form',
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.scss']
})
export class TripFormComponent implements OnInit {
  // @Input() data!: ITrip;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger | undefined;

  tripForm = new FormGroup({
    shift: new FormControl(''),
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
      public dialogRef: MatDialogRef<TripFormComponent>,
      public dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public data: ITrip,
      private _snackBar: MatSnackBar,
      private _addressService: AddressService,
      private _deliveryService: DeliveryService,
      private _gigLoggerService: GigLoggerService,
      private _nameService: NameService,
      private _placeService: PlaceService,
      private _shiftService: ShiftService,
      private _timerService: TimerService,
      private _tripService: TripService,
      private _viewportScroller: ViewportScroller
    ) {}

  async ngOnInit(): Promise<void> {
    this.load();
  }

  public async load() {
    if (this.data?.id) {
      this.title = `Edit Trip - #${ this.data.rowId }`;
      // Load form with passed in data.
      await this.loadForm()
    }
    else {
      this.data = {} as ITrip; // Reset data if not editing. Need to do this to prevent expanded form fields from showing.
    }

    await this.setDefaultShift();
  }

  // TODO move this to a helper or service
  private async createShift(): Promise<IShift> {
    let shift: IShift = {} as IShift;
    if (!this.tripForm.value.shift || this.tripForm.value.shift == "new") {
      // console.log("New Shift!");
      let shifts: IShift[] = [];
      let today: string = DateHelper.getISOFormat();

      shifts.push(...await this._shiftService.queryShifts("date", today));
      
      shift = ShiftHelper.createNewShift(this.tripForm.value.service ?? "", shifts);
      shift.region = this.tripForm.value.region ?? "";
      shift.rowId = await this._shiftService.getMaxShiftId() + 1;
      
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
    trip.region = shift.region;
    trip.number = shift.number ?? 0;

    trip.startAddress = this.tripForm.value.startAddress ?? "";
    trip.endAddress = this.tripForm.value.endAddress ?? "";
    trip.endUnit = this.tripForm.value.endUnit ?? "";
    trip.distance = this.tripForm.value.distance;

    trip.pay = +(this.tripForm.value.pay ?? 0);
    trip.tip = this.tripForm.value.tip;
    trip.bonus = this.tripForm.value.bonus;
    trip.cash = this.tripForm.value.cash;
    trip.total = +(trip.pay ?? 0) + +(trip.tip ?? 0) + +(trip.bonus ?? 0);

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
      updateTripAction(trip, ActionEnum.Update);
      trip.pickupTime = this.tripForm.value.pickupTime ?? "";
      trip.dropoffTime = this.tripForm.value.dropoffTime ?? "";
    }
    else {
      trip.rowId = await this._tripService.getMaxId() + 1;
      updateTripAction(trip, ActionEnum.Add);
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
    // console.log(this.shifts);

    if (this.shifts.length > 0) {
      sort(this.shifts, '-key');
    }

    //Set default shift to last trip or latest shift.
    if (!this.data?.id) {
      let today = DateHelper.getISOFormat();

      let trips = await this._tripService.query("date", today);

      sort(trips, '-id');

      let latestTrip = trips[0];
      let shift = this.shifts.find(x => x.key === latestTrip?.key);

      // If a shift is found assign it.
      if (shift) {
        this.selectedShift = shift;
      }
      else {
        // If there is a shift today that has no trips select it.
        this.selectedShift = this.shifts.find(x => x.date === today);
      }

      // Set place if only one in the list.
      let places = await this._placeService.list();
      if (places.length === 1) {
        this.tripForm.controls.place.setValue(places[0].place);
        await this.selectPlace();
      }
    }

    // Check to see if service should be displayed
    await this.onShiftSelected(this.tripForm.value.shift ?? "");
  }

  public async addTrip() {
    let shift = await this.createShift();
    let trip = await this.createTrip(shift);
    await this._tripService.add(trip);
    
    // Update shift numbers & weekday current amount.
    await this._gigLoggerService.calculateShiftTotals([shift]);

    // Update ancillary info
    await this._gigLoggerService.updateAncillaryInfo();

    this._snackBar.open("Trip Stored to Device");

    await this.formReset();
    this.parentReload.emit();
    
    // console.log(trip);
    await this._timerService.delay(1000); // TODO: see if parent will scroll after done.
    this._viewportScroller.scrollToAnchor("todaysTrips");
  }

  public async editTrip() {
    let shifts: IShift[] = [];

    if (this.selectedShift) {
      shifts.push(this.selectedShift);
    }

    let shift = await this.createShift();
    let trip = await this.createTrip(shift);

    updateShiftAction(shift, ActionEnum.Update);
    this._shiftService.update([shift]);
    
    shifts.push(shift);

    if (shifts.length > 1) {
      shifts = [...new Set(shifts)]; // Remove duplicates
    }

    await this._tripService.update([trip]);

    // Update shift numbers & weekday current amount.
    await this._gigLoggerService.calculateShiftTotals(shifts);

    // Update ancillary info
    await this._gigLoggerService.updateAncillaryInfo();

    this._snackBar.open("Trip Updated");

    this.dialogRef.close();
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

  public async onShiftSelected(value:string) {
    if (value) {
      this.isNewShift = false;
      this.tripForm.controls.service.clearValidators();
      this.tripForm.controls.service.updateValueAndValidity();

      return;
    }

    this.isNewShift = true;
    this.tripForm.controls.service.setValidators([Validators.required]);

    // Get the most recent shift
    let shifts = (await this._shiftService.list()).reverse();
    let shift = shifts[0];

    if (!shift) {
      return;
    } 

    //Set the most recent service as default.
    if (shift.service) {
      this.tripForm.controls.service.setValue(shift.service);
    }
    else {
      let recentService = shifts.filter(x => x.service)[0];
      this.tripForm.controls.service.setValue(recentService.service);
    }

    //Set the most recent region as default.
    if (shift.region) {
      this.tripForm.controls.region.setValue(shift.region);
    }
    else {
      let recentRegion = shifts.filter(x => x.region)[0];
      this.tripForm.controls.region.setValue(recentRegion.region);
    }

    this.tripForm.controls.service.updateValueAndValidity();
  }

  setPickupAddress(address: string) {
    this.tripForm.controls.startAddress.setValue(address);
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
    this.selectedAddressDeliveries = await this._deliveryService.queryRemoteDeliveries("address", address);
    sort(this.selectedAddressDeliveries, 'name');
  }

  async showNameAddresses() {
    let name = this.tripForm.value.name;

    if (!name) { this.selectedNameDeliveries = []; return; }

    this.selectedName = await this._nameService.find('name', name);
    this.selectedNameDeliveries = await this._deliveryService.queryRemoteDeliveries("name", name);
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
      return;
    }

    // Filter addresses to show only those with trips in the last year.
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    this.selectedPlaceAddresses = this.selectedPlace?.addresses?.filter(address => 
      new Date(address.lastTrip) >= oneYearAgo
    );

    place = this.selectedPlace.place;

    let recentTrips = (await this._tripService.getAll()).reverse().filter(x => x.place === place);
    let recentTrip = recentTrips[0];

    if (!recentTrip) {
      return;
    }

    // Auto assign to most recent start address.
    if (recentTrip.startAddress) {
      this.tripForm.controls.startAddress.setValue(recentTrip.startAddress);
    }
    else {
      let recentAddress = recentTrips.filter(x => x.startAddress)[0];
      this.tripForm.controls.startAddress.setValue(recentAddress?.startAddress ?? "");
    }

    // Auto assign to most recent type.
    if (recentTrip.type) {
      this.tripForm.controls.type.setValue(recentTrip.type);
    }
    else {
      let recentType = recentTrips.filter(x => x.type)[0];
      this.tripForm.controls.type.setValue(recentType?.type ?? "");
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
    this.dialogRef.close();
  }
}