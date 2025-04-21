import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';

@Component({
  selector: 'app-service-worker-status',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './service-worker-status.component.html',
  styleUrl: './service-worker-status.component.scss',
})
export class ServiceWorkerStatusComponent {
  serviceWorkerStatus: string = 'Checking...';
  isUpdateAvailable: boolean = false;

  constructor(private swUpdate: SwUpdate) {}

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

  updateApp(): void {
    if ('caches' in window) {
      // Clear all caches
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName).then(deleted => {
            if (deleted) {
              console.log(`Cache ${cacheName} deleted successfully.`);
            }
          });
        });
      }).finally(() => {
        // Unregister the service worker
        if (navigator.serviceWorker) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
              registration.unregister().then(unregistered => {
                if (unregistered) {
                  console.log('Service worker unregistered successfully.');
                }
              });
            });
          }).finally(() => {
            console.log('All caches cleared and service worker unregistered. Reloading the page...');
            document.location.reload();
          });
        } else {
          console.warn('Service Worker API not supported in this browser.');
          document.location.reload();
        }
      });
    } else {
      console.warn('Caches API not supported in this browser.');
      document.location.reload();
    }
  }
}