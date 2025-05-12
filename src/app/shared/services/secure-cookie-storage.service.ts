import { Injectable } from '@angular/core';
import { OAuthStorage } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class SecureCookieStorageService implements OAuthStorage {
  getItem(key: string): string | null {
    const value = document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)')?.pop() || '';
    return value ? decodeURIComponent(value) : null;
  }

  removeItem(key: string): void {
    document.cookie = `${key}=; Max-Age=-99999999; Secure; SameSite=Strict; Path=/; Domain=${window.location.hostname}`;
  }

  setItem(key: string, value: string): void {
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${key}=${encodedValue}; Secure; SameSite=Strict; Path=/; Domain=${window.location.hostname}; Max-Age=3600`;
  }
}
