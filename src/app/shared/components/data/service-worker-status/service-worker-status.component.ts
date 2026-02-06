import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '@services/logger.service';
import { AppUpdateService, AppUpdateStatus } from '@services/app-update.service';
import { Subscription } from 'rxjs';
import { Inject } from '@angular/core';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-service-worker-status',
  standalone: true,
  imports: [CommonModule, BaseButtonComponent],
  templateUrl: './service-worker-status.component.html',
})
export class ServiceWorkerStatusComponent implements OnInit, OnDestroy {
  serviceWorkerStatus: string = 'Checking...';
  isUpdateAvailable: boolean = false;
  showInstallButton: boolean = false;
  isOnline: boolean = navigator.onLine;
  private updateStatusSubscription: Subscription | undefined;
  private deferredPrompt: any;

  constructor(
    @Inject(AppUpdateService) private appUpdateService: AppUpdateService,
    private logger: LoggerService
  ) {}
  
  async ngOnInit(): Promise<void> {
    // Subscribe to app update status
    this.updateStatusSubscription = this.appUpdateService.updateStatus$.subscribe(
      (status: AppUpdateStatus) => {
        this.isUpdateAvailable = status.isUpdateAvailable;
        
        if (status.isEnabled) {
          this.serviceWorkerStatus = status.isUpdateAvailable ? 'Update Available' : 'Active';
        } else {
          this.serviceWorkerStatus = 'Not Enabled';
        }
      }
    );

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
      this.isOnline = false;
      this.serviceWorkerStatus = 'Offline';
    });

    window.addEventListener('online', () => {
      this.isOnline = true;
      // Restore previous status when coming back online
      const currentStatus = this.appUpdateService.getCurrentStatus();
      if (currentStatus.isEnabled) {
        this.serviceWorkerStatus = currentStatus.isUpdateAvailable ? 'Update Available' : 'Active';
      } else {
        this.serviceWorkerStatus = 'Not Enabled';
      }
    });
  }
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.updateStatusSubscription) {
      this.updateStatusSubscription.unsubscribe();
    }
  }
    // Trigger an update if available
  async updateApp(): Promise<void> {
    try {
      await this.appUpdateService.activateUpdate();
    } catch (error) {
      this.logger.error('Error updating app', error);
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

  async forceCacheUpdate(): Promise<void> {
    // Check for internet connectivity before attempting cache update
    if (!navigator.onLine) {
      this.logger.warn('Cannot force cache update - no internet connectivity');
      // Optionally show a user-friendly message here
      return;
    }

    try {
      this.logger.info('Starting force cache update...');
      await this.appUpdateService.forceCacheUpdate();
      this.logger.info('Force cache update completed successfully');
    } catch (error) {
      this.logger.error('Error during force cache update', error);
    }
  }
}