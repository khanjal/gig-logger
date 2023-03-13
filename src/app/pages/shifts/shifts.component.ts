import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { GoogleDriveService } from 'src/app/shared/services/googleSheet.service';
import {map, startWith} from 'rxjs/operators';
import { NameModel } from 'src/app/models/name.model';
import { AddressModel } from 'src/app/models/address.model';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent implements OnInit {

  addressControl = new FormControl('');
  nameControl = new FormControl('');
  shiftControl = new FormControl('');
  timeControl = new FormControl('');
  serviceControl = new FormControl('');
  placeControl = new FormControl('');
  amountControl = new FormControl('');

  isNewShift: boolean = false;

  addresses: AddressModel[] = [];
  filteredAddresses: Observable<AddressModel[]> | undefined;
  selectedAddress: AddressModel | undefined;

  names: NameModel[] = [];
  filteredNames: Observable<NameModel[]> | undefined;
  selectedName: NameModel | undefined;

  shifts: string[] = [];

  constructor(private _googleSheetService: GoogleDriveService) { }

  async ngOnInit(): Promise<void> {
    await this._loadAddresses();
    await this._loadNames();
    await this._loadShifts();
    
    //console.log(testData);

    this.filteredAddresses = this.addressControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAddress(value || '')),
    );

    this.filteredNames = this.nameControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterName(value || '')),
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

  private async _loadAddresses() {
    let addresses: AddressModel[] = [];
    let addressData = localStorage.getItem('addresses') ?? '""';
    this.addresses = JSON.parse(addressData);

    if (!this.addresses) {
      await this._googleSheetService.loadAddresses();
      addressData = localStorage.getItem('addresses') ?? "''";
      this.addresses = JSON.parse(addressData);
    }

    // console.log(addresses);
  }

  private async _loadNames() {
    let names: NameModel[] = [];
    let nameData = localStorage.getItem('names') ?? '""';
    this.names = JSON.parse(nameData);

    if (!this.names) {
      await this._googleSheetService.loadNames();
      nameData = localStorage.getItem('names') ?? "''";
      this.names = JSON.parse(nameData);
    }

    // console.log(names);
  }

  private async _loadShifts() {
    let shifts: string[] = [];
    let shiftData = localStorage.getItem('shifts') ?? '""';
    this.shifts = JSON.parse(shiftData);

    if (!this.shifts) {
      await this._googleSheetService.loadShifts();
      shiftData = localStorage.getItem('shifts') ?? "''";
      this.shifts = JSON.parse(shiftData);
    }

    console.log(shifts);
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
}
