// Angular core imports
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';

// Angular Material imports
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

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
import { ServerGooglePlacesService, AutocompleteResult } from '@services/server-google-places.service';

// RxJS imports
import { Observable, switchMap, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';

// Utility imports
import { createSearchItem, searchJson, isRateLimitError, isGoogleResult } from './search-input.utils';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FocusScrollDirective, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, ScrollingModule],
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

export class SearchInputComponent implements OnDestroy {
  // #region ViewChild, Inputs, Outputs, Form
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;
  @ViewChild('searchInput') inputElement!: ElementRef;
  @Input() fieldName: string = '';
  @Input() searchType: string = '';
  @Input() googleSearch: string | undefined;
  @Input() isRequired: boolean = false;
  @Output() auxiliaryData: EventEmitter<string> = new EventEmitter<string>();
  @Output() valueChanged: EventEmitter<string> = new EventEmitter<string>();

  searchForm = new FormGroup({
    searchInput: new FormControl('')
  });
  // #endregion

  // #region State & Constants
  filteredItems: Observable<ISearchItem[]> | undefined;
  filteredItemsArray: ISearchItem[] = [];
  showGoogleMapsIcon = false;
  private readonly MIN_GOOGLE_SEARCH_LENGTH = 2;
  private readonly MAX_VISIBLE_ITEMS = 5;
  private readonly ITEM_HEIGHT = 48;
  private readonly BLUR_DELAY = 100;
  private readonly DEBOUNCE_TIME = 300;
  private googlePredictionsCache = new Map<string, ISearchItem[]>();
  private searchSubscription?: Subscription;
  // #endregion

  // #region ControlValueAccessor
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get value(): string {
    return this.searchForm.controls.searchInput.value || '';
  }
  set value(val: string) {
    const currentValue = this.searchForm.controls.searchInput.value || '';
    if (currentValue !== val) {
      this.searchForm.controls.searchInput.setValue(val, { emitEvent: false });
    }
  }
  writeValue(value: string): void {
    this.searchForm.controls.searchInput.setValue(value || '', { emitEvent: false });
  }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void {}
  // #endregion

  // #region Lifecycle
  constructor(
    public dialog: MatDialog,
    private _addressService: AddressService,
    private _nameService: NameService,
    private _placeService: PlaceService,
    private _regionService: RegionService,
    private _serviceService: ServiceService,
    private _typeService: TypeService,
    private _serverGooglePlacesService: ServerGooglePlacesService
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
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  // #endregion

  // #region Event Handlers
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.setInputValue(value);
    this.valueChanged.emit(value);
  }
  onBlur(): void {
    const trimmedValue = this.value.trim();
    if (this.value !== trimmedValue) {
      this.setInputValue(trimmedValue);
    }
    this.onTouched();
    this.valueChanged.emit(trimmedValue);
  }
  public onClear(): void {
    this.setInputValue('');
    this.googlePredictionsCache.clear();
  }
  async onInputSelect(inputValue: string): Promise<void> {
    // Find the selected item to get place ID for Google results
    const selectedItem = this.filteredItemsArray.find(item => 
      item.name === inputValue || item.value === inputValue
    );
    
    let finalAddress = inputValue;
    
    // If this is a Google address result with a place ID, get full address with zip
    if (selectedItem?.placeId && this.searchType === 'Address') {
      try {
        const fullAddress = await this._serverGooglePlacesService.getFullAddressWithZip(selectedItem.placeId);
        if (fullAddress) {
          finalAddress = fullAddress;
        }
      } catch (error) {
        // Error getting full address with zip; fall back to original value
      }
    }
    // Use emitEvent: false to avoid triggering valueChanges and duplicate API calls
    this.setInputValue(finalAddress);
    if (this.inputElement) {
      setTimeout(() => {
        this.inputElement.nativeElement.blur();
      }, this.BLUR_DELAY);
    }
  }
  onFocus(): void {
    const value = this.value;
    this._filterItems(value).then(items => {
      this.filteredItemsArray = items;
    });
  }
  // #endregion

  // #region Public Methods
  getViewportHeight(items?: ISearchItem[]): number {
    const itemsToUse = items || this.filteredItemsArray;
    if (!itemsToUse || itemsToUse.length === 0) {
      return 0;
    }
    return Math.min(itemsToUse.length, this.MAX_VISIBLE_ITEMS) * this.ITEM_HEIGHT;
  }
  public openGoogleMaps(): void {
    const searchQuery = encodeURIComponent(this.value || this.fieldName);
    const baseUrl = 'https://www.google.com/maps/search/';
    window.open(`${baseUrl}${searchQuery}`, '_blank');
  }
  public triggerRateLimitFallback(): void {
    if (this.searchType === 'Address' || this.searchType === 'Place') {
      console.log('Manually triggering rate limit fallback - showing Google Maps icon');
      this.showGoogleMapsIcon = true;
    }
  }
  // #endregion

