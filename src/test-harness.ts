import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SwUpdate } from '@angular/service-worker';
import { OAuthService } from 'angular-oauth2-oidc';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';

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

export const commonTestingProviders = [
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
