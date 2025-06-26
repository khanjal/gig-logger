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
import { GoogleAutocompleteService } from '@services/google-autocomplete.service';

// RxJS imports
import { Observable, switchMap, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
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
      this.onChange(val);
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
  // #endregion

  // #region Event Handlers
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.searchForm.controls.searchInput.setValue(value, { emitEvent: false });
    this.onChange(value);
    this.valueChanged.emit(value);
  }
  onBlur(): void {
    const trimmedValue = this.value.trim();
    if (this.value !== trimmedValue) {
      this.searchForm.controls.searchInput.setValue(trimmedValue, { emitEvent: false });
      this.onChange(trimmedValue);
    }
    this.onTouched();
    this.valueChanged.emit(trimmedValue);
  }
  public onClear(): void {
    this.searchForm.controls.searchInput.setValue('', { emitEvent: false });
    this.onChange('');
    this.googlePredictionsCache.clear();
  }
  async onInputSelect(inputValue: string): Promise<void> {
    this.searchForm.controls.searchInput.setValue(inputValue, { emitEvent: false });
    this.onChange(inputValue);
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
        if (this.inputElement) {
          this._googleAutocompleteService.clearAddressListeners(this.inputElement);
        }
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
        return (await this._filterAddress('')).map(item => this.createSearchItem(item, 'address'));
      case 'Name':
        return (await this._filterName('')).map(item => this.createSearchItem(item, 'name'));
      case 'Place':
        return (await this._filterPlace('')).map(item => this.createSearchItem(item, 'place'));
      case 'Region':
        return (await this._filterRegion('')).map(item => this.createSearchItem(item, 'region'));
      case 'Service':
        return (await this._filterService('')).map(item => this.createSearchItem(item, 'service'));
      case 'Type':
        return (await this._filterType('')).map(item => this.createSearchItem(item, 'type'));
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
        const addressResults = (await this._filterAddress(value)).map(item => this.createSearchItem(item, 'address'));
        return await this.addGooglePredictionsIfNeeded(value, addressResults);
      case 'Name':
        return (await this._filterName(value)).map(item => this.createSearchItem(item, 'name'));
      case 'Place':
        let places = (await this._filterPlace(value)).map(item => this.createSearchItem(item, 'place'));
        places = await this.handleJsonFallback(places, 'places', value);
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

  private createSearchItem(item: any, nameProperty: string): ISearchItem {
    return {
      id: item.id,
      name: item[nameProperty],
      saved: item.saved,
      value: item[nameProperty],
      trips: item.trips
    };
  }

  private async addGooglePredictionsIfNeeded(value: string, results: ISearchItem[]): Promise<ISearchItem[]> {
    if (results.length === 0 && value && value.length >= this.MIN_GOOGLE_SEARCH_LENGTH) {
      const googlePredictions = await this.getGooglePredictions(value);
      return googlePredictions;
    }
    return results;
  }

  private async handleJsonFallback(results: ISearchItem[], searchType: string, value: string): Promise<ISearchItem[]> {
    if (results.length === 0) {
      return await this.searchJson(searchType, value);
    }
    return results;
  }

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

  private isGoogleAllowed(): boolean {
    const hostname = window.location.hostname;
    return hostname.includes('gig-test') || hostname === 'localhost';
  }

  private async getGooglePredictions(value: string): Promise<ISearchItem[]> {
    if (!this.isGoogleAllowed() || !this.googleSearch || !this._googleAutocompleteService.isGoogleMapsLoaded()) {
      return [];
    }
    const cacheKey = `${this.googleSearch}:${value.toLowerCase()}`;
    if (this.googlePredictionsCache.has(cacheKey)) {
      return this.googlePredictionsCache.get(cacheKey)!;
    }
    try {
      const predictions = await this._googleAutocompleteService.getAutocompletePredictions(
        value,
        this.googleSearch,
        { componentRestrictions: { country: 'US' } }
      );
      this.showGoogleMapsIcon = false;
      const results = predictions.map(prediction => ({
        id: undefined,
        name: this.googleSearch === 'address' ? prediction.address : prediction.place,
        saved: false,
        value: this.googleSearch === 'address' ? prediction.address : prediction.place,
        trips: 0
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
      console.warn('Error getting Google predictions:', error);
      if (this.isRateLimitError(error) && (this.searchType === 'Address' || this.searchType === 'Place')) {
        console.log('Rate limit detected - showing Google Maps icon as fallback');
        this.showGoogleMapsIcon = true;
      }
      return [];
    }
  }

  private isRateLimitError(error: any): boolean {
    if (!error) return false;
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
  // #endregion

  // #region Utility
  isGoogleResult(item: ISearchItem): boolean {
    return item.id === undefined && item.trips === 0 && !item.saved;
  }
  // #endregion
}
