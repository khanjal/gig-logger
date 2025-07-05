import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-location-permission',
  templateUrl: './location-permission.component.html',
  styleUrls: ['./location-permission.component.scss']
})
export class LocationPermissionComponent implements OnInit {
  permissionState: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';

  ngOnInit() {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        this.permissionState = result.state as any;
        result.onchange = () => {
          this.permissionState = result.state as any;
        };
      });
    } else {
      this.permissionState = 'unsupported';
    }
  }

  requestLocation() {
    if (this.permissionState === 'prompt') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.permissionState = 'granted';
        },
        (error) => {
          this.permissionState = 'denied';
        }
      );
    }
  }
}
