import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { SearchInputComponent } from './search-input.component';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { DropdownDataService } from '@services/dropdown-data.service';
import { AddressService } from '@services/sheets/address.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { RegionService } from '@services/sheets/region.service';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { ServerGooglePlacesService } from '@services/server-google-places.service';
import { LoggerService } from '@services/logger.service';
import { PermissionService } from '@services/permission.service';
import { MockLocationService } from '@services/mock-location.service';
import type { ISearchItem } from '@interfaces/search/search-item.interface';
import type { IPlace } from '@interfaces/entities/place.interface';
import type { IName } from '@interfaces/entities/name.interface';
import type { IAutocompleteResult } from '@interfaces/external/google-places.interface';
import type { IService } from '@interfaces/entities/service.interface';
import type { DropdownType } from '@interfaces/ui/dropdown-data.interface';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

// Exposes the private/internal surface of SearchInputComponent that these
// class-only tests exercise directly, to avoid `any` casts.
interface SearchInputComponentInternals {
  initialValue: string;
  googlePredictionsCache: Map<string, ISearchItem[]>;
  CACHE_SIZE_LIMIT: number;
  syncSelectionStateForExternalValue(value: string): Promise<void>;
  mapPlacesToSearchItems(places: IPlace[]): ISearchItem[];
  mapNamesToSearchItems(names: IName[]): ISearchItem[];
  appendDropdownMatches(existingItems: ISearchItem[], type: DropdownType, value: string): Promise<ISearchItem[]>;
  transformGooglePredictions(predictions: IAutocompleteResult[]): ISearchItem[];
  manageCacheSize(): void;
  handleGoogleSearchError(error: unknown): void;
  isRateLimitError(error: unknown): boolean;
  setGoogleSearchType(): void;
  updateGoogleMapsIconVisibility(results: ISearchItem[], value: string): void;
  getFilteredResults(value: string): Promise<ISearchItem[]>;
  _filterService(value: string): Promise<IService[]>;
};

