import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IAddress } from '@interfaces/address.interface';
import { AddressService } from '@services/address.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { TripService } from '@services/trip.service';
import { Observable, startWith, map, mergeMap } from 'rxjs';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { DateHelper } from 'src/app/shared/helpers/date.helper';
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
    endAddress: new FormControl(''),
    bonus: new FormControl(),
    cash: new FormControl(),
    distance: new FormControl(),
    name: new FormControl(''),
    note: new FormControl(''),
    pay: new FormControl(),
    place: new FormControl(''),
    service: new FormControl(''),
    shift: new FormControl(''),
    tip: new FormControl(),
  });

  isNewShift: boolean = false;
  showAdvancedPay: boolean = false;

  filteredAddresses: Observable<IAddress[]> | undefined;
  selectedAddress: IAddress | undefined;

  filteredNames: Observable<NameModel[]> | undefined;
  selectedName: NameModel | undefined;

  places: PlaceModel[] = [];
  filteredPlaces: Observable<PlaceModel[]> | undefined;

  services: ServiceModel[] = [];
  filteredServices: Observable<ServiceModel[]> | undefined;

  sheetTrips: TripModel[] = [];
  shifts: ShiftModel[] = [];

  constructor(
    private _snackBar: MatSnackBar,
    private _addressService: AddressService,
    private _nameService: NameService,
    private _placeService: PlaceService,
    private _serviceService: ServiceService,
    private _shfitService: ShiftService,
    private _tripService: TripService
    ) {}

  async ngOnInit(): Promise<void> {
    
    this.filteredAddresses = this.quickForm.controls.endAddress.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterAddress(value || ''))
    );

    this.filteredNames = this.quickForm.controls.name.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterName(value || ''))
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

  public async load() {
    ShiftHelper.updateAllShiftTotals();

    this.places = await this._placeService.getRemotePlaces();
    this.services = await this._serviceService.getRemoteServices();
    this.shifts = ShiftHelper.sortShiftsDesc(ShiftHelper.getPastShifts(1));
    this.sheetTrips = TripHelper.getPastTrips(1);

    // Set defaults if there is only one place.
    if (this.places.length === 1) {
      this.quickForm.controls.place.setValue(this.places[0].place);
    }

    // Set defaults if there is only one service.
    if (this.services.length === 1) {
      this.quickForm.controls.service.setValue(this.services[0].service);
    }
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
    trip.endAddress = this.quickForm.value.endAddress ?? "";
    trip.pay = +this.quickForm.value.pay ?? 0;
    trip.tip = +this.quickForm.value.tip ?? 0;
    trip.bonus = +this.quickForm.value.bonus ?? 0;
    trip.cash = +this.quickForm.value.cash ?? 0;
    trip.total = trip.pay + trip.tip + trip.bonus;
    trip.date = shift.date;
    trip.distance = this.quickForm.value.distance ?? 0;
    trip.name = this.quickForm.value.name ?? "";
    trip.note = this.quickForm.value.note ?? "";
    trip.place = this.quickForm.value.place ?? "";
    trip.service = shift.service;
    trip.shiftNumber = shift.shiftNumber ?? 0;
    trip.time = shift.end = timeString;

    TripHelper.addTrip(trip);

    this._snackBar.open("Trip Stored");

    this.load();
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
    this.quickForm.controls.endAddress.setValue(address);
    this.showAddressNames(address);
  }

  showAddressNamesEvent(event: any) {
    let address = event.target.value.toLowerCase();
    this.showAddressNames(address);
  }

  async showAddressNames(address: string) {
    this.selectedAddress = await this._addressService.getRemoteAddress(address);
  }

  showNameAddressesEvent(event: any) {
    let name = event.target.value.toLowerCase();
    this.showNameAddresses(name);
  }

  async showNameAddresses(name: string) {
    this.selectedName = await this._nameService.findRemoteName(name);
  }

  toggleAdvancedPay() {
    this.showAdvancedPay = !this.showAdvancedPay;
  }

  public getShortAddress(address: string): string {
    return AddressHelper.getShortAddress(address);
  }

  private async _filterAddress(value: string): Promise<IAddress[]> {
    const filterValue = value.toLowerCase();

    return (await this._addressService.filterRemoteAddress(filterValue)).slice(0,25);
  }

  private async _filterName(value: string): Promise<NameModel[]> {
    const filterValue = value.toLowerCase();

    return (await this._nameService.filterRemoteNames(filterValue)).slice(0,25);
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
