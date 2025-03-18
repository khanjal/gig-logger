import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, input, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserModule } from '@angular/platform-browser';
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
import { PipesModule } from '@pipes/pipes.module';
import { AddressService } from '@services/address.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { TypeService } from '@services/type.service';
import { mergeMap, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [AsyncPipe, BrowserModule, FocusScrollDirective, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, PipesModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})

export class SearchInputComponent {
  @ViewChild('searchInput') inputElement!: ElementRef;
  @Input() fieldName: string = "";
  @Input() formData: any; // Allows string, null, or undefined
  @Input() showGoogle: boolean = false;
  @Input() searchType: string | undefined;
  @Output() outEvent = new EventEmitter<string>;
 
  searchForm = new FormGroup({
    searchInput: new FormControl('')
  });
  filteredAddresses: any | undefined;
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

  public clearDataEvent() {
    this.searchForm.controls.searchInput.setValue("");
    this.triggerFocus();
    this.emitEvent("");
    
  }
  
  public async onBlurEvent(event: FocusEvent): Promise<void> {
    let inputValue = (event.target as HTMLInputElement).value;
    inputValue = await this.SetProperValue(inputValue);    

    this.emitEvent(inputValue);
  }

  public triggerBlur(): void {
    setTimeout(() => {
      this.inputElement.nativeElement.blur();
    }, 0);
  }

  private triggerFocus(): void {
    setTimeout(() => {
      this.inputElement.nativeElement.focus(); // Set focus back to the input
    }, 0);
  }

  private emitEvent(data: string) {
    // console.log("Emitting: ", data);
    this.searchForm.controls.searchInput.setValue(data);
    this.outEvent.emit(data);
  }

  public searchAddress() {
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
        this.emitEvent(result);
      }
    });
  }

  private async SetProperValue(value: string): Promise<string> {
    let properValue = "";

    switch (this.searchType) {
      case "Address":
        properValue = (await this._filterAddress(value))[0]?.address ?? "";
        break;
      case "Name":
        properValue =  (await this._filterName(value))[0]?.name ?? "";
        break;
      case "Place":
        properValue = (await this._filterPlace(value))[0]?.place ?? "";
        break;
      case "Place":
        properValue = (await this._filterPlace(value))[0]?.place ?? "";
        break;
      case "Region":
        properValue = (await this._filterRegion(value))[0]?.region ?? "";
        break;
      case "Service":
        properValue = (await this._filterService(value))[0]?.service ?? "";
        break;
      case "Type":
        properValue = (await this._filterType(value))[0]?.type ?? "";
        break;
      default:
        return value;
    }

    if (properValue.toLocaleLowerCase() === value.toLocaleLowerCase()) {
      return properValue;
    }

    return value;
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
