import { ElementRef, Injectable } from '@angular/core';

/**
 * Google Places API (New) Autocomplete Service
 * 
 * This service uses the latest Google Places API with PlaceAutocompleteElement.
 * Updated for March 2025+ compatibility.
 * Key features:
 * 
 * 1. Uses google.maps.places.PlaceAutocompleteElement (latest API)
 * 2. Dynamic library loading with google.maps.importLibrary("places")
 * 3. Async/await patterns for better error handling
 * 4. Modern event handling with addEventListener
 * 5. Explicit fields for better performance and billing optimization
 * 6. TypeScript interfaces for better type safety
 */

// New Google Places API types
declare global {
  interface Window {
    google: any;
  }
}

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

@Injectable({
  providedIn: 'root'
})
export class GoogleAutocompleteService {
  private autocompleteService: any;
  private placesService: any;

  public async getPlaceAutocomplete(
    inputElement: ElementRef<any>, 
    searchType: string, 
    callback: (result: AutocompleteResult) => void,    options?: {
      componentRestrictions?: { country: string };
      fields?: string[];
      types?: string[]; // Still array for compatibility, but only first element used
    }
  ): Promise<void> {
    // Wait for Google Maps to be loaded
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }

    try {
      // Load the Places library dynamically
      const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
        const searchTypeMapping: { [key: string]: string } = {
        address: 'geocode',
        place: 'establishment', 
        business: 'establishment',
        default: 'geocode'
      };      const selectedType = options?.types?.[0] || searchTypeMapping[searchType] || searchTypeMapping['default'];
      const fields = options?.fields || ['place_id', 'formatted_address', 'name', 'address_components', 'geometry'];
      const componentRestrictions = options?.componentRestrictions || { country: 'US' };// Create the new PlaceAutocompleteElement
      const autocompleteElement = new PlaceAutocompleteElement();
      
      // Configure the autocomplete element using the correct property names
      if (componentRestrictions.country) {
        autocompleteElement.country = componentRestrictions.country;
      }
        // Set the type restrictions
      if (selectedType) {
        autocompleteElement.type = selectedType; // PlaceAutocompleteElement uses a single type
      }

      // Set placeholder and other styling properties
      if (inputElement.nativeElement.placeholder) {
        autocompleteElement.placeholder = inputElement.nativeElement.placeholder;
      }

      // Copy CSS classes and ID
      if (inputElement.nativeElement.className) {
        autocompleteElement.className = inputElement.nativeElement.className;
      }
      
      if (inputElement.nativeElement.id) {
        autocompleteElement.id = inputElement.nativeElement.id;
      }      // Replace the input element with the autocomplete element
      const parentElement = inputElement.nativeElement.parentElement;
      if (parentElement) {
        // Replace the input with autocomplete element
        parentElement.replaceChild(autocompleteElement, inputElement.nativeElement);
        
        // Update the ElementRef to point to the new element
        inputElement.nativeElement = autocompleteElement;
      }

      // Add place changed listener
      autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
        const place = event.place;
        if (!place || !place.formattedAddress) {
          return;
        }
        
        const placeName = place.displayName?.text || place.name || "";
        const address = this.formatAddress(place);
        const placeDetails: PlaceDetails = {
          placeId: place.id,
          name: placeName,
          formattedAddress: place.formattedAddress,
          addressComponents: this.convertAddressComponents(place.addressComponents),
          geometry: place.location ? {
            location: {
              lat: place.location.latitude || place.location.lat,
              lng: place.location.longitude || place.location.lng
            }
          } : undefined
        };

        callback({ place: placeName, address, placeDetails });
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }

  /**
   * Get Google Places autocomplete predictions for dropdown integration
   * Uses the new AutocompleteSuggestion API (March 2025+)
   * Returns an array of predictions that can be displayed in a dropdown
   */
  public async getAutocompletePredictions(
    query: string,
    searchType: string,
    options?: {
      componentRestrictions?: { country: string };
      types?: string[];
    }
  ): Promise<AutocompleteResult[]> {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return [];
    }

    try {
      // Load the Places library dynamically
      await window.google.maps.importLibrary("places");
      
      const searchTypeMapping: { [key: string]: string } = {
        address: 'geocode',
        place: 'establishment', 
        business: 'establishment',
        default: 'geocode'
      };
      
      const selectedTypes = options?.types || [searchTypeMapping[searchType] || searchTypeMapping['default']];
      const componentRestrictions = options?.componentRestrictions || { country: 'US' };
      
      // Use the new AutocompleteSuggestion API - simplified request without location restrictions
      const request = {
        input: query,
        includedPrimaryTypes: selectedTypes
      };
      
      // Get suggestions using the new API
      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      
      if (suggestions && suggestions.length > 0) {
        // Convert suggestions to AutocompleteResult format
        const results: AutocompleteResult[] = suggestions.map((suggestion: any) => ({
          place: this.extractPlaceNameFromSuggestion(suggestion),
          address: suggestion.placePrediction?.text?.text || '',
          placeDetails: {
            placeId: suggestion.placePrediction?.placeId || '',
            name: this.extractPlaceNameFromSuggestion(suggestion),
            formattedAddress: suggestion.placePrediction?.text?.text || ''
          }
        }));
        return results;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting Google Places predictions:', error);
      return [];
    }
  }

