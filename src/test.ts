// This file is required by karma.conf.js and loads recursively all the .spec and framework files

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

// Initialize the Angular testing environment (Angular CLI discovers specs automatically)
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
// Global test providers/imports to satisfy common dependencies in standalone components
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
    {
      provide: OAuthService,
      useValue: {
        configure: () => {},
        loadDiscoveryDocumentAndTryLogin: () => Promise.resolve(true),
        hasValidAccessToken: () => false,
        initLoginFlow: () => {},
        logOut: () => {}
      }
    },
    // Global mock for AuthGoogleService: individual specs may override
    {
      provide: AuthGoogleService,
      useValue: {
        canSync: () => Promise.resolve(false),
        isAuthenticated: () => Promise.resolve(false),
        isAuthenticatedSync: () => false,
        profile$: new BehaviorSubject(null)
      }
    },
    // Global mock for SpreadsheetService: avoid hitting IndexedDB during tests
    {
      provide: SpreadsheetService,
      useValue: {
        querySpreadsheets: () => Promise.resolve([]),
        getSpreadsheets: () => Promise.resolve([]),
        getDefaultSheet: () => Promise.resolve(undefined),
        add: async () => {},
        update: async () => {},
        deleteSpreadsheet: async () => {},
      }
    },
    // Lightweight stubs for ShiftService and TripService used by HeaderComponent
    {
      provide: ShiftService,
      useValue: {
        getUnsavedShifts: () => Promise.resolve([])
      }
    },
    {
      provide: TripService,
      useValue: {
        getUnsaved: () => Promise.resolve([])
      }
    },
    // LoggerService no-op stub
    {
      provide: LoggerService,
      useValue: {
        error: () => {},
        info: () => {},
        debug: () => {}
      }
    },
    // ThemeService stub with simple observables
    {
      provide: ThemeService,
      useValue: {
        preferenceChanges: new BehaviorSubject('system'),
        activeTheme$: new BehaviorSubject('light'),
        setTheme: (_: any) => {}
      }
    },
    // Global lightweight MatSnackBar mock
    {
      provide: MatSnackBar,
      useValue: {
        open: (message: any, action?: any, config?: any) => ({ message, action, config })
      }
    }
  ]
});

// Also ensure overriding providers at the TestBed level so standalone
// components that create their own injectors still receive the mocks.
getTestBed().overrideProvider(AuthGoogleService, {
  useValue: {
    canSync: () => Promise.resolve(false),
    isAuthenticated: () => Promise.resolve(false),
    isAuthenticatedSync: () => false,
    profile$: new BehaviorSubject(null)
  }
});

getTestBed().overrideProvider(SpreadsheetService, {
  useValue: {
    querySpreadsheets: () => Promise.resolve([]),
    getSpreadsheets: () => Promise.resolve([]),
    getDefaultSheet: () => Promise.resolve(undefined)
  }
});

getTestBed().overrideProvider(ShiftService, {
  useValue: {
    getUnsavedShifts: () => Promise.resolve([])
  }
});

getTestBed().overrideProvider(TripService, {
  useValue: {
    getUnsaved: () => Promise.resolve([])
  }
});

getTestBed().overrideProvider(LoggerService, {
  useValue: {
    error: () => {},
    info: () => {},
    debug: () => {}
  }
});

getTestBed().overrideProvider(ThemeService, {
  useValue: {
    preferenceChanges: new BehaviorSubject('system'),
    activeTheme$: new BehaviorSubject('light'),
    setTheme: (_: any) => {}
  }
});

getTestBed().overrideProvider(OAuthService, {
  useValue: {
    configure: () => {},
    loadDiscoveryDocumentAndTryLogin: () => Promise.resolve(true),
    hasValidAccessToken: () => false,
    initLoginFlow: () => {},
    logOut: () => {}
  }
});

getTestBed().overrideProvider(MatSnackBar, {
  useValue: {
    open: (message: any, action?: any, config?: any) => ({ message, action, config })
  }
});
