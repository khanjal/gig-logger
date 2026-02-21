import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LoggerService } from './logger.service';
import { MockLocationService } from './mock-location.service';
import { getCurrentUserId } from '@utils/user-id.util';
import { firstValueFrom } from 'rxjs';
import { 
  IAutocompleteResult, 
  IPlaceDetails, 
  IAddressComponent, 
  IUserApiUsage, 
  IPlacesAutocompleteRequest, 
  IPlaceDetailsRequest 
} from '@interfaces/google-places.interface';

/**
 * @deprecated Use IAutocompleteResult from @interfaces/google-places.interface instead
 */
export type AutocompleteResult = IAutocompleteResult;

/**
 * @deprecated Use IPlaceDetails from @interfaces/google-places.interface instead
 */
export type PlaceDetails = IPlaceDetails;

/**
 * @deprecated Use IAddressComponent from @interfaces/google-places.interface instead
 */
export type GoogleAddressComponent = IAddressComponent;

/**
 * @deprecated Use IUserApiUsage from @interfaces/google-places.interface instead
 */
export type UserApiUsage = IUserApiUsage;

/**
 * @deprecated Use IPlacesAutocompleteRequest from @interfaces/google-places.interface instead
 */
export type PlacesAutocompleteRequest = IPlacesAutocompleteRequest;

/**
 * @deprecated Use IPlaceDetailsRequest from @interfaces/google-places.interface instead
 */
export type PlaceDetailsRequest = IPlaceDetailsRequest;

@Injectable({
  providedIn: 'root'
})
export class ServerGooglePlacesService {
  private baseUrl = environment.gigLoggerApi;
  private cachedLocation: { lat: number; lng: number; timestamp: number } | null = null;
  private locationCacheDuration = 5 * 60 * 1000; // 5 minutes

