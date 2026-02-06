import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PollingService } from '@services/polling.service';
import { LoggerService } from '@services/logger.service';

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  private pollingKey = 'pollingEnabled';
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
    const saved = localStorage.getItem(this.pollingKey);
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
