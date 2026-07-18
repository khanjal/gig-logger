import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { Router, ActivatedRoute } from '@angular/router';
import type { Event as RouterEvent, UrlTree } from '@angular/router';
import { LoggerService } from '@services/logger.service';
import { ThemeService } from '@services/theme.service';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';
import type { UserProfile } from '@interfaces/auth/user-profile.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IShift } from '@interfaces/entities/shift.interface';
import { BehaviorSubject, of, Subject } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let commonSpy: Partial<CommonService>;
  let spreadsheetSpy: jasmine.SpyObj<SpreadsheetService>;
  let authSpy: jasmine.SpyObj<AuthGoogleService>;
  let shiftSpy: jasmine.SpyObj<ShiftService>;
  let tripSpy: jasmine.SpyObj<TripService>;
  let routerEvents: Subject<RouterEvent>;

  beforeEach(async () => {
    // Prevent the component's internal polling interval from scheduling during tests
    spyOn(window, 'setInterval').and.callFake(((..._args: unknown[]) => 0) as unknown as typeof window.setInterval);
    commonSpy = { onHeaderLinkUpdate: of(null) };
    spreadsheetSpy = jasmine.createSpyObj('SpreadsheetService', ['querySpreadsheets', 'getSpreadsheets'], {
      spreadsheets$: new BehaviorSubject<ISpreadsheet[]>([])
    });
    spreadsheetSpy.querySpreadsheets.and.returnValue(Promise.resolve([]));
    spreadsheetSpy.getSpreadsheets.and.returnValue(Promise.resolve([]));
    authSpy = jasmine.createSpyObj('AuthGoogleService', ['canSync'], { profile$: new Subject<UserProfile | null>() });
    authSpy.canSync.and.returnValue(Promise.resolve(false));
    shiftSpy = jasmine.createSpyObj('ShiftService', ['getUnsavedShifts']);
    shiftSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
    tripSpy = jasmine.createSpyObj('TripService', ['getUnsaved']);
    tripSpy.getUnsaved.and.returnValue(Promise.resolve([]));

    routerEvents = new Subject<RouterEvent>();
    const routerSpy: Partial<Router> = {
      events: routerEvents.asObservable(),
      createUrlTree: () => ({} as UrlTree),
      navigate: jasmine.createSpy('navigate'),
      serializeUrl: (_: UrlTree) => ''
    };
    const activatedRouteStub: Partial<ActivatedRoute> = { snapshot: { url: [] } as unknown as ActivatedRoute['snapshot'] };

    const loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);
    const themeSpy = jasmine.createSpyObj<ThemeService>('ThemeService', ['setTheme'], { preferenceChanges: of('system'), activeTheme$: of('light') });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: CommonService, useValue: commonSpy },
        { provide: SpreadsheetService, useValue: spreadsheetSpy },
        { provide: AuthGoogleService, useValue: authSpy },
        { provide: ShiftService, useValue: shiftSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ThemeService, useValue: themeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Do NOT await global lifecycle whenStable here — it can hang due to
    // the component's internal interval/timers. Tests that need lifecycle
    // behavior should call `await component.ngOnInit()` themselves.
    // Tear down any subscriptions started in the constructor so the test
    // environment doesn't remain unstable.
    try { component.ngOnDestroy(); } catch { /* ignore */ }
  });

  it('toggles menu open/close', () => {
    expect(component.isMenuOpen()).toBeFalse();
    component.toggleMenu();
    expect(component.isMenuOpen()).toBeTrue();
    component.closeMenu();
    expect(component.isMenuOpen()).toBeFalse();
  });

  it('reports active route correctly', () => {
    component.currentRoute.set('/home');
    expect(component.isActiveRoute('/home')).toBeTrue();
    expect(component.isActiveRoute('/other')).toBeFalse();
  });

  it('cycles theme via ThemeService', () => {
    const themeSpy = jasmine.createSpyObj<ThemeService>('ThemeService', ['setTheme'], { preferenceChanges: of('system'), activeTheme$: of('light') });
    component['themeService'] = themeSpy;
    component.themePreference.set('system');
    component.cycleTheme();
    expect(themeSpy.setTheme).toHaveBeenCalled();
  });

  it('updateUnsavedCounts sets counts to 0 when not authenticated', async () => {
    // authSpy default returns false
    await component['updateUnsavedCounts']();
    expect(component.unsavedTripsCount()).toBe(0);
    expect(component.unsavedShiftsCount()).toBe(0);
  });

  it('updateUnsavedCounts sets counts when authenticated', async () => {
    authSpy.canSync.and.returnValue(Promise.resolve(true));
    tripSpy.getUnsaved.and.returnValue(Promise.resolve([1,2,3] as unknown as ITrip[]));
    shiftSpy.getUnsavedShifts.and.returnValue(Promise.resolve([1] as unknown as IShift[]));

    await component['updateUnsavedCounts']();

    expect(component.unsavedTripsCount()).toBe(3);
    expect(component.unsavedShiftsCount()).toBe(1);
  });

  it('ngOnInit initializes header and loads default sheet when authenticated', async () => {
    // Make auth return true and spreadsheet service return a default sheet
    authSpy.canSync.and.returnValue(Promise.resolve(true));
    spreadsheetSpy.querySpreadsheets.and.returnValue(Promise.resolve([{ id: 'sheet-1' } as ISpreadsheet]));

    // Call ngOnInit and wait for it to complete
    await component.ngOnInit();

    expect(component.isLoading()).toBeFalse();
    expect(component.defaultSheet()).toBeDefined();
    expect(component.defaultSheet() && component.defaultSheet()!.id).toBe('sheet-1');
  });

  it('themeLabel and themeIcon reflect preference and resolved theme', () => {
    component.themePreference.set('dark');
    expect(component.themeLabel).toBe('Dark');

    component.themePreference.set('light');
    component.resolvedTheme.set('light');
    expect(component.themeIcon).toBe('light_mode');

    component.themePreference.set('system');
    expect(component.themeIcon).toBe('brightness_auto');
  });

  it('setLoadingState delays hiding', fakeAsync(() => {
    // Ensure any pending timers from component init are flushed
    tick();

    component['setLoadingState'](true);
    tick(0); // process immediate show
    expect(component.isLoading()).toBeTrue();

    component['setLoadingState'](false);
    tick(299);
    expect(component.isLoading()).toBeTrue();
    tick(1);
    expect(component.isLoading()).toBeFalse();
  }));
});
