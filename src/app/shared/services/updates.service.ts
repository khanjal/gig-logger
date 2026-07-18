import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import type { IUpdateEntry } from '@interfaces/sync/update.interface';

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  private http = inject(HttpClient);

  private readonly url = 'assets/updates.json';
  private updatesSubject = new BehaviorSubject<IUpdateEntry[]>([]);

  constructor() {
    this.loadUpdates();
  }

  private loadUpdates(): void {
    this.http.get<IUpdateEntry[]>(this.url).subscribe(
      (data) => this.updatesSubject.next(data ?? []),
      (err) => {
        // If loading fails, keep the subject empty and log a warning
        // Consumers can handle empty state as "no updates"
         
        console.warn('Failed to load updates.json', err);
      }
    );
  }

  getUpdates(): Observable<IUpdateEntry[]> {
    return this.updatesSubject.asObservable();
  }
}
