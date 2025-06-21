// Angular core imports
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';

// Angular Material imports
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

// Application-specific imports - Components
import { AddressDialogComponent } from '@components/forms/address-dialog/address-dialog.component';

// Application-specific imports - Directives
import { FocusScrollDirective } from '@directives/focus-scroll/focus-scroll.directive';

// Application-specific imports - Helpers
import { AddressHelper } from '@helpers/address.helper';
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


// Application-specific imports - Services
import { AddressService } from '@services/sheets/address.service';
import { LoggerService } from '@services/logger.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { RegionService } from '@services/sheets/region.service';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { GoogleAddressService } from '@services/google-address.service';

// RxJS imports
import { Observable, startWith, switchMap } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [AsyncPipe, CommonModule, FocusScrollDirective, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, MatMenuModule, ReactiveFormsModule, ScrollingModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true
    }
  ]
})

export class SearchInputComponent {
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;
  @ViewChild('searchInput') inputElement!: ElementRef;
  @Input() fieldName: string = '';
  @Input() searchType: string = '';
  @Input() googleSearch: string | undefined; // Google search type (e.g., 'address', 'place', etc.)
  @Input() isRequired: boolean = false; // Default is not required

  @Output() auxiliaryData: EventEmitter<string> = new EventEmitter<string>();
  @Output() valueChanged: EventEmitter<string> = new EventEmitter<string>();
 
  // Callbacks for ControlValueAccessor
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  searchForm = new FormGroup({
    searchInput: new FormControl('')
  });

  filteredItems: Observable<ISearchItem[]> | undefined;
  showSearch: boolean = false;
  placeSearch: boolean = false;
  constructor(
    public dialog: MatDialog,
    private _addressService: AddressService,
    private _logger: LoggerService,
    private _nameService: NameService,
    private _placeService: PlaceService,
    private _regionService: RegionService,
    private _serviceService: ServiceService,
    private _typeService: TypeService,
    private _googleAddressService: GoogleAddressService
  ) { }

  async ngOnInit(): Promise<void> {
    if (this.isRequired) {
      this.searchForm.controls.searchInput.setValidators([Validators.required]);
    }

    this.filteredItems = this.searchForm.controls.searchInput.valueChanges.pipe(
      startWith(''),
      switchMap(async value => {
        const trimmedValue = value || '';
        return await this._filterItems(trimmedValue);
      })
    );

    if (this.placeSearch) {
      this.showSearch = true;
    }
  }
  
  async ngOnChanges(): Promise<void> {
    if (this.isRequired) {
      this.searchForm.controls.searchInput.setValidators([Validators.required]);
    } else {
      this.searchForm.controls.searchInput.clearValidators();
    }

    this.searchForm.controls.searchInput.updateValueAndValidity(); // Ensure the form control is updated
  }

  // Getter and setter for the value
  get value(): string {
    return this.searchForm.controls.searchInput.value || '';
  }

  set value(val: string) {
    this.searchForm.controls.searchInput.setValue(val); // Update the FormControl value
    this.onChange(val); // Notify Angular forms of the change
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.searchForm.controls.searchInput.setValue(value || ''); // Set the FormControl value
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Handle the disabled state if needed
  }

  // Event handlers
  onBlur(): void {
    this.value = this.value.trim(); // Trim the value
    this.onTouched(); // Notify Angular forms that the input was touched
    this.valueChanged.emit(this.value); // Emit the event to the parent
  }

  public onClear() {
    this.value = '';
  }

  async onInputChange(event: Event): Promise<void> {
    const inputValue = (event.target as HTMLInputElement).value;
    this.value = inputValue; // Update the value
    this._googleAddressService.clearAddressListeners(this.inputElement); // Clear any existing google listeners
    
    if (this.placeSearch) {
      this.showSearch = true;
    }
  }

  async onInputSelect(inputValue: string): Promise<void> {
    this.value = inputValue; // Update the value and trigger onChange

    // Delay the blur to avoid race conditions
    if (this.inputElement) {
      setTimeout(() => {
        this.inputElement.nativeElement.blur();
      }, 100); // Delay by 100ms
    }
  }

