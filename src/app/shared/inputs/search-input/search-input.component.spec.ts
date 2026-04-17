import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchInputComponent } from './search-input.component';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { DropdownDataService } from '@services/dropdown-data.service';
import { AddressService } from '@services/sheets/address.service';
import { PlaceService } from '@services/sheets/place.service';

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
    expect((component as any).initialValue).toBe('123 Main St');
    expect(component.hasSelection()).toBeTrue();

    component.writeValue('');
    expect((component as any).initialValue).toBe('');
    expect(component.hasSelection()).toBeFalse();

    component.writeValue(null as any);
    expect((component as any).initialValue).toBe('');
    expect(component.hasSelection()).toBeFalse();
  });

  it('should only reset hasSelection if value changed from initial', () => {
    component.writeValue('Initial Value');
    expect(component.hasSelection()).toBeTrue();

    const event = { target: { value: 'Initial Value' } } as any;
    component.onInputChange(event);
    expect(component.hasSelection()).toBeTrue();

    const changedEvent = { target: { value: 'Changed Value' } } as any;
    component.onInputChange(changedEvent);
    expect(component.hasSelection()).toBeFalse();
  });

  it('writeValue sets Place as selected when exact match exists', async () => {
    component.searchType = 'Place';
    component.ngOnChanges();
    spyOn(placeService, 'find').and.returnValue(Promise.resolve({ place: 'Walmart' } as any));

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
    const item = { name: 'Selected Place', placeId: undefined } as any;
    await component.onInputSelect(item);
    expect((component as any).initialValue).toBe('Selected Place');
    expect(component.hasSelection()).toBeTrue();
  });

  it('emits valueChanged when an option is selected', async () => {
    const emitSpy = spyOn(component.valueChanged, 'emit');

    await component.onInputSelect({ name: 'Saved Place', placeId: undefined } as any);

    expect(emitSpy).toHaveBeenCalledWith('Saved Place');
  });

  it('emits a cleared value when cleared', () => {
    const emitSpy = spyOn(component.valueChanged, 'emit');
    component.writeValue('Existing');

    component.onClear();

    expect(emitSpy).toHaveBeenCalledWith('');
    expect((component as any).initialValue).toBe('');
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
    component.filteredItemsArray.set(new Array(3).fill({} as any));
    expect(component.getViewportHeight()).toBe(Math.min(3, 10) * itemSize);
  });

  it('sets googleSearch via setGoogleSearchType and reports isGoogleSearchType correctly', () => {
    (component as any).setGoogleSearchType();
    // default searchType is empty -> googleSearch undefined
    expect(component.googleSearch).toBeUndefined();

    component.searchType = 'Address';
    (component as any).setGoogleSearchType();
    expect(component.googleSearch).toBe('address');
    expect(component.isGoogleSearchType()).toBeTrue();

    component.searchType = 'Name';
    (component as any).setGoogleSearchType();
    expect(component.googleSearch).toBe('address'); // previous value remains
    expect(component.isGoogleSearchType()).toBeFalse();
  });

  it('updateGoogleMapsIconVisibility toggles showGoogleMapsIcon correctly', () => {
    component.searchType = 'Address';
    // short value -> false
    (component as any).updateGoogleMapsIconVisibility([], 'a');
    expect(component.showGoogleMapsIcon()).toBeFalse();

    // long enough and no results -> true
    (component as any).updateGoogleMapsIconVisibility([], 'ab');
    expect(component.showGoogleMapsIcon()).toBeTrue();
  });

  it('openGoogleMaps opens a new window with encoded query', () => {
    const orig = window.open;
    let openedUrl = '' as any;
    // @ts-ignore - spy on window.open
    (window as any).open = ((url: string) => { openedUrl = url; return null; }) as any;

    component.fieldName = 'FieldName';
    component.value = 'Some Place & Co';
    component.openGoogleMaps();
    expect(openedUrl).toContain('https://www.google.com/maps/search/');
    expect(openedUrl).toContain(encodeURIComponent('Some Place & Co'));

    // restore
    (window as any).open = orig;
  });

  it('transformGooglePredictions returns ISearchItem array with appropriate fields', () => {
    const predictions = [
      { address: '123 A St', place: 'Place A', placeDetails: { placeId: 'pid' } },
      { address: '456 B St', place: 'Place B', placeDetails: null }
    ];
    (component as any).googleSearch = 'address';
    const results = (component as any).transformGooglePredictions(predictions);
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
    } as any;

    const items = (component as any).mapPlacesToSearchItems([place]);
    // first item is base (no address), then entries sorted by lastTrip (New Addr first)
    expect(items[0].name).toBe('My Place');
    expect(items[1].address).toBe('New Addr');
    expect(items[2].address).toBe('Old Addr');
  });

  it('mapNamesToSearchItems includes addresses when present', () => {
    const name = { id: 2, name: 'John', saved: false, trips: 2, addresses: ['A1', 'A2'] } as any;
    const items = (component as any).mapNamesToSearchItems([name]);
    expect(items.length).toBe(3); // base + 2 addresses
    expect(items[1].address).toBe('A1');
  });

  it('manageCacheSize trims the oldest entry when limit exceeded', () => {
    const cache = new Map<string, any>();
    // fill slightly above the component limit (access private limit via any)
    const limit = (component as any).CACHE_SIZE_LIMIT || 50;
    for (let i = 0; i < limit + 1; i++) {
      cache.set('k' + i, []);
    }
    (component as any).googlePredictionsCache = cache;
    (component as any).manageCacheSize();
    expect((component as any).googlePredictionsCache.size).toBe(limit);
  });

  it('appendDropdownMatches appends non-duplicate dropdown fallback values', async () => {
    const existingItems = [
      { id: 1, name: 'DoorDash', value: 'DoorDash', saved: true, trips: 2 }
    ] as any[];
    dropdownDataSpy.filterDropdown.and.returnValue(Promise.resolve(['DoorDash', 'Uber Eats']));

    const result = await (component as any).appendDropdownMatches(existingItems, 'Service', 'do');

    expect(dropdownDataSpy.filterDropdown).toHaveBeenCalledWith('Service', 'do');
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('DoorDash');
    expect(result[1].name).toBe('Uber Eats');
  });

  it('getFilteredResults uses dropdown fallback for Service', async () => {
    component.searchType = 'Service';
    spyOn<any>(component, '_filterService').and.returnValue(Promise.resolve([]));
    dropdownDataSpy.filterDropdown.and.returnValue(Promise.resolve(['Uber Eats']));

    const result = await (component as any).getFilteredResults('uber');

    expect(dropdownDataSpy.filterDropdown).toHaveBeenCalledWith('Service', 'uber');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Uber Eats');
  });
});
