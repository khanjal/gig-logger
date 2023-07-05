import { ViewportScroller } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TripHelper } from '@helpers/trip.helper';
import { IAddress } from '@interfaces/address.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IRegion } from '@interfaces/region.interface';
import { IService } from '@interfaces/service.interface';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { IType } from '@interfaces/type.interface';
import { AddressService } from '@services/address.service';
import { DeliveryService } from '@services/delivery.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { TripService } from '@services/trip.service';
import { TypeService } from '@services/type.service';
import { WeekdayService } from '@services/weekday.service';
import { Observable, startWith, mergeMap } from 'rxjs';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { DateHelper } from 'src/app/shared/helpers/date.helper';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';

@Component({
  selector: 'quick-form',
  templateUrl: './quick-form.component.html',
  styleUrls: ['./quick-form.component.scss']
})
export class QuickFormComponent implements OnInit {
  // @Input() data!: ITrip;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

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
    note: new FormControl('')
  });

  isNewShift: boolean = true;
  showAdvancedPay: boolean = false;
  showPickupAddress: boolean = false;
  showOdometer: boolean = false;
  showOrder: boolean = false;
  showTimes: boolean = false;

  filteredStartAddresses: Observable<IAddress[]> | undefined;
  filteredEndAddresses: Observable<IAddress[]> | undefined;
  selectedAddress: IAddress | undefined;
  selectedAddressDeliveries: IDelivery[] | undefined;
  
  filteredNames: Observable<IName[]> | undefined;
  selectedName: IName | undefined;
  selectedNameDeliveries: IDelivery[] | undefined;
  
  filteredPlaces: Observable<IPlace[]> | undefined;
  selectedPlace: IPlace | undefined;

  filteredRegions: Observable<IRegion[]> | undefined;
  filteredServices: Observable<IService[]> | undefined;
  filteredTypes: Observable<IType[]> | undefined;
  
  sheetTrips: ITrip[] = [];
  shifts: IShift[] = [];
  selectedShift: IShift | undefined;

  title: string = "Add Trip";

  constructor(
      public formDialogRef: MatDialogRef<QuickFormComponent>,
      @Inject(MAT_DIALOG_DATA) public data: ITrip,
      private _snackBar: MatSnackBar,
      private _addressService: AddressService,
      private _deliveryService: DeliveryService,
      private _nameService: NameService,
      private _placeService: PlaceService,
      private _regionService: RegionService,
      private _serviceService: ServiceService,
      private _shiftService: ShiftService,
      private _tripService: TripService,
      private _typeService: TypeService,
      private _weekdayService: WeekdayService,
      private _viewportScroller: ViewportScroller
    ) {}

  async ngOnInit(): Promise<void> {
    this.load();

    this.filteredStartAddresses = this.quickForm.controls.startAddress.valueChanges.pipe(
      mergeMap(async value => await this._filterAddress(value || ''))
    );

    this.filteredEndAddresses = this.quickForm.controls.endAddress.valueChanges.pipe(
      mergeMap(async value => await this._filterAddress(value || ''))
    );

    this.filteredNames = this.quickForm.controls.name.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterName(value || ''))
    );

    this.filteredPlaces = this.quickForm.controls.place.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterPlace(value || ''))
    );

    this.filteredRegions = this.quickForm.controls.region.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterRegion(value || ''))
    );

    this.filteredServices = this.quickForm.controls.service.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterService(value || ''))
    );

    this.filteredTypes = this.quickForm.controls.type.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterType(value || ''))
    );
  }

  public async load() {
    if (this.data?.id) {
      this.title = `Edit Trip - ${ this.data.id }`;
      // Load form with passed in data.
      await this.loadForm()
    }

    await this.setDefaultShift();
  }

  // TODO move this to a helper or service
  private async calculateShiftTotals() {
    let shifts = await this._shiftService.getPreviousWeekShifts();

    shifts.forEach(async shift => {
      shift.trips = 0;
      shift.total = 0;

      let trips = [...(await this._tripService.queryLocalTrips("key", shift.key)).filter(x => !x.saved),
                  ...await this._tripService.queryRemoteTrips("key", shift.key)];
      trips.forEach(trip => {
          shift.trips++;
          shift.total += trip.total;
      });

      this._shiftService.updateShift(shift);
    });
  }

  private async calculateDailyTotal() {
    let currentAmount = 0;
    let date = new Date().toLocaleDateString();
    let dayOfWeek = new Date().toLocaleDateString('en-us', {weekday: 'short'});
    let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];

    let todaysTrips = [... (await this._tripService.queryLocalTrips("date", date)).filter(x => !x.saved),
                      ...await this._tripService.queryRemoteTrips("date", date)];

    todaysTrips.forEach(trip => {
      currentAmount += trip.total;
    });

    weekday.currentAmount = currentAmount;
    await this._weekdayService.updateWeekday(weekday);
  }

  private async createShift(): Promise<IShift> {
    let shift: IShift = {} as IShift;
    if (!this.quickForm.value.shift || this.quickForm.value.shift == "new") {
      console.log("New Shift!");
      let shifts: IShift[] = [];
      let today: string = new Date().toLocaleDateString();

      shifts.push(...(await this._shiftService.queryLocalShifts("date", today)).filter(x => !x.saved));
      shifts.push(...await this._shiftService.queryRemoteShifts("date", today));
      
      shift = ShiftHelper.createNewShift(this.quickForm.value.service ?? "", shifts);
      shift.region = this.quickForm.value.region ?? "";
      
      await this._shiftService.addNewShift(shift);
    }
    else {
      shift = <IShift><unknown>this.quickForm.value.shift;
    }

    return shift;
  }

  private createTrip(shift: IShift): ITrip {
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

    trip.pay = +this.quickForm.value.pay ?? 0;
    trip.tip = this.quickForm.value.tip;
    trip.bonus = this.quickForm.value.bonus;
    trip.cash = this.quickForm.value.cash;
    trip.total = trip.pay + trip.tip + trip.bonus;

    trip.startOdometer = this.quickForm.value.startOdometer;
    trip.endOdometer = this.quickForm.value.endOdometer;
    
    trip.name = this.quickForm.value.name ?? "";
    trip.place = this.quickForm.value.place ?? "";
    trip.type = this.quickForm.value.type ?? "";
    trip.note = this.quickForm.value.note ?? "";
    trip.orderNumber = this.quickForm.value.orderNumber?.toLocaleUpperCase() ?? "";
    trip.saved = false;
    
    // Set form properties depending on edit/add
    if (this.data?.id) {
      trip.pickupTime = this.quickForm.value.pickupTime ?? "";
      trip.dropoffTime = this.quickForm.value.dropoffTime ?? "";
    }
    else {
      trip.pickupTime = DateHelper.getTimeString(new Date);
    }

    trip.duration = DateHelper.getDuration(trip.pickupTime, trip.dropoffTime);

    return trip;
  }

  private async loadForm() {
    this.selectedShift = (await this._shiftService.queryShiftsByKey(this.data.date, this.data.service, this.data.number))[0];
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
  }

  private async setDefaultShift() {
    this.shifts = await this._shiftService.getPreviousWeekShifts();
    // console.log(this.shifts);

    if (this.shifts.length > 0) {
      this.shifts = ShiftHelper.sortShiftsDesc(this.shifts);
    }

    //Set default shift to last trip or latest shift.
    if (!this.data.id) {
      // Remove duplicates
      this.shifts = ShiftHelper.removeDuplicateShifts(this.shifts);

      let today = new Date().toLocaleDateString();

      let trips = await this._tripService.queryLocalTrips("date", today);

      // Check for local trips first. If not use remote trips.
      if (trips.length === 0) {
        await this._tripService.queryRemoteTrips("date", today)
      }

      let latestTrip = TripHelper.sortTripsDesc(trips)[0];
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
      let places = await this._placeService.getRemotePlaces();
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
    let trip = this.createTrip(shift);
    await this._tripService.addTrip(trip);
    
    // Update shift total.
    // TODO: Break shift total into pay/tip/bonus/cash
    shift.trips++;
    shift.total += trip.pay + trip.tip + trip.bonus;
    await this._shiftService.updateShift(shift);
    
    // Update weekday current amount.
    let dayOfWeek = new Date().toLocaleDateString('en-us', {weekday: 'short'});
    let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];
    weekday.currentAmount += trip.pay + trip.tip + trip.bonus;
    await this._weekdayService.updateWeekday(weekday);

    this._snackBar.open("Trip Stored to Device");

    this.formReset();
    this.parentReload.emit();
    
    // console.log(trip);
  }

  public async editTrip() {
    let shift = await this.createShift();

    let trip = this.createTrip(shift);

    await this._tripService.updateLocalTrip(trip);

    // Update all shift totals from displayed shifts and daily total.
    await this.calculateShiftTotals();
    await this.calculateDailyTotal();

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
      let service = (await this._serviceService.getRemoteServices()).reduce((prev, current) => (prev.visits > current.visits) ? prev : current);
      this.quickForm.controls.service.setValue(service.service);

      //Set the most used region as default.
      let region = (await this._regionService.get()).reduce((prev, current) => (prev.visits > current.visits) ? prev : current);
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

  showAddressNamesEvent(event: any) {
    let address = event.target.value;
    this.showAddressNames(address);
  }

  async showAddressNames(address: string) {
    if (!address) { return; }
    this.selectedAddress = await this._addressService.getRemoteAddress(address);
    this.selectedAddressDeliveries = await this._deliveryService.queryRemoteDeliveries("address", address);
  }

  showNameAddressesEvent(event: any) {
    let name = event.target.value;
    this.showNameAddresses(name);
  }

  async showNameAddresses(name: string) {
    if (!name) { return; }
    this.selectedName = await this._nameService.findRemoteName(name);
    this.selectedNameDeliveries = await this._deliveryService.queryRemoteDeliveries("name", name);
  }

  selectPlaceEvent(event: any) {
    let place = event.target.value;
    this.selectPlace(place);
  }

  async selectPlace(place: string) {
    if (!place) {
      return;
    }

    this.selectedPlace = await this._placeService.getRemotePlace(place);

    // TODO: Auto select most used address.
    // Auto assign to start address if only one and if there is no start address already.
    if (!this.quickForm.value.startAddress && this.selectedPlace?.addresses.length === 1) {
      this.quickForm.controls.startAddress.setValue(this.selectedPlace?.addresses[0]);
    }

    // Auto assign to most used type if there is no type already.
    if (!this.quickForm.value.type && this.selectedPlace?.types?.length) {
      //Set the most used type as default.
      let type = this.selectedPlace?.types.reduce((prev, current) => (prev.visits > current.visits) ? prev : current);

      if (type) {
        this.quickForm.controls.type.setValue(type.type);
      }

      // this.quickForm.controls.type.setValue(this.selectedPlace?.types[0].type);
    }
  }

  async countAddress(address: string): Promise<number> {
    let foundAddress = await this._addressService.findRemoteAddress(address);
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

  setPickupTime() {
    this.quickForm.controls.pickupTime.setValue(DateHelper.getTimeString(new Date));
  }

  setDropoffTime() {
    this.quickForm.controls.dropoffTime.setValue(DateHelper.getTimeString(new Date));
  }

  public getPlaceAddress(address: string) {
    return AddressHelper.getPlaceAddress(this.quickForm.value.place ?? "", address);
  }

  private async _filterAddress(value: string): Promise<IAddress[]> {
    let addresses = await this._addressService.getRemoteAddresses();
    addresses = addresses.filter(x => x.address.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    return (addresses).slice(0,100);
  }

  private async _filterName(value: string): Promise<IName[]> {
    let names = await this._nameService.getRemoteNames();
    names = names.filter(x => x.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()));

    return (names).slice(0,100);
  }

  private async _filterPlace(value: string): Promise<IPlace[]> {
    let places = await this._placeService.getRemotePlaces();
    places = places.filter(x => x.place.toLocaleLowerCase().includes(value.toLocaleLowerCase()));

    return places;
  }

  private async _filterRegion(value: string): Promise<IRegion[]> {
    const filterValue = value;

    return await this._regionService.filter(filterValue);
  }

  private async _filterService(value: string): Promise<IService[]> {
    const filterValue = value;

    return await this._serviceService.filterRemoteServices(filterValue);
  }

  private async _filterType(value: string): Promise<IType[]> {
    const filterValue = value;

    return await this._typeService.filter(filterValue);
  }
}