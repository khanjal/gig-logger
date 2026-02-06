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
}

@Injectable({
  providedIn: 'root'
})
export class MockLocationService {
  private readonly STORAGE_KEY = 'mockLocation';
  private readonly DEFAULT_RADIUS = 25; // miles
  
  // Preset locations for quick testing
  readonly presetLocations: PresetLocation[] = [
    { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 },
    { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437 },
    { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298 },
    { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
    { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321 },
    { name: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
    { name: 'Boston, MA', latitude: 42.3601, longitude: -71.0589 },
    { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903 },
    { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918 },
    { name: 'Portland, OR', latitude: 45.5152, longitude: -122.6784 }
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
