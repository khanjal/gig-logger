import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { GoogleDriveService } from 'src/app/shared/services/googleSheet.service';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent implements OnInit {

  addressControl = new FormControl('');
  shiftControl = new FormControl('');
  timeControl = new FormControl('');
  serviceControl = new FormControl('');
  placeControl = new FormControl('');
  amountControl = new FormControl('');

  isNewShift: boolean = false;

  addresses: string[] = [];
  filteredAddresses: Observable<string[]> | undefined;
  shifts: string[] = [];

  constructor(private _googleSheetService: GoogleDriveService) { }

  async ngOnInit(): Promise<void> {
    await this._loadAddresses();
    await this._loadShifts();
    
    //console.log(testData);

    this.filteredAddresses = this.addressControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAddress(value || '')),
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

  private _filterAddress(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.addresses.filter(option => option.toLowerCase().includes(filterValue));
  }

  private async _loadAddresses() {
    let addresses: string[] = [];
    let addressData = localStorage.getItem('addresses') ?? '""';
    this.addresses = JSON.parse(addressData);

    if (!this.addresses) {
      await this._googleSheetService.loadAddresses();
      addressData = localStorage.getItem('addresses') ?? "''";
      this.addresses = JSON.parse(addressData);
    }

    console.log(addresses);
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
}
