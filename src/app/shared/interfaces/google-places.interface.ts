/**
 * Google Places API autocomplete result interface.
 */
export interface IAutocompleteResult {
  place: string;
  address: string;
  placeDetails?: IPlaceDetails;
}

/**
 * Google Places API place details interface.
 */
export interface IPlaceDetails {
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  addressComponents?: IAddressComponent[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Google Places API address component interface.
 */
export interface IAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

/**
 * User API usage tracking interface.
 */
export interface IUserApiUsage {
  userId: string;
  monthlyQuota: number;
  currentUsage: number;
  tier: string;
  lastRequestTime: string;
}

/**
 * Places autocomplete request interface.
 */
export interface IPlacesAutocompleteRequest {
  query: string;
  searchType: string;
  userId: string;
  country: string;
  userLatitude?: number;
  userLongitude?: number;
  radiusMeters?: number;
}

/**
 * Place details request interface.
 */
export interface IPlaceDetailsRequest {
  placeId: string;
  userId: string;
}
