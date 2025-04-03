import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SwPush, SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';

@Component({
  selector: 'app-service-worker-status',
  standalone: true,
  imports: [CommonModule, MatIconModule],
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

    // Listen for version updates
    this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
      if (event.type === 'VERSION_READY') {
        const versionReadyEvent = event as VersionReadyEvent;
        console.log(`New version available: ${versionReadyEvent.latestVersion.hash}`);
        this.serviceWorkerStatus = 'Update Available';
        this.isUpdateAvailable = true;
      }
    });
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
