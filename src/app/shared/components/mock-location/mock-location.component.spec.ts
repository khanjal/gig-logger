import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MockLocationComponent } from './mock-location.component';
import { MockLocationService } from '../../services/mock-location.service';

describe('MockLocationComponent', () => {
  let component: MockLocationComponent;
  let fixture: ComponentFixture<MockLocationComponent>;
  let mockLocationServiceSpy: jasmine.SpyObj<MockLocationService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const mockLocationSpy = jasmine.createSpyObj('MockLocationService', [
      'getMockLocation',
      'enable',
      'disable',
      'setCoordinates',
      'setRadius',
      'isValidLatitude',
      'isValidLongitude',
      'isValidRadius',
      'reset'
    ]);
    
    mockLocationSpy.presetLocations = [
      { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 }
    ];
    
    mockLocationSpy.getMockLocation.and.returnValue({
      enabled: false,
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 25,
      name: 'New York, NY'
    });

    const snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [MockLocationComponent, FormsModule],
      providers: [
        { provide: MockLocationService, useValue: mockLocationSpy },
        { provide: MatSnackBar, useValue: snackBar }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MockLocationComponent);
    component = fixture.componentInstance;
    mockLocationServiceSpy = TestBed.inject(MockLocationService) as jasmine.SpyObj<MockLocationService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', () => {
    fixture.detectChanges();
    
    expect(component.latitude).toBe(40.7128);
    expect(component.longitude).toBe(-74.0060);
    expect(component.radius).toBe(25);
  });

  it('should enable mock location when toggled on', () => {
    component.enabled = true;
    mockLocationServiceSpy.isValidLatitude.and.returnValue(true);
    mockLocationServiceSpy.isValidLongitude.and.returnValue(true);
    
    component.onToggleChange();
    
    expect(mockLocationServiceSpy.enable).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Mock location enabled', 'Dismiss', { duration: 3000 });
  });

  it('should disable mock location when toggled off', () => {
    component.enabled = false;
    
    component.onToggleChange();
    
    expect(mockLocationServiceSpy.disable).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Mock location disabled - using real location', 'Dismiss', { duration: 3000 });
  });

  it('should set coordinates from preset', () => {
    const preset = { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437 };
    mockLocationServiceSpy.isValidLatitude.and.returnValue(true);
    mockLocationServiceSpy.isValidLongitude.and.returnValue(true);
    
    component.onPresetSelect(preset);
    
    expect(component.latitude).toBe(34.0522);
    expect(component.longitude).toBe(-118.2437);
    expect(component.locationName).toBe('Los Angeles, CA');
  });

  it('should validate coordinates', () => {
    mockLocationServiceSpy.isValidLatitude.and.returnValue(true);
    mockLocationServiceSpy.isValidLongitude.and.returnValue(true);
    
    const result = component.validateCoordinates();
    
    expect(result).toBe(true);
  });

  it('should show error for invalid latitude', () => {
    mockLocationServiceSpy.isValidLatitude.and.returnValue(false);
    
    const result = component.validateCoordinates();
    
    expect(result).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Latitude must be between -90 and 90', 'Dismiss', { duration: 3000 });
  });

  it('should format coordinates', () => {
    const formatted = component.formatCoordinate(40.712345678);
    expect(formatted).toBe('40.712346');
  });

  it('should reset to defaults', () => {
    component.resetToDefaults();
    
    expect(mockLocationServiceSpy.reset).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Reset to default settings', 'Dismiss', { duration: 2000 });
  });
});
