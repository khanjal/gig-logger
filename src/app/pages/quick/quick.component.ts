import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';
import { AddressModel } from 'src/app/models/address.model';
import { NameModel } from 'src/app/models/name.model';
import { PlaceModel } from 'src/app/models/place.model';
import { ServiceModel } from 'src/app/models/service.model';
import { ShiftModel } from 'src/app/models/shift.model';
import { TripModel } from 'src/app/models/trip.model';
import { DateHelper } from 'src/app/shared/helpers/date.helper';
import { AddressService } from 'src/app/shared/services/address.service';
import { NameService } from 'src/app/shared/services/name.service';
import { PlaceService } from 'src/app/shared/services/place.service';
import { ServiceService } from 'src/app/shared/services/service.service';
import { ShiftService } from 'src/app/shared/services/shift.service';
import { TripService } from 'src/app/shared/services/trip.service';

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit {

  quickForm = new FormGroup({
    address: new FormControl(''),
    amount: new FormControl(''),
    name: new FormControl(''),
    place: new FormControl(''),
    service: new FormControl(''),
    shift: new FormControl('')
  });

  isNewShift: boolean = false;

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

  shifts: ShiftModel[] = [];
  trips: TripModel[] = [];
  yesterdayTrips: TripModel[] = [];

  displayedColumns: string[] = [];

  constructor(
      private _router: Router, 
      private _addressService: AddressService, 
      private _nameService: NameService,
      private _placeService: PlaceService,
      private _serviceService: ServiceService,
      private _shiftService: ShiftService,
      private _tripService: TripService
    ) { }

  async ngOnInit(): Promise<void> {
    this.addresses = await this._addressService.getAddresses();
    this.names = await this._nameService.getNames();
    this.places = await this._placeService.getPlaces();
    this.services = await this._serviceService.getServices();
    this.shifts = await this._shiftService.getTodaysShifts();
    this.trips = await this._tripService.getPastTrips(1);
    // this.trips = await this._tripService.getTrips();

    this.displayedColumns = ['saved', 'date', 'service', 'place', 'time', 'amount', 'name', 'address'];

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
  }

  public onShiftSelected(value:string) {
    if (value == 'new') {
      this.isNewShift = true;
    }
    else {
      this.isNewShift = false;
      // Mark form untouched so that service isn't in error anymore
    }
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

  async addTrip() {
    // console.log(this.quickForm.value);

    let shift: ShiftModel = new ShiftModel;
    if (this.quickForm.value.shift == "new") {
      console.log("New Shift!");

      let datestring = DateHelper.getDateString();
      
      shift.date = datestring;
      shift.service = this.quickForm.value.service ?? "";

      // Count number of shifts with same date and service type. Only add number if > 0.
      let shiftNumber = await this._shiftService.getNextShiftNumber(this.quickForm.value.service ?? "");

      if (shiftNumber > 0) {
        shift.shiftNumber = (shiftNumber+1).toString();
      }

      await this._shiftService.addShift(shift);
    }
    else {
      // console.log(this.quickForm.value.shift);
      if (this.quickForm.value.shift) {
        shift = <ShiftModel><unknown>this.quickForm.value.shift;
      }
    }

    console.log(shift);
    
    let trip: TripModel = new TripModel;

    trip.address = this.quickForm.value.address ?? "";
    trip.amount = this.quickForm.value.amount ?? "";
    trip.date = shift.date;
    trip.name = this.quickForm.value.name ?? "";
    trip.place = this.quickForm.value.place ?? "";
    trip.service = shift.service;
    trip.shiftNumber = shift.shiftNumber;
    trip.time = DateHelper.getTimeString(new Date);

    await this._tripService.addTrip(trip);

    console.log(trip);

    this.trips = await this._tripService.getPastTrips();

    // this._router.navigate(['/quick']);
    window.location.reload();
  }

  async save() {
    console.log('Saving...');
    console.log('Saved!');
  }

  async reload() {
    await this._addressService.loadAddresses()
    this.addresses = await this._addressService.getAddresses();

    await this._nameService.loadNames()
    this.names = await this._nameService.getNames();

    await this._placeService.loadPlaces();
    this.places = await this._placeService.getPlaces();

    await this._serviceService.loadServices();
    this.services = await this._serviceService.getServices();

    await this._shiftService.loadShifts();
    this.shifts = await this._shiftService.getTodaysShifts();

    await this._tripService.loadTrips();
    this.trips = await this._tripService.getPastTrips();

    window.location.reload();
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
