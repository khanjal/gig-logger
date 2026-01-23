import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SyncStatusIndicatorComponent } from './sync-status-indicator.component';
import { SyncStatusService } from '@services/sync-status.service';
import { UiPreferencesService } from '@services/ui-preferences.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { ThemeService, ThemePreference } from '@services/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SyncStatusIndicatorComponent', () => {
  let component: SyncStatusIndicatorComponent;
  let fixture: ComponentFixture<SyncStatusIndicatorComponent>;
  let syncStatusSpy: jasmine.SpyObj<SyncStatusService>;
  let uiPreferencesSpy: any;
  let unsavedDataSpy: jasmine.SpyObj<UnsavedDataService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let themeSpy: jasmine.SpyObj<ThemeService>;
  let syncState$: BehaviorSubject<any>;
  let messages$: BehaviorSubject<any[]>;
  let preference$: BehaviorSubject<ThemePreference>;

  beforeEach(async () => {
    syncState$ = new BehaviorSubject({ status: 'idle', message: 'Ready', progress: 0 });
    messages$ = new BehaviorSubject<any[]>([]);
    preference$ = new BehaviorSubject<ThemePreference>('system');
    
    syncStatusSpy = jasmine.createSpyObj('SyncStatusService', ['clearMessages', 'getTimeSinceLastSync']);
    Object.defineProperty(syncStatusSpy, 'syncState$', { value: syncState$.asObservable() });
    Object.defineProperty(syncStatusSpy, 'messages$', { value: messages$.asObservable() });
    syncStatusSpy.getTimeSinceLastSync.and.returnValue('2 min ago');

    const pollingEnabledSubject = new BehaviorSubject<boolean>(true);
    uiPreferencesSpy = {
      pollingEnabled$: pollingEnabledSubject.asObservable(),
      pollingEnabledSubject,
      setPolling: jasmine.createSpy('setPolling').and.returnValue(Promise.resolve())
    };

    unsavedDataSpy = jasmine.createSpyObj('UnsavedDataService', ['hasUnsavedData']);
    unsavedDataSpy.hasUnsavedData.and.returnValue(Promise.resolve(false));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    themeSpy = jasmine.createSpyObj('ThemeService', ['setTheme'], { currentPreference: 'system', preferenceChanges: preference$.asObservable() });

    await TestBed.configureTestingModule({
      imports: [SyncStatusIndicatorComponent],
      providers: [
        { provide: SyncStatusService, useValue: syncStatusSpy },
        { provide: UiPreferencesService, useValue: uiPreferencesSpy },
        { provide: UnsavedDataService, useValue: unsavedDataSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ThemeService, useValue: themeSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SyncStatusIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('toggleAutoSave', () => {
    it('enables polling when toggled on', async () => {
      await component.toggleAutoSave(true);

      expect(uiPreferencesSpy.setPolling).toHaveBeenCalledWith(true);
      expect(component.autoSaveEnabled).toBeTrue();
    });

    it('stops polling when toggled off', async () => {
      await component.toggleAutoSave(false);

      expect(uiPreferencesSpy.setPolling).toHaveBeenCalledWith(false);
      expect(component.autoSaveEnabled).toBeFalse();
    });
  });

  describe('getNextCheckText', () => {
    it('returns dash when polling disabled', () => {
      uiPreferencesSpy.pollingEnabledSubject.next(false);
      syncState$.next({ status: 'idle', nextSyncIn: 30 });

      expect(component.getNextCheckText()).toBe('-');
    });

    it('returns formatted seconds when next sync available', () => {
      uiPreferencesSpy.pollingEnabledSubject.next(true);
      syncState$.next({ status: 'idle', nextSyncIn: 45 });

      expect(component.getNextCheckText()).toBe('in 45s');
    });
  });

  describe('setTheme', () => {
    it('updates theme preference and notifies service', () => {
      component.setTheme('dark');

      expect(themeSpy.setTheme).toHaveBeenCalledWith('dark');
      expect(component.themePreference).toBe('dark');
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('subscribes to sync state changes', () => {
      syncState$.next({ status: 'syncing', message: 'Syncing...', progress: 50 });

      expect(component.syncState?.status).toBe('syncing');
    });

    it('subscribes to messages', () => {
      const testMessages = [{ type: 'info', text: 'Test', timestamp: new Date() }];
      messages$.next(testMessages);

      expect(component.messages.length).toBe(1);
    });

    it('checks for unsaved changes on init', (done) => {
      setTimeout(() => {
        expect(unsavedDataSpy.hasUnsavedData).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('sets up interval for periodic updates', () => {
      expect(component['intervalId']).toBeDefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('clears interval and completes subject', () => {
      const intervalId = component['intervalId'];
      spyOn(window, 'clearInterval');

      component.ngOnDestroy();

      expect(window.clearInterval).toHaveBeenCalledWith(intervalId);
    });
  });

  describe('getStatusIcon', () => {
    it('returns sync_disabled when polling disabled and idle', () => {
      component.syncState = { status: 'idle' } as any;
      uiPreferencesSpy.pollingEnabledSubject.next(false);

      expect(component.getStatusIcon()).toBe('sync_disabled');
    });

    it('returns sync when syncing', () => {
      component.syncState = { status: 'syncing' } as any;

      expect(component.getStatusIcon()).toBe('sync');
    });

    it('returns cloud_done when success', () => {
      component.syncState = { status: 'success' } as any;

      expect(component.getStatusIcon()).toBe('cloud_done');
    });

    it('returns cloud_off when error', () => {
      component.syncState = { status: 'error' } as any;

      expect(component.getStatusIcon()).toBe('cloud_off');
    });

    it('returns cloud_queue when idle', () => {
      component.syncState = { status: 'idle' } as any;

      expect(component.getStatusIcon()).toBe('cloud_queue');
    });

    it('returns cloud_off when no sync state', () => {
      component.syncState = null;

      expect(component.getStatusIcon()).toBe('cloud_off');
    });
  });

  describe('getStatusClass', () => {
    it('returns status-disabled when polling disabled', () => {
      component.syncState = { status: 'idle' } as any;
      uiPreferencesSpy.pollingEnabledSubject.next(false);

      expect(component.getStatusClass()).toBe('status-disabled');
    });

    it('returns status-syncing when syncing', () => {
      component.syncState = { status: 'syncing' } as any;

      expect(component.getStatusClass()).toBe('status-syncing');
    });

    it('returns status-idle when no state', () => {
      component.syncState = null;

      expect(component.getStatusClass()).toBe('status-idle');
    });
  });

  describe('getTooltipText', () => {
    it('returns auto-sync disabled message when polling off', () => {
      component.syncState = { status: 'idle' } as any;
      uiPreferencesSpy.pollingEnabledSubject.next(false);

      expect(component.getTooltipText()).toBe('Auto-sync disabled');
    });

    it('shows progress for syncing state', () => {
      component.syncState = { status: 'syncing', message: 'Syncing data', progress: 75 } as any;

      expect(component.getTooltipText()).toBe('Syncing data (75%)');
    });

    it('shows last sync time for success', () => {
      component.syncState = { status: 'success', message: 'Sync complete' } as any;
      component.timeSinceLastSync = '5 min ago';

      expect(component.getTooltipText()).toBe('Sync complete - 5 min ago');
    });

    it('shows error message on failure', () => {
      component.syncState = { status: 'error', error: 'Network error' } as any;

      expect(component.getTooltipText()).toBe('Network error');
    });
  });

  describe('forceSync', () => {
    it('opens data sync modal with save mode', async () => {
      const dialogRef = { afterClosed: () => new BehaviorSubject(true).asObservable() };
      dialogSpy.open.and.returnValue(dialogRef as any);

      await component.forceSync();

      expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        data: 'save'
      }));
    });

    it('checks unsaved changes after dialog closes', (done) => {
      const dialogRef = { afterClosed: () => of(true) };
      dialogSpy.open.and.returnValue(dialogRef as any);
      
      // Reset spy call count from ngOnInit
      unsavedDataSpy.hasUnsavedData.calls.reset();

      component.forceSync().then(() => {
        expect(unsavedDataSpy.hasUnsavedData).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('updateFromSpreadsheet', () => {
    it('opens data sync modal with load mode', async () => {
      const dialogRef = { afterClosed: () => new BehaviorSubject(true).asObservable() };
      dialogSpy.open.and.returnValue(dialogRef as any);

      await component.updateFromSpreadsheet();

      expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        data: 'load'
      }));
    });
  });

  describe('getMessageIcon', () => {
    it('returns correct icon for each message type', () => {
      expect(component.getMessageIcon('error')).toBe('error');
      expect(component.getMessageIcon('warning')).toBe('warning');
      expect(component.getMessageIcon('info')).toBe('info');
    });
  });

  describe('clearMessages', () => {
    it('calls service to clear messages', () => {
      component.clearMessages();

      expect(syncStatusSpy.clearMessages).toHaveBeenCalled();
    });
  });

  describe('toggleDetailedView', () => {
    it('toggles showDetailedView flag', () => {
      component.showDetailedView = false;

      component.toggleDetailedView();
      expect(component.showDetailedView).toBeTrue();

      component.toggleDetailedView();
      expect(component.showDetailedView).toBeFalse();
    });
  });

  describe('formatTimestamp', () => {
    it('formats date as time string', () => {
      const date = new Date('2024-12-29T10:30:00');
      
      const result = component.formatTimestamp(date);
      
      expect(result).toContain(':30');
    });
  });
});
