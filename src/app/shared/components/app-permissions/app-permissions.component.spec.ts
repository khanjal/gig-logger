import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppPermissionsComponent } from './app-permissions.component';
import { LoggerService } from '@services/logger.service';

describe('AppPermissionsComponent', () => {
  let component: AppPermissionsComponent;
  let fixture: ComponentFixture<AppPermissionsComponent>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn']);

    await TestBed.configureTestingModule({
      imports: [AppPermissionsComponent],
      providers: [
        { provide: LoggerService, useValue: loggerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppPermissionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('sets initial permission states to checking', () => {
      expect(component.locationPermission.state).toBe('checking');
      expect(component.microphonePermission.state).toBe('checking');
    });

    it('checks permissions on init', async () => {
      spyOn(component, 'checkLocationPermission').and.returnValue(Promise.resolve());
      spyOn(component, 'checkMicrophonePermission').and.returnValue(Promise.resolve());

      await component.ngOnInit();

      expect(component.checkLocationPermission).toHaveBeenCalled();
      expect(component.checkMicrophonePermission).toHaveBeenCalled();
    });
  });

  describe('checkLocationPermission', () => {
    it('sets unsupported when permissions API unavailable', async () => {
      const originalPermissions = (navigator as any).permissions;
      Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true });

      await component.checkLocationPermission();

      expect(component.locationPermission.state).toBe('unsupported');
      Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
    });

    it('queries geolocation permission and updates state', async () => {
      const mockResult = { state: 'granted', onchange: null };
      const originalPermissions = (navigator as any).permissions;
      Object.defineProperty(navigator, 'permissions', {
        value: { query: async () => mockResult },
        configurable: true
      });

      await component.checkLocationPermission();

      expect(component.locationPermission.state).toBe('granted');
      expect(component.locationPermission.canRequest).toBeFalse();
      Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
    });

    it('sets prompt state when permission not yet requested', async () => {
      const mockResult = { state: 'prompt', onchange: null };
      const originalPermissions = (navigator as any).permissions;
      Object.defineProperty(navigator, 'permissions', {
        value: { query: async () => mockResult },
        configurable: true
      });

      await component.checkLocationPermission();

      expect(component.locationPermission.state).toBe('prompt');
      expect(component.locationPermission.canRequest).toBeTrue();
      Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
    });
  });

  describe('checkMicrophonePermission', () => {
    it('sets unsupported when permissions API unavailable', async () => {
      const originalPermissions = (navigator as any).permissions;
      Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true });
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });

      await component.checkMicrophonePermission();

      expect(component.microphonePermission.state).toBe('unsupported');
      Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
      Object.defineProperty(navigator, 'mediaDevices', { value: originalMediaDevices, configurable: true });
    });

    it('queries microphone permission and updates state', async () => {
      const mockResult = { state: 'granted', onchange: null };
      const originalPermissions = (navigator as any).permissions;
      Object.defineProperty(navigator, 'permissions', {
        value: { query: async () => mockResult },
        configurable: true
      });

      await component.checkMicrophonePermission();

      expect(component.microphonePermission.state).toBe('granted');
      Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
    });

    it('handles query failure and checks media devices API', async () => {
      const originalPermissions = (navigator as any).permissions;
      Object.defineProperty(navigator, 'permissions', {
        value: { query: async () => { throw new Error('Query failed'); } },
        configurable: true
      });
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: () => Promise.resolve(new MediaStream()) },
        configurable: true
      });

      await component.checkMicrophonePermission();

      expect(component.microphonePermission.state).toBe('prompt');
      expect(component.microphonePermission.canRequest).toBeTrue();
      Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true });
      Object.defineProperty(navigator, 'mediaDevices', { value: originalMediaDevices, configurable: true });
    });
  });

  describe('requestLocation', () => {
    it('updates state to granted on success', async () => {
      const originalGeo = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any) => success({ coords: { latitude: 1, longitude: 2 } })
        },
        configurable: true
      });

      await component.requestLocation();

      expect(component.locationPermission.state).toBe('granted');
      expect(component.locationPermission.canRequest).toBeFalse();
      Object.defineProperty(navigator, 'geolocation', { value: originalGeo, configurable: true });
    });

    it('updates state to denied on error', async () => {
      const originalGeo = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (_success: any, error: any) => error({ message: 'denied' })
        },
        configurable: true
      });

      await component.requestLocation();

      expect(component.locationPermission.state).toBe('denied');
      Object.defineProperty(navigator, 'geolocation', { value: originalGeo, configurable: true });
    });
  });

  describe('requestMicrophone', () => {
    it('grants permission and stops tracks after success', async () => {
      const mockTrack = { stop: jasmine.createSpy('stop') };
      const mockStream = { getTracks: () => [mockTrack] };
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: async () => mockStream },
        configurable: true
      });

      await component.requestMicrophone();

      expect(component.microphonePermission.state).toBe('granted');
      expect(component.microphonePermission.canRequest).toBeFalse();
      expect(mockTrack.stop).toHaveBeenCalled();
      Object.defineProperty(navigator, 'mediaDevices', { value: originalMediaDevices, configurable: true });
    });

    it('updates state to denied on error', async () => {
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: async () => { throw new Error('denied'); } },
        configurable: true
      });

      await component.requestMicrophone();

      expect(component.microphonePermission.state).toBe('denied');
      expect(loggerSpy.error).toHaveBeenCalled();
      Object.defineProperty(navigator, 'mediaDevices', { value: originalMediaDevices, configurable: true });
    });
  });

  describe('getStateColor', () => {
    it('returns correct color for each state', () => {
      expect(component.getStateColor('granted')).toBe('text-green-600');
      expect(component.getStateColor('denied')).toBe('text-red-600');
      expect(component.getStateColor('prompt')).toBe('text-yellow-600');
      expect(component.getStateColor('checking')).toBe('text-gray-500');
      expect(component.getStateColor('unsupported')).toBe('text-gray-400');
    });
  });

  describe('getStateIcon', () => {
    it('returns correct icon for each state', () => {
      expect(component.getStateIcon('granted')).toBe('check_circle');
      expect(component.getStateIcon('denied')).toBe('cancel');
      expect(component.getStateIcon('prompt')).toBe('help');
      expect(component.getStateIcon('checking')).toBe('hourglass_empty');
      expect(component.getStateIcon('unsupported')).toBe('block');
    });
  });

  describe('getStateText', () => {
    it('returns correct text for each state', () => {
      expect(component.getStateText('granted')).toBe('Granted');
      expect(component.getStateText('denied')).toBe('Denied');
      expect(component.getStateText('prompt')).toBe('Not Requested');
      expect(component.getStateText('checking')).toBe('Checking...');
      expect(component.getStateText('unsupported')).toBe('Not Supported');
    });
  });

  describe('openBrowserSettings', () => {
    it('shows alert with instructions', () => {
      spyOn(window, 'alert');
      
      component.openBrowserSettings();
      
      expect(window.alert).toHaveBeenCalled();
    });
  });
});
