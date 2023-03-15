import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PagesModule } from './pages/pages.module';
import { HeaderComponent } from './shared/header/header.component';
import { MatIconModule } from '@angular/material/icon';
import { GoogleDriveService } from './shared/services/googleSheet.service';
import { HttpClientModule } from '@angular/common/http';
import { AddressService } from './shared/services/address.service';
import { NameService } from './shared/services/name.service';
import { PlaceService } from './shared/services/place.service';
import { ShiftService } from './shared/services/shift.service';
import { ServiceService } from './shared/services/service.service';
import { TripService } from './shared/services/trip.service';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatToolbarModule,
    MatIconModule,
    PagesModule
  ],
  providers: [
    AddressService,
    GoogleDriveService,
    NameService,
    PlaceService,
    ServiceService,
    ShiftService,
    TripService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
