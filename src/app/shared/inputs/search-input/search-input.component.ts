import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserModule } from '@angular/platform-browser';
import { AddressDialogComponent } from '@components/address-dialog/address-dialog.component';
import { sort } from '@helpers/sort.helper';
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { IAddress } from '@interfaces/address.interface';
import { PipesModule } from '@pipes/pipes.module';
import { AddressService } from '@services/address.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [AsyncPipe, BrowserModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, PipesModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})

export class SearchInputComponent {
  @Input() fieldName: string = "";
  @Input() formData: any;
  @Input() showGoogle: boolean = false;
  @Output() outEvent = new EventEmitter<string>;

  filteredAddresses: any | undefined;
  selectedAddress: IAddress | undefined;
  
  searchForm = new FormGroup({
    searchInput: new FormControl('')
  });

  constructor(
    public dialog: MatDialog,
    private _addressService: AddressService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.filteredAddresses = this.searchForm.controls.searchInput.valueChanges.pipe(
      switchMap(async value => await this._filterAddress(value || ''))
    );
  }

  async ngOnChanges(){
    this.searchForm.controls.searchInput.setValue(this.formData);
  }

  searchAddress() {
    let dialogData: IAddressDialog = {} as IAddressDialog;
    dialogData.title = `Search ${this.fieldName}`;
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
        this.searchForm.controls.searchInput.setValue(result);
        this.outEvent.emit(result);
      }
    });
  }

  returnDataEvent(event: any) {
    let address: string = event.target.value;
    this.outEvent.emit(address);
  }

  private async _filterAddress(value: string): Promise<IAddress[]> {
    let addresses = await this._addressService.getRemoteAddresses();
    addresses = addresses.filter(x => x.address.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    sort(addresses, 'address');
    return (addresses).slice(0,100);
  }
}
