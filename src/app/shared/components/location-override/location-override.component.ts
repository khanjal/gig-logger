import type { ElementRef, OnInit} from '@angular/core';
import { Component, ViewChild, signal, inject } from '@angular/core';
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
import type { IPresetLocation } from '@interfaces/external/mock-location.interface';
import { BaseCardComponent, BaseInputComponent, BaseFabButtonComponent, BaseRectButtonComponent } from '@components/base';

@Component({
  selector: 'app-location-override',
  standalone: true,
  imports: [
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
  public mockLocationService = inject(MockLocationService);
  private snackBar = inject(MatSnackBar);

  @ViewChild('mockLocationCard') public mockLocationCard?: ElementRef<HTMLElement>;
  public enabled = signal(false);
  public latitude = signal(40.7128);
  public longitude = signal(-74.0060);
  public radius = signal(25);
  public locationName = signal('');
  public selectedPreset = signal<IPresetLocation | null>(null);
  public currentRealLocation = signal<{ lat: number; lng: number } | null>(null);
  public gettingLocation = signal(false);

  public ngOnInit(): void {
    this.loadSettings();
    this.getCurrentRealLocation();
  }

  public get usPresets(): IPresetLocation[] {
    return this.getSortedPresets('US');
  }

  public get canadaPresets(): IPresetLocation[] {
    return this.getSortedPresets('CA');
  }

  public loadSettings(): void {
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

  public onToggleChange(): void {
    if (this.enabled()) {
      this.mockLocationService.enable();
      this.saveSettings();
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LOCATION_OVERRIDE_ENABLED, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
    } else {
      this.mockLocationService.disable();
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LOCATION_OVERRIDE_DISABLED, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
    }
  }

  public onPresetSelect(preset: IPresetLocation | null): void {
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

  public onCoordinatesChange(): void {
    if (this.validateCoordinates()) {
      this.saveSettings();
    }
  }

  public onLatitudeChange(value: number): void {
    this.latitude.set(value);
    this.onCoordinatesChange();
  }

  public onLongitudeChange(value: number): void {
    this.longitude.set(value);
    this.onCoordinatesChange();
  }

  public onRadiusChange(value: number): void {
    if (this.mockLocationService.isValidRadius(value)) {
      this.radius.set(value);
      this.mockLocationService.setRadius(value);
    } else {
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.RADIUS_INVALID, { action: SNACKBAR_DEFAULT_ACTION, duration: 3000 });
    }
  }

  public validateCoordinates(): boolean {
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

  public saveSettings(): void {
    if (this.validateCoordinates()) {
      this.mockLocationService.setCoordinates(this.latitude(), this.longitude(), this.locationName());
      this.mockLocationService.setRadius(this.radius());
    }
  }

  public resetToDefaults(): void {
    this.mockLocationService.reset();
    this.loadSettings();
    openSnackbar(this.snackBar, SNACKBAR_MESSAGES.RESET_TO_DEFAULT_SETTINGS, { action: SNACKBAR_DEFAULT_ACTION, duration: 2000 });
    this.scrollToCard();
  }

  public async getCurrentRealLocation(): Promise<void> {
    this.gettingLocation.set(true);
    try {
      const position = await this.getRealGeolocation();
      this.currentRealLocation.set({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch {
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

  public useCurrentLocation(): void {
    if (this.currentRealLocation()) {
      this.latitude.set(this.currentRealLocation()!.lat);
      this.longitude.set(this.currentRealLocation()!.lng);
      this.locationName.set('Current Location');
      this.saveSettings();
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.USING_CURRENT_REAL_LOCATION, { action: SNACKBAR_DEFAULT_ACTION, duration: 2000 });
    }
  }

  public formatCoordinate(value: number): string {
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
