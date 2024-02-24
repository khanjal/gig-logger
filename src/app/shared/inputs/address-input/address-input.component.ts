import { Component, EventEmitter, Input, Output } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { IAddress } from '@interfaces/address.interface';
import { switchMap } from 'rxjs';
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { sort } from '@helpers/sort.helper';
import { AddressService } from '@services/address.service';
import { AsyncPipe } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AddressDialogComponent } from '@components/address-dialog/address-dialog.component';
import { PipesModule } from '@pipes/pipes.module';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-address-input',
  standalone: true,
  imports: [AsyncPipe, BrowserModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, PipesModule],
  templateUrl: './address-input.component.html',
  styleUrl: './address-input.component.scss',
})
export class AddressInputComponent {
  @Input() addressName: string = "Main";
  @Input() formAddress: any;
  @Output() addressEvent = new EventEmitter<string>;

  filteredAddresses: any | undefined;
  selectedAddress: IAddress | undefined;
  addressForm = new FormGroup({
    addressInput: new FormControl('')
  });
  
  constructor(
    public dialog: MatDialog,
    private _addressService: AddressService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.filteredAddresses = this.addressForm.controls.addressInput.valueChanges.pipe(
      switchMap(async value => await this._filterAddress(value || ''))
    );
  }

  async ngOnChanges(){
    this.addressForm.controls.addressInput.setValue(this.formAddress);
  }

  searchAddress() {
    let dialogData: IAddressDialog = {} as IAddressDialog;
    dialogData.title = `Search ${this.addressName} Address`;
    dialogData.address = "";
    dialogData.trueText = "OK";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async dialogResult => {
      let result = dialogResult;

      if(result) {
        this.addressForm.controls.addressInput.setValue(result);
        this.addressEvent.emit(result);
      }
    });
  }

  returnAddressEvent(event: any) {
    let address: string = event.target.value;
    this.addressEvent.emit(address);
  }

  private async _filterAddress(value: string): Promise<IAddress[]> {
    let addresses = await this._addressService.getRemoteAddresses();
    addresses = addresses.filter(x => x.address.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    sort(addresses, 'address');
    return (addresses).slice(0,100);
  }
}
