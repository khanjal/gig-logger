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
import { Observable, startWith, switchMap, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';

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
  filteredItemsArray: ISearchItem[] = []; // Single subscription result
  showGoogleMapsIcon = false; // Show Google Maps icon when rate limited
  
  // Constants
  private readonly MIN_GOOGLE_SEARCH_LENGTH = 2;
  private readonly MAX_VISIBLE_ITEMS = 5;
  private readonly ITEM_HEIGHT = 48;
  private readonly BLUR_DELAY = 100;
  private readonly DEBOUNCE_TIME = 300; // 300ms debounce for API calls
  
  // Simple cache for Google predictions to avoid duplicate API calls
  private googlePredictionsCache = new Map<string, ISearchItem[]>();
  private searchSubscription?: Subscription;
  
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

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
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
   * Sets up the filtered items observable with debouncing and caching
   */
  private setupFilteredItems(): void {
    // Clean up existing subscription
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.filteredItems = this.searchForm.controls.searchInput.valueChanges.pipe(
      debounceTime(this.DEBOUNCE_TIME), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only emit if value actually changed
      switchMap(async value => {
        const trimmedValue = value?.trim() || '';
        
        // Reset Google Maps icon when user starts typing again
        if (trimmedValue && this.showGoogleMapsIcon) {
          this.showGoogleMapsIcon = false;
        }
        
        // Clear Google listeners on each search to prevent conflicts
        if (this.inputElement) {
          this._googleAutocompleteService.clearAddressListeners(this.inputElement);
        }
        return await this._filterItems(trimmedValue);
      })
    );
    
    // Single subscription to prevent duplicate calls
    this.searchSubscription = this.filteredItems.subscribe(items => {
      this.filteredItemsArray = items;
    });
    
    // Initialize with empty results
    this.filteredItemsArray = [];
  }

  // Getter and setter for the value
  get value(): string {
    return this.searchForm.controls.searchInput.value || '';
  }

  set value(val: string) {
    // Only update if value is actually different to prevent loops
    const currentValue = this.searchForm.controls.searchInput.value || '';
    if (currentValue !== val) {
      this.searchForm.controls.searchInput.setValue(val, { emitEvent: false }); // Don't emit to prevent duplicate triggers
      this.onChange(val); // Notify Angular forms of the change
    }
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    // Don't emit valueChanges event to prevent triggering search
    this.searchForm.controls.searchInput.setValue(value || '', { emitEvent: false });
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
    const trimmedValue = this.value.trim();
    
    // Only update if the trimmed value is different to prevent unnecessary triggers
    if (this.value !== trimmedValue) {
      this.searchForm.controls.searchInput.setValue(trimmedValue, { emitEvent: false });
      this.onChange(trimmedValue);
    }
    
    this.onTouched(); // Notify Angular forms that the input was touched
    this.valueChanged.emit(trimmedValue); // Emit the event to the parent
  }

  public onClear(): void {
    // Clear the value without triggering search, then notify form
    this.searchForm.controls.searchInput.setValue('', { emitEvent: false });
    this.onChange('');
    // Clear Google predictions cache when user clears input
    this.googlePredictionsCache.clear();
  }

  async onInputSelect(inputValue: string): Promise<void> {
    // Set value without triggering additional search since user selected from existing results
    this.searchForm.controls.searchInput.setValue(inputValue, { emitEvent: false });
    this.onChange(inputValue);

    // Delay the blur to avoid race conditions
    if (this.inputElement) {
      setTimeout(() => {
        this.inputElement.nativeElement.blur();
      }, this.BLUR_DELAY);
    }
  }

  getViewportHeight(items?: ISearchItem[]): number {
    const itemsToUse = items || this.filteredItemsArray;
    if (!itemsToUse || itemsToUse.length === 0) {
      return 0;
    }
    return Math.min(itemsToUse.length, this.MAX_VISIBLE_ITEMS) * this.ITEM_HEIGHT;
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
   * Includes caching to reduce API calls
   */
  private async getGooglePredictions(value: string): Promise<ISearchItem[]> {
    if (!this.isGoogleAllowed() || !this.googleSearch || !this._googleAutocompleteService.isGoogleMapsLoaded()) {
      return [];
    }

    // Create cache key with search type and value
    const cacheKey = `${this.googleSearch}:${value.toLowerCase()}`;
    
    // Check cache first
    if (this.googlePredictionsCache.has(cacheKey)) {
      return this.googlePredictionsCache.get(cacheKey)!;
    }

    try {
      const predictions = await this._googleAutocompleteService.getAutocompletePredictions(
        value,
        this.googleSearch,
        { componentRestrictions: { country: 'US' } }
      );

      // If we successfully get predictions, hide the Google Maps icon
      this.showGoogleMapsIcon = false;

      const results = predictions.map(prediction => ({
        id: undefined,
        name: this.googleSearch === 'address' ? prediction.address : prediction.place,
        saved: false,
        value: this.googleSearch === 'address' ? prediction.address : prediction.place,
        trips: 0
      }));

      // Cache the results (limit cache size to prevent memory issues)
      if (this.googlePredictionsCache.size >= 50) {
        // Clear oldest entry if cache gets too large
        const firstKey = this.googlePredictionsCache.keys().next().value;
        if (firstKey) {
          this.googlePredictionsCache.delete(firstKey);
        }
      }
      this.googlePredictionsCache.set(cacheKey, results);

      return results;
    } catch (error: any) {
      console.warn('Error getting Google predictions:', error);
      
      // Check if this is a rate limit error and show Google Maps icon if needed
      if (this.isRateLimitError(error) && (this.searchType === 'Address' || this.searchType === 'Place')) {
        console.log('Rate limit detected - showing Google Maps icon as fallback');
        this.showGoogleMapsIcon = true;
      }
      
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
    // Early return for empty values
    if (!value || value.length === 0) {
      return [];
    }

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

  /**
   * Check if the error is a rate limit error from Google API
   */
  private isRateLimitError(error: any): boolean {
    if (!error) return false;
    
    // Check for common rate limit error indicators
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    return (
      errorCode === 'over_query_limit' ||
      errorCode === 'request_denied' ||
      errorMessage.includes('over query limit') ||
      errorMessage.includes('quota exceeded') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      error.status === 429
    );
  }

  /**
   * Open Google Maps in a new tab when rate limited
   * Provides a fallback search option when API quota is exceeded
   */
  public openGoogleMaps(): void {
    const searchQuery = encodeURIComponent(this.value || this.fieldName);
    const baseUrl = 'https://www.google.com/maps/search/';
    window.open(`${baseUrl}${searchQuery}`, '_blank');
  }

  /**
   * Manually trigger Google Maps icon (for testing rate limit scenarios)
   * This can be useful for testing the rate limit fallback functionality
   */
  public triggerRateLimitFallback(): void {
    if (this.searchType === 'Address' || this.searchType === 'Place') {
      console.log('Manually triggering rate limit fallback - showing Google Maps icon');
      this.showGoogleMapsIcon = true;
    }
  }
}
