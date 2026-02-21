/**
 * AppUpdateService - Centralized service for handling PWA app updates
 * 
 * This service provides a unified interface for checking, managing, and applying
 * Progressive Web App updates using Angular's Service Worker functionality.
 * 
 * Features:
 * - Automatic update checking on service initialization
 * - Observable stream of update status changes
 * - Manual update checking
 * - Update activation with automatic reload
 * - Force cache clearing for troubleshooting
 * 
 * Usage:
 * ```typescript
 * constructor(private appUpdateService: AppUpdateService) {}
 * 
 * ngOnInit() {
 *   this.appUpdateService.updateStatus$.subscribe(status => {
 *     if (status.isUpdateAvailable) {
 *       // Show update notification
 *     }
 *   });
 * }
 * ```
 * 
 * @author GitHub Copilot
 * @since 2025-06-10
 */
import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { LoggerService } from './logger.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { IAppUpdateStatus } from '@interfaces/app-update-status.interface';

/**
 * @deprecated Use IAppUpdateStatus from @interfaces/app-update-status.interface instead
 */
export type AppUpdateStatus = IAppUpdateStatus;

@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  private swUpdate = inject(SwUpdate);
  private logger = inject(LoggerService);

  private updateStatusSubject = new BehaviorSubject<AppUpdateStatus>({
    isUpdateAvailable: false,
    isEnabled: false
  });

  private versionUpdateSubscription: Subscription | undefined;

  public readonly updateStatus$: Observable<AppUpdateStatus> = this.updateStatusSubject.asObservable();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (this.swUpdate.isEnabled) {
        this.updateStatusSubject.next({
          ...this.updateStatusSubject.value,
          isEnabled: true
        });

        // Listen for version updates
        this.versionUpdateSubscription = this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
          if (event.type === 'VERSION_READY') {
            const versionReadyEvent = event as VersionReadyEvent;
            this.logger.info(`New version available: ${versionReadyEvent.latestVersion.hash}`);
            
            this.updateStatusSubject.next({
              isUpdateAvailable: true,
              isEnabled: true,
              currentVersion: versionReadyEvent.currentVersion.hash,
              latestVersion: versionReadyEvent.latestVersion.hash
            });
          }
        });

        // Check for update immediately
        await this.checkForUpdate();
      } else {
        this.logger.info('Service Worker is not enabled');
        this.updateStatusSubject.next({
          isUpdateAvailable: false,
          isEnabled: false
        });
      }
    } catch (error) {
      this.logger.error('Error initializing app update service', error);
    }
  }

  /**
   * Manually check for updates
   */
  public async checkForUpdate(): Promise<boolean> {
    try {
      if (this.swUpdate.isEnabled) {
        const updateFound = await this.swUpdate.checkForUpdate();
        this.logger.info(`Update check completed. Update found: ${updateFound}`);
        return updateFound;
      }
      return false;
    } catch (error) {
      this.logger.error('Error checking for updates', error);
      return false;
    }
  }

  /**
   * Activate the pending update and reload the app
   */
  public async activateUpdate(): Promise<void> {
    try {
      if (this.swUpdate.isEnabled && this.updateStatusSubject.value.isUpdateAvailable) {
        await this.swUpdate.activateUpdate();
        this.logger.info('Update activated, reloading app...');
        document.location.reload();
      } else {
        this.logger.warn('No update available to activate');
      }
    } catch (error) {
      this.logger.error('Error activating update', error);
      throw error;
    }
  }

  /**
   * Get current update status
   */
  public getCurrentStatus(): AppUpdateStatus {
    return this.updateStatusSubject.value;
  }

  /**
   * Clear the cache and force reload (for troubleshooting)
   */
  public async forceCacheUpdate(): Promise<void> {
    if ('caches' in window) {
      try {
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        this.logger.info('All caches cleared');

        // Unregister service workers
        if (navigator.serviceWorker) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
          this.logger.info('Service workers unregistered');
        }

        this.logger.info('Cache cleared and service worker unregistered. Reloading...');
        document.location.reload();
      } catch (error) {
        this.logger.error('Error during force cache update', error);
        document.location.reload();
      }
    } else {
      this.logger.warn('Caches API not supported in this browser.');
      document.location.reload();
    }
  }

  /**
   * Clean up subscriptions
   */
  public destroy(): void {
    if (this.versionUpdateSubscription) {
      this.versionUpdateSubscription.unsubscribe();
    }
  }
}
