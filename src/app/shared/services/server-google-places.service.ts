import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AUTH_CONSTANTS } from '@constants/auth.constants';

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

  constructor(private http: HttpClient) {}

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
   * Get user's current location for location bias (optional)
   */
  async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          resolve(null);
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Get autocomplete with optional location bias
   */
  async getAutocompleteWithLocation(
    query: string, 
    searchType: string = 'address',
    country: string = 'US',
    useLocationBias: boolean = false
  ): Promise<AutocompleteResult[]> {
    let userLocation = null;
    
    if (useLocationBias) {
      try {
        userLocation = await this.getUserLocation();
      } catch (error) {
        console.log('Could not get user location, using default bias:', error);
      }
    }

    return this.getAutocomplete(
      query, 
      searchType, 
      country, 
      userLocation?.lat, 
      userLocation?.lng
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
      console.warn('Could not parse access token for user ID:', error);
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
      console.warn('Could not access stored access token:', error);
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
    console.error('Server Google Places API Error:', error);
    
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
