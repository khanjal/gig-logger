import { TestBed } from '@angular/core/testing';
import { MockLocationService } from './mock-location.service';
import { LoggerService } from './logger.service';

describe('MockLocationService', () => {
  let service: MockLocationService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const logger = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error']);
    
    TestBed.configureTestingModule({
      providers: [
        MockLocationService,
        { provide: LoggerService, useValue: logger }
      ]
    });
    
    service = TestBed.inject(MockLocationService);
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default mock location when not set', () => {
    const mockLocation = service.getMockLocation();
    expect(mockLocation.enabled).toBe(false);
    expect(mockLocation.latitude).toBe(40.7128);
    expect(mockLocation.longitude).toBe(-74.0060);
    expect(mockLocation.radius).toBe(25);
  });

  it('should save and retrieve mock location', () => {
    const testLocation = {
      enabled: true,
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 30,
      name: 'Los Angeles'
    };
    
    service.saveMockLocation(testLocation);
    const retrieved = service.getMockLocation();
    
    expect(retrieved).toEqual(testLocation);
  });

  it('should validate latitude correctly', () => {
    expect(service.isValidLatitude(0)).toBe(true);
    expect(service.isValidLatitude(45)).toBe(true);
    expect(service.isValidLatitude(-45)).toBe(true);
    expect(service.isValidLatitude(90)).toBe(true);
    expect(service.isValidLatitude(-90)).toBe(true);
    expect(service.isValidLatitude(91)).toBe(false);
    expect(service.isValidLatitude(-91)).toBe(false);
  });

  it('should validate longitude correctly', () => {
    expect(service.isValidLongitude(0)).toBe(true);
    expect(service.isValidLongitude(90)).toBe(true);
    expect(service.isValidLongitude(-90)).toBe(true);
    expect(service.isValidLongitude(180)).toBe(true);
    expect(service.isValidLongitude(-180)).toBe(true);
    expect(service.isValidLongitude(181)).toBe(false);
    expect(service.isValidLongitude(-181)).toBe(false);
  });

  it('should validate radius correctly', () => {
    expect(service.isValidRadius(1)).toBe(true);
    expect(service.isValidRadius(25)).toBe(true);
    expect(service.isValidRadius(50)).toBe(true);
    expect(service.isValidRadius(0)).toBe(false);
    expect(service.isValidRadius(51)).toBe(false);
  });

  it('should enable mock location', () => {
    service.enable();
    expect(service.isEnabled()).toBe(true);
  });

  it('should disable mock location', () => {
    service.enable();
    expect(service.isEnabled()).toBe(true);
    
    service.disable();
    expect(service.isEnabled()).toBe(false);
  });

  it('should get location when enabled', () => {
    service.setCoordinates(40.7128, -74.0060);
    service.enable();
    
    const location = service.getLocation();
    expect(location).toEqual({ lat: 40.7128, lng: -74.0060 });
  });

  it('should return null when disabled', () => {
    service.setCoordinates(40.7128, -74.0060);
    service.disable();
    
    const location = service.getLocation();
    expect(location).toBeNull();
  });

  it('should set coordinates', () => {
    service.setCoordinates(34.0522, -118.2437, 'Los Angeles');
    const mockLocation = service.getMockLocation();
    
    expect(mockLocation.latitude).toBe(34.0522);
    expect(mockLocation.longitude).toBe(-118.2437);
    expect(mockLocation.name).toBe('Los Angeles');
  });

  it('should set radius', () => {
    service.setRadius(35);
    expect(service.getRadius()).toBe(35);
  });

  it('should reset to defaults', () => {
    service.setCoordinates(50, 50);
    service.setRadius(40);
    service.enable();
    
    service.reset();
    
    const mockLocation = service.getMockLocation();
    expect(mockLocation.enabled).toBe(false);
    expect(mockLocation.latitude).toBe(40.7128);
    expect(mockLocation.longitude).toBe(-74.0060);
    expect(mockLocation.radius).toBe(25);
  });

  it('should have preset locations', () => {
    expect(service.presetLocations.length).toBeGreaterThan(0);
    expect(service.presetLocations[0].name).toBe('New York, NY');
  });
});
