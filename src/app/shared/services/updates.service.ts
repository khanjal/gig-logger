import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import type { IUpdateDetail, IUpdateEntry } from '@interfaces/update.interface';

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  private readonly url = 'assets/updates.json';
  private updatesSubject = new BehaviorSubject<IUpdateEntry[]>([]);

  constructor(private http: HttpClient) {
    this.loadUpdates();
  }

  private loadUpdates(): void {
    this.http.get<IUpdateEntry[]>(this.url).subscribe(
      (data) => this.updatesSubject.next(data ?? []),
      (err) => {
        // If loading fails, keep the subject empty and log a warning
        // Consumers can handle empty state as "no updates"
        // eslint-disable-next-line no-console
        console.warn('Failed to load updates.json', err);
      }
    );
  }

  getUpdates(): Observable<IUpdateEntry[]> {
    return this.updatesSubject.asObservable();
  }
}
