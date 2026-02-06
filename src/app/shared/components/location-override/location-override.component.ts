import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatOptgroup } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MockLocationService, PresetLocation } from '@services/mock-location.service';
import { BaseButtonComponent, BaseCardComponent, BaseInputComponent } from '@components/base';

@Component({
  selector: 'app-location-override',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseCardComponent,
    BaseButtonComponent,
    BaseInputComponent,
    MatSlideToggle,
    MatIcon,
    MatFormField,
    MatSelect,
    MatLabel,
    MatOption,
    MatOptgroup
  ],
  templateUrl: './location-override.component.html',
  styleUrl: './location-override.component.scss'
})
export class LocationOverrideComponent implements OnInit {
  @ViewChild('mockLocationCard') mockLocationCard?: ElementRef<HTMLElement>;
  enabled = false;
  latitude = 40.7128;
  longitude = -74.0060;
  radius = 25;
  locationName = '';
  selectedPreset: PresetLocation | null = null;
  currentRealLocation: { lat: number; lng: number } | null = null;
  gettingLocation = false;

  constructor(
    public mockLocationService: MockLocationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.getCurrentRealLocation();
  }

  get usPresets(): PresetLocation[] {
    return this.getSortedPresets('US');
  }

  get canadaPresets(): PresetLocation[] {
    return this.getSortedPresets('CA');
  }

  loadSettings(): void {
    const settings = this.mockLocationService.getMockLocation();
    this.enabled = settings.enabled;
    this.latitude = settings.latitude;
    this.longitude = settings.longitude;
    this.radius = settings.radius;
    this.locationName = settings.name || '';
    this.selectedPreset = this.mockLocationService.presetLocations.find(
      (preset) => preset.latitude === settings.latitude && preset.longitude === settings.longitude
    ) ?? null;
  }

  onToggleChange(): void {
    if (this.enabled) {
      this.mockLocationService.enable();
      this.saveSettings();
      this.snackBar.open('Location override enabled', 'Dismiss', { duration: 3000 });
    } else {
      this.mockLocationService.disable();
      this.snackBar.open('Location override disabled - using real location', 'Dismiss', { duration: 3000 });
    }
  }

  onPresetSelect(preset: PresetLocation | null): void {
    if (!preset) {
      this.selectedPreset = null;
      return;
    }

    this.selectedPreset = preset;
    this.latitude = preset.latitude;
    this.longitude = preset.longitude;
    this.locationName = preset.name;
    this.saveSettings();
    this.snackBar.open(`Location set to ${preset.name}`, 'Dismiss', { duration: 2000 });
  }

  onCoordinatesChange(): void {
    if (this.validateCoordinates()) {
      this.saveSettings();
    }
  }

  onRadiusChange(): void {
    if (this.mockLocationService.isValidRadius(this.radius)) {
      this.mockLocationService.setRadius(this.radius);
    } else {
      this.snackBar.open('Radius must be between 1 and 50 miles', 'Dismiss', { duration: 3000 });
    }
  }

  validateCoordinates(): boolean {
    if (!this.mockLocationService.isValidLatitude(this.latitude)) {
      this.snackBar.open('Latitude must be between -90 and 90', 'Dismiss', { duration: 3000 });
      return false;
    }
    if (!this.mockLocationService.isValidLongitude(this.longitude)) {
      this.snackBar.open('Longitude must be between -180 and 180', 'Dismiss', { duration: 3000 });
      return false;
    }
    return true;
  }

  saveSettings(): void {
    if (this.validateCoordinates()) {
      this.mockLocationService.setCoordinates(this.latitude, this.longitude, this.locationName);
      this.mockLocationService.setRadius(this.radius);
    }
  }

  resetToDefaults(): void {
    this.mockLocationService.reset();
    this.loadSettings();
    this.snackBar.open('Reset to default settings', 'Dismiss', { duration: 2000 });
    this.scrollToCard();
  }

  async getCurrentRealLocation(): Promise<void> {
    this.gettingLocation = true;
    try {
      const position = await this.getRealGeolocation();
      this.currentRealLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      this.currentRealLocation = null;
    } finally {
      this.gettingLocation = false;
    }
  }

  private getRealGeolocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
    });
  }

  useCurrentLocation(): void {
    if (this.currentRealLocation) {
      this.latitude = this.currentRealLocation.lat;
      this.longitude = this.currentRealLocation.lng;
      this.locationName = 'Current Location';
      this.saveSettings();
      this.snackBar.open('Using current real location', 'Dismiss', { duration: 2000 });
    }
  }

  formatCoordinate(value: number): string {
    return value.toFixed(3);
  }

  private scrollToCard(): void {
    setTimeout(() => {
      const cardElement = document.getElementById('mock-location-card');
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  private getSortedPresets(country: 'US' | 'CA'): PresetLocation[] {
    return this.mockLocationService.presetLocations
      .filter((preset) => preset.country === country)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
