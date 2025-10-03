import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VersionService {
  constructor(private http: HttpClient) {}

  async getVersion(): Promise<{ version: string; build: string }> {
    try {
      return await firstValueFrom(this.http.get<{ version: string; build: string }>('/assets/version.json'));
    } catch {
      return { version: 'unknown', build: 'unknown' };
    }
  }
}