  /**
   * Get detailed place information by place ID
   */
  public async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.placesService) {
      return null;
    }

    return new Promise((resolve) => {
      const request = {
        placeId: placeId,
        fields: ['place_id', 'formatted_address', 'name', 'address_components', 'geometry']
      };
      
      this.placesService.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const placeDetails: PlaceDetails = {
            placeId: place.place_id,
            name: place.name || "",
            formattedAddress: place.formatted_address,
            addressComponents: this.convertAddressComponents(place.address_components),
            geometry: place.geometry ? {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            } : undefined
          };
          resolve(placeDetails);
        } else {
          resolve(null);
        }
      });
    });
  }

  public attachToModal(): void {
    const modalContainer = document.querySelector('.mat-mdc-dialog-container');
    const pacContainer = document.querySelector('.pac-container');
    if (modalContainer && pacContainer) {
      modalContainer.appendChild(pacContainer);
    }
  }
  public clearAddressListeners(inputElement: ElementRef<any>): void {
    // For PlaceAutocompleteElement, we need to remove event listeners differently
    if (inputElement.nativeElement && inputElement.nativeElement.removeEventListener) {
      inputElement.nativeElement.removeEventListener('gmp-placeselect', null);
    }
    
    // Also clear any legacy listeners if they exist
    if (window.google && window.google.maps && window.google.maps.event) {
      window.google.maps.event.clearInstanceListeners(inputElement.nativeElement);
    }
    this.removePacContainers();
  }

  public isGoogleMapsLoaded(): boolean {
    return !!(window.google && window.google.maps);
  }

  public async waitForGoogleMaps(maxAttempts: number = 10): Promise<boolean> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      if (this.isGoogleMapsLoaded()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    return false;
  }

  public getAddressComponent(place: any, componentType: string, format: 'long_name' | 'short_name' = 'long_name'): string | undefined {
    if (!place.address_components) {
      return undefined;
    }

    const component = place.address_components.find((comp: any) => 
      comp.types.includes(componentType)
    );
    
    return component ? component[format] : undefined;
  }

  public parseAddressComponents(place: any): {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    administrativeAreaLevel2?: string;
    country?: string;
    postalCode?: string;
  } {
    return {
      streetNumber: this.getAddressComponent(place, 'street_number', 'short_name'),
      route: this.getAddressComponent(place, 'route', 'long_name'),
      locality: this.getAddressComponent(place, 'locality', 'long_name'),
      administrativeAreaLevel1: this.getAddressComponent(place, 'administrative_area_level_1', 'short_name'),
      administrativeAreaLevel2: this.getAddressComponent(place, 'administrative_area_level_2', 'short_name'),
      country: this.getAddressComponent(place, 'country', 'long_name'),
      postalCode: this.getAddressComponent(place, 'postal_code', 'long_name')
    };
  }
  private formatAddress(place: any): string {
    // Handle new API format
    let formattedAddress = place.formattedAddress || place.formatted_address;
    let name = place.displayName?.text || place.name || "";

    if (name && formattedAddress && !formattedAddress.startsWith(name)) {
      formattedAddress = `${name}, ${formattedAddress}`;
    }

    return formattedAddress ?? "";
  }
  private convertAddressComponents(components: any[]): GoogleAddressComponent[] {
    if (!components) return [];
    
    return components.map(comp => ({
      // Handle both new API format and legacy format
      longText: comp.longText || comp.long_name,
      shortText: comp.shortText || comp.short_name,
      types: comp.types || []
    }));
  }

  private removePacContainers(): void {
    const pacContainers = document.querySelectorAll('.pac-container');
    pacContainers.forEach(container => container.remove());
  }

  private extractPlaceName(prediction: any): string {
    // Extract business/place name from the prediction
    const terms = prediction.terms || [];
    return terms.length > 0 ? terms[0].value : prediction.structured_formatting?.main_text || "";
  }

  private extractPlaceNameFromSuggestion(suggestion: any): string {
    // Extract business/place name from the new AutocompleteSuggestion format
    return suggestion.placePrediction?.structuredFormat?.mainText?.text || 
           suggestion.placePrediction?.text?.text?.split(',')[0] || "";
  }
}
