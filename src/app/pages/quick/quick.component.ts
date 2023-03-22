import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';
import { AddressModel } from 'src/app/shared/models/address.model';
import { NameModel } from 'src/app/shared/models/name.model';
import { PlaceModel } from 'src/app/shared/models/place.model';
import { ServiceModel } from 'src/app/shared/models/service.model';
import { ShiftModel } from 'src/app/shared/models/shift.model';
import { TripModel } from 'src/app/shared/models/trip.model';
import { DateHelper } from 'src/app/shared/helpers/date.helper';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { GoogleDriveService } from 'src/app/shared/services/googleSheet.service';
import { NameHelper } from 'src/app/shared/helpers/name.helper';
import { PlaceHelper } from 'src/app/shared/helpers/place.helper';
import { ServiceHelper } from 'src/app/shared/helpers/service.helper';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';
import { TripHelper } from 'src/app/shared/helpers/trip.helper';

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit {

  quickForm = new FormGroup({
    address: new FormControl(''),
    amount: new FormControl(),
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
  savedTrips: TripModel[] = [];
  unsavedTrips: TripModel[] = [];

  constructor(
      private _router: Router, 
      private _googleService: GoogleDriveService
    ) { }

  async ngOnInit(): Promise<void> {
    await this.load();

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

      shift = ShiftHelper.createNewShift(this.quickForm.value.service ?? "");
      ShiftHelper.addShift(shift);
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
    trip.pay = +this.quickForm.value.amount ?? 0;
    trip.date = shift.date;
    trip.name = this.quickForm.value.name ?? "";
    trip.place = this.quickForm.value.place ?? "";
    trip.service = shift.service;
    trip.shiftNumber = shift.shiftNumber ?? 0;
    trip.time = DateHelper.getTimeString(new Date);

    TripHelper.addTrip(trip);

    console.log(trip);

    this.unsavedTrips = TripHelper.getLocalTrips();

    // this._router.navigate(['/quick']);
    window.location.reload();
  }

  async save() {
    console.log('Saving...');
    console.log('Saved!');
  }

  async load() {
    this.addresses = AddressHelper.getRemoteAddresses();
    this.names = NameHelper.getRemoteNames();
    this.places = PlaceHelper.getRemotePlaces();
    this.services = ServiceHelper.getRemoteServices();
    this.shifts = ShiftHelper.getPastShifts(2);
    this.savedTrips = TripHelper.getPastTrips(2);
    this.unsavedTrips = TripHelper.getLocalTrips();
  }

  async reload() {
    await this._googleService.loadRemoteData();

    await this.load();

    // window.location.reload();
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
