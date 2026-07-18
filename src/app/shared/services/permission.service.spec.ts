import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';
import type { BehaviorSubject } from 'rxjs';
import type { PermissionState } from '@interfaces/auth/permission.interface';

interface PermissionServicePrivates {
  microphoneState$: BehaviorSubject<PermissionState>;
  locationState$: BehaviorSubject<PermissionState>;
}

interface WindowWithSpeechRecognition {
  webkitSpeechRecognition?: unknown;
  SpeechRecognition?: unknown;
}

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSpeechRecognitionSupported', () => {
    it('returns true when webkitSpeechRecognition exists', () => {
      (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition = function() {};

      expect(service.isSpeechRecognitionSupported()).toBeTrue();

      delete (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition;
    });

    it('returns true when SpeechRecognition exists', () => {
      (window as unknown as WindowWithSpeechRecognition).SpeechRecognition = function() {};

      expect(service.isSpeechRecognitionSupported()).toBeTrue();

      delete (window as unknown as WindowWithSpeechRecognition).SpeechRecognition;
    });

    it('returns false when neither exists', () => {
      const webkit = (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition;
      const standard = (window as unknown as WindowWithSpeechRecognition).SpeechRecognition;
      delete (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition;
      delete (window as unknown as WindowWithSpeechRecognition).SpeechRecognition;

      expect(service.isSpeechRecognitionSupported()).toBeFalse();

      if (webkit) (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition = webkit;
      if (standard) (window as unknown as WindowWithSpeechRecognition).SpeechRecognition = standard;
    });
  });

  describe('getMicrophoneState', () => {
    it('returns current microphone state', () => {
      const state = service.getMicrophoneState();
      expect(['granted', 'denied', 'prompt', 'unsupported', 'checking']).toContain(state);
    });
  });

  describe('getLocationState', () => {
    it('returns current location state', () => {
      const state = service.getLocationState();
      expect(['granted', 'denied', 'prompt', 'unsupported', 'checking']).toContain(state);
    });
  });

  describe('hasMicrophonePermission', () => {
    it('returns false when denied', async () => {
      (service as unknown as PermissionServicePrivates).microphoneState$.next('denied');

      const result = await service.hasMicrophonePermission();

      expect(result).toBeFalse();
    });

    it('returns true when granted', async () => {
      spyOn(service, 'getMicrophoneState').and.returnValue('granted');

      const result = await service.hasMicrophonePermission();

      expect(result).toBeTrue();
    });

    it('returns true when prompt', async () => {
      spyOn(service, 'getMicrophoneState').and.returnValue('prompt');

      const result = await service.hasMicrophonePermission();

      expect(result).toBeTrue();
    });
  });

  describe('hasLocationPermission', () => {
    it('returns false when denied', async () => {
      (service as unknown as PermissionServicePrivates).locationState$.next('denied');

      const result = await service.hasLocationPermission();

      expect(result).toBeFalse();
    });

    it('returns true when granted', async () => {
      spyOn(service, 'getLocationState').and.returnValue('granted');

      const result = await service.hasLocationPermission();

      expect(result).toBeTrue();
    });
  });

  describe('requestMicrophone', () => {
    it('returns granted on success', async () => {
      const mockTrack = { stop: jasmine.createSpy('stop') };
      const mockStream = { getTracks: () => [mockTrack] };
      const original = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: async () => mockStream },
        configurable: true
      });

      const result = await service.requestMicrophone();

      expect(result).toBe('granted');
      expect(mockTrack.stop).toHaveBeenCalled();
      Object.defineProperty(navigator, 'mediaDevices', { value: original, configurable: true });
    });

    it('returns denied on error', async () => {
      const original = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: async () => { throw new Error('denied'); } },
        configurable: true
      });

      const result = await service.requestMicrophone();

      expect(result).toBe('denied');
      Object.defineProperty(navigator, 'mediaDevices', { value: original, configurable: true });
    });

    it('returns unsupported when mediaDevices unavailable', async () => {
      const original = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        configurable: true
      });

      const result = await service.requestMicrophone();

      expect(result).toBe('unsupported');
      Object.defineProperty(navigator, 'mediaDevices', { value: original, configurable: true });
    });
  });

  describe('requestLocation', () => {
    it('returns granted on success', async () => {
      const original = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition)
        },
        configurable: true
      });

      const result = await service.requestLocation();

      expect(result).toBe('granted');
      Object.defineProperty(navigator, 'geolocation', { value: original, configurable: true });
    });

    it('returns denied on error', async () => {
      const original = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({ message: 'denied' } as GeolocationPositionError)
        },
        configurable: true
      });

      const result = await service.requestLocation();

      expect(result).toBe('denied');
      Object.defineProperty(navigator, 'geolocation', { value: original, configurable: true });
    });

    it('returns unsupported when geolocation unavailable', async () => {
      const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
      Object.defineProperty(navigator, 'geolocation', {
        get: () => undefined,
        configurable: true,
        enumerable: false
      });

      const result = await service.requestLocation();

      expect(result).toBe('unsupported');
      if (original) {
        Object.defineProperty(navigator, 'geolocation', original);
      }
    });
  });
});
