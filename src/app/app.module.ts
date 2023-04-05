import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PagesModule } from './pages/pages.module';
import { MatIconModule } from '@angular/material/icon';
import { GoogleDriveService } from './shared/services/googleSheet.service';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { AuthService } from './shared/services/auth.service';
import { AuthGuardService } from './shared/services/auth-guard.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatIconModule,
    PagesModule,
    SharedModule
  ],
  providers: [
    AuthService,
    AuthGuardService,
    GoogleDriveService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
