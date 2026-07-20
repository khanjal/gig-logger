import { TestBed } from '@angular/core/testing';
import { AppUpdateService } from './app-update.service';
import type { VersionReadyEvent } from '@angular/service-worker';
import { SwUpdate } from '@angular/service-worker';
import { LoggerService } from '@services/logger.service';
import type { BehaviorSubject, Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import type { IAppUpdateStatus } from '@interfaces/sync/app-update-status.interface';

interface SwUpdateMock {
  isEnabled: boolean;
  checkForUpdate: jasmine.Spy;
  activateUpdate: jasmine.Spy;
  versionUpdates: unknown;
}

interface AppUpdateServicePrivates {
  updateStatusSubject: BehaviorSubject<IAppUpdateStatus>;
  versionUpdateSubscription: Subscription | undefined;
}

describe('AppUpdateService', () => {
  let service: AppUpdateService;
  let swUpdateMock: SwUpdateMock;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let versionSubject: Subject<VersionReadyEvent>;

  const setup = async (isEnabled = true) => {
    versionSubject = new Subject<VersionReadyEvent>();
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

    const status: IAppUpdateStatus = service.getCurrentStatus();
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
    (service as unknown as AppUpdateServicePrivates).updateStatusSubject.next({
      isUpdateAvailable: true,
      isEnabled: true,
    } as IAppUpdateStatus);

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
    const sub = (service as unknown as AppUpdateServicePrivates).versionUpdateSubscription as Subscription;
    const unsubscribeSpy = spyOn(sub, 'unsubscribe');

    service.destroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
