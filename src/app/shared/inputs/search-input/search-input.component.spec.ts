import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchInputComponent } from './search-input.component';
import { commonTestingImports, commonTestingProviders } from '@test-harness';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SearchInputComponent],
      providers: [...commonTestingProviders]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getItemSize and getViewportHeight behavior', () => {
    const itemSize = component.getItemSize();
    expect(itemSize).toBeGreaterThan(0);

    // No items -> zero height
    component.filteredItemsArray = [];
    expect(component.getViewportHeight()).toBe(0);

    // When searching flags are set -> return single item height
    component.isGoogleSearching = true;
    expect(component.getViewportHeight()).toBe(itemSize);
    component.isGoogleSearching = false;

    // With a few items - should be items.length * itemSize
    component.filteredItemsArray = new Array(3).fill({} as any);
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
    expect(component.showGoogleMapsIcon).toBeFalse();

    // long enough and no results -> true
    (component as any).updateGoogleMapsIconVisibility([], 'ab');
    expect(component.showGoogleMapsIcon).toBeTrue();
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
});