  // In-memory caches for autocomplete and place details
  private autocompleteCache = new Map<string, { results: AutocompleteResult[]; timestamp: number }>();
  private placeDetailsCache = new Map<string, { details: PlaceDetails; timestamp: number }>();
  private autocompleteCacheDuration = 2 * 60 * 1000; // 2 minutes
  private placeDetailsCacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private logger: LoggerService,
    private mockLocationService: MockLocationService
  ) {}

  /**
   * Get autocomplete suggestions from server-side Google Places API
   * Now uses in-memory cache to avoid redundant requests
   */
  async getAutocomplete(
    query: string, 
    searchType: string = 'address',
    country: string = 'US',
    userLat?: number,
    userLng?: number,
    radiusMeters?: number
  ): Promise<AutocompleteResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const cacheKey = `${query.trim().toLowerCase()}|${searchType}|${country}|${userLat ?? ''}|${userLng ?? ''}|${radiusMeters ?? ''}`;
    const now = Date.now();
    const cached = this.autocompleteCache.get(cacheKey);
    if (cached && now - cached.timestamp < this.autocompleteCacheDuration) {
      this.logger.debug('Returning cached autocomplete results for', cacheKey);
      return cached.results;
    }
    try {
      // Convert radius from miles to meters if from mock location, otherwise use parameter or undefined for backend default
      const MILES_TO_METERS = 1609.34;
      let radius = radiusMeters;
      if (!radius && this.mockLocationService.isEnabled()) {
        radius = this.mockLocationService.getRadius() * MILES_TO_METERS;
      }
      
      const request: PlacesAutocompleteRequest = {
        query: query.trim(),
        searchType,
        userId: getCurrentUserId(),
        country,
        userLatitude: userLat,
        userLongitude: userLng,
        radiusMeters: radius
      };
      const response = await firstValueFrom(this.http.post<AutocompleteResult[]>(
        `${this.baseUrl}/places/autocomplete`, 
        request,
        this.setOptions()
      ));
      const results = response || [];
      this.autocompleteCache.set(cacheKey, { results, timestamp: now });
      return results;
    } catch (error) {
      try {
        this.handleError(error);
      } catch (handleErrorException) {
        this.logger.error('Error while handling another error:', handleErrorException);
      }
      return [];
    }
  }

  /**
   * Get detailed place information by place ID
   * Now uses in-memory cache to avoid redundant requests
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!placeId) {
      return null;
    }
    const now = Date.now();
    const cached = this.placeDetailsCache.get(placeId);
    if (cached && now - cached.timestamp < this.placeDetailsCacheDuration) {
      this.logger.debug('Returning cached place details for', placeId);
      return cached.details;
    }
    try {
      const request: PlaceDetailsRequest = {
        placeId,
        userId: getCurrentUserId()
      };
      const details = await firstValueFrom(this.http.post<PlaceDetails>(
        `${this.baseUrl}/places/details`, 
        request,
        this.setOptions()
      )) || null;
      if (details) {
        this.placeDetailsCache.set(placeId, { details, timestamp: now });
      }
      return details;
    } catch (error) {
      try {
        this.handleError(error);
      } catch (handleErrorException) {
        this.logger.error('Error while handling another error:', handleErrorException);
      }
      return null;
    }
  }

  /**
   * Get current user's API usage statistics
   */
  async getUserUsage(): Promise<UserApiUsage | null> {
    try {
      const userId = getCurrentUserId();
      return await firstValueFrom(this.http.get<UserApiUsage>(
        `${this.baseUrl}/places/usage/${userId}`,
        this.setOptions()
      )) || null;
    } catch (error) {
      try {
        this.handleError(error);
      } catch (handleErrorException) {
        this.logger.error('Error while handling another error:', handleErrorException);
      }
      return null;
    }
  }

  /**
   * Check if the service is available (for fallback scenarios)
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const usage = await this.getUserUsage();
      return usage !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get full address with zip code using place ID
   */
  async getFullAddressWithZip(placeId: string): Promise<string | null> {
    const placeDetails = await this.getPlaceDetails(placeId);
    if (!placeDetails) return null;

    let fullAddress = placeDetails.formattedAddress || '';
    
    // If zip is missing, try to append it from address components
    if (fullAddress && !fullAddress.match(/\b\d{5}(-\d{4})?\b/)) {
      const addressComponents = placeDetails.addressComponents;
      if (addressComponents) {
        const zipComponent = addressComponents.find(comp => 
          comp.types.includes('postal_code')
        );
        if (zipComponent) {
          const zip = zipComponent.shortText || zipComponent.longText;
          if (zip) {
            // Try to insert after state if possible
            const stateMatch = fullAddress.match(/([A-Z]{2}),?\s*USA?$/i);
            if (stateMatch) {
              fullAddress = fullAddress.replace(/([A-Z]{2}),?\s*USA?$/i, `$1 ${zip}, USA`);
            } else {
              fullAddress = fullAddress.replace(/,?\s*USA?$/i, `, ${zip}, USA`);
            }
          }
        }
      }
    }
    
    return fullAddress;
  }

  /**
   * Parse address components from place details
   */
  parseAddressComponents(placeDetails: PlaceDetails): {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    administrativeAreaLevel2?: string;
    country?: string;
    postalCode?: string;
  } {
    if (!placeDetails.addressComponents) {
      return {};
    }

    const getComponent = (type: string, format: 'longText' | 'shortText' = 'longText'): string | undefined => {
      const component = placeDetails.addressComponents!.find(comp => 
        comp.types.includes(type)
      );
      return component ? component[format] : undefined;
    };

    return {
      streetNumber: getComponent('street_number', 'shortText'),
      route: getComponent('route', 'longText'),
      locality: getComponent('locality', 'longText'),
      administrativeAreaLevel1: getComponent('administrative_area_level_1', 'shortText'),
      administrativeAreaLevel2: getComponent('administrative_area_level_2', 'shortText'),
      country: getComponent('country', 'longText'),
      postalCode: getComponent('postal_code', 'longText')
    };
  }

  /**
   * Get user's current location for location bias (with enhanced caching)
   * Now supports mock location override for testing
   */
  async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    // Check if mock location is enabled
    const mockLocation = this.mockLocationService.getLocation();
    if (mockLocation) {
      this.logger.info('Using mock location for Google Places', mockLocation);
      return mockLocation;
    }

    // Use cached real location if available and fresh
    if (this.cachedLocation) {
      const now = Date.now();
      if (now - this.cachedLocation.timestamp < this.locationCacheDuration) {
        this.logger.debug('Using cached location for Google Places');
        // Return full object, but only lat/lng are used by callers
        return { lat: this.cachedLocation.lat, lng: this.cachedLocation.lng };
      }
    }

    // Get real geolocation
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        this.logger.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          this.cachedLocation = location;
          this.logger.debug('Location obtained and cached for Google Places', location);
          resolve({ lat: location.lat, lng: location.lng });
        },
        (error) => {
          this.logger.warn('Geolocation error for Google Places:', error.message);
          if (this.cachedLocation && 'timestamp' in this.cachedLocation) {
            this.logger.debug('Using last known cached location due to error');
            return resolve({ 
              lat: this.cachedLocation.lat, 
              lng: this.cachedLocation.lng 
            });
          }
          resolve(null);
        },
        {
          timeout: 8000,
          enableHighAccuracy: true,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Get autocomplete with optional location bias
   * Only calls Google Places API if we have user location or explicit override
   */
  async getAutocompleteWithLocation(
    query: string, 
    searchType: string = 'address',
    country: string = 'US',
    useLocationBias: boolean = false,
    forceWithoutLocation: boolean = false
  ): Promise<AutocompleteResult[]> {
    let userLocation = null;
    
    if (useLocationBias) {
      try {
        userLocation = await this.getUserLocation();
      } catch (error) {
        // Silently handle location errors
      }
    }

    // If we don't have user location and it's not explicitly forced, don't call the API
    if (useLocationBias && !userLocation && !forceWithoutLocation) {
      return [];
    }

    return this.getAutocomplete(
      query, 
      searchType, 
      country, 
      userLocation?.lat, 
      userLocation?.lng
    );
  }

  /**
   * Smart autocomplete that tries location-based only. No fallback suggestions.
   */
  async getSmartAutocomplete(
    query: string, 
    searchType: string = 'address',
    country: string = 'US'
  ): Promise<AutocompleteResult[]> {
    // Only try to get location-based results
    try {
      const locationResults = await this.getAutocompleteWithLocation(
        query, 
        searchType, 
        country, 
        true, // use location bias
        false // don't force without location
      );
      if (locationResults.length > 0) {
        return locationResults;
      }
    } catch (error) {
      // Silently handle location-based errors
    }
    // No fallback: just return empty
    return [];
  }

  /**
   * Clear cached location (useful when user moves significantly)
   */
  clearLocationCache(): void {
    this.cachedLocation = null;
  }

  /**
   * Check if location permission is granted
   */
  async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch (error) {
      return 'prompt';
    }
  }

  /**
   * Check if we can reliably get user location for Google Places API
   */
  async canGetUserLocation(): Promise<boolean> {
    // If mock location is enabled, treat location as available.
    if (this.mockLocationService.isEnabled() && this.mockLocationService.getLocation()) {
      return true;
    }

    // Check if we have cached location first
    if (this.cachedLocation && 'timestamp' in this.cachedLocation) {
      const now = Date.now();
      const cached = this.cachedLocation as { lat: number; lng: number; timestamp: number };
      if (now - cached.timestamp < this.locationCacheDuration) {
        return true;
      }
    }

    // Check permission status
    const permission = await this.checkLocationPermission();
    if (permission === 'denied') {
      return false;
    }

    // If permission is granted, we can likely get location
    if (permission === 'granted') {
      return true;
    }

    // If we need to prompt, we can't be sure without actually prompting
    return false;
  }

  /**
   * Get autocomplete results only if location is available, otherwise return empty
   */
  async getLocationBasedAutocomplete(
    query: string, 
    searchType: string = 'address',
    country: string = 'US'
  ): Promise<AutocompleteResult[]> {
    const canGetLocation = await this.canGetUserLocation();
    
    if (!canGetLocation) {
      return [];
    }

    return this.getAutocompleteWithLocation(
      query, 
      searchType, 
      country, 
      true, // use location bias
      false // don't force without location
    );
  }

  private handleError(error: any): void {
    this.logger.error('Server Google Places API Error:', error);
    
    if (error instanceof HttpErrorResponse) {
      if (error.status === 429) {
        throw new Error('API quota exceeded. Please upgrade your plan or try again later.');
      } else if (error.status === 400) {
        throw new Error('Invalid request. Please check your input.');
      } else if (error.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
    }
    
    throw new Error('Unable to fetch place suggestions. Please try again.');
  }

  private setHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    
    headers = headers.set('Content-Type', 'application/json');
    
    // Add UserId header for rate limiting and user identification
    const userId = getCurrentUserId();
    headers = headers.set('UserId', userId);
    
    return headers;
  }

  private setOptions() {
    return {
      withCredentials: true,
      headers: this.setHeaders()
    };
  }
}
