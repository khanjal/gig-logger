import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import type { PermissionState } from '@interfaces/auth/permission.interface';

export type { PermissionState };

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private microphoneState$ = new BehaviorSubject<PermissionState>('checking');
  private locationState$ = new BehaviorSubject<PermissionState>('checking');

  constructor() {
    this.initMicrophonePermission();
    this.initLocationPermission();
  }

  public isSpeechRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  public getMicrophoneState$(): Observable<PermissionState> {
    return this.microphoneState$.asObservable();
  }

  public getMicrophoneState(): PermissionState {
    return this.microphoneState$.value;
  }

  private async initMicrophonePermission() {
    // Older/non-standard environments may lack `permissions` or `mediaDevices` at
    // runtime even though the DOM lib types declare them as always present.
    const nav = navigator as Partial<Pick<Navigator, 'permissions' | 'mediaDevices'>>;

    if (!nav.permissions) {
      if (nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function') {
        this.microphoneState$.next('prompt');
      } else {
        this.microphoneState$.next('unsupported');
      }
      return;
    }

    try {
      const status = await nav.permissions.query({ name: 'microphone' });
      this.microphoneState$.next(status.state as PermissionState);
      // Watch for changes
      if (typeof status.onchange === 'function') {
        status.onchange = () => {
          this.microphoneState$.next(status.state as PermissionState);
        };
      }
    } catch {
      if (nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function') {
        this.microphoneState$.next('prompt');
      } else {
        this.microphoneState$.next('unsupported');
      }
    }
  }

  private async initLocationPermission() {
    if (!('permissions' in navigator)) {
      if ('geolocation' in navigator) {
        this.locationState$.next('prompt');
      } else {
        this.locationState$.next('unsupported');
      }
      return;
    }

    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      this.locationState$.next(status.state as PermissionState);
      if (typeof status.onchange === 'function') {
        status.onchange = () => {
          this.locationState$.next(status.state as PermissionState);
        };
      }
    } catch {
      if ('geolocation' in navigator) {
        this.locationState$.next('prompt');
      } else {
        this.locationState$.next('unsupported');
      }
    }
  }

  public async hasMicrophonePermission(): Promise<boolean> {
    const state = this.microphoneState$.value;
    if (state === 'denied') return false;
    // For prompt/granted/unsupported/checking treat as allowed to attempt (only explicit denied blocks)
    return true;
  }

  public async hasLocationPermission(): Promise<boolean> {
    const state = this.locationState$.value;
    if (state === 'denied') return false;
    return true;
  }

  public async requestMicrophone(): Promise<PermissionState> {
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        this.microphoneState$.next('unsupported');
        return 'unsupported';
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      this.microphoneState$.next('granted');
      return 'granted';
    } catch {
      this.microphoneState$.next('denied');
      return 'denied';
    }
  }

  public async requestLocation(): Promise<PermissionState> {
    try {
      if (!('geolocation' in navigator) || !navigator.geolocation) {
        this.locationState$.next('unsupported');
        return 'unsupported';
      }
      // Request permission by asking for current position
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (err) => reject(err)
        );
      });
      this.locationState$.next('granted');
      return 'granted';
    } catch {
      this.locationState$.next('denied');
      return 'denied';
    }
  }

  public getLocationState$(): Observable<PermissionState> {
    return this.locationState$.asObservable();
  }

  public getLocationState(): PermissionState {
    return this.locationState$.value;
  }
}
