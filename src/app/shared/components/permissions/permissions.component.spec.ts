import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionsComponent } from './permissions.component';
import { LoggerService } from '@services/logger.service';
import { PermissionService } from '@services/permission.service';
import { BehaviorSubject } from 'rxjs';

describe('PermissionsComponent', () => {
  let component: PermissionsComponent;
  let fixture: ComponentFixture<PermissionsComponent>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let permissionServiceSpy: jasmine.SpyObj<PermissionService>;
  let locationState$: BehaviorSubject<any>;
  let microphoneState$: BehaviorSubject<any>;

  beforeEach(async () => {
    loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn']);
    locationState$ = new BehaviorSubject('checking');
    microphoneState$ = new BehaviorSubject('checking');
    
    permissionServiceSpy = jasmine.createSpyObj('PermissionService', 
      ['getLocationState', 'getMicrophoneState', 'requestLocation', 'requestMicrophone'],
      {
        getLocationState$: () => locationState$.asObservable(),
        getMicrophoneState$: () => microphoneState$.asObservable()
      }
    );
    permissionServiceSpy.getLocationState.and.returnValue('checking');
    permissionServiceSpy.getMicrophoneState.and.returnValue('checking');

    await TestBed.configureTestingModule({
      imports: [PermissionsComponent],
      providers: [
        { provide: LoggerService, useValue: loggerSpy },
        { provide: PermissionService, useValue: permissionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionsComponent);
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

    it('subscribes to permission state changes on init', async () => {
      await component.ngOnInit();
      
      expect(permissionServiceSpy.getLocationState).toHaveBeenCalled();
      expect(permissionServiceSpy.getMicrophoneState).toHaveBeenCalled();
    });
  });

  describe('permission state updates', () => {
    it('updates location permission when state changes to granted', async () => {
      await component.ngOnInit();
      locationState$.next('granted');
      
      expect(component.locationPermission.state).toBe('granted');
      expect(component.locationPermission.canRequest).toBeFalse();
    });

    it('updates location permission when state changes to prompt', async () => {
      await component.ngOnInit();
      locationState$.next('prompt');
      
      expect(component.locationPermission.state).toBe('prompt');
      expect(component.locationPermission.canRequest).toBeTrue();
    });

    it('updates microphone permission when state changes to granted', async () => {
      await component.ngOnInit();
      microphoneState$.next('granted');
      
      expect(component.microphonePermission.state).toBe('granted');
      expect(component.microphonePermission.canRequest).toBeFalse();
    });

    it('updates microphone permission when state changes to prompt', async () => {
      await component.ngOnInit();
      microphoneState$.next('prompt');
      
      expect(component.microphonePermission.state).toBe('prompt');
      expect(component.microphonePermission.canRequest).toBeTrue();
    });
  });

  describe('requestLocation', () => {
    it('updates state to granted on success', async () => {
      permissionServiceSpy.requestLocation.and.returnValue(Promise.resolve('granted'));
      
      await component.requestLocation();
      
      expect(component.locationPermission.state).toBe('granted');
      expect(component.locationPermission.canRequest).toBeFalse();
    });

    it('updates state to denied on error', async () => {
      permissionServiceSpy.requestLocation.and.returnValue(Promise.resolve('denied'));
      
      await component.requestLocation();
      
      expect(component.locationPermission.state).toBe('denied');
    });
  });

  describe('requestMicrophone', () => {
    it('grants permission on success', async () => {
      permissionServiceSpy.requestMicrophone.and.returnValue(Promise.resolve('granted'));
      
      await component.requestMicrophone();
      
      expect(component.microphonePermission.state).toBe('granted');
      expect(component.microphonePermission.canRequest).toBeFalse();
    });

    it('updates state to denied on error', async () => {
      permissionServiceSpy.requestMicrophone.and.returnValue(Promise.resolve('denied'));
      
      await component.requestMicrophone();
      
      expect(component.microphonePermission.state).toBe('denied');
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
