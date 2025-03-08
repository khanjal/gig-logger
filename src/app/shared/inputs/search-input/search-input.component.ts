import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AddressDialogComponent } from '@components/address-dialog/address-dialog.component';
import { FocusScrollDirective } from '@directives/focus-scroll/focus-scroll.directive';
import { sort } from '@helpers/sort.helper';
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { IAddress } from '@interfaces/address.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IRegion } from '@interfaces/region.interface';
import { IService } from '@interfaces/service.interface';
import { IType } from '@interfaces/type.interface';

import { AddressService } from '@services/address.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { TypeService } from '@services/type.service';
import { mergeMap, startWith, switchMap } from 'rxjs';
import { ShortAddressPipe } from '../../pipes/short-address.pipe';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [AsyncPipe, CommonModule, FocusScrollDirective, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, ShortAddressPipe, TruncatePipe],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})

export class SearchInputComponent {
  @Input() fieldName: string = "";
  @Input() formData: any;
  @Input() showGoogle: boolean = false;
  @Input() searchType: string | undefined;
  @Output() outEvent = new EventEmitter<string>;

  filteredAddresses: any | undefined;
  
  searchForm = new FormGroup({
    searchInput: new FormControl('')
  });
  filteredNames: any;
  filteredPlaces: any;
  filteredRegions: any;
  filteredServices: any;
  filteredTypes: any;

  constructor(
    public dialog: MatDialog,
    private _addressService: AddressService,
    private _nameService: NameService,
    private _placeService: PlaceService,
    private _regionService: RegionService,
    private _serviceService: ServiceService,
    private _typeService: TypeService
  ) {}

  async ngOnInit(): Promise<void> {

    switch (this.searchType) {
      case "Address":
          this.filteredAddresses = this.searchForm.controls.searchInput.valueChanges.pipe(
            switchMap(async value => await this._filterAddress(value || ''))
          );
        break;
      case "Name": 
        this.filteredNames = this.searchForm.controls.searchInput.valueChanges.pipe(
          startWith(''),
          mergeMap(async value => await this._filterName(value || ''))
        );
        break;
      case "Place":
        this.filteredPlaces = this.searchForm.controls.searchInput.valueChanges.pipe(
          startWith(''),
          mergeMap(async value => await this._filterPlace(value || ''))
        );
        break;
      case "Region":
        this.filteredRegions = this.searchForm.controls.searchInput.valueChanges.pipe(
          startWith(''),
          mergeMap(async value => await this._filterRegion(value || ''))
        );
        break;
      case "Service":
        this.filteredServices = this.searchForm.controls.searchInput.valueChanges.pipe(
          startWith(''),
          mergeMap(async value => await this._filterService(value || ''))
        );
        break;
      case "Type":
        this.filteredTypes = this.searchForm.controls.searchInput.valueChanges.pipe(
          startWith(''),
          mergeMap(async value => await this._filterType(value || ''))
        );
        break;
      default:
        break;
    }
  }

  async ngOnChanges(){
    this.searchForm.controls.searchInput.setValue(this.formData);
  }

  blurDataEvent(event: any) {
    let data: string = event.target.value;
    this.outEvent.emit(data);
  }

  clearDataEvent() {
    this.searchForm.controls.searchInput.setValue('')
    this.outEvent.emit();
  }
  
  clickDataEvent(event: any) {
    let data: string = event.value;
    this.outEvent.emit(data);
  }

  searchAddress() {
    let dialogData: IAddressDialog = {} as IAddressDialog;
    dialogData.title = `Search ${this.fieldName}`;
    dialogData.address = this.searchForm.value.searchInput ?? "";
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

  private async _filterAddress(value: string): Promise<IAddress[]> {
    let addresses = await this._addressService.getAddresses();
    addresses = addresses.filter(x => x.address.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    sort(addresses, 'address');
    return (addresses).slice(0,100);
  }

  private async _filterName(value: string): Promise<IName[]> {
    let names = await this._nameService.getNames();
    names = names.filter(x => x.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    sort(names, 'name');

    return (names).slice(0,100);
  }

  private async _filterPlace(value: string): Promise<IPlace[]> {
    let places = await this._placeService.getPlaces();
    places = places.filter(x => x.place.toLocaleLowerCase().includes(value.toLocaleLowerCase()));

    return places;
  }

  private async _filterRegion(value: string): Promise<IRegion[]> {
    const filterValue = value;

    return await this._regionService.filter(filterValue);
  }

  private async _filterService(value: string): Promise<IService[]> {
    const filterValue = value;

    return await this._serviceService.filterServices(filterValue);
  }

  private async _filterType(value: string): Promise<IType[]> {
    const filterValue = value;

    return await this._typeService.filter(filterValue);
  }
}
