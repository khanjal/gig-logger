import { enableProdMode, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { SecureCookieStorageService } from './app/shared/services/secure-cookie-storage.service';
import { AppInitializerService } from './app/shared/services/app-initializer.service';

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// App initializer factory
export function initializeApp(appInitializer: AppInitializerService) {
  return () => appInitializer.initialize();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      CommonModule,
      RouterModule,
      AppRoutingModule,
      MatDialogModule,
      BrowserAnimationsModule,      
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.production,
        registrationStrategy: 'registerWhenStable:30000'
      }),
      OAuthModule.forRoot()
    ),
    provideHttpClient(withInterceptorsFromDi()),
    provideNativeDateAdapter(),
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } },
    { provide: OAuthStorage, useClass: SecureCookieStorageService },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializerService],
      multi: true
    }
  ]
}).catch(err => {
  console.error('Failed to bootstrap application:', err);
  
  // Show user-friendly error message
  const errorContainer = document.createElement('div');
  errorContainer.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
      padding: 20px;
      font-family: Arial, sans-serif;
    ">
      <h1 style="color: #f44336; margin-bottom: 16px;">Application Failed to Load</h1>
      <p style="color: #666; margin-bottom: 24px;">
        The application encountered an error during startup. Please try refreshing the page.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="
          background: #2196F3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Reload Page
      </button>
    </div>
  `;
  
  // Clear the body and show error
  document.body.innerHTML = '';
  document.body.appendChild(errorContainer);
});
