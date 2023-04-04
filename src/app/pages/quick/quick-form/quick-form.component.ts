import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, startWith, map } from 'rxjs';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { DateHelper } from 'src/app/shared/helpers/date.helper';
import { NameHelper } from 'src/app/shared/helpers/name.helper';
import { PlaceHelper } from 'src/app/shared/helpers/place.helper';
import { ServiceHelper } from 'src/app/shared/helpers/service.helper';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';
import { TripHelper } from 'src/app/shared/helpers/trip.helper';
import { AddressModel } from 'src/app/shared/models/address.model';
import { NameModel } from 'src/app/shared/models/name.model';
import { PlaceModel } from 'src/app/shared/models/place.model';
import { ServiceModel } from 'src/app/shared/models/service.model';
import { ShiftModel } from 'src/app/shared/models/shift.model';
import { TripModel } from 'src/app/shared/models/trip.model';

@Component({
  selector: 'quick-form',
  templateUrl: './quick-form.component.html',
  styleUrls: ['./quick-form.component.scss']
})
export class QuickFormComponent implements OnInit {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  quickForm = new FormGroup({
    address: new FormControl(''),
    bonus: new FormControl(),
    cash: new FormControl(),
    distance: new FormControl(),
    name: new FormControl(''),
    pay: new FormControl(),
    place: new FormControl(''),
    service: new FormControl(''),
    shift: new FormControl(''),
    tip: new FormControl(),
  });

  isNewShift: boolean = false;
  showAdvancedPay: boolean = false;

  addresses: AddressModel[] = [];
  filteredAddresses: Observable<AddressModel[]> | undefined;
  selectedAddress: AddressModel | undefined;

  names: NameModel[] = [];
  filteredNames: Observable<NameModel[]> | undefined;
  selectedName: NameModel | undefined;

  places: PlaceModel[] = [];
  filteredPlaces: Observable<PlaceModel[]> | undefined;

  services: ServiceModel[] = [];
  filteredServices: Observable<ServiceModel[]> | undefined;

  sheetTrips: TripModel[] = [];
  shifts: ShiftModel[] = [];

  async ngOnInit(): Promise<void> {
    
    this.filteredAddresses = this.quickForm.controls.address.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAddress(value || '')),
    );

    this.filteredNames = this.quickForm.controls.name.valueChanges.pipe(
      startWith(''),
      map(value => this._filterName(value || '')),
    );

    this.filteredPlaces = this.quickForm.controls.place.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPlace(value || '')),
    );

    this.filteredServices = this.quickForm.controls.service.valueChanges.pipe(
      startWith(''),
      map(value => this._filterService(value || '')),
    );

    this.load();
  }

  public load() {
    this.addresses = AddressHelper.getRemoteAddresses();
    this.names = NameHelper.getRemoteNames();
    this.places = PlaceHelper.getRemotePlaces();
    this.services = ServiceHelper.getRemoteServices();
    this.shifts = ShiftHelper.sortShiftsDesc(ShiftHelper.getPastShifts(1));
    this.sheetTrips = TripHelper.getPastTrips(1);
  }

  public addTrip() {
    let shift: ShiftModel = new ShiftModel;
    if (this.quickForm.value.shift == "new") {
      console.log("New Shift!");

      shift = ShiftHelper.createNewShift(this.quickForm.value.service ?? "");
      ShiftHelper.addShift(shift);
      this.shifts = ShiftHelper.getPastShifts(1);
    }
    else {
      if (this.quickForm.value.shift) {
        shift = <ShiftModel><unknown>this.quickForm.value.shift;
      }
    }

    let timeString = DateHelper.getTimeString(new Date);

    shift.end = timeString;

    // TODO: Update shift with time

    // console.log(shift);
    
    let trip: TripModel = new TripModel;

    trip.id = TripHelper.getLocalTrips().length++;
    trip.address = this.quickForm.value.address ?? "";
    trip.pay = +this.quickForm.value.pay ?? 0;
    trip.tip = +this.quickForm.value.tip ?? 0;
    trip.bonus = +this.quickForm.value.bonus ?? 0;
    trip.cash = +this.quickForm.value.cash ?? 0;
    trip.total = trip.pay + trip.tip + trip.bonus;
    trip.date = shift.date;
    trip.distance = this.quickForm.value.distance ?? 0;
    trip.name = this.quickForm.value.name ?? "";
    trip.place = this.quickForm.value.place ?? "";
    trip.service = shift.service;
    trip.shiftNumber = shift.shiftNumber ?? 0;
    trip.time = shift.end = timeString;

    TripHelper.addTrip(trip);

    // this.$emit('event-name');

    ShiftHelper.updateAllShiftTotals();
    this.shifts = ShiftHelper.sortShiftsDesc(ShiftHelper.getPastShifts(1));
    this.formReset();
    this.parentReload.emit();
    this.showAdvancedPay = false;

    // console.log(trip);
  }

  public formReset() {
    this.selectedAddress = undefined;
    this.selectedName = undefined;
    this.quickForm.reset();
  }

  public onShiftSelected(value:string) {
    if (value == 'new') {
      this.isNewShift = true;
      this.quickForm.controls.service.setValidators([Validators.required]);
    }
    else {
      this.isNewShift = false;
      this.quickForm.controls.service.clearValidators();
    }

    this.quickForm.controls.service.updateValueAndValidity();
  }

  selectAddress(address: string) {
    this.quickForm.controls.address.setValue(address);
    this.showAddressNames(address);
  }

  showAddressNamesEvent(event: any) {
    let address = event.target.value.toLowerCase();
    this.showAddressNames(address);
  }

  showAddressNames(address: string) {
    // console.log(address);

    if (address) {
      this.selectedAddress = this.addresses.find(option => option.address.toLowerCase().includes(address.toLowerCase()));
    }
    else
    {
      this.selectedAddress = new AddressModel;
    }
  }

  showNameAddressesEvent(event: any) {
    let name = event.target.value.toLowerCase();
    this.showNameAddresses(name);
  }

  showNameAddresses(name: string) {
    // console.log(name);
    // console.log(this._filterName(name));

    if (name) {
      this.selectedName = this.names.find(option => option.name.toLowerCase().includes(name.toLowerCase()));
    }
    else
    {
      this.selectedName = new NameModel;
    }
  }

  toggleAdvancedPay() {
    this.showAdvancedPay = !this.showAdvancedPay;
  }

  public getShortAddress(address: string): string {
    return AddressHelper.getShortAddress(address);
  }

  private _filterAddress(value: string): AddressModel[] {
    const filterValue = value.toLowerCase();

    return this.addresses.filter(option => option.address.toLowerCase().includes(filterValue));
  }

  private _filterName(value: string): NameModel[] {
    const filterValue = value.toLowerCase();

    return this.names.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  private _filterPlace(value: string): PlaceModel[] {
    const filterValue = value.toLowerCase();

    return this.places.filter(option => option.place.toLowerCase().includes(filterValue));
  }

  private _filterService(value: string): ServiceModel[] {
    const filterValue = value.toLowerCase();

    return this.services.filter(option => option.service.toLowerCase().includes(filterValue));
  }
}
