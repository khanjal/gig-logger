import { ViewportScroller } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddressDialogComponent } from '@components/address-dialog/address-dialog.component';
import { sort } from '@helpers/sort.helper';
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { IAddress } from '@interfaces/address.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IRegion } from '@interfaces/region.interface';
import { IService } from '@interfaces/service.interface';
import { IShift, updateShiftAction } from '@interfaces/shift.interface';
import { ITrip, updateTripAction } from '@interfaces/trip.interface';
import { AddressService } from '@services/address.service';
import { DeliveryService } from '@services/delivery.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/trip.service';
import { Observable, startWith, mergeMap } from 'rxjs';
import { DateHelper } from 'src/app/shared/helpers/date.helper';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';
import { ActionEnum } from '@enums/action.enum';

@Component({
  selector: 'quick-form',
  templateUrl: './quick-form.component.html',
  styleUrls: ['./quick-form.component.scss']
})
export class QuickFormComponent implements OnInit {
  // @Input() data!: ITrip;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger | undefined;

  quickForm = new FormGroup({
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
      public formDialogRef: MatDialogRef<QuickFormComponent>,
      public dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public data: ITrip,
      private _snackBar: MatSnackBar,
      private _addressService: AddressService,
      private _deliveryService: DeliveryService,
      private _gigLoggerService: GigLoggerService,
      private _nameService: NameService,
      private _placeService: PlaceService,
      private _regionService: RegionService,
      private _serviceService: ServiceService,
      private _shiftService: ShiftService,
      private _timerService: TimerService,
      private _tripService: TripService,
      private _viewportScroller: ViewportScroller
    ) {}

  async ngOnInit(): Promise<void> {
    this.load();

    this.filteredServices = this.quickForm.controls.service.valueChanges.pipe(
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

    await this.setDefaultShift();
  }

  // TODO move this to a helper or service
  private async createShift(): Promise<IShift> {
    let shift: IShift = {} as IShift;
    if (!this.quickForm.value.shift || this.quickForm.value.shift == "new") {
      // console.log("New Shift!");
      let shifts: IShift[] = [];
      let today: string = DateHelper.getISOFormat();

      shifts.push(...await this._shiftService.queryShifts("date", today));
      
      shift = ShiftHelper.createNewShift(this.quickForm.value.service ?? "", shifts);
      shift.region = this.quickForm.value.region ?? "";
      shift.rowId = await this._shiftService.getMaxShiftId() + 1;
      
      await this._shiftService.addNewShift(shift);
    }
    else {
      shift = <IShift><unknown>this.quickForm.value.shift;
    }

    return shift;
  }

  private async createTrip(shift: IShift): Promise<ITrip> {
    let trip: ITrip = {} as ITrip;

    trip.id = this.data?.id;
    trip.key = shift.key;
    
    trip.date = shift.date;
    trip.service = shift.service;
    trip.region = shift.region;
    trip.number = shift.number ?? 0;

    trip.startAddress = this.quickForm.value.startAddress ?? "";
    trip.endAddress = this.quickForm.value.endAddress ?? "";
    trip.endUnit = this.quickForm.value.endUnit ?? "";
    trip.distance = this.quickForm.value.distance;

    trip.pay = this.quickForm.value.pay ?? 0;
    trip.tip = this.quickForm.value.tip;
    trip.bonus = this.quickForm.value.bonus;
    trip.cash = this.quickForm.value.cash;
    trip.total = +(trip.pay ?? 0) + +(trip.tip ?? 0) + +(trip.bonus ?? 0);

    trip.startOdometer = this.quickForm.value.startOdometer;
    trip.endOdometer = this.quickForm.value.endOdometer;
    
    trip.name = this.quickForm.value.name ?? "";
    trip.place = this.quickForm.value.place ?? "";
    trip.type = this.quickForm.value.type ?? "";
    trip.note = this.quickForm.value.note ?? "";
    trip.orderNumber = this.quickForm.value.orderNumber?.toLocaleUpperCase() ?? "";
    trip.exclude = this.quickForm.value.exclude ? true : false;
    trip.saved = false;
    
    // Set form properties depending on edit/add
    if (this.data?.id) {
      trip.rowId = this.data.rowId;
      updateTripAction(trip, this.data?.saved ? ActionEnum.Update : this.data?.action);
      trip.pickupTime = this.quickForm.value.pickupTime ?? "";
      trip.dropoffTime = this.quickForm.value.dropoffTime ?? "";
    }
    else {
      trip.rowId = await this._tripService.getMaxTripId() + 1;
      updateTripAction(trip, ActionEnum.Add);
      trip.pickupTime = DateHelper.getTimeString(new Date);
    }

    let duration = DateHelper.getDurationSeconds(trip.pickupTime, trip.dropoffTime);
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
    this.quickForm.controls.service.setValue(this.data.service);
    this.quickForm.controls.type.setValue(this.data.type);

    this.quickForm.controls.pay.setValue(this.data.pay === 0 ? '' : this.data.pay); // Don't load in a 0
    this.quickForm.controls.tip.setValue(this.data.tip);
    this.quickForm.controls.bonus.setValue(this.data.bonus);
    this.quickForm.controls.cash.setValue(this.data.cash);
    this.showAdvancedPay = true;

    this.quickForm.controls.startOdometer.setValue(this.data.startOdometer);
    this.quickForm.controls.endOdometer.setValue(this.data.endOdometer);
    this.showOdometer = true;

    this.quickForm.controls.place.setValue(this.data.place);
    this.selectPlace(this.data.place);
    this.showPickupAddress = true;

    this.quickForm.controls.distance.setValue(this.data.distance);
    this.quickForm.controls.name.setValue(this.data.name);
    this.showNameAddresses(this.data.name);

    this.quickForm.controls.startAddress.setValue(this.data.startAddress);
    this.quickForm.controls.endAddress.setValue(this.data.endAddress);
    this.showAddressNames(this.data.endAddress);

    this.quickForm.controls.pickupTime.setValue(this.data.pickupTime);
    this.quickForm.controls.dropoffTime.setValue(this.data.dropoffTime);
    this.showTimes = true;

    this.quickForm.controls.note.setValue(this.data.note);

    this.quickForm.controls.endUnit.setValue(this.data.endUnit);
    this.quickForm.controls.orderNumber.setValue(this.data.orderNumber);
    this.showOrder = true;

    if (this.data.exclude) {
      this.quickForm.controls.exclude.setValue("true");
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
      // Remove duplicates
      this.shifts = ShiftHelper.removeDuplicateShifts(this.shifts);

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
        this.quickForm.controls.place.setValue(places[0].place);
        await this.selectPlace(places[0].place);
      }
    }

    // Check to see if service should be displayed
    await this.onShiftSelected(this.quickForm.value.shift ?? "");
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
    this._viewportScroller.scrollToAnchor("unsavedTrips");
  }

  public async editTrip() {
    let shifts: IShift[] = [];

    if (this.selectedShift) {
      shifts.push(this.selectedShift);
    }

    let shift = await this.createShift();
    let trip = await this.createTrip(shift);

    shift.finish = DateHelper.getTimeString(new Date);
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

    this.quickForm.reset();
    this.setDefaultShift();
    this._viewportScroller.scrollToAnchor("addTrip");
  }

  public async onShiftSelected(value:string) {
    if (!value) {
      this.isNewShift = true;
      this.quickForm.controls.service.setValidators([Validators.required]);

      //Set the most used service as default.
      let service = (await this._serviceService.getServices())?.reduce((prev, current) => (prev.visits > current.visits) ? prev : current, {} as IService);
      this.quickForm.controls.service.setValue(service.service);

      //Set the most used region as default.
      let region = (await this._regionService.get()).reduce((prev, current) => (prev.visits > current.visits) ? prev : current, {} as IRegion);
      this.quickForm.controls.region.setValue(region.region);
    }
    else {
      this.isNewShift = false;
      this.quickForm.controls.service.clearValidators();
    }

    this.quickForm.controls.service.updateValueAndValidity();
  }

  selectPickupAddress(address: string) {
    this.quickForm.controls.startAddress.setValue(address);
  }

  selectDestinationAddress(address: string) {
    this.quickForm.controls.endAddress.setValue(address);
    this.showAddressNames(address);
  }

  selectName(name: string) {
    this.quickForm.controls.name.setValue(name);
    this.showNameAddresses(name);
  }

  setPickupAddress(address: string) {
    this.quickForm.controls.startAddress.setValue(address);
  }

  setDestinationAddress(address: string) {
    this.quickForm.controls.endAddress.setValue(address);
    this.showAddressNames(address);
  }

  setName(name: string) {
    this.quickForm.controls.name.setValue(name);
    this.showNameAddresses(name);
  }
  
  setPlace(place: string) {
    this.quickForm.controls.place.setValue(place);
    this.selectPlace(place);
  }

  setRegion(region: string) {
    this.quickForm.controls.region.setValue(region);
  }
  
  setType(type: string) {
    this.quickForm.controls.type.setValue(type);
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

    // Auto assign to most used start address if there is no start address already.
    if (!this.quickForm.value.startAddress && this.selectedPlace?.addresses?.length) {
      //Set the most used type as default.
      let address = this.selectedPlace?.addresses.reduce((prev, current) => (prev.visits > current.visits) ? prev : current);

      if (address) {
        this.quickForm.controls.startAddress.setValue(address.address);
      }
    }

    // Auto assign to most used type if there is no type already.
    if (!this.quickForm.value.type && this.selectedPlace?.types?.length) {
      //Set the most used type as default.
      let type = this.selectedPlace?.types.reduce((prev, current) => (prev.visits > current.visits) ? prev : current);

      if (type) {
        this.quickForm.controls.type.setValue(type.type);
      }
    }
  }

  // TODO move to helper
  async countAddress(address: string): Promise<number> {
    let foundAddress = await this._addressService.findAddress(address);
    console.log(foundAddress);
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
    this.quickForm.controls.pickupTime.setValue(DateHelper.getTimeString(new Date));
  }

  setDropoffTime() {
    this.quickForm.controls.dropoffTime.setValue(DateHelper.getTimeString(new Date));
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