import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TripHelper } from '@helpers/trip.helper';
import { IAddress } from '@interfaces/address.interface';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { AddressService } from '@services/address.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { TripService } from '@services/trip.service';
import { Observable, startWith, mergeMap } from 'rxjs';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { DateHelper } from 'src/app/shared/helpers/date.helper';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';
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
  // @Input() data!: ITrip;
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  quickForm = new FormGroup({
    bonus: new FormControl(),
    cash: new FormControl(),
    distance: new FormControl(),
    name: new FormControl(''),
    note: new FormControl(''),
    pay: new FormControl(),
    place: new FormControl(''),
    service: new FormControl(''),
    shift: new FormControl(''),
    endAddress: new FormControl(''),
    startAddress: new FormControl(''),
    tip: new FormControl(),
  });

  isNewShift: boolean = true;
  showAdvancedPay: boolean = false;
  showPickupAddress: boolean = false;

  filteredAddresses: Observable<IAddress[]> | undefined;
  selectedAddress: IAddress | undefined;

  filteredNames: Observable<NameModel[]> | undefined;
  selectedName: NameModel | undefined;

  filteredPlaces: Observable<PlaceModel[]> | undefined;
  placeAddresses: string[] | undefined;

  filteredServices: Observable<ServiceModel[]> | undefined;

  sheetTrips: TripModel[] = [];
  shifts: ShiftModel[] = [];
  selectedShift: IShift | undefined;

  title: string = "Add Trip";

  constructor(
    public dialogRef: MatDialogRef<QuickFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ITrip,
    private _snackBar: MatSnackBar,
    private _addressService: AddressService,
    private _nameService: NameService,
    private _placeService: PlaceService,
    private _serviceService: ServiceService,
    private _shfitService: ShiftService,
    private _tripService: TripService
    ) {}

  async ngOnInit(): Promise<void> {
    if (this.data?.id) {
      this.title = `Edit Trip - ${ this.data.id }`;
      // Load form with passed in data.
      await this.loadForm()
    }

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
      mergeMap(async value => await this._filterPlace(value || ''))
    );

    this.filteredServices = this.quickForm.controls.service.valueChanges.pipe(
      startWith(''),
      mergeMap(async value => await this._filterService(value || ''))
    );

    this.load();
  }

  public async load() {
    // ShiftHelper.updateAllShiftTotals();
    this.shifts = [...await this._shfitService.getRemoteShiftsPreviousDays(7), 
                  ...await this._shfitService.getLocalShiftsPreviousDays(7)];

    //Set default shift to last trip or latest shift.
    if (this.shifts.length > 0 && !this.data.id) {
      // Remove duplicates
      this.shifts = ShiftHelper.removeDuplicateShifts(this.shifts);

      // Update all shift totals from displayed shifts.
      await this.calculateShiftTotals(this.shifts);

      this.shifts = ShiftHelper.sortShiftsDesc(this.shifts);
      
      let trips = await this._tripService.queryLocalTrips("date", new Date().toLocaleDateString());
      let latestTrip = TripHelper.sortTripsDesc(trips)[0];
      let shift = this.shifts.find(x => x.key === latestTrip?.key);
      
      if (shift) {
        
        this.selectedShift = shift;
      }

      // Set place if only one in the list.
      let places = await this._placeService.getRemotePlaces();
      if (places.length === 1) {
        this.quickForm.controls.place.setValue(places[0].place);
        await this.showPlaceAddresses(places[0].place);
      }
    }

    this.onShiftSelected(this.quickForm.value.shift ?? "");

    // this.sheetTrips = TripHelper.getPastTrips(1);

    // Set defaults if there is only one place.
    // if (this.f.length === 1) {
    //   this.quickForm.controls.place.setValue(this.places[0].place);
    // }

    // Set default to most used service
    // if (this.services.length === 1) {
    //   this.quickForm.controls.service.setValue(this.services[0].service);
    // }
  }

  private async calculateShiftTotals(shifts: IShift[]): Promise<IShift[]> {
    let calculatedShifts: IShift[] = [];

    shifts.forEach(async shift => {
      shift.trips = 0;
      shift.total = 0;

      let trips = [...(await this._tripService.queryLocalTrips("key", shift.key)).filter(x => x.saved === "false"),
                  ...await this._tripService.queryRemoteTrips("key", shift.key)];
      trips.forEach(trip => {
          shift.trips++;
          shift.total += trip.total;
      });

      calculatedShifts.push(shift);
    });

    return calculatedShifts;
  }

  private async createShift(): Promise<IShift> {
    let shift: ShiftModel = new ShiftModel;
    if (!this.quickForm.value.shift || this.quickForm.value.shift == "new") {
      console.log("New Shift!");
      let shifts: IShift[] = [];

      shifts.push(...await this._shfitService.queryLocalShifts("date", new Date().toLocaleDateString()));
      shifts.push(...await this._shfitService.queryRemoteShifts("date", new Date().toLocaleDateString()));
      
      shift = ShiftHelper.createNewShift(this.quickForm.value.service ?? "", shifts);
      
      
      await this._shfitService.addNewShift(shift);
    }
    else {
      if (this.quickForm.value.shift) {
        shift = <ShiftModel><unknown>this.quickForm.value.shift;
      }
    }

    let timeString = DateHelper.getTimeString(new Date);

    shift.end = timeString;

    return shift;
  }

  private createTrip(shift: IShift): ITrip {
    let trip: TripModel = new TripModel;

    trip.id = this.data.id;
    trip.key = shift.key;
    
    trip.date = shift.date;
    trip.service = shift.service;
    trip.number = shift.number ?? 0;

    trip.startAddress = this.quickForm.value.startAddress ?? "";
    trip.endAddress = this.quickForm.value.endAddress ?? "";
    trip.distance = this.quickForm.value.distance;

    trip.pay = +this.quickForm.value.pay ?? 0;
    trip.tip = this.quickForm.value.tip;
    trip.bonus = this.quickForm.value.bonus;
    trip.cash = this.quickForm.value.cash;
    trip.total = trip.pay + trip.tip + trip.bonus;
    
    trip.name = this.quickForm.value.name ?? "";
    trip.place = this.quickForm.value.place ?? "";
    trip.time = shift.end;

    trip.note = this.quickForm.value.note ?? "";

    return trip;
  }

  public async addTrip() {
    let shift = await this.createShift();

    // TODO: Update shift with time

    // console.log(shift);
    
    let trip = this.createTrip(shift);

    await this._tripService.addTrip(trip);

    this._snackBar.open("Trip stored to device");

    this.load();
    this.formReset();
    this.parentReload.emit();
    this.showAdvancedPay = false;

    // console.log(trip);
  }

  public async editTrip() {
    let shift = await this.createShift();

    let trip = this.createTrip(shift);

    await this._tripService.updateLocalTrip(trip);

    this._snackBar.open("Trip Updated");

    this.dialogRef.close();
  }

  public formReset() {
    this.selectedAddress = undefined;
    this.selectedName = undefined;
    this.placeAddresses = undefined;
    this.quickForm.reset();
  }

  public onShiftSelected(value:string) {
    // TODO: Look into fixing this value check.
    if (value === 'new' || value === '' || value === ' ' || this.shifts.length === 0) {
      this.isNewShift = true;
      this.quickForm.controls.service.setValidators([Validators.required]);
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

  showPlaceAddressesEvent(event: any) {
    let place = event.target.value;
    this.showPlaceAddresses(place);
  }

  async showPlaceAddresses(place: string) {
    if (place) {
      this.placeAddresses = (await this._addressService.filterRemoteAddress(place)).map(address => address.address);

      // Auto assign to start address if only one and if there is no start address already.
      if (this.placeAddresses.length === 1 && !this.quickForm.value.startAddress && !this.data.id) {
        this.quickForm.controls.startAddress.setValue(this.placeAddresses[0]);
      }
    }
  }

  toggleAdvancedPay() {
    this.showAdvancedPay = !this.showAdvancedPay;
  }

  togglePickupAddress() {
    this.showPickupAddress = !this.showPickupAddress;
  }
  
  compareShifts(o1: IShift, o2: IShift): boolean {
    return o1?.date === o2?.date && o1?.service === o2?.service && o1?.number === o2?.number
  }

  public getShortAddress(address: string): string {
    return AddressHelper.getShortAddress(address);
  }

  private async _filterAddress(value: string): Promise<IAddress[]> {
    const filterValue = value.toLowerCase();

    return (await this._addressService.filterRemoteAddress(filterValue)).slice(0,100);
  }

  private async _filterName(value: string): Promise<NameModel[]> {
    const filterValue = value.toLowerCase();

    return (await this._nameService.filterRemoteNames(filterValue)).slice(0,100);
  }

  private async _filterPlace(value: string): Promise<PlaceModel[]> {
    const filterValue = value.toLowerCase();

    return await this._placeService.filterRemotePlaces(filterValue);
  }

  private async _filterService(value: string): Promise<ServiceModel[]> {
    const filterValue = value.toLowerCase();

    return await this._serviceService.filterRemoteServices(filterValue);
  }

  private async loadForm() {
    this.selectedShift = (await this._shfitService.queryShiftsByKey(this.data.date, this.data.service, this.data.number))[0];
    this.quickForm.controls.service.setValue(this.data.service);

    this.quickForm.controls.pay.setValue(this.data.pay);
    this.quickForm.controls.tip.setValue(this.data.tip);
    this.quickForm.controls.bonus.setValue(this.data.bonus);
    this.quickForm.controls.cash.setValue(this.data.cash);
    this.showAdvancedPay = true;

    this.quickForm.controls.place.setValue(this.data.place);
    this.showPlaceAddresses(this.data.place);
    this.showPickupAddress = true;

    this.quickForm.controls.distance.setValue(this.data.distance);
    this.quickForm.controls.name.setValue(this.data.name);
    this.showNameAddresses(this.data.name);

    this.quickForm.controls.startAddress.setValue(this.data.startAddress);
    this.quickForm.controls.endAddress.setValue(this.data.endAddress);
    this.showAddressNames(this.data.endAddress);

    this.quickForm.controls.note.setValue(this.data.note);
  }
}