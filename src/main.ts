import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app/app-routing.module';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
    importProvidersFrom(CommonModule, HttpClientModule, RouterModule, AppRoutingModule, MatDialogModule, BrowserAnimationsModule),
    provideNativeDateAdapter()
  ]
}).catch(err => console.error(err));
