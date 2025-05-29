import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/service-worker.js').then((registration) => {
//     console.log('Service Worker registered with scope:', registration.scope);
//   }).catch((error) => {
//     console.error('Service Worker registration failed:', error);
//   });
// }

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
      })
    ),
    provideHttpClient(withInterceptorsFromDi()),
    provideNativeDateAdapter(),
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } }
  ]
}).catch(err => console.error(err));
