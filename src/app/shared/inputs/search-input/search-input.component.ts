// Angular core imports
import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

// Angular Material imports
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

// Application-specific imports - Components
import { AddressDialogComponent } from '@components/address-dialog/address-dialog.component';

// Application-specific imports - Directives
import { FocusScrollDirective } from '@directives/focus-scroll/focus-scroll.directive';

// Application-specific imports - Helpers
import { AddressHelper } from '@helpers/address.helper';
import { sort } from '@helpers/sort.helper';
import { StringHelper } from '@helpers/string.helper';

// Application-specific imports - Interfaces
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { IAddress } from '@interfaces/address.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IRegion } from '@interfaces/region.interface';
import { ISearchItem } from '@interfaces/search-item.interface';
import { IService } from '@interfaces/service.interface';
import { IType } from '@interfaces/type.interface';

// Application-specific imports - Pipes
import { PipesModule } from '@pipes/pipes.module';

// Application-specific imports - Services
import { AddressService } from '@services/address.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { TypeService } from '@services/type.service';

// RxJS imports
import { Observable, startWith, switchMap } from 'rxjs';

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
  @Input() isRequired: boolean = false; // Default is not required
  @Output() outEvent = new EventEmitter<string>;
 
  searchForm = new FormGroup({
    searchInput: new FormControl('')
  });

  filteredItems: Observable<ISearchItem[]> | undefined;

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
    if (this.isRequired) {
      this.searchForm.controls.searchInput.setValidators([Validators.required]);
    }

    this.filteredItems = this.searchForm.controls.searchInput.valueChanges.pipe(
      startWith(''),
      switchMap(async value => {
        const trimmedValue = value?.trim() || '';
        return await this._filterItems(trimmedValue);
      })
    );
  }
  
  async ngOnChanges(): Promise<void> {
    if (this.isRequired) {
      this.searchForm.controls.searchInput.setValidators([Validators.required]);
    } else {
      this.searchForm.controls.searchInput.clearValidators();
    }

    this.searchForm.controls.searchInput.updateValueAndValidity(); // Ensure the form control is updated
    this.searchForm.controls.searchInput.setValue(this.formData); // Set the initial value
  }

  private async _filterItems(value: string): Promise<ISearchItem[]> {
    switch (this.searchType) {
      case 'Address':
        return (await this._filterAddress(value)).map(item => ({
          id: item.id,
          name: StringHelper.truncate(AddressHelper.getShortAddress(item.address), 35),
          visits: item.visits
        }));
      case 'Name':
        return (await this._filterName(value)).map(item => ({
          id: item.id,
          name: item.name,
          visits: item.visits
        }));
      case 'Place':
        return (await this._filterPlace(value)).map(item => ({
          id: item.id,
          name: item.place,
          visits: item.visits
        }));
      case 'Region':
        return (await this._filterRegion(value)).map(item => ({
          id: item.id,
          name: item.region,
          visits: item.visits
        }));
      case 'Service':
        return (await this._filterService(value)).map(item => ({
          id: item.id,
          name: item.service,
          visits: item.visits
        }));
      case 'Type':
        return (await this._filterType(value)).map(item => ({
          id: item.id,
          name: item.type,
          visits: item.visits
        }));
      default:
        return [];
    }
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
    value = value.trim();

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
