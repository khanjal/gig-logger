// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SwUpdate } from '@angular/service-worker';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';
import { AuthGoogleService } from './app/shared/services/auth-google.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpreadsheetService } from './app/shared/services/spreadsheet.service';
import { ShiftService } from './app/shared/services/sheets/shift.service';
import { TripService } from './app/shared/services/sheets/trip.service';
import { LoggerService } from './app/shared/services/logger.service';
import { ThemeService } from './app/shared/services/theme.service';
import type { UserProfile } from './app/shared/interfaces/user-profile.interface';

// Initialize the Angular testing environment (Angular CLI discovers specs automatically)
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
// Global test providers/imports to satisfy common dependencies in standalone components
// Shared test stubs so we can reuse the same objects in both
// `configureTestingModule` and `overrideProvider` without drift.
const AUTH_GOOGLE_SERVICE_STUB = {
  canSync: () => Promise.resolve(false),
  isAuthenticated: () => Promise.resolve(false),
  isAuthenticatedSync: () => false,
  profile$: new BehaviorSubject<UserProfile | null>(null)
};

const SPREADSHEET_SERVICE_STUB = {
  spreadsheets$: new BehaviorSubject<any[]>([]),
  querySpreadsheets: () => Promise.resolve([]),
  getSpreadsheets: () => Promise.resolve([]),
  getDefaultSheet: () => Promise.resolve(undefined),
  add: async () => {},
  update: async () => {},
  deleteSpreadsheet: async () => {},
};

const SHIFT_SERVICE_STUB = { getUnsavedShifts: () => Promise.resolve([]) };
const TRIP_SERVICE_STUB = { getUnsaved: () => Promise.resolve([]) };
const LOGGER_SERVICE_STUB = { error: () => {}, info: () => {}, debug: () => {} };
const THEME_SERVICE_STUB = { preferenceChanges: new BehaviorSubject('system'), activeTheme$: new BehaviorSubject('light'), setTheme: (_: any) => {} };
const OAUTH_SERVICE_STUB = { configure: () => {}, loadDiscoveryDocumentAndTryLogin: () => Promise.resolve(true), hasValidAccessToken: () => false, initLoginFlow: () => {}, logOut: () => {} };
const MAT_SNACKBAR_STUB = { open: (message: any, action?: any, config?: any) => ({ message, action, config }) };

getTestBed().configureTestingModule({
  imports: [
    HttpClientTestingModule,
    RouterTestingModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatDatepickerModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: { close: () => {} } },
    { provide: SwUpdate, useValue: { isEnabled: false, checkForUpdate: () => Promise.resolve(false) } },
    { provide: OAuthService, useValue: OAUTH_SERVICE_STUB },
    { provide: AuthGoogleService, useValue: AUTH_GOOGLE_SERVICE_STUB },
    { provide: SpreadsheetService, useValue: SPREADSHEET_SERVICE_STUB },
    { provide: ShiftService, useValue: SHIFT_SERVICE_STUB },
    { provide: TripService, useValue: TRIP_SERVICE_STUB },
    { provide: LoggerService, useValue: LOGGER_SERVICE_STUB },
    { provide: ThemeService, useValue: THEME_SERVICE_STUB },
    { provide: MatSnackBar, useValue: MAT_SNACKBAR_STUB }
  ]
});

// Also ensure overriding providers at the TestBed level so standalone
// components that create their own injectors still receive the mocks.
