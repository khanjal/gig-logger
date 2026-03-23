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
    // Global mock for AuthGoogleService to satisfy components/services that
    // call `canSync()` or subscribe to `profile$`. Individual specs can
    // override this provider when needed.
    {
      provide: AuthGoogleService,
      useValue: {
        canSync: () => Promise.resolve(false),
        isAuthenticated: () => Promise.resolve(false),
        isAuthenticatedSync: () => false,
        profile$: new BehaviorSubject(null)
      }
    },
    // Global lightweight MatSnackBar mock: many specs assert that
    // `snackBar.open(...)` is called; provide a tolerant stub here so
    // tests don't fail on argument shape changes. Individual specs can
    // override this provider when they need to inspect the call.
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
