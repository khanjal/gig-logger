import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatOptgroup } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { MockLocationService } from '@services/mock-location.service';
import type { IPresetLocation } from '@interfaces/mock-location.interface';
import { BaseCardComponent, BaseInputComponent, BaseFabButtonComponent, BaseRectButtonComponent } from '@components/base';

@Component({
  selector: 'app-location-override',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseCardComponent,
    BaseFabButtonComponent,
    BaseRectButtonComponent,
    BaseInputComponent,
    MatSlideToggle,
    MatIcon,
    MatFormField,
    MatSelect,
    MatLabel,
    MatHint,
    MatOption,
    MatOptgroup
  ],
  templateUrl: './location-override.component.html',
  styleUrl: './location-override.component.scss'
})
export class LocationOverrideComponent implements OnInit {
  @ViewChild('mockLocationCard') mockLocationCard?: ElementRef<HTMLElement>;
  enabled = signal(false);
  latitude = signal(40.7128);
  longitude = signal(-74.0060);
  radius = signal(25);
  locationName = signal('');
  selectedPreset = signal<IPresetLocation | null>(null);
  currentRealLocation = signal<{ lat: number; lng: number } | null>(null);
  gettingLocation = signal(false);

  constructor(
    public mockLocationService: MockLocationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.getCurrentRealLocation();
  }

  get usPresets(): IPresetLocation[] {
    return this.getSortedPresets('US');
  }

  get canadaPresets(): IPresetLocation[] {
    return this.getSortedPresets('CA');
  }

  loadSettings(): void {
    const settings = this.mockLocationService.getMockLocation();
    this.enabled.set(settings.enabled);
    this.latitude.set(settings.latitude);
    this.longitude.set(settings.longitude);
    this.radius.set(settings.radius);
    this.locationName.set(settings.name || '');
    this.selectedPreset.set(this.mockLocationService.presetLocations.find(
      (preset) => preset.latitude === settings.latitude && preset.longitude === settings.longitude
    ) ?? null);
  }

  onToggleChange(): void {
    if (this.enabled()) {
      this.mockLocationService.enable();
      this.saveSettings();
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LOCATION_OVERRIDE_ENABLED, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
    } else {
      this.mockLocationService.disable();
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LOCATION_OVERRIDE_DISABLED, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
    }
  }

  onPresetSelect(preset: IPresetLocation | null): void {
    if (!preset) {
      this.selectedPreset.set(null);
      return;
    }

    this.selectedPreset.set(preset);
    this.latitude.set(preset.latitude);
    this.longitude.set(preset.longitude);
    this.locationName.set(preset.name);
    this.saveSettings();
    openSnackbar(this.snackBar, `Location set to ${preset.name}`, { action: SNACKBAR_DEFAULT_ACTION, duration: 2000 });
  }

  onCoordinatesChange(): void {
    if (this.validateCoordinates()) {
      this.saveSettings();
    }
  }

  onLatitudeChange(value: number): void {
    this.latitude.set(value);
    this.onCoordinatesChange();
  }

  onLongitudeChange(value: number): void {
    this.longitude.set(value);
    this.onCoordinatesChange();
  }

  onRadiusChange(value: number): void {
    if (this.mockLocationService.isValidRadius(value)) {
      this.radius.set(value);
      this.mockLocationService.setRadius(value);
    } else {
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.RADIUS_INVALID, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
    }
  }

  validateCoordinates(): boolean {
    if (!this.mockLocationService.isValidLatitude(this.latitude())) {
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LATITUDE_INVALID, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
      return false;
    }
    if (!this.mockLocationService.isValidLongitude(this.longitude())) {
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LONGITUDE_INVALID, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
      return false;
    }
    return true;
  }

  saveSettings(): void {
    if (this.validateCoordinates()) {
      this.mockLocationService.setCoordinates(this.latitude(), this.longitude(), this.locationName());
      this.mockLocationService.setRadius(this.radius());
    }
  }

  resetToDefaults(): void {
    this.mockLocationService.reset();
    this.loadSettings();
    openSnackbar(this.snackBar, SNACKBAR_MESSAGES.RESET_TO_DEFAULT_SETTINGS, { action: SNACKBAR_DEFAULT_ACTION, duration: 2000 });
    this.scrollToCard();
  }

  async getCurrentRealLocation(): Promise<void> {
    this.gettingLocation.set(true);
    try {
      const position = await this.getRealGeolocation();
      this.currentRealLocation.set({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      this.currentRealLocation.set(null);
    } finally {
      this.gettingLocation.set(false);
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
    if (this.currentRealLocation()) {
      this.latitude.set(this.currentRealLocation()!.lat);
      this.longitude.set(this.currentRealLocation()!.lng);
      this.locationName.set('Current Location');
      this.saveSettings();
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.USING_CURRENT_REAL_LOCATION, { action: SNACKBAR_DEFAULT_ACTION, duration: 2000 });
    }
  }

  formatCoordinate(value: number): string {
    return value.toFixed(3);
  }

  private scrollToCard(): void {
    setTimeout(() => {
      this.mockLocationCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  private getSortedPresets(country: 'US' | 'CA'): IPresetLocation[] {
    return this.mockLocationService.presetLocations
      .filter((preset) => preset.country === country)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
