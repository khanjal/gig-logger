/**
 * Mock location interface for testing location-based features.
 */
export interface IMockLocation {
  enabled: boolean;
  latitude: number;
  longitude: number;
  radius: number; // in miles
  name?: string;
}

/**
 * Preset location interface for quick testing with known locations.
 */
export interface IPresetLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: 'US' | 'CA';
}
