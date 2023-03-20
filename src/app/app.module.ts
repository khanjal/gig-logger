import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PagesModule } from './pages/pages.module';
import { MatIconModule } from '@angular/material/icon';
import { GoogleDriveService } from './shared/services/googleSheet.service';
import { HttpClientModule } from '@angular/common/http';
import { AddressService } from './shared/services/address.service';
import { NameService } from './shared/services/name.service';
import { PlaceService } from './shared/services/place.service';
import { ShiftService } from './shared/services/shift.service';
import { ServiceService } from './shared/services/service.service';
import { TripService } from './shared/services/trip.service';
import { SharedModule } from './shared/shared.module';

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
