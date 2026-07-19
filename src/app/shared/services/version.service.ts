import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private http = inject(HttpClient);


  public async getVersion(): Promise<{ version: string; build: string }> {
    try {
      return await firstValueFrom(this.http.get<{ version: string; build: string }>('/assets/version.json'));
    } catch {
      return { version: 'unknown', build: 'unknown' };
    }
  }

  // Returns a formatted version string like YYYY.MM.DD.build
  public async getFormattedVersion(): Promise<string> {
    const v = await this.getVersion();
    if (v.version === 'unknown' || v.build === 'unknown') return 'unknown';
    // Replace dashes with dots in date (YYYY-MM-DD -> YYYY.MM.DD)
    const date = v.version.replace(/-/g, '.');
    return `${date}.${v.build}`;
  }
}
