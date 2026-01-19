import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'checking';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private microphoneState$ = new BehaviorSubject<PermissionState>('checking');
  private locationState$ = new BehaviorSubject<PermissionState>('checking');

  constructor() {
    this.initMicrophonePermission();
    this.initLocationPermission();
  }

  isSpeechRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  getMicrophoneState$(): Observable<PermissionState> {
    return this.microphoneState$.asObservable();
  }

  getMicrophoneState(): PermissionState {
    return this.microphoneState$.value;
  }

  private async initMicrophonePermission() {
    if (!('permissions' in navigator)) {
      if ((navigator as any).mediaDevices && typeof (navigator as any).mediaDevices.getUserMedia === 'function') {
        this.microphoneState$.next('prompt');
      } else {
        this.microphoneState$.next('unsupported');
      }
      return;
    }

    try {
      const status = await (navigator as any).permissions.query({ name: 'microphone' } as any);
      this.microphoneState$.next(status.state as PermissionState);
      // Watch for changes
      if (typeof status.onchange === 'function') {
        status.onchange = () => {
          this.microphoneState$.next(status.state as PermissionState);
        };
      }
    } catch (e) {
      if ((navigator as any).mediaDevices && typeof (navigator as any).mediaDevices.getUserMedia === 'function') {
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
      const status = await (navigator as any).permissions.query({ name: 'geolocation' } as any);
      this.locationState$.next(status.state as PermissionState);
      if (typeof status.onchange === 'function') {
        status.onchange = () => {
          this.locationState$.next(status.state as PermissionState);
        };
      }
    } catch (e) {
      if ('geolocation' in navigator) {
        this.locationState$.next('prompt');
      } else {
        this.locationState$.next('unsupported');
      }
    }
  }

  async hasMicrophonePermission(): Promise<boolean> {
    const state = this.microphoneState$.value;
    if (state === 'denied') return false;
    // For prompt/granted/unsupported/checking treat as allowed to attempt (only explicit denied blocks)
    return true;
  }

  async hasLocationPermission(): Promise<boolean> {
    const state = this.locationState$.value;
    if (state === 'denied') return false;
    return true;
  }

  async requestMicrophone(): Promise<PermissionState> {
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        this.microphoneState$.next('unsupported');
        return 'unsupported';
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      this.microphoneState$.next('granted');
      return 'granted';
    } catch (e) {
      this.microphoneState$.next('denied');
      return 'denied';
    }
  }

  async requestLocation(): Promise<PermissionState> {
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
    } catch (e) {
      this.locationState$.next('denied');
      return 'denied';
    }
  }

  getLocationState$(): Observable<PermissionState> {
    return this.locationState$.asObservable();
  }

  getLocationState(): PermissionState {
    return this.locationState$.value;
  }
}
