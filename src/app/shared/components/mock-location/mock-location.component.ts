import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MockLocationService, PresetLocation } from '@services/mock-location.service';

@Component({
  selector: 'app-mock-location',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatSlideToggle,
    MatIcon,
    MatButton
  ],
  templateUrl: './mock-location.component.html',
  styleUrl: './mock-location.component.scss'
})
export class MockLocationComponent implements OnInit {
  enabled = false;
  latitude = 40.7128;
  longitude = -74.0060;
  radius = 25;
  locationName = '';
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

  loadSettings(): void {
    const settings = this.mockLocationService.getMockLocation();
    this.enabled = settings.enabled;
    this.latitude = settings.latitude;
    this.longitude = settings.longitude;
    this.radius = settings.radius;
    this.locationName = settings.name || '';
  }

  onToggleChange(): void {
    if (this.enabled) {
      this.mockLocationService.enable();
      this.saveSettings();
      this.snackBar.open('Mock location enabled', 'Dismiss', { duration: 3000 });
    } else {
      this.mockLocationService.disable();
      this.snackBar.open('Mock location disabled - using real location', 'Dismiss', { duration: 3000 });
    }
  }

  onPresetSelect(preset: PresetLocation): void {
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
    return value.toFixed(6);
  }
}
