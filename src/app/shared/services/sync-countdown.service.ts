import { Injectable } from '@angular/core';
import { PollingService } from '@services/polling.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SyncCountdownService {
  constructor(private polling: PollingService) {}
  get nextSyncCountdown$(): Observable<number> {
    return this.polling.nextSyncCountdown$;
  }
}
