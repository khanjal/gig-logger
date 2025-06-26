import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AUTH_CONSTANTS } from '@constants/auth.constants';
import { LoggerService } from './logger.service';

export interface AutocompleteResult {
  place: string;
  address: string;
  placeDetails?: PlaceDetails;
}

export interface PlaceDetails {
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface GoogleAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

export interface UserApiUsage {
  userId: string;
  monthlyQuota: number;
  currentUsage: number;
  tier: string;
  lastRequestTime: string;
}

export interface PlacesAutocompleteRequest {
  query: string;
  searchType: string;
  userId: string;
  country: string;
  userLatitude?: number;
  userLongitude?: number;
}

export interface PlaceDetailsRequest {
  placeId: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServerGooglePlacesService {
  private baseUrl = environment.gigLoggerApi;
  private cachedLocation: { lat: number; lng: number; timestamp: number } | null = null;
  private locationCacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient, private logger: LoggerService) {}

  /**
   * Get autocomplete suggestions from server-side Google Places API
   */
  async getAutocomplete(
    query: string, 
    searchType: string = 'address',
    country: string = 'US',
    userLat?: number,
    userLng?: number
  ): Promise<AutocompleteResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const request: PlacesAutocompleteRequest = {
        query: query.trim(),
        searchType,
        userId: this.getCurrentUserId(),
        country,
        userLatitude: userLat,
        userLongitude: userLng
      };

      const response = await this.http.post<AutocompleteResult[]>(
        `${this.baseUrl}/places/autocomplete`, 
        request,
        this.setOptions()
      ).toPromise();
      
      return response || [];
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  /**
   * Get detailed place information by place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!placeId) {
      return null;
    }

    try {
      const request: PlaceDetailsRequest = {
        placeId,
        userId: this.getCurrentUserId()
      };

      return await this.http.post<PlaceDetails>(
        `${this.baseUrl}/places/details`, 
        request,
        this.setOptions()
      ).toPromise() || null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Get current user's API usage statistics
   */
  async getUserUsage(): Promise<UserApiUsage | null> {
    try {
      const userId = this.getCurrentUserId();
      return await this.http.get<UserApiUsage>(
        `${this.baseUrl}/places/usage/${userId}`,
        this.setOptions()
      ).toPromise() || null;
    } catch (error) {
      this.handleError(error);
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
   */
  async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    if (this.cachedLocation) {
      const now = Date.now();
      if (now - this.cachedLocation.timestamp < this.locationCacheDuration) {
        this.logger.debug('Using cached location for Google Places');
        return { lat: this.cachedLocation.lat, lng: this.cachedLocation.lng };
      }
    }

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
            lng: position.coords.longitude
          };
          this.cachedLocation = {
            ...location,
            timestamp: Date.now()
          };
          this.logger.debug('Location obtained and cached for Google Places', location);
          resolve(location);
        },
        (error) => {
          this.logger.warn('Geolocation error for Google Places:', error.message);
          if (this.cachedLocation) {
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
    // Check if we have cached location first
    if (this.cachedLocation) {
      const now = Date.now();
      if (now - this.cachedLocation.timestamp < this.locationCacheDuration) {
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

  private getCurrentUserId(): string {
    // Since we have an HTTP interceptor that automatically adds the UserId header,
    // we can rely on that for server-side user identification.
    // This method is now primarily for fallback scenarios where the header isn't available.
    
    // Priority 1: Check localStorage for stored authenticated user ID
    const storedUserId = localStorage.getItem('authenticatedUserId');
    if (storedUserId) {
      return storedUserId;
    }

    // Priority 2: Try to parse access token from secure storage
    try {
      const accessToken = this.getStoredAccessToken();
      if (accessToken) {
        const payload = this.parseJwtPayload(accessToken);
        if (payload?.sub) {
          // Store for future use
          localStorage.setItem('authenticatedUserId', payload.sub);
          return payload.sub;
        }
      }
    } catch (error) {
      this.logger.warn('Could not parse access token for user ID:', error);
    }

    // Fallback: Use stored/generated anonymous user ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  private getStoredAccessToken(): string | null {
    // Try to get access token from secure cookie storage
    // This is a simplified approach that avoids circular dependency
    try {
      // Check if there's a way to access the secure storage
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === AUTH_CONSTANTS.ACCESS_TOKEN && value) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      this.logger.warn('Could not access stored access token:', error);
    }
    return null;
  }

  private parseJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private generateUserId(): string {
    // Generate a simple UUID-like identifier
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
    
    // Get access token from secure cookie storage
    const accessToken = this.getStoredAccessToken();
    if (accessToken) {
      headers = headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    // Add UserId header for rate limiting and user identification
    const userId = this.getCurrentUserId();
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
