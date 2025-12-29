import { TestBed } from '@angular/core/testing';
import { AppUpdateService, AppUpdateStatus } from './app-update.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { LoggerService } from './logger.service';
import { Subject } from 'rxjs';

describe('AppUpdateService', () => {
  let service: AppUpdateService;
  let swUpdateMock: any;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let versionSubject: Subject<any>;

  const setup = async (isEnabled: boolean = true) => {
    versionSubject = new Subject();
    swUpdateMock = {
      isEnabled,
      checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(false),
      activateUpdate: jasmine.createSpy('activateUpdate').and.resolveTo(),
      versionUpdates: versionSubject.asObservable(),
    };
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'warn']);

    await TestBed.configureTestingModule({
      providers: [
        AppUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    }).compileComponents();

    service = TestBed.inject(AppUpdateService);
    await Promise.resolve(); // allow async initialize to complete
  };

  it('marks service worker disabled state', async () => {
    await setup(false);
    const status = service.getCurrentStatus();
    expect(status.isEnabled).toBeFalse();
    expect(loggerSpy.info).toHaveBeenCalledWith('Service Worker is not enabled');
  });

  it('checks for updates when enabled', async () => {
    await setup(true);
    expect(swUpdateMock.checkForUpdate).toHaveBeenCalled();
  });

  it('updates status when version ready event arrives', async () => {
    await setup(true);
    const event: VersionReadyEvent = {
      type: 'VERSION_READY',
      currentVersion: { hash: 'v1', appData: {} },
      latestVersion: { hash: 'v2', appData: {} },
    } as VersionReadyEvent;

    versionSubject.next(event);

    const status: AppUpdateStatus = service.getCurrentStatus();
    expect(status.isUpdateAvailable).toBeTrue();
    expect(status.currentVersion).toBe('v1');
    expect(status.latestVersion).toBe('v2');
  });

  xit('activates update and reloads when available', async () => {
    await setup(true);
    // Mock document.location.reload()
    const originalReload = document.location.reload.bind(document.location);
    const reloadSpy = jasmine.createSpy('reload');
    document.location.reload = reloadSpy;

    // Simulate update available
    (service as any).updateStatusSubject.next({
      isUpdateAvailable: true,
      isEnabled: true,
    });

    await service.activateUpdate();

    expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
    
    // Restore original
    document.location.reload = originalReload;
  });

  it('warns when trying to activate without an update', async () => {
    await setup(true);
    await service.activateUpdate();
    expect(loggerSpy.warn).toHaveBeenCalledWith('No update available to activate');
  });

  it('cleans up subscriptions on destroy', async () => {
    await setup(true);
    const sub = (service as any).versionUpdateSubscription as { unsubscribe: () => void };
    const unsubscribeSpy = spyOn(sub, 'unsubscribe');

    service.destroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
