import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SwPush, SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-service-worker-status',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './service-worker-status.component.html',
  styleUrl: './service-worker-status.component.scss'
})
export class ServiceWorkerStatusComponent {
  serviceWorkerStatus: string = 'Checking...';
  isUpdateAvailable: boolean = false;

  constructor(
    private swUpdate: SwUpdate, 
    private swPush: SwPush
  ) { }

  async ngOnInit(): Promise<void> {
    // Check if the service worker is enabled
    if (this.swUpdate.isEnabled) {
      this.serviceWorkerStatus = 'Active';

      // Listen for updates
      // this.swUpdate.available.subscribe(() => {
      //   this.serviceWorkerStatus = 'Update Available';
      //   this.isUpdateAvailable = true;
      // });

      // this.swUpdate.activated.subscribe(() => {
      //   this.serviceWorkerStatus = 'Updated';
      // });
    } else {
      this.serviceWorkerStatus = 'Not Enabled';
    }

    // Check if the app is offline
    window.addEventListener('offline', () => {
      this.serviceWorkerStatus = 'Offline';
    });

    window.addEventListener('online', () => {
      this.serviceWorkerStatus = 'Online';
    });
    }

    
  // Trigger an update if available
  updateApp(): void {
    if (this.isUpdateAvailable) {
      this.swUpdate.activateUpdate().then(() => {
        document.location.reload();
      });
    }
  }
}