  // #region Private Helpers
  private updateValidators(): void {
    const control = this.searchForm.controls.searchInput;
    if (this.isRequired) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }
  }

  private setGoogleSearchType(): void {
    if (this.searchType === 'Address') {
      this.googleSearch = 'address';
    } else if (this.searchType === 'Place') {
      this.googleSearch = 'place';
    }
  }

  private setupFilteredItems(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    this.filteredItems = this.searchForm.controls.searchInput.valueChanges.pipe(
      debounceTime(this.DEBOUNCE_TIME),
      distinctUntilChanged(),
      switchMap(async value => {
        const trimmedValue = value?.trim() || '';
        if (trimmedValue && this.showGoogleMapsIcon) {
          this.showGoogleMapsIcon = false;
        }
        // No need to clear address listeners - server-side only now
        return await this._filterItems(trimmedValue);
      })
    );
    this.searchSubscription = this.filteredItems.subscribe(items => {
      this.filteredItemsArray = items;
    });
    this.filteredItemsArray = [];
  }

  private async getAllItemsForType(): Promise<ISearchItem[]> {
    switch (this.searchType) {
      case 'Address':
        return (await this._filterAddress('')).map(item => createSearchItem(item, 'address'));
      case 'Name':
        return (await this._filterName('')).map(item => createSearchItem(item, 'name'));
      case 'Place':
        return (await this._filterPlace('')).map(item => createSearchItem(item, 'place'));
      case 'Region':
        return (await this._filterRegion('')).map(item => createSearchItem(item, 'region'));
      case 'Service':
        return (await this._filterService('')).map(item => createSearchItem(item, 'service'));
      case 'Type':
        return (await this._filterType('')).map(item => createSearchItem(item, 'type'));
      default:
        return [];
    }
  }

  private async _filterItems(value: string): Promise<ISearchItem[]> {
    if (!value || value.length === 0) {
      return await this.getAllItemsForType();
    }
    switch (this.searchType) {
      case 'Address':
        const addressResults = (await this._filterAddress(value)).map(item => createSearchItem(item, 'address'));
        return await this.addGooglePredictionsIfNeeded(value, addressResults);
      case 'Name':
        return (await this._filterName(value)).map(item => createSearchItem(item, 'name'));
      case 'Place':
        let places = (await this._filterPlace(value)).map(item => createSearchItem(item, 'place'));
        places = await this.handleJsonFallback(places, 'places', value);
        return await this.addGooglePredictionsIfNeeded(value, places);
      case 'Region':
        return (await this._filterRegion(value)).map(item => createSearchItem(item, 'region'));
      case 'Service':
        let services = (await this._filterService(value)).map(item => createSearchItem(item, 'service'));
        return await this.handleJsonFallback(services, 'services', value);
      case 'Type':
        let types = (await this._filterType(value)).map(item => createSearchItem(item, 'type'));
        return await this.handleJsonFallback(types, 'types', value);
      default:
        return [];
    }
  }

  // #region Private Filter Methods
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
  // #endregion

  private async addGooglePredictionsIfNeeded(value: string, results: ISearchItem[]): Promise<ISearchItem[]> {
    if (results.length === 0 && value && value.length >= this.MIN_GOOGLE_SEARCH_LENGTH) {
      const googlePredictions = await this.getGooglePredictions(value);
      return googlePredictions;
    }
    return results;
  }

  private async handleJsonFallback(results: ISearchItem[], searchType: string, value: string): Promise<ISearchItem[]> {
    if (results.length === 0) {
      return await searchJson(searchType, value);
    }
    return results;
  }

  private async getGooglePredictions(value: string): Promise<ISearchItem[]> {
    if (!this.isGoogleAllowed() || !this.googleSearch) {
      return [];
    }
    const cacheKey = `${this.googleSearch}:${value.toLowerCase()}`;
    if (this.googlePredictionsCache.has(cacheKey)) {
      return this.googlePredictionsCache.get(cacheKey)!;
    }
    try {
      // Use smart autocomplete that only calls API with location, otherwise uses fallbacks
      const predictions = await this._serverGooglePlacesService.getSmartAutocomplete(
        value,
        this.googleSearch,
        'US'
      );
      this.showGoogleMapsIcon = false;
      const results = predictions.map((prediction: AutocompleteResult) => ({
        id: undefined,
        name: this.googleSearch === 'address' 
          ? prediction.address 
          : prediction.place,
        saved: false,
        value: this.googleSearch === 'address' ? prediction.address : prediction.place,
        trips: 0,
        placeId: prediction.placeDetails?.placeId // Store place ID for later lookup
      }));
      if (this.googlePredictionsCache.size >= 50) {
        const firstKey = this.googlePredictionsCache.keys().next().value;
        if (firstKey) {
          this.googlePredictionsCache.delete(firstKey);
        }
      }
      this.googlePredictionsCache.set(cacheKey, results);
      return results;
    } catch (error: any) {
      // Error getting Google predictions; no fallback, just return empty array
      if (this.isRateLimitError(error) && (this.searchType === 'Address' || this.searchType === 'Place')) {
        this.showGoogleMapsIcon = true;
      }
      return [];
    }
  }

  private isRateLimitError(error: any): boolean {
    return isRateLimitError(error);
  }
  // #endregion

  // #region Utility
  isGoogleResult(item: ISearchItem): boolean {
    return isGoogleResult(item);
  }
  // #endregion

  private isGoogleAllowed(): boolean {
    const hostname = window.location.hostname;
    return hostname.includes('gig-test') || hostname === 'localhost';
  }

  private setInputValue(val: string) {
    this.searchForm.controls.searchInput.setValue(val, { emitEvent: false });
    this.onChange(val);
  }
}
