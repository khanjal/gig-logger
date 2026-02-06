import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ServerGooglePlacesService, AutocompleteResult, PlaceDetails } from './server-google-places.service';
import { LoggerService } from './logger.service';
import { MockLocationService } from './mock-location.service';

describe('ServerGooglePlacesService', () => {
  let service: ServerGooglePlacesService;
  let httpMock: HttpTestingController;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let mockLocationServiceSpy: jasmine.SpyObj<MockLocationService>;

  beforeEach(() => {
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'warn', 'debug']);
    mockLocationServiceSpy = jasmine.createSpyObj('MockLocationService', ['getLocation']);
    mockLocationServiceSpy.getLocation.and.returnValue(null); // Default: mock disabled

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ServerGooglePlacesService,
        { provide: LoggerService, useValue: loggerSpy },
        { provide: MockLocationService, useValue: mockLocationServiceSpy }
      ]
    });

    service = TestBed.inject(ServerGooglePlacesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns empty autocomplete for empty query', async () => {
    const result = await service.getAutocomplete('');
    expect(result).toEqual([]);
  });

  it('caches autocomplete results for repeated queries', async () => {
    const reqPromise = service.getAutocomplete('Main');
    const req = httpMock.expectOne(r => r.url.includes('/places/autocomplete'));
    req.flush([{ place: 'Main St', address: '123 Main St' } as AutocompleteResult]);
    const first = await reqPromise;
    expect(first.length).toBe(1);

    const second = await service.getAutocomplete('Main');
    // No new HTTP request due to cache
    expect(second.length).toBe(1);
    expect(loggerSpy.debug).toHaveBeenCalled();
  });

  it('fetches and caches place details', async () => {
    const promise = service.getPlaceDetails('place-1');
    const req = httpMock.expectOne(r => r.url.includes('/places/details'));
    req.flush({ placeId: 'place-1', formattedAddress: 'City, ST, USA' } as PlaceDetails);
    const first = await promise;
    expect(first?.placeId).toBe('place-1');

    const second = await service.getPlaceDetails('place-1');
    expect(second?.placeId).toBe('place-1');
    expect(loggerSpy.debug).toHaveBeenCalled();
  });

  it('getFullAddressWithZip appends zip when missing', async () => {
    const details: PlaceDetails = {
      placeId: 'pid',
      formattedAddress: 'City, ST, USA',
      addressComponents: [
        { longText: '94105', shortText: '94105', types: ['postal_code'] }
      ]
    };
    // Seed cache to avoid HTTP
    (service as any).placeDetailsCache.set('pid', { details, timestamp: Date.now() });
    const full = await service.getFullAddressWithZip('pid');
    expect(full).toContain('94105');
  });

  it('parseAddressComponents extracts fields correctly', () => {
    const details: PlaceDetails = {
      addressComponents: [
        { longText: '1600', shortText: '1600', types: ['street_number'] },
        { longText: 'Amphitheatre Pkwy', shortText: 'Amphitheatre', types: ['route'] },
        { longText: 'Mountain View', shortText: 'Mountain View', types: ['locality'] },
        { longText: 'CA', shortText: 'CA', types: ['administrative_area_level_1'] },
        { longText: 'Santa Clara', shortText: 'Santa Clara', types: ['administrative_area_level_2'] },
        { longText: 'United States', shortText: 'US', types: ['country'] },
        { longText: '94043', shortText: '94043', types: ['postal_code'] }
      ]
    };
    const parsed = service.parseAddressComponents(details);
    expect(parsed.route).toBe('Amphitheatre Pkwy');
    expect(parsed.administrativeAreaLevel1).toBe('CA');
    expect(parsed.postalCode).toBe('94043');
  });

  it('getUserLocation caches location on success', async () => {
    const mockGeo = {
      getCurrentPosition: (success: any, _error: any) => {
        success({ coords: { latitude: 1, longitude: 2 } });
      }
    } as Geolocation;
    const originalGeo = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', { value: mockGeo, configurable: true });

    const first = await service.getUserLocation();
    expect(first).toEqual({ lat: 1, lng: 2 });

    const second = await service.getUserLocation();
    expect(second).toEqual({ lat: 1, lng: 2 });

    Object.defineProperty(navigator, 'geolocation', { value: originalGeo, configurable: true });
  });

  it('getAutocompleteWithLocation returns empty when location required but unavailable', async () => {
    spyOn(service, 'getUserLocation').and.returnValue(Promise.resolve(null));
    const result = await service.getAutocompleteWithLocation('Main', 'address', 'US', true, false);
    expect(result).toEqual([]);
  });

  it('getAutocompleteWithLocation forces call without location when flag set', async () => {
    spyOn(service, 'getUserLocation').and.returnValue(Promise.resolve(null));
    const promise = service.getAutocompleteWithLocation('Main', 'address', 'US', true, true);
    await Promise.resolve();
    const req = httpMock.expectOne(r => r.url.includes('/places/autocomplete'));
    req.flush([{ place: 'Main St', address: '123 Main St' } as AutocompleteResult]);
    const result = await promise;
    expect(result.length).toBe(1);
  });

  it('checkLocationPermission returns states based on Permissions API', async () => {
    const originalPermissions = (navigator as any).permissions;
    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'granted' }) }, configurable: true });
    expect(await service.checkLocationPermission()).toBe('granted');

    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'denied' }) }, configurable: true });
    expect(await service.checkLocationPermission()).toBe('denied');

    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true });
    expect(await service.checkLocationPermission()).toBe('prompt');
    Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
  });

  it('canGetUserLocation true when cached location fresh', async () => {
    (service as any).cachedLocation = { lat: 1, lng: 2, timestamp: Date.now() };
    expect(await service.canGetUserLocation()).toBeTrue();
  });

  it('canGetUserLocation respects permission states', async () => {
    const originalPermissions = (navigator as any).permissions;
    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'denied' }) }, configurable: true });
    expect(await service.canGetUserLocation()).toBeFalse();

    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'granted' }) }, configurable: true });
    expect(await service.canGetUserLocation()).toBeTrue();

    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'prompt' }) }, configurable: true });
    expect(await service.canGetUserLocation()).toBeFalse();
    Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
  });

  it('getLocationBasedAutocomplete returns results when location is available', async () => {
    spyOn(service, 'canGetUserLocation').and.returnValue(Promise.resolve(true));
    spyOn(service, 'getUserLocation').and.returnValue(Promise.resolve({ lat: 1, lng: 2 } as any));
    spyOn(service, 'getAutocomplete').and.returnValue(Promise.resolve([{ place: 'Main St', address: '123 Main St' } as AutocompleteResult]));

    const result = await service.getLocationBasedAutocomplete('Main', 'address', 'US');

    expect(service.getAutocomplete).toHaveBeenCalledWith('Main', 'address', 'US', 1, 2);
    expect(result.length).toBe(1);
  });

  it('getAutocomplete handles server errors gracefully', async () => {
    const promise = service.getAutocomplete('Main');
    const req = httpMock.expectOne(r => r.url.includes('/places/autocomplete'));
    req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });
    const result = await promise;
    expect(result).toEqual([]);
    expect(loggerSpy.error).toHaveBeenCalled();
  });

  it('getPlaceDetails returns null on error and logs', async () => {
    const promise = service.getPlaceDetails('pid');
    const req = httpMock.expectOne(r => r.url.includes('/places/details'));
    req.flush({ message: 'bad' }, { status: 400, statusText: 'Bad Request' });
    const result = await promise;
    expect(result).toBeNull();
    expect(loggerSpy.error).toHaveBeenCalled();
  });

  it('isServiceAvailable reflects getUserUsage result', async () => {
    const spy = spyOn(service, 'getUserUsage').and.returnValue(Promise.resolve({ userId: 'u', monthlyQuota: 1, currentUsage: 0, tier: 'free', lastRequestTime: '' }));
    expect(await service.isServiceAvailable()).toBeTrue();
    spy.and.returnValue(Promise.resolve(null));
    expect(await service.isServiceAvailable()).toBeFalse();
  });
});
