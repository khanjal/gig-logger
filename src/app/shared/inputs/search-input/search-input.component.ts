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
import { MatMenuModule } from '@angular/material/menu';

// Application-specific imports - Directives
import { FocusScrollDirective } from '@directives/focus-scroll/focus-scroll.directive';

// Application-specific imports - Interfaces
import { IAddress } from '@interfaces/address.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IRegion } from '@interfaces/region.interface';
import { ISearchItem } from '@interfaces/search-item.interface';
import { IService } from '@interfaces/service.interface';
import { IType } from '@interfaces/type.interface';

// Application-specific imports - Services
import { AddressService } from '@services/sheets/address.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { RegionService } from '@services/sheets/region.service';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { ServerGooglePlacesService, AutocompleteResult } from '@services/server-google-places.service';

// Application-specific imports - Pipes
import { ShortAddressPipe } from '@pipes/short-address.pipe';

// RxJS imports
import { Observable, switchMap, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';

// Utility imports
import { createSearchItem, searchJson, isRateLimitError, isGoogleResult, isValidSearchType } from './search-input.utils';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FocusScrollDirective, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatAutocompleteModule, ReactiveFormsModule, ScrollingModule, MatMenuModule, ShortAddressPipe],
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
  hasSelection = false;
  private readonly MIN_GOOGLE_SEARCH_LENGTH = 2;
  private readonly ITEM_HEIGHT = 48;
  private readonly BLUR_DELAY = 100;
  private readonly DEBOUNCE_TIME = 300;
  private readonly CACHE_SIZE_LIMIT = 50;
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
    this.validateSearchType();
    this.updateValidators();
    this.setGoogleSearchType();
    this.setupFilteredItems();
  }

  private validateSearchType(): void {
    if (!isValidSearchType(this.searchType)) {
      console.warn(`Invalid search type: ${this.searchType}`);
    }
  }
  async ngOnChanges(): Promise<void> {
    this.updateValidators();
    this.setGoogleSearchType();
    this.searchForm.controls.searchInput.updateValueAndValidity();
  }
  ngOnDestroy(): void {
    this.cleanupSubscriptions();
    this.cleanupCache();
  }

  private cleanupSubscriptions(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private cleanupCache(): void {
    this.googlePredictionsCache.clear();
  }
  // #endregion

  // #region Event Handlers
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target) {
      console.warn('Invalid input target in onInputChange');
      return;
    }
    
    const value = target.value;
    this.setInputValue(value);
    this.valueChanged.emit(value);
    
    // Reset selection state when input changes
    this.hasSelection = false;
    
    // Hide icon if input is cleared
    if (!value) {
      this.showGoogleMapsIcon = false;
    }
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
    this.resetComponentState();
  }

  private resetComponentState(): void {
    this.googlePredictionsCache.clear();
    this.showGoogleMapsIcon = false;
    this.hasSelection = false;
    this.filteredItemsArray = [];
  }
  
  async onInputSelect(selectedItem: ISearchItem): Promise<void> {
    let finalAddress = selectedItem.name;

    // Get full address for Google results with place ID
    if (selectedItem?.placeId && this.searchType === 'Address') {
      try {
        const fullAddress = await this._serverGooglePlacesService.getFullAddressWithZip(selectedItem.placeId);
        if (fullAddress) {
          finalAddress = fullAddress;
        }
      } catch (error) {
        console.warn('Error getting full address with zip:', error);
        // Continue with original value
      }
    }

    // Emit auxiliary data for place searches
    if (this.searchType === 'Place' && selectedItem?.address) {
      this.auxiliaryData.emit(selectedItem.address);
    }

    this.setInputValue(finalAddress);
    this.hasSelection = true;

    // Blur input after selection
    this.blurInputAfterDelay();
  }

  private blurInputAfterDelay(): void {
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
    // Show up to 10 items to reduce white space and lag
    return Math.min(itemsToUse.length, 10) * this.getItemSize();
  }
  
  getItemSize(): number {
    // Always use static item height
    return this.ITEM_HEIGHT;
  }

  public openGoogleMaps(): void {
    const searchQuery = encodeURIComponent(this.value || this.fieldName);
    const baseUrl = 'https://www.google.com/maps/search/';
    window.open(`${baseUrl}${searchQuery}`, '_blank');
  }
  public async triggerGoogleSearch(): Promise<void> {
    if (!this.value || this.value.length < this.MIN_GOOGLE_SEARCH_LENGTH) return;
    if (!this.isGoogleSearchType()) return;
    
    try {
      const googleResults = await this.getGooglePredictions(this.value);
      this.filteredItemsArray = googleResults;
      this.showGoogleMapsIcon = googleResults.length === 0;
      
      // Open the dropdown if closed
      if (this.autocompleteTrigger && !this.autocompleteTrigger.panelOpen) {
        this.autocompleteTrigger.openPanel();
      }
    } catch (error) {
      console.warn('Error triggering Google search:', error);
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
      return await this.handleEmptySearch();
    }

    const results = await this.getFilteredResults(value);
    this.updateGoogleMapsIconVisibility(results, value);
    return results;
  }

  private async handleEmptySearch(): Promise<ISearchItem[]> {
    let items = await this.getAllItemsForType();
    
    if (items.length === 0) {
      items = await this.getJsonFallback('');
    }
    
    this.showGoogleMapsIcon = false;
    return items;
  }

  private async getFilteredResults(value: string): Promise<ISearchItem[]> {
    switch (this.searchType) {
      case 'Address':
        const addressResults = (await this._filterAddress(value)).map(item => createSearchItem(item, 'address'));
        // For Address, do not auto-trigger Google predictions
        if (addressResults.length === 0 && value && value.length >= this.MIN_GOOGLE_SEARCH_LENGTH) {
          this.showGoogleMapsIcon = true;
        } else {
          this.showGoogleMapsIcon = false;
        }
        return addressResults;
      case 'Name':
        return (await this._filterName(value)).map(item => createSearchItem(item, 'name'));
      case 'Place':
        let places = await this._filterPlace(value);
        let placeItems = this.mapPlacesToSearchItems(places);
        placeItems = await this.getJsonFallback(value);
        // For Place, do not auto-trigger Google predictions
        if (placeItems.length === 0 && value && value.length >= this.MIN_GOOGLE_SEARCH_LENGTH) {
          this.showGoogleMapsIcon = true;
        } else {
          this.showGoogleMapsIcon = false;
        }
        return placeItems;
      case 'Region':
        return (await this._filterRegion(value)).map(item => createSearchItem(item, 'region'));
      case 'Service':
        let services = (await this._filterService(value)).map(item => createSearchItem(item, 'service'));
        return await this.getJsonFallback(value);
      case 'Type':
        let types = (await this._filterType(value)).map(item => createSearchItem(item, 'type'));
        return await this.getJsonFallback(value);
      default:
        return [];
    }
  }

  private async getJsonFallback(value: string): Promise<ISearchItem[]> {
    switch (this.searchType) {
      case 'Place':
        return await searchJson('places', value);
      case 'Service':
        return await searchJson('services', value);
      case 'Type':
        return await searchJson('types', value);
      default:
        return [];
    }
  }

  private updateGoogleMapsIconVisibility(results: ISearchItem[], value: string): void {
    const shouldShowIcon = this.isGoogleSearchType() && 
                          results.length === 0 && 
                          value.length >= this.MIN_GOOGLE_SEARCH_LENGTH;
    this.showGoogleMapsIcon = shouldShowIcon;
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

  private async getGooglePredictions(value: string): Promise<ISearchItem[]> {
    if (!this.isGoogleAllowed() || !this.googleSearch) {
      return [];
    }

    const cacheKey = `${this.googleSearch}:${value.toLowerCase()}`;
    const cachedResults = this.googlePredictionsCache.get(cacheKey);
    
    if (cachedResults) {
      return cachedResults;
    }

    try {
      const predictions = await this._serverGooglePlacesService.getSmartAutocomplete(
        value,
        this.googleSearch,
        'US'
      );

      const results = this.transformGooglePredictions(predictions);
      this.manageCacheSize();
      this.googlePredictionsCache.set(cacheKey, results);
      
      return results;
    } catch (error: any) {
      this.handleGoogleSearchError(error);
      return [];
    }
  }

  private transformGooglePredictions(predictions: AutocompleteResult[]): ISearchItem[] {
    return predictions.map((prediction: AutocompleteResult) => ({
      id: undefined,
      name: this.googleSearch === 'address' ? prediction.address : prediction.place,
      saved: false,
      value: this.googleSearch === 'address' ? prediction.address : prediction.place,
      trips: 0,
      placeId: prediction.placeDetails?.placeId,
      address: prediction.address
    }));
  }

  private manageCacheSize(): void {
    if (this.googlePredictionsCache.size >= this.CACHE_SIZE_LIMIT) {
      const firstKey = this.googlePredictionsCache.keys().next().value;
      if (firstKey) {
        this.googlePredictionsCache.delete(firstKey);
      }
    }
  }

  private handleGoogleSearchError(error: any): void {
    if (this.isRateLimitError(error) && this.isGoogleSearchType()) {
      this.showGoogleMapsIcon = true;
    }
    console.warn('Error getting Google predictions:', error);
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

  public isGoogleSearchType(): boolean {
    return this.searchType === 'Address' || this.searchType === 'Place';
  }

  private setInputValue(val: string): void {
    this.searchForm.controls.searchInput.setValue(val, { emitEvent: false });
    this.onChange(val);
  }

  private mapPlacesToSearchItems(places: IPlace[]): ISearchItem[] {
    const items: ISearchItem[] = [];
    for (const place of places) {
      if (Array.isArray(place.addresses) && place.addresses.length > 0) {
        // Sort addresses by lastTrip descending
        const sortedAddresses = [...place.addresses].sort((a, b) => {
          const dateA = a.lastTrip ? new Date(a.lastTrip).getTime() : 0;
          const dateB = b.lastTrip ? new Date(b.lastTrip).getTime() : 0;
          return dateB - dateA;
        });
        for (const address of sortedAddresses) {
          let trips = typeof address.trips === 'number' ? address.trips : place.trips;
          items.push({
            id: place.id,
            name: place.place,
            saved: place.saved,
            value: place.place,
            trips: trips,
            address: address.address
          });
        }
      } else {
        items.push({
          id: place.id,
          name: place.place,
          saved: place.saved,
          value: place.place,
          trips: place.trips
        });
      }
    }
    return items;
  }
}
