import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SwUpdate } from '@angular/service-worker';
import { OAuthService } from 'angular-oauth2-oidc';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { AuthGoogleService } from '@services/auth-google.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { LoggerService } from '@services/logger.service';
import { ThemeService } from '@services/theme.service';
import { CommonService } from '@services/common.service';

const createDialogRefStub = () => ({ close: () => {} });

const createOAuthServiceMock = () => ({
  configure: jasmine.createSpy('configure'),
  loadDiscoveryDocument: jasmine.createSpy('loadDiscoveryDocument').and.returnValue(Promise.resolve(true)),
  loadDiscoveryDocumentAndTryLogin: jasmine.createSpy('loadDiscoveryDocumentAndTryLogin').and.returnValue(Promise.resolve(true)),
  hasValidAccessToken: jasmine.createSpy('hasValidAccessToken').and.returnValue(false),
  initLoginFlow: jasmine.createSpy('initLoginFlow'),
  logOut: jasmine.createSpy('logOut'),
  setStorage: jasmine.createSpy('setStorage'),
  tryLoginImplicitFlow: jasmine.createSpy('tryLoginImplicitFlow').and.returnValue(Promise.resolve(true)),
  setupAutomaticSilentRefresh: jasmine.createSpy('setupAutomaticSilentRefresh')
});

export const createDialogSpy = () => {
  const afterOpenedSubject = new Subject<void>();
  const afterAllClosedSubject = new Subject<void>();
  return {
    open: jasmine.createSpy('open').and.callFake((_comp?: unknown, _config?: unknown) => {
      afterOpenedSubject.next();
      return { afterClosed: () => of(undefined) } as any;
    }),
    openDialogs: [],
    afterOpened: afterOpenedSubject,
    afterAllClosed: afterAllClosedSubject,
    _getAfterAllClosed: () => afterAllClosedSubject,
    _afterAllClosedAtThisLevel: afterAllClosedSubject,
    _afterOpened: afterOpenedSubject
  };
};

export const createAuthGoogleServiceMock = () => jasmine.createSpyObj('AuthGoogleService', [
  'isAuthenticated',
  'login',
  'logout',
  'getToken'
]);

export const createAuthGoogleServiceMockExtended = () => {
  const mock: any = jasmine.createSpyObj('AuthGoogleService', [
    'isAuthenticated',
    'canSync',
    'login',
    'logout',
    'getToken'
  ], { profile$: new Subject<any>() });
  mock.canSync.and.returnValue(Promise.resolve(false));
  mock.isAuthenticated.and.returnValue(false);
  return mock;
};

export const createSpreadsheetServiceMock = () => {
  const spreadsheets$ = new BehaviorSubject<any[]>([]);
  return {
    spreadsheets$,
    querySpreadsheets: jasmine.createSpy('querySpreadsheets').and.returnValue(Promise.resolve([])),
    getSpreadsheets: jasmine.createSpy('getSpreadsheets').and.returnValue(Promise.resolve([]))
  } as any;
};

export const createShiftServiceMock = () => jasmine.createSpyObj('ShiftService', [
  'getAll',
  'getById',
  'add',
  'update',
  'delete',
  'getShiftsBetweenDates'
]);

export const createTripServiceMock = () => jasmine.createSpyObj('TripService', [
  'getAll',
  'getById',
  'add',
  'update',
  'delete',
  'getBetweenDates'
]);

export const commonTestingImports = [
  HttpClientTestingModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  MatDialogModule,
  MatDatepickerModule
];

export const commonTestingProviders: any[] = [
  provideNativeDateAdapter(),
  { provide: MAT_DIALOG_DATA, useValue: {} },
  { provide: MatDialogRef, useValue: createDialogRefStub() },
  { provide: SwUpdate, useValue: { isEnabled: false, checkForUpdate: () => Promise.resolve(false), activateUpdate: () => Promise.resolve(false) } },
  { provide: OAuthService, useValue: createOAuthServiceMock() },
  {
    provide: ActivatedRoute,
    useValue: {
      snapshot: { params: {}, queryParams: {} },
      paramMap: { get: () => null },
      queryParamMap: { get: () => null }
    }
  }
];

// Provide lightweight global test doubles for common services used by HeaderComponent
commonTestingProviders.push(
  { provide: (AuthGoogleService as any), useValue: createAuthGoogleServiceMockExtended() },
  { provide: (SpreadsheetService as any), useValue: createSpreadsheetServiceMock() },
  { provide: (ShiftService as any), useValue: createShiftServiceMock() },
  { provide: (TripService as any), useValue: createTripServiceMock() },
  { provide: (LoggerService as any), useValue: jasmine.createSpyObj('LoggerService', ['error', 'debug']) },
  { provide: (ThemeService as any), useValue: { preferenceChanges: of('system'), activeTheme$: of('light'), setTheme: jasmine.createSpy('setTheme') } },
  { provide: (CommonService as any), useValue: { onHeaderLinkUpdate: of(null) } }
);
