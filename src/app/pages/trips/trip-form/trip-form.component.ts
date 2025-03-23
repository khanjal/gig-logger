// Angular core imports
import { ViewportScroller } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

// Angular material imports
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// RxJS imports
import { Observable, startWith, mergeMap } from 'rxjs';

// Application-specific imports - Interfaces
import { IAddress } from '@interfaces/address.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IService } from '@interfaces/service.interface';
import { IShift, updateShiftAction } from '@interfaces/shift.interface';
import { ITrip, updateTripAction } from '@interfaces/trip.interface';

// Application-specific imports - Services
import { AddressService } from '@services/address.service';
import { DeliveryService } from '@services/delivery.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/trip.service';

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

  filteredServices: Observable<IService[]> | undefined;
  
  sheetTrips: ITrip[] = [];
  shifts: IShift[] = [];
  selectedShift: IShift | undefined;

  title: string = "Add Trip";

  constructor(
      public formDialogRef: MatDialogRef<TripFormComponent>,
      public dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public data: ITrip,
      private _snackBar: MatSnackBar,
      private _addressService: AddressService,
      private _deliveryService: DeliveryService,
      private _gigLoggerService: GigLoggerService,
      private _nameService: NameService,
      private _placeService: PlaceService,
      private _serviceService: ServiceService,
      private _shiftService: ShiftService,
      private _timerService: TimerService,
      private _tripService: TripService,
      private _viewportScroller: ViewportScroller
    ) {}

  async ngOnInit(): Promise<void> {
    this.load();

    this.filteredServices = this.tripForm.controls.service.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterService(value || ''))
    );

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
      
      await this._shiftService.addNewShift(shift);
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
      trip.rowId = await this._tripService.getMaxTripId() + 1;
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
    this.selectedShift = (await this._shiftService.queryShiftByKey(this.data.key));
    this.tripForm.controls.service.setValue(this.data.service);
    this.tripForm.controls.type.setValue(this.data.type);

    this.tripForm.controls.pay.setValue(this.data.pay === 0 ? '' : this.data.pay); // Don't load in a 0
    this.tripForm.controls.tip.setValue(this.data.tip);
    this.tripForm.controls.bonus.setValue(this.data.bonus);
    this.tripForm.controls.cash.setValue(this.data.cash);
    this.showAdvancedPay = true;

    this.tripForm.controls.startOdometer.setValue(this.data.startOdometer);
    this.tripForm.controls.endOdometer.setValue(this.data.endOdometer);
    this.showOdometer = true;

    this.tripForm.controls.place.setValue(this.data.place);
    this.selectPlace(this.data.place);
    this.showPickupAddress = true;

    this.tripForm.controls.distance.setValue(this.data.distance);
    this.tripForm.controls.name.setValue(this.data.name);
    this.showNameAddresses(this.data.name);

    this.tripForm.controls.startAddress.setValue(this.data.startAddress);
    this.tripForm.controls.endAddress.setValue(this.data.endAddress);
    this.showAddressNames(this.data.endAddress);

    this.tripForm.controls.pickupTime.setValue(DateHelper.removeSeconds(this.data.pickupTime));
    this.tripForm.controls.dropoffTime.setValue(DateHelper.removeSeconds(this.data.dropoffTime));
    this.showTimes = true;

    this.tripForm.controls.note.setValue(this.data.note);

    this.tripForm.controls.endUnit.setValue(this.data.endUnit);
    this.tripForm.controls.orderNumber.setValue(this.data.orderNumber);
    this.showOrder = true;

    if (this.data.exclude) {
      this.tripForm.controls.exclude.setValue("true");
    }
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

      let trips = await this._tripService.queryTrips("date", today);

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
      let places = await this._placeService.getPlaces();
      if (places.length === 1) {
        this.tripForm.controls.place.setValue(places[0].place);
        await this.selectPlace(places[0].place);
      }
    }

    // Check to see if service should be displayed
    await this.onShiftSelected(this.tripForm.value.shift ?? "");
  }

  public async addTrip() {
    let shift = await this.createShift();
    let trip = await this.createTrip(shift);
    await this._tripService.addTrip(trip);
    
    // Update shift numbers & weekday current amount.
    await this._gigLoggerService.calculateShiftTotals([shift]);

    this._snackBar.open("Trip Stored to Device");

    this.formReset();
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
    this._shiftService.updateShift(shift);
    
    shifts.push(shift);

    if (shifts.length > 1) {
      shifts = [...new Set(shifts)]; // Remove duplicates
    }

    await this._tripService.updateTrip(trip);

    // Update shift numbers & weekday current amount.
    await this._gigLoggerService.calculateShiftTotals(shifts);

    this._snackBar.open("Trip Updated");

    this.formDialogRef.close();
  }

  public formReset() {
    this.data = {} as ITrip;

    // Reset all selections
    this.selectedAddress = undefined;
    this.selectedAddressDeliveries = undefined;
    this.selectedName = undefined;
    this.selectedNameDeliveries = undefined;
    this.selectedPlace = undefined;

    // Reset all show fields
    this.showAdvancedPay = false;
    this.showPickupAddress = false;
    this.showOdometer = false;
    this.showOrder = false;

    this.tripForm.reset();
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
    let shifts = (await this._shiftService.getShifts()).reverse();
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
    await this.showAddressNames(address);
  }

  async setName(name: string) {
    this.tripForm.controls.name.setValue(name);
    await this.showNameAddresses(name);
  }

  async showAddressNames(address: string) {
    if (!address) { this.selectedAddressDeliveries = []; return; }
    this.selectedAddress = await this._addressService.getAddress(address);
    this.selectedAddressDeliveries = await this._deliveryService.queryRemoteDeliveries("address", address);
    sort(this.selectedAddressDeliveries, 'name');
  }

  async showNameAddresses(name: string) {
    if (!name) { this.selectedNameDeliveries = []; return; }
    this.selectedName = await this._nameService.findName(name);
    this.selectedNameDeliveries = await this._deliveryService.queryRemoteDeliveries("name", name);
    sort(this.selectedNameDeliveries, 'address');
  }

  async selectPlace(place: string) {
    if (!place) {
      this.selectedPlace = undefined;
      return;
    }

    this.selectedPlace = await this._placeService.getPlace(place);
    if (!this.selectedPlace) {
      return;
    }

    place = this.selectedPlace.place;

    let recentTrips = (await this._tripService.getTrips()).reverse().filter(x => x.place === place);
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
  }

  // TODO move to helper
  async countAddress(address: string): Promise<number> {
    let foundAddress = await this._addressService.findAddress(address);
    return foundAddress?.visits ?? 0;
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

  private clearFocus(elementId: string) {
    let input = document.getElementById(elementId);
    input?.blur();
    this.autocomplete?.closePanel();
  }

  setPickupTime() {
    this.tripForm.controls.pickupTime.setValue(this.getCurrentTime());
  }

  setDropoffTime() {
    this.tripForm.controls.dropoffTime.setValue(this.getCurrentTime());
  }

  getCurrentTime() {
    return DateHelper.getTimeString(new Date);
  }

  private async _filterName(value: string): Promise<IName[]> {
    let names = await this._nameService.getNames();
    names = names.filter(x => x.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    sort(names, 'name');

    return (names).slice(0,100);
  }

  private async _filterService(value: string): Promise<IService[]> {
    const filterValue = value;

    return await this._serviceService.filterServices(filterValue);
  }

}