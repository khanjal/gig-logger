import { Component, Input } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { IAddress } from '@interfaces/address.interface';
import { Observable, mergeMap, switchMap } from 'rxjs';
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { sort } from '@helpers/sort.helper';
import { AddressService } from '@services/address.service';
import { AsyncPipe } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-address-input',
  standalone: true,
  imports: [AsyncPipe, BrowserModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule],
  templateUrl: './address-input.component.html',
  styleUrl: './address-input.component.scss',
})
export class AddressInputComponent {
  @Input() addressName : string = ""

  filteredAddresses: any | undefined;
  selectedAddress: IAddress | undefined;
  addressForm = new FormGroup({
    addressInput: new FormControl('')
  });
  

  constructor(
    private _addressService: AddressService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.filteredAddresses = this.addressForm.controls.addressInput.valueChanges.pipe(
      switchMap(async value => await this._filterAddress(value || ''))
    );
  }

  searchAddress() {

    let dialogData: IAddressDialog = {} as IAddressDialog;
    dialogData.title = "Search ${{this.addressName}} Address";
    dialogData.address = "";
    dialogData.trueText = "OK";
    dialogData.falseText = "Cancel";

    // const dialogRef = this.dialog.open(AddressDialogComponent, {
    //   width: "350px",
    //   data: dialogData
    // });

    // dialogRef.afterClosed().subscribe(async dialogResult => {
    //   let result = dialogResult;

    //   if(result) {
    //     this.quickForm.controls.startAddress.setValue(result);
    //   }
    // });
  }

  private async _filterAddress(value: string): Promise<IAddress[]> {
    console.log(value);
    let addresses = await this._addressService.getRemoteAddresses();
    addresses = addresses.filter(x => x.address.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    sort(addresses, 'address');
    return (addresses).slice(0,100);
  }
}
