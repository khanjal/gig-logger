import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let commonSpy: any;
  let spreadsheetSpy: any;
  let authSpy: any;
  let shiftSpy: any;
  let tripSpy: any;
  let routerEvents: Subject<any>;

  beforeEach(async () => {
    commonSpy = { onHeaderLinkUpdate: of(null) };
    spreadsheetSpy = jasmine.createSpyObj('SpreadsheetService', ['querySpreadsheets']);
    spreadsheetSpy.querySpreadsheets.and.returnValue(Promise.resolve([]));
    authSpy = jasmine.createSpyObj('AuthGoogleService', ['isAuthenticated']);
    authSpy.isAuthenticated.and.returnValue(Promise.resolve(false));
    shiftSpy = jasmine.createSpyObj('ShiftService', ['getUnsavedShifts']);
    tripSpy = jasmine.createSpyObj('TripService', ['getUnsaved']);
    tripSpy.getUnsaved.and.returnValue(Promise.resolve([]));

    routerEvents = new Subject<any>();
    const routerSpy: any = {
      events: routerEvents.asObservable(),
      createUrlTree: (...args: any[]) => ({}),
      navigate: jasmine.createSpy('navigate'),
      serializeUrl: (_: any) => ''
    };
    const activatedRouteStub: any = { snapshot: { url: [] } };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: CommonService, useValue: commonSpy },
        { provide: SpreadsheetService, useValue: spreadsheetSpy },
        { provide: AuthGoogleService, useValue: authSpy },
        { provide: ShiftService, useValue: shiftSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('toggles menu open/close', () => {
    expect(component.isMenuOpen).toBeFalse();
    component.toggleMenu();
    expect(component.isMenuOpen).toBeTrue();
    component.closeMenu();
    expect(component.isMenuOpen).toBeFalse();
  });

  it('reports active route correctly', () => {
    component.currentRoute = '/home';
    expect(component.isActiveRoute('/home')).toBeTrue();
    expect(component.isActiveRoute('/other')).toBeFalse();
  });

  it('cycles theme via ThemeService', () => {
    const themeSpy = jasmine.createSpyObj('ThemeService', ['setTheme'], { preferenceChanges: of('system'), activeTheme$: of('light') });
    component['themeService'] = themeSpy as any;
    component.themePreference = 'system';
    component.cycleTheme();
    expect(themeSpy.setTheme).toHaveBeenCalled();
  });

  it('updateUnsavedCounts sets counts to 0 when not authenticated', async () => {
    // authSpy default returns false
    await (component as any).updateUnsavedCounts();
    expect(component.unsavedTripsCount).toBe(0);
    expect(component.unsavedShiftsCount).toBe(0);
  });

  it('updateUnsavedCounts sets counts when authenticated', async () => {
    authSpy.isAuthenticated.and.returnValue(Promise.resolve(true));
    tripSpy.getUnsaved.and.returnValue(Promise.resolve([1,2,3]));
    shiftSpy.getUnsavedShifts.and.returnValue(Promise.resolve([1]));

    await (component as any).updateUnsavedCounts();

    expect(component.unsavedTripsCount).toBe(3);
    expect(component.unsavedShiftsCount).toBe(1);
  });

  it('ngOnInit initializes header and loads default sheet when authenticated', async () => {
    // Make auth return true and spreadsheet service return a default sheet
    authSpy.isAuthenticated.and.returnValue(Promise.resolve(true));
    spreadsheetSpy.querySpreadsheets.and.returnValue(Promise.resolve([{ id: 'sheet-1' }]));

    // Call ngOnInit and wait for it to complete
    await component.ngOnInit();

    expect(component.isLoading).toBeFalse();
    expect(component.defaultSheet).toBeDefined();
    expect(component.defaultSheet && (component.defaultSheet as any).id).toBe('sheet-1');
  });

  it('themeLabel and themeIcon reflect preference and resolved theme', () => {
    component.themePreference = 'dark';
    expect(component.themeLabel).toBe('Dark');

    component.themePreference = 'light';
    component.resolvedTheme = 'light';
    expect(component.themeIcon).toBe('light_mode');

    component.themePreference = 'system';
    expect(component.themeIcon).toBe('brightness_auto');
  });

  it('setLoadingState delays hiding', fakeAsync(() => {
    // Ensure any pending timers from component init are flushed
    tick();

    (component as any).setLoadingState(true);
    tick(0); // process immediate show
    expect(component.isLoading).toBeTrue();

    (component as any).setLoadingState(false);
    tick(299);
    expect(component.isLoading).toBeTrue();
    tick(1);
    expect(component.isLoading).toBeFalse();
  }));
});
