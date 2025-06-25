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

// Application-specific imports - Components
import { AddressDialogComponent } from '@components/forms/address-dialog/address-dialog.component';

// Application-specific imports - Directives
import { FocusScrollDirective } from '@directives/focus-scroll/focus-scroll.directive';

// Application-specific imports - Interfaces
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { IAddress } from '@interfaces/address.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IRegion } from '@interfaces/region.interface';
import { ISearchItem } from '@interfaces/search-item.interface';
import { IService } from '@interfaces/service.interface';
import { IType } from '@interfaces/type.interface';

// Application-specific imports - Services
import { AddressService } from '@services/sheets/address.service';
import { LoggerService } from '@services/logger.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { RegionService } from '@services/sheets/region.service';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { GoogleAutocompleteService, AutocompleteResult } from '@services/google-autocomplete.service';

// RxJS imports
import { Observable, startWith, switchMap } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [AsyncPipe, CommonModule, FocusScrollDirective, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, ScrollingModule],
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
  
  // Constants
  private readonly MIN_GOOGLE_SEARCH_LENGTH = 2;
  private readonly MAX_VISIBLE_ITEMS = 5;
  private readonly ITEM_HEIGHT = 48;
  private readonly BLUR_DELAY = 100;
  
  constructor(
    public dialog: MatDialog,
    private _addressService: AddressService,
    private _logger: LoggerService,
    private _nameService: NameService,
    private _placeService: PlaceService,
    private _regionService: RegionService,
    private _serviceService: ServiceService,
    private _typeService: TypeService,
    private _googleAutocompleteService: GoogleAutocompleteService
  ) { }

  async ngOnInit(): Promise<void> {
    this.updateValidators();
    this.setGoogleSearchType();
    this.setupFilteredItems();
  }
  
  async ngOnChanges(): Promise<void> {
    this.updateValidators();
    this.setGoogleSearchType();
    this.searchForm.controls.searchInput.updateValueAndValidity();
  }

  /**
   * Updates form validators based on isRequired property
   */
  private updateValidators(): void {
    const control = this.searchForm.controls.searchInput;
    if (this.isRequired) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }
  }

  /**
   * Sets Google search type based on searchType for Address and Place
   */
  private setGoogleSearchType(): void {
    if (this.searchType === 'Address') {
      this.googleSearch = 'address';
    } else if (this.searchType === 'Place') {
      this.googleSearch = 'place';
    }
  }

  /**
   * Sets up the filtered items observable
   */
  private setupFilteredItems(): void {
    this.filteredItems = this.searchForm.controls.searchInput.valueChanges.pipe(
      startWith(''),
      switchMap(async value => {
        const trimmedValue = value || '';
        return await this._filterItems(trimmedValue);
      })
    );
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

  public onClear(): void {
    this.value = '';
  }

  async onInputChange(event: Event): Promise<void> {
    const inputValue = (event.target as HTMLInputElement).value;
    this.value = inputValue;
    this._googleAutocompleteService.clearAddressListeners(this.inputElement);
  }

  async onInputSelect(inputValue: string): Promise<void> {
    this.value = inputValue;

    // Delay the blur to avoid race conditions
    if (this.inputElement) {
      setTimeout(() => {
        this.inputElement.nativeElement.blur();
      }, this.BLUR_DELAY);
    }
  }

  getViewportHeight(items: ISearchItem[] | null): number {
    if (!items || items.length === 0) {
      return 0;
    }
    return Math.min(items.length, this.MAX_VISIBLE_ITEMS) * this.ITEM_HEIGHT;
  }

  /**
   * Check if Google functionality is allowed (localhost or gig-test subdomain only)
   */
  private isGoogleAllowed(): boolean {
    const hostname = window.location.hostname;
    return hostname.includes('gig-test') || hostname === 'localhost';
  }

  /**
   * Get Google autocomplete predictions and format them as ISearchItem[]
   * Restricted to localhost and gig-test subdomain only
   */
  private async getGooglePredictions(value: string): Promise<ISearchItem[]> {
    if (!this.isGoogleAllowed() || !this.googleSearch || !this._googleAutocompleteService.isGoogleMapsLoaded()) {
      return [];
    }

    try {
      const predictions = await this._googleAutocompleteService.getAutocompletePredictions(
        value,
        this.googleSearch,
        { componentRestrictions: { country: 'US' } }
      );

      return predictions.map(prediction => ({
        id: undefined,
        name: this.googleSearch === 'address' ? prediction.address : prediction.place,
        saved: false,
        value: this.googleSearch === 'address' ? prediction.address : prediction.place,
        trips: 0
      }));
    } catch (error) {
      console.warn('Error getting Google predictions:', error);
      return [];
    }
  }

  /**
   * Helper method to create ISearchItem from various data types
   */
  private createSearchItem(item: any, nameProperty: string): ISearchItem {
    return {
      id: item.id,
      name: item[nameProperty],
      saved: item.saved,
      value: item[nameProperty],
      trips: item.trips
    };
  }

  /**
   * Helper method to add Google predictions only if no local results exist
   */
  private async addGooglePredictionsIfNeeded(value: string, results: ISearchItem[]): Promise<ISearchItem[]> {
    // Only use Google predictions if no local results and search criteria are met
    if (results.length === 0 && value && value.length >= this.MIN_GOOGLE_SEARCH_LENGTH) {
      const googlePredictions = await this.getGooglePredictions(value);
      return googlePredictions;
    }
    return results;
  }

  /**
   * Helper method to handle JSON fallback search
   */
  private async handleJsonFallback(results: ISearchItem[], searchType: string, value: string): Promise<ISearchItem[]> {
    if (results.length === 0) {
      return await this.searchJson(searchType, value);
    }
    return results;
  }

  // Filter items based on the search type
  private async _filterItems(value: string): Promise<ISearchItem[]> {
    switch (this.searchType) {
      case 'Address':
        const addressResults = (await this._filterAddress(value)).map(item => this.createSearchItem(item, 'address'));
        return await this.addGooglePredictionsIfNeeded(value, addressResults);

      case 'Name':
        return (await this._filterName(value)).map(item => this.createSearchItem(item, 'name'));

      case 'Place':
        let places = (await this._filterPlace(value)).map(item => this.createSearchItem(item, 'place'));
        // Try JSON fallback first if no local results
        places = await this.handleJsonFallback(places, 'places', value);
        // Only use Google if still no results after JSON fallback
        return await this.addGooglePredictionsIfNeeded(value, places);

      case 'Region':
        return (await this._filterRegion(value)).map(item => this.createSearchItem(item, 'region'));

      case 'Service':
        let services = (await this._filterService(value)).map(item => this.createSearchItem(item, 'service'));
        return await this.handleJsonFallback(services, 'services', value);

      case 'Type':
        let types = (await this._filterType(value)).map(item => this.createSearchItem(item, 'type'));
        return await this.handleJsonFallback(types, 'types', value);

      default:
        return [];
    }
  }

  private async searchJson(searchType: string, value: string): Promise<ISearchItem[]> {
    try {
      const itemsJson = await fetch(`/assets/json/${searchType}.json`).then(res => res.json());
      return itemsJson
        .filter((item: string) => item.toLowerCase().includes(value.toLowerCase()))
        .map((item: string) => ({
          id: item,
          name: item,
          saved: false,
          value: item,
          trips: 0
        }));
    } catch (error) {
      console.warn(`Error loading ${searchType}.json:`, error);
      return [];
    }
  }

  // Open the address dialog
  public searchAddress(): void {
    const dialogData: IAddressDialog = {
      title: `Search ${this.fieldName}`,
      address: this.value ?? "",
      trueText: "OK",
      falseText: "Cancel",
      trueColor: "primary",
      falseColor: "warn"
    };

    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.value = result;
      }
    });
  }

  // Filter methods for different data types
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
    return await this._regionService.filter('region', value);
  }

  private async _filterService(value: string): Promise<IService[]> {
    return await this._serviceService.filter('service', value);
  }

  private async _filterType(value: string): Promise<IType[]> {
    return await this._typeService.filter('type', value);
  }

  /**
   * Check if an item is from Google results
   */
  isGoogleResult(item: ISearchItem): boolean {
    // Google results have no ID (undefined) and trips = 0 and saved = false
    return item.id === undefined && item.trips === 0 && !item.saved;
  }

}