  /**
   * Scrolls the closest scrollable parent to the top when the input is focused.
   * Works for modals and main window. Handles virtual keyboard pop-up as well.
   */
  onInputFocus(event: FocusEvent) {
    let el = (event.target as HTMLElement).parentElement;
    // Traverse up to find the closest scrollable parent
    while (el) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      }
      el = el.parentElement;
    }
  }

  onSearch() {
    if (!this.googleSearch) {
      return;
    }

    this.showSearch = false;
    this._googleAddressService.getPlaceAutocomplete(
      this.inputElement, this.googleSearch, (result: { place: string, address: string }) => {
        if (this.googleSearch === 'address') {
          this.value = result.address;
        }
        else {
          this.value = result.place;
          this.auxiliaryData.emit(result.address);
        }
    });

    setTimeout(() => {
        this._googleAddressService.attachToModal();
        this.inputElement.nativeElement.blur();
        this.inputElement.nativeElement.focus();
    }, 100);
  }

  openMap() {
    if (this.value) {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.value)}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      this._logger.warn('No value provided for Google Maps navigation');
    }
  }

  getViewportHeight(items: ISearchItem[] | null): number {
    if (!items || items.length === 0) {
      return 0; // No items, collapse the viewport
    }
  
    const maxVisibleItems = 5; // Maximum number of items to show without scrolling
    const itemHeight = 48; // Height of each item in pixels
  
    return Math.min(items.length, maxVisibleItems) * itemHeight;
  }

  // Filter items based on the search type
  private async _filterItems(value: string): Promise<ISearchItem[]> {
    switch (this.searchType) {
      case 'Address':
        return (await this._filterAddress(value)).map(item => ({
          id: item.id,
          name: StringHelper.truncate(AddressHelper.getShortAddress(item.address, "", 1), 35),
          saved: item.saved,
          value: item.address,
          trips: item.trips
        }));
      case 'Name':
        return (await this._filterName(value)).map(item => ({
          id: item.id,
          name: item.name,
          saved: item.saved,
          value: item.name,
          trips: item.trips
        }));
      case 'Place':
        let places = (await this._filterPlace(value)).map(item => ({
          id: item.id,
          name: item.place,
          saved: item.saved,
          value: item.place,
          trips: item.trips
        }));

        if (places.length === 0) {
          places = await this.searchJson('places', value);
        }

        return places;
      case 'Region':
        return (await this._filterRegion(value)).map(item => ({
          id: item.id,
          name: item.region,
          saved: item.saved,
          value: item.region,
          trips: item.trips
        }));
      case 'Service':
        let services = (await this._filterService(value)).map(item => ({
          id: item.id,
          name: item.service,
          saved: item.saved,
          value: item.service,
          trips: item.trips
        }));

        if (services.length === 0) {
          services = await this.searchJson('services', value);
        }

        return services;
      case 'Type':
        let types = (await this._filterType(value)).map(item => ({
          id: item.id,
          name: item.type,
          saved: item.saved,
          value: item.type,
          trips: item.trips
        }));

        if (types.length === 0) {
          types = await this.searchJson('types', value);
        }

        return types;
      default:
        return [];
    }
  }

  private async searchJson(searchType: string, value: string ) {
    let items = [];
    const itemsJson = await fetch('/assets/json/'+searchType+'.json').then(res => res.json());
    items = itemsJson
      .filter((item: string) => item.toLowerCase().includes(value.toLowerCase()))
      .map((item: string) => ({
        id: item,
        name: item,
        saved: false,
        value: item,
        trips: 0
      }));

      return items;
  }

  // Open the address dialog
  public searchAddress() {
    let dialogData: IAddressDialog = {} as IAddressDialog;
    dialogData.title = `Search ${this.fieldName}`;
    dialogData.address = this.value ?? "";
    dialogData.trueText = "OK";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async dialogResult => {
      let result = dialogResult;

      if(result) {
        this.value = result;
      }
    });
  }
  /**
   * Sets the proper casing for the value based on the search type
   * This ensures consistent data formatting across different search types
   */
  private async setProperValue(value: string): Promise<string> {
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
    }    return value;
  }

  // Check if there are 2 or more available actions to show in the menu
  hasAvailableActions(filteredItemsLength?: number): boolean {
    let buttonCount = 0;
    
    // Count Google Search button (only shows when no filtered items)
    if (this.showSearch && this.value && this.googleSearch && (filteredItemsLength === 0 || filteredItemsLength === undefined)) {
      buttonCount++;
    }
    
    // Count Google Maps button (mutually exclusive with search button)
    if (!this.showSearch && this.value && this.googleSearch) {
      buttonCount++;
    }
    
    // Count Clear button
    if (this.value) {
      buttonCount++;
    }
    
    // Only show menu if there are 2 or more buttons
    return buttonCount >= 2;
  }

  // Filter items based on the search type
  private async _filterAddress(value: string): Promise<IAddress[]> {
    return await this._addressService.includes('address', value);
  }

  private async _filterName(value: string): Promise<IName[]> {
    return await this._nameService.includes('name', value);
  }

  private async _filterPlace(value: string): Promise<IPlace[]> {
    return await this._placeService.includes('place', value);
  }

  private async _filterRegion(value: string): Promise<IRegion[]> {
    const filterValue = value;

    return await this._regionService.filter('region', filterValue);
  }

  private async _filterService(value: string): Promise<IService[]> {
    const filterValue = value;

    return await this._serviceService.filter('service', filterValue);
  }

  private async _filterType(value: string): Promise<IType[]> {
    const filterValue = value;

    return await this._typeService.filter('type', filterValue);
  }

}
