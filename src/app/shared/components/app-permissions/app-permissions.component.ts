import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

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
  templateUrl: './app-permissions.component.html',
  styleUrls: ['./app-permissions.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule]
})
export class AppPermissionsComponent implements OnInit {
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

  async ngOnInit() {
    await this.checkLocationPermission();
    await this.checkMicrophonePermission();
  }

  async checkLocationPermission() {
    if (!('permissions' in navigator)) {
      this.locationPermission.state = 'unsupported';
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      this.updateLocationPermissionState(result.state as PermissionState);
      
      result.onchange = () => {
        this.updateLocationPermissionState(result.state as PermissionState);
      };
    } catch (error) {
      this.locationPermission.state = 'unsupported';
    }
  }

  async checkMicrophonePermission() {
    if (!('permissions' in navigator)) {
      this.microphonePermission.state = 'unsupported';
      return;
    }

    try {
      // Try to query microphone permission
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      this.updateMicrophonePermissionState(result.state as PermissionState);
      
      result.onchange = () => {
        this.updateMicrophonePermissionState(result.state as PermissionState);
      };
    } catch (error) {
      // If query fails, check if we have media devices API
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        // We can't query the permission, but we can try to request it
        this.microphonePermission.state = 'prompt';
        this.microphonePermission.canRequest = true;
      } else {
        this.microphonePermission.state = 'unsupported';
      }
    }
  }

  private updateLocationPermissionState(state: PermissionState) {
    this.locationPermission.state = state;
    this.locationPermission.canRequest = state === 'prompt';
    this.locationPermission.canRevoke = false; // Browser doesn't support programmatic revocation
  }

  private updateMicrophonePermissionState(state: PermissionState) {
    this.microphonePermission.state = state;
    this.microphonePermission.canRequest = state === 'prompt';
    this.microphonePermission.canRevoke = false; // Browser doesn't support programmatic revocation
  }

  async requestLocation() {
    try {
      await navigator.geolocation.getCurrentPosition(
        () => {
          this.locationPermission.state = 'granted';
          this.locationPermission.canRequest = false;
        },
        () => {
          this.locationPermission.state = 'denied';
          this.locationPermission.canRequest = false;
        }
      );
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  }

  async requestMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      this.microphonePermission.state = 'granted';
      this.microphonePermission.canRequest = false;
    } catch (error) {
      this.microphonePermission.state = 'denied';
      this.microphonePermission.canRequest = false;
      console.error('Error requesting microphone:', error);
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
