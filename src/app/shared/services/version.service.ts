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

  // Returns a formatted version string like YYYYMMDD.build
  async getFormattedVersion(): Promise<string> {
    const v = await this.getVersion();
    if (v.version === 'unknown' || v.build === 'unknown') return 'unknown';
    // Remove dashes from date if present
    const date = v.version.replace(/-/g, '');
    return `${date}.${v.build}`;
  }
}