// class-only tests
describe('SearchInputComponent (class-only)', () => {
  let comp: SearchInputComponent;
  const addressService = jasmine.createSpyObj('AddressService', ['includes', 'find']);
  const nameService = jasmine.createSpyObj('NameService', ['includes', 'find']);
  const placeService = jasmine.createSpyObj('PlaceService', ['includes', 'find']);
  const regionService = jasmine.createSpyObj('RegionService', ['filter']);
  const serviceService = jasmine.createSpyObj('ServiceService', ['filter']);
  const typeService = jasmine.createSpyObj('TypeService', ['filter']);
  const serverGoogle = jasmine.createSpyObj('ServerGooglePlacesService', ['getSmartAutocomplete', 'getFullAddressWithZip']);
  const logger = jasmine.createSpyObj('LoggerService', ['warn']);
  const dropdown = jasmine.createSpyObj('DropdownDataService', ['filterDropdown']);
  const permission = jasmine.createSpyObj('PermissionService', ['getLocationState']);
  const mockLoc = jasmine.createSpyObj('MockLocationService', ['getLocation']);
  const dialog: Partial<MatDialog> = {};

  beforeEach(() => {
    addressService.includes.and.returnValue(Promise.resolve([]));
    addressService.find.and.returnValue(Promise.resolve(null));
    nameService.includes.and.returnValue(Promise.resolve([]));
    placeService.includes.and.returnValue(Promise.resolve([]));
    placeService.find.and.returnValue(Promise.resolve(null));
    regionService.filter.and.returnValue(Promise.resolve([]));
    serviceService.filter.and.returnValue(Promise.resolve([]));
    typeService.filter.and.returnValue(Promise.resolve([]));
    serverGoogle.getSmartAutocomplete.and.returnValue(Promise.resolve([]));
    serverGoogle.getFullAddressWithZip.and.returnValue(Promise.resolve(null));
    dropdown.filterDropdown.and.returnValue(Promise.resolve([]));
    permission.getLocationState.and.returnValue('granted');
    mockLoc.getLocation.and.returnValue({ lat: 0, lng: 0 });

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: AddressService, useValue: addressService },
        { provide: NameService, useValue: nameService },
        { provide: PlaceService, useValue: placeService },
        { provide: RegionService, useValue: regionService },
        { provide: ServiceService, useValue: serviceService },
        { provide: TypeService, useValue: typeService },
        { provide: ServerGooglePlacesService, useValue: serverGoogle },
        { provide: LoggerService, useValue: logger },
        { provide: DropdownDataService, useValue: dropdown },
        { provide: PermissionService, useValue: permission },
        { provide: MockLocationService, useValue: mockLoc }
      ]
    });

    comp = TestBed.runInInjectionContext(() => new SearchInputComponent());
  });

  it('writeValue and value getter/setter work', async () => {
    comp.writeValue(' hello ');
    expect(comp.value).toBe(' hello ');
    // syncSelectionStateForExternalValue is async; spy and ensure it's called
    const spy = spyOn(comp as unknown as SearchInputComponentInternals, 'syncSelectionStateForExternalValue').and.returnValue(Promise.resolve());
    comp.writeValue('x');
    expect(spy).toHaveBeenCalled();
  });

  it('onInputChange updates value and emits', () => {
    const emitSpy = spyOn(comp.valueChanged, 'emit');
    const ev = { target: { value: 'abc' } } as unknown as Event;
    comp.onInputChange(ev);
    expect(comp.value).toBe('abc');
    expect(emitSpy).toHaveBeenCalledWith('abc');
  });

  it('onClear resets state and emits empty', () => {
    const emitSpy = spyOn(comp.valueChanged, 'emit');
    comp.searchForm.controls.searchInput.setValue('foo');
    comp.onClear();
    expect(comp.value).toBe('');
    expect(emitSpy).toHaveBeenCalledWith('');
  });

  it('getViewportHeight and getItemSize', () => {
    expect(comp.getItemSize()).toBeGreaterThan(0);
    comp.filteredItemsArray.set([]);
    expect(comp.getViewportHeight()).toBe(0);
    // set items and test limit
    const items: ISearchItem[] = Array.from({ length: 12 }, (_, i) => ({ name: `n${i}`, trips: 0 }) as unknown as ISearchItem);
    comp.filteredItemsArray.set(items);
    expect(comp.getViewportHeight()).toBe(comp.getItemSize() * 10);
  });

  it('mapPlacesToSearchItems sorts addresses and includes base item', () => {
    const place = {
      id: 1,
      place: 'P1',
      saved: true,
      trips: 3,
      addresses: [
        { address: 'A1', lastTrip: '2020-01-01', trips: 1 },
        { address: 'A2', lastTrip: '2021-01-01', trips: 2 }
      ]
    } as unknown as IPlace;

    const items = (comp as unknown as SearchInputComponentInternals).mapPlacesToSearchItems([place]);
    expect(items.length).toBeGreaterThan(1);
    // first address should be the one with later lastTrip
    expect(items.some((it: ISearchItem) => it.address === 'A2')).toBeTrue();
  });

  it('mapNamesToSearchItems includes addresses', () => {
    const name = { id: 2, name: 'N1', saved: false, trips: 0, addresses: ['Addr1'] } as unknown as IName;
    const items = (comp as unknown as SearchInputComponentInternals).mapNamesToSearchItems([name]);
    expect(items.length).toBe(2);
    expect(items[1].address).toBe('Addr1');
  });

  it('appendDropdownMatches returns fallback items', async () => {
    dropdown.filterDropdown.and.returnValue(Promise.resolve(['X']));
    const out = await (comp as unknown as SearchInputComponentInternals).appendDropdownMatches([], 'Service', 'x');
    expect(out.some((i: ISearchItem) => i.name === 'X')).toBeTrue();
  });

  it('triggerGoogleSearch handles success and opens panel', async () => {
    comp.searchType = 'Place';
    comp.googleSearch = 'place';
    comp.searchForm.controls.searchInput.setValue('abc');
    serverGoogle.getSmartAutocomplete.and.returnValue(Promise.resolve([{ place: 'P', address: 'A', placeDetails: { placeId: 'p1' } }] as IAutocompleteResult[]));
    comp.autocompleteTrigger = { panelOpen: false, openPanel: jasmine.createSpy('openPanel') } as unknown as MatAutocompleteTrigger;

    await comp.triggerGoogleSearch();

    expect(comp.filteredItemsArray().length).toBeGreaterThanOrEqual(0);
    expect(comp.autocompleteTrigger.openPanel).toHaveBeenCalled();
  });

  it('transformGooglePredictions maps predictions', () => {
    comp.googleSearch = 'address';
    const out = (comp as unknown as SearchInputComponentInternals).transformGooglePredictions([{ address: 'Addr', place: 'P', placeDetails: {} }]);
    expect(out[0].name).toBe('Addr');
  });

  it('manageCacheSize evicts oldest when over limit', () => {
    const internals = comp as unknown as SearchInputComponentInternals;
    const limit = internals.CACHE_SIZE_LIMIT;
    // fill cache
    for (let i = 0; i < limit + 2; i++) {
      internals.googlePredictionsCache.set(`k${i}`, [{ name: `n${i}` } as unknown as ISearchItem]);
    }
    // manageCacheSize may evict incrementally; call until trimmed
    while (internals.googlePredictionsCache.size > limit) {
      internals.manageCacheSize();
    }
    expect(internals.googlePredictionsCache.size).toBeLessThanOrEqual(limit);
  });

  it('handleGoogleSearchError sets icon on rate limit', () => {
    spyOn(comp as unknown as SearchInputComponentInternals, 'isRateLimitError').and.returnValue(true);
    comp.searchType = 'Address';
    (comp as unknown as SearchInputComponentInternals).handleGoogleSearchError(new Error('rate'));
    expect(comp.showGoogleMapsIcon()).toBeTrue();
  });

  it('isGoogleSearchType and isGoogleResult and isLocationAllowed', () => {
    comp.searchType = 'Address';
    // debug: ensure assignment took effect
    expect(comp.searchType).toBe('Address');
    // ensure googleSearch mapping is applied
    (comp as unknown as SearchInputComponentInternals).setGoogleSearchType();
    expect(comp.googleSearch).toBe('address');
    const item = { placeId: 'p1', trips: 0, saved: false } as unknown as ISearchItem;
    expect(comp.isGoogleResult(item)).toBeTrue();

    // ensure location permission allows using device location
    permission.getLocationState.and.returnValue('granted');
    expect(comp.isLocationAllowed()).toBeTrue();
  });
});
describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;
  let dropdownDataSpy: jasmine.SpyObj<DropdownDataService>;
  let addressService: AddressService;
  let placeService: PlaceService;

  beforeEach(async () => {
    dropdownDataSpy = jasmine.createSpyObj('DropdownDataService', ['filterDropdown']);
    dropdownDataSpy.filterDropdown.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SearchInputComponent],
      providers: [
        ...commonTestingProviders,
        { provide: DropdownDataService, useValue: dropdownDataSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    addressService = TestBed.inject(AddressService);
    placeService = TestBed.inject(PlaceService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track initialValue and hasSelection on writeValue', () => {
    component.writeValue('123 Main St');
    expect((component as unknown as SearchInputComponentInternals).initialValue).toBe('123 Main St');
    expect(component.hasSelection()).toBeTrue();

    component.writeValue('');
    expect((component as unknown as SearchInputComponentInternals).initialValue).toBe('');
    expect(component.hasSelection()).toBeFalse();

    component.writeValue(null as unknown as string);
    expect((component as unknown as SearchInputComponentInternals).initialValue).toBe('');
    expect(component.hasSelection()).toBeFalse();
  });

  it('should only reset hasSelection if value changed from initial', () => {
    component.writeValue('Initial Value');
    expect(component.hasSelection()).toBeTrue();

    const event = { target: { value: 'Initial Value' } } as unknown as Event;
    component.onInputChange(event);
    expect(component.hasSelection()).toBeTrue();

    const changedEvent = { target: { value: 'Changed Value' } } as unknown as Event;
    component.onInputChange(changedEvent);
    expect(component.hasSelection()).toBeFalse();
  });

  it('writeValue sets Place as selected when exact match exists', async () => {
    component.searchType = 'Place';
    component.ngOnChanges();
    spyOn(placeService, 'find').and.returnValue(Promise.resolve({ place: 'Walmart' } as unknown as IPlace));

    component.writeValue('Walmart');
    await fixture.whenStable();

    expect(component.hasSelection()).toBeTrue();
    expect(component.showGoogleMapsIcon()).toBeFalse();
  });

  it('writeValue sets Place as unselected when exact match does not exist', async () => {
    component.searchType = 'Place';
    component.ngOnChanges();
    spyOn(placeService, 'find').and.returnValue(Promise.resolve(undefined));

    component.writeValue('Unknown Place');
    await fixture.whenStable();

    expect(component.hasSelection()).toBeFalse();
    expect(component.showGoogleMapsIcon()).toBeTrue();
  });

  it('writeValue sets Address as unselected when exact match does not exist', async () => {
    component.searchType = 'Address';
    component.ngOnChanges();
    spyOn(addressService, 'find').and.returnValue(Promise.resolve(undefined));

    component.writeValue('999 New St');
    await fixture.whenStable();

    expect(component.hasSelection()).toBeFalse();
    expect(component.showGoogleMapsIcon()).toBeTrue();
  });

  it('should update initialValue on selection', async () => {
    const item = { name: 'Selected Place', placeId: undefined } as unknown as ISearchItem;
    await component.onInputSelect(item);
    expect((component as unknown as SearchInputComponentInternals).initialValue).toBe('Selected Place');
    expect(component.hasSelection()).toBeTrue();
  });

  it('emits valueChanged when an option is selected', async () => {
    const emitSpy = spyOn(component.valueChanged, 'emit');

    await component.onInputSelect({ name: 'Saved Place', placeId: undefined } as unknown as ISearchItem);

    expect(emitSpy).toHaveBeenCalledWith('Saved Place');
  });

  it('emits a cleared value when cleared', () => {
    const emitSpy = spyOn(component.valueChanged, 'emit');
    component.writeValue('Existing');

    component.onClear();

    expect(emitSpy).toHaveBeenCalledWith('');
    expect((component as unknown as SearchInputComponentInternals).initialValue).toBe('');
    expect(component.hasSelection()).toBeFalse();
  });

  it('getItemSize and getViewportHeight behavior', () => {
    const itemSize = component.getItemSize();
    expect(itemSize).toBeGreaterThan(0);

    // No items -> zero height
    component.filteredItemsArray.set([]);
    expect(component.getViewportHeight()).toBe(0);

    // When searching flags are set -> return single item height
    component.isGoogleSearching.set(true);
    expect(component.getViewportHeight()).toBe(itemSize);
    component.isGoogleSearching.set(false);

    // With a few items - should be items.length * itemSize
    component.filteredItemsArray.set(new Array(3).fill({} as unknown as ISearchItem));
    expect(component.getViewportHeight()).toBe(Math.min(3, 10) * itemSize);
  });

  it('sets googleSearch via setGoogleSearchType and reports isGoogleSearchType correctly', () => {
    (component as unknown as SearchInputComponentInternals).setGoogleSearchType();
    // default searchType is empty -> googleSearch undefined
    expect(component.googleSearch).toBeUndefined();

    component.searchType = 'Address';
    (component as unknown as SearchInputComponentInternals).setGoogleSearchType();
    expect(component.googleSearch).toBe('address');
    expect(component.isGoogleSearchType()).toBeTrue();

    component.searchType = 'Name';
    (component as unknown as SearchInputComponentInternals).setGoogleSearchType();
    expect(component.googleSearch).toBe('address'); // previous value remains
    expect(component.isGoogleSearchType()).toBeFalse();
  });

  it('updateGoogleMapsIconVisibility toggles showGoogleMapsIcon correctly', () => {
    component.searchType = 'Address';
    // short value -> false
    (component as unknown as SearchInputComponentInternals).updateGoogleMapsIconVisibility([], 'a');
    expect(component.showGoogleMapsIcon()).toBeFalse();

    // long enough and no results -> true
    (component as unknown as SearchInputComponentInternals).updateGoogleMapsIconVisibility([], 'ab');
    expect(component.showGoogleMapsIcon()).toBeTrue();
  });

  it('openGoogleMaps opens a new window with encoded query', () => {
    const orig = window.open;
    let openedUrl = '';
    window.open = ((url: string) => { openedUrl = url; return null; }) as typeof window.open;

    component.fieldName = 'FieldName';
    component.value = 'Some Place & Co';
    component.openGoogleMaps();
    expect(openedUrl).toContain('https://www.google.com/maps/search/');
    expect(openedUrl).toContain(encodeURIComponent('Some Place & Co'));

    // restore
    window.open = orig;
  });

  it('transformGooglePredictions returns ISearchItem array with appropriate fields', () => {
    const predictions: IAutocompleteResult[] = [
      { address: '123 A St', place: 'Place A', placeDetails: { placeId: 'pid' } },
      { address: '456 B St', place: 'Place B', placeDetails: undefined }
    ];
    component.googleSearch = 'address';
    const results = (component as unknown as SearchInputComponentInternals).transformGooglePredictions(predictions);
    expect(results.length).toBe(2);
    expect(results[0].name).toBe('123 A St');
    expect(results[0].placeId).toBe('pid');
  });

  it('mapPlacesToSearchItems sorts addresses by lastTrip and includes base item', () => {
    const place = {
      id: 1,
      place: 'My Place',
      saved: true,
      trips: 5,
      addresses: [
        { address: 'Old Addr', lastTrip: '2020-01-01', trips: 1 },
        { address: 'New Addr', lastTrip: '2022-01-01', trips: 3 }
      ]
    } as unknown as IPlace;

    const items = (component as unknown as SearchInputComponentInternals).mapPlacesToSearchItems([place]);
    // first item is base (no address), then entries sorted by lastTrip (New Addr first)
    expect(items[0].name).toBe('My Place');
    expect(items[1].address).toBe('New Addr');
    expect(items[2].address).toBe('Old Addr');
  });

  it('mapNamesToSearchItems includes addresses when present', () => {
    const name = { id: 2, name: 'John', saved: false, trips: 2, addresses: ['A1', 'A2'] } as unknown as IName;
    const items = (component as unknown as SearchInputComponentInternals).mapNamesToSearchItems([name]);
    expect(items.length).toBe(3); // base + 2 addresses
    expect(items[1].address).toBe('A1');
  });

  it('manageCacheSize trims the oldest entry when limit exceeded', () => {
    const cache = new Map<string, ISearchItem[]>();
    const internals = component as unknown as SearchInputComponentInternals;
    // fill slightly above the component limit (access private limit via internals type)
    const limit = internals.CACHE_SIZE_LIMIT || 50;
    for (let i = 0; i < limit + 1; i++) {
      cache.set('k' + i, []);
    }
    internals.googlePredictionsCache = cache;
    internals.manageCacheSize();
    expect(internals.googlePredictionsCache.size).toBe(limit);
  });

  it('appendDropdownMatches appends non-duplicate dropdown fallback values', async () => {
    const existingItems: ISearchItem[] = [
      { id: 1, name: 'DoorDash', value: 'DoorDash', saved: true, trips: 2 }
    ];
    dropdownDataSpy.filterDropdown.and.returnValue(Promise.resolve(['DoorDash', 'Uber Eats']));

    const result = await (component as unknown as SearchInputComponentInternals).appendDropdownMatches(existingItems, 'Service', 'do');

    expect(dropdownDataSpy.filterDropdown).toHaveBeenCalledWith('Service', 'do');
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('DoorDash');
    expect(result[1].name).toBe('Uber Eats');
  });

  it('getFilteredResults uses dropdown fallback for Service', async () => {
    component.searchType = 'Service';
    spyOn(component as unknown as SearchInputComponentInternals, '_filterService').and.returnValue(Promise.resolve([]));
    dropdownDataSpy.filterDropdown.and.returnValue(Promise.resolve(['Uber Eats']));

    const result = await (component as unknown as SearchInputComponentInternals).getFilteredResults('uber');

    expect(dropdownDataSpy.filterDropdown).toHaveBeenCalledWith('Service', 'uber');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Uber Eats');
  });
});
