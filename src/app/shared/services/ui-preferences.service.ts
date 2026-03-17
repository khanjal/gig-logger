import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PollingService } from '@services/polling.service';
import { LoggerService } from '@services/logger.service';
import { SESSION_CONSTANTS } from '@constants/session.constants';

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  private pollingKey = SESSION_CONSTANTS.POLLING_ENABLED;
  private readonly LEGACY_POLLING_KEY = 'pollingEnabled';
  private _pollingEnabled$ = new BehaviorSubject<boolean>(this.loadPolling());
  public pollingEnabled$ = this._pollingEnabled$.asObservable();

  constructor(private _pollingService: PollingService, private logger: LoggerService) {
    // Keep polling service in sync when preference changes
    this._pollingEnabled$.subscribe(async enabled => {
      try {
        if (enabled) {
          if (!this._pollingService.isPollingEnabled()) {
            await this._pollingService.startPolling();
          }
        } else {
          this._pollingService.stopPolling();
        }
      } catch (err) {
        this.logger.error('UiPreferencesService: failed to apply polling preference', err);
      }
    });
  }

  private loadPolling(): boolean {
    // Prefer new RG-prefixed key; migrate legacy if found
    let saved = localStorage.getItem(this.pollingKey);
    if (!saved) {
      const legacy = localStorage.getItem(this.LEGACY_POLLING_KEY);
      if (legacy !== null) {
        try {
          // migrate to new key and remove legacy
          localStorage.setItem(this.pollingKey, legacy);
          localStorage.removeItem(this.LEGACY_POLLING_KEY);
          saved = legacy;
          this.logger.info('Migrated polling preference from legacy storage key');
        } catch (err) {
          this.logger.warn('Failed to migrate polling preference', err);
        }
      }
    }

    return saved ? JSON.parse(saved) : false;
  }

  async setPolling(value: boolean) {
    localStorage.setItem(this.pollingKey, JSON.stringify(value));
    this._pollingEnabled$.next(value);
  }

  async togglePolling() {
    await this.setPolling(!this._pollingEnabled$.value);
  }
}
