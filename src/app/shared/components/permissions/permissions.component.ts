import { Component, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { LoggerService } from '@services/logger.service';
import { PermissionService } from '@services/permission.service';
import { CommonModule } from '@angular/common';
import { BaseCardComponent, BaseRectButtonComponent } from '@components/base';
import { MatIcon } from '@angular/material/icon';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'checking';

interface PermissionStatus {
  name: string;
  icon: string;
  state: PermissionState;
  description: string;
  canRequest: boolean;
  canRevoke: boolean;
}

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
  standalone: true,
  imports: [CommonModule, BaseCardComponent, BaseRectButtonComponent, MatIcon, MatDividerModule]
})
export class PermissionsComponent implements OnInit {
  locationPermission: PermissionStatus = {
    name: 'Location',
    icon: 'location_on',
    state: 'checking',
    description: 'Used to search for nearby places and addresses',
    canRequest: false,
    canRevoke: false
  };

  microphonePermission: PermissionStatus = {
    name: 'Microphone',
    icon: 'mic',
    state: 'checking',
    description: 'Used for voice input when adding trips',
    canRequest: false,
    canRevoke: false
  };

  constructor(private logger: LoggerService, private _permissionService: PermissionService) {}

  async ngOnInit() {
    this.updateLocationPermissionState(this._permissionService.getLocationState());
    this.updateMicrophonePermissionState(this._permissionService.getMicrophoneState());

    this._permissionService.getLocationState$().subscribe(state => this.updateLocationPermissionState(state));
    this._permissionService.getMicrophoneState$().subscribe(state => this.updateMicrophonePermissionState(state));
  }

  private updateLocationPermissionState(state: PermissionState) {
    this.locationPermission.state = state;
    this.locationPermission.canRequest = state === 'prompt';
    this.locationPermission.canRevoke = false;
  }

  private updateMicrophonePermissionState(state: PermissionState) {
    this.microphonePermission.state = state;
    this.microphonePermission.canRequest = state === 'prompt';
    this.microphonePermission.canRevoke = false;
  }

  async requestLocation() {
    try {
      const state = await this._permissionService.requestLocation();
      this.updateLocationPermissionState(state);
    } catch (error) {
      this.logger.error('Error requesting location:', error);
    }
  }

  async requestMicrophone() {
    try {
      const state = await this._permissionService.requestMicrophone();
      this.updateMicrophonePermissionState(state);
    } catch (error) {
      this.logger.error('Error requesting microphone:', error);
    }
  }

  getStateColor(state: PermissionState): string {
    switch (state) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      case 'prompt':
        return 'text-yellow-600';
      case 'checking':
        return 'text-gray-500';
      case 'unsupported':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  }

  getStateIcon(state: PermissionState): string {
    switch (state) {
      case 'granted':
        return 'check_circle';
      case 'denied':
        return 'cancel';
      case 'prompt':
        return 'help';
      case 'checking':
        return 'hourglass_empty';
      case 'unsupported':
        return 'block';
      default:
        return 'help';
    }
  }

  getStateText(state: PermissionState): string {
    switch (state) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'prompt':
        return 'Not Requested';
      case 'checking':
        return 'Checking...';
      case 'unsupported':
        return 'Not Supported';
      default:
        return 'Unknown';
    }
  }

  openBrowserSettings() {
    alert('To change permissions:\n\n1. Click the lock icon in your browser\'s address bar\n2. Find the permission you want to change\n3. Select "Allow" or "Block"\n4. Refresh this page');
  }
}
