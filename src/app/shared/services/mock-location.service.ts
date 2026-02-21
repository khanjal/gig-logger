import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

export interface MockLocation {
  enabled: boolean;
  latitude: number;
  longitude: number;
  radius: number; // in miles
  name?: string;
}

export interface PresetLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: 'US' | 'CA';
}

@Injectable({
  providedIn: 'root'
})
export class MockLocationService {
  private readonly STORAGE_KEY = 'mockLocation';
  private readonly DEFAULT_RADIUS = 25; // miles
  
  // Preset locations for quick testing
  readonly presetLocations: PresetLocation[] = [
    { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060, country: 'US' },
    { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437, country: 'US' },
    { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298, country: 'US' },
    { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194, country: 'US' },
    { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321, country: 'US' },
    { name: 'Austin, TX', latitude: 30.2672, longitude: -97.7431, country: 'US' },
    { name: 'Boston, MA', latitude: 42.3601, longitude: -71.0589, country: 'US' },
    { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903, country: 'US' },
    { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918, country: 'US' },
    { name: 'Atlanta, GA', latitude: 33.7490, longitude: -84.3880, country: 'US' },
    { name: 'Dallas, TX', latitude: 32.7767, longitude: -96.7970, country: 'US' },
    { name: 'Houston, TX', latitude: 29.7604, longitude: -95.3698, country: 'US' },
    { name: 'Phoenix, AZ', latitude: 33.4484, longitude: -112.0740, country: 'US' },
    { name: 'Philadelphia, PA', latitude: 39.9526, longitude: -75.1652, country: 'US' },
    { name: 'Washington, DC', latitude: 38.9072, longitude: -77.0369, country: 'US' },
    { name: 'Minneapolis, MN', latitude: 44.9778, longitude: -93.2650, country: 'US' },
    { name: 'Las Vegas, NV', latitude: 36.1699, longitude: -115.1398, country: 'US' },
    { name: 'San Diego, CA', latitude: 32.7157, longitude: -117.1611, country: 'US' },
    { name: 'Toronto, ON', latitude: 43.6532, longitude: -79.3832, country: 'CA' },
    { name: 'Vancouver, BC', latitude: 49.2827, longitude: -123.1207, country: 'CA' },
    { name: 'Montreal, QC', latitude: 45.5019, longitude: -73.5674, country: 'CA' },
    { name: 'Calgary, AB', latitude: 51.0447, longitude: -114.0719, country: 'CA' },
    { name: 'Ottawa, ON', latitude: 45.4215, longitude: -75.6972, country: 'CA' },
    { name: 'Edmonton, AB', latitude: 53.5461, longitude: -113.4938, country: 'CA' },
    { name: 'Winnipeg, MB', latitude: 49.8951, longitude: -97.1384, country: 'CA' },
    { name: 'Quebec City, QC', latitude: 46.8139, longitude: -71.2080, country: 'CA' },
    { name: 'Halifax, NS', latitude: 44.6488, longitude: -63.5752, country: 'CA' },
    { name: 'Victoria, BC', latitude: 48.4284, longitude: -123.3656, country: 'CA' }
  ];

  constructor(private logger: LoggerService) {}

  /**
   * Get current mock location settings
   */
  getMockLocation(): MockLocation {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        this.logger.warn('Failed to parse mock location from storage', error);
      }
    }
    
    // Default disabled state
    return {
      enabled: false,
      latitude: 40.7128,
      longitude: -74.0060,
      radius: this.DEFAULT_RADIUS,
      name: 'New York, NY'
    };
  }

  /**
   * Save mock location settings
   */
  saveMockLocation(mockLocation: MockLocation): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockLocation));
      this.logger.info('Mock location saved', mockLocation);
    } catch (error) {
      this.logger.error('Failed to save mock location', error);
    }
  }

  /**
   * Check if mock location is enabled
   */
  isEnabled(): boolean {
    return this.getMockLocation().enabled;
  }

  /**
   * Get mock location coordinates if enabled
   */
  getLocation(): { lat: number; lng: number } | null {
    const mock = this.getMockLocation();
    if (!mock.enabled) {
      return null;
    }
    return {
      lat: mock.latitude,
      lng: mock.longitude
    };
  }

  /**
   * Get search radius in miles
   */
  getRadius(): number {
    return this.getMockLocation().radius;
  }

  /**
   * Enable mock location
   */
  enable(): void {
    const current = this.getMockLocation();
    current.enabled = true;
    this.saveMockLocation(current);
  }

  /**
   * Disable mock location
   */
  disable(): void {
    const current = this.getMockLocation();
    current.enabled = false;
    this.saveMockLocation(current);
  }

  /**
   * Set coordinates
   */
  setCoordinates(latitude: number, longitude: number, name?: string): void {
    const current = this.getMockLocation();
    current.latitude = latitude;
    current.longitude = longitude;
    if (name) {
      current.name = name;
    }
    this.saveMockLocation(current);
  }

  /**
   * Set radius
   */
  setRadius(radius: number): void {
    const current = this.getMockLocation();
    current.radius = radius;
    this.saveMockLocation(current);
  }

  /**
   * Validate latitude (-90 to 90)
   */
  isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  /**
   * Validate longitude (-180 to 180)
   */
  isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  /**
   * Validate radius (1 to 50 miles)
   */
  isValidRadius(radius: number): boolean {
    return radius >= 1 && radius <= 50;
  }

  /**
   * Reset to default settings
   */
  reset(): void {
    const defaultSettings: MockLocation = {
      enabled: false,
      latitude: 40.7128,
      longitude: -74.0060,
      radius: this.DEFAULT_RADIUS,
      name: 'New York, NY'
    };
    this.saveMockLocation(defaultSettings);
  }
}
