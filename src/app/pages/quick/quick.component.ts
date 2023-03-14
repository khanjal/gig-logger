import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { AddressModel } from 'src/app/models/address.model';
import { NameModel } from 'src/app/models/name.model';
import { PlaceModel } from 'src/app/models/place.model';
import { ServiceModel } from 'src/app/models/service.model';
import { ShiftModel } from 'src/app/models/shift.model';
import { AddressService } from 'src/app/shared/services/address.service';
import { NameService } from 'src/app/shared/services/name.service';
import { PlaceService } from 'src/app/shared/services/place.service';
import { ServiceService } from 'src/app/shared/services/service.service';
import { ShiftService } from 'src/app/shared/services/shift.service';

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
  shifts: ShiftModel[] = [];

  constructor(
      private _addressService: AddressService, 
      private _nameService: NameService,
      private _placeService: PlaceService,
      private _serviceService: ServiceService,
      private _shiftService: ShiftService
    ) { }

  async ngOnInit(): Promise<void> {
    this.addresses = await this._addressService.getAddresses();
    this.names = await this._nameService.getNames();
    this.places = await this._placeService.getPlaces();
    this.services = await this._serviceService.getServices();
    this.shifts = await this._shiftService.getShifts();
    
    //console.log(testData);

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
  }

  public onShiftSelected(value:string) {
    if (value == 'new') {
      this.isNewShift = true;
    }
    else {
      this.isNewShift = false;
    }
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

  showNameAddresses(event: any) {
    let name = event.target.value.toLowerCase();
    // console.log(this._filterName(name));

    if (name) {
      this.selectedName = this.names.find(option => option.name.toLowerCase().includes(name));
    }
    else
    {
      this.selectedName = new NameModel;
    }
  }

  addTrip() {
    console.warn(this.quickForm.value);
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
    this.shifts = await this._shiftService.getShifts();
  }
}
