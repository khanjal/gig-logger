import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { LoggerService } from '@services/logger.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-service-worker-status',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './service-worker-status.component.html',
  styleUrl: './service-worker-status.component.scss',
})
export class ServiceWorkerStatusComponent implements OnInit, OnDestroy {
  serviceWorkerStatus: string = 'Checking...';
  isUpdateAvailable: boolean = false;
  showInstallButton: boolean = false;
  private versionUpdateSubscription: Subscription | undefined;
  private deferredPrompt: any;

  constructor(
    private swUpdate: SwUpdate,
    private logger: LoggerService
  ) {}
  async ngOnInit(): Promise<void> {
    // Check if the service worker is enabled
    if (this.swUpdate.isEnabled) {
      this.serviceWorkerStatus = 'Active';      // Listen for version updates
      this.versionUpdateSubscription = this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
        if (event.type === 'VERSION_READY') {
          const versionReadyEvent = event as VersionReadyEvent;
          this.logger.info(`New version available: ${versionReadyEvent.latestVersion.hash}`);
          this.serviceWorkerStatus = 'Update Available';
          this.isUpdateAvailable = true;
        }
      });
    } else {
      this.serviceWorkerStatus = 'Not Enabled';
    }

    // Listen for the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton = true;
      this.logger.info('PWA install prompt available');
    });

    // Hide button if already installed
    window.addEventListener('appinstalled', () => {
      this.showInstallButton = false;
      this.logger.info('PWA installed successfully');
    });

    // Check if the app is offline
    window.addEventListener('offline', () => {
      this.serviceWorkerStatus = 'Offline';
    });

    window.addEventListener('online', () => {
      this.serviceWorkerStatus = 'Online';
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.versionUpdateSubscription) {
      this.versionUpdateSubscription.unsubscribe();
    }
  }
    // Trigger an update if available
  updateApp(): void {
    if (this.isUpdateAvailable) {
      this.swUpdate.activateUpdate().then(() => {
        document.location.reload();
      });
    }
  }

  // Install the PWA if prompt is available
  async installApp(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.logger.info('PWA installed successfully');
      } else {
        this.logger.info('PWA installation declined');
      }
      this.deferredPrompt = null;
      this.showInstallButton = false;
    }
  }
  forceCacheUpdate(): void {
    if ('caches' in window) {
      // Clear all caches
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName).then(deleted => {
            if (deleted) {
              this.logger.debug(`Cache ${cacheName} deleted successfully.`);
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
                  this.logger.debug('Service worker unregistered successfully.');
                }
              });
            });
          }).finally(() => {
            this.logger.info('All caches cleared and service worker unregistered. Reloading the page...');
            document.location.reload();
          });
        } else {
          this.logger.warn('Service Worker API not supported in this browser.');
          document.location.reload();
        }
      });
    } else {
      this.logger.warn('Caches API not supported in this browser.');
      document.location.reload();
    }
  }
}