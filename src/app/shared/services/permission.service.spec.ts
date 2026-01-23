import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';

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
      (window as any).webkitSpeechRecognition = function() {};

      expect(service.isSpeechRecognitionSupported()).toBeTrue();

      delete (window as any).webkitSpeechRecognition;
    });

    it('returns true when SpeechRecognition exists', () => {
      (window as any).SpeechRecognition = function() {};

      expect(service.isSpeechRecognitionSupported()).toBeTrue();

      delete (window as any).SpeechRecognition;
    });

    it('returns false when neither exists', () => {
      const webkit = (window as any).webkitSpeechRecognition;
      const standard = (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).SpeechRecognition;

      expect(service.isSpeechRecognitionSupported()).toBeFalse();

      if (webkit) (window as any).webkitSpeechRecognition = webkit;
      if (standard) (window as any).SpeechRecognition = standard;
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
      (service as any).microphoneState$.next('denied');

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
      (service as any).locationState$.next('denied');

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
          getCurrentPosition: (success: any) => success({ coords: { latitude: 1, longitude: 2 } })
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
          getCurrentPosition: (_success: any, error: any) => error({ message: 'denied' })
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
