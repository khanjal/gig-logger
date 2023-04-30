import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PagesModule } from './pages/pages.module';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { GoogleSheetService } from '@services/googleSheet.service';
import { ShiftService } from '@services/shift.service';
import { TripService } from '@services/trip.service';
import { AddressService } from '@services/address.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { ServiceService } from '@services/service.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { WeekdayService } from '@services/weekday.service';
import { TimerService } from '@services/timer.service';

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
    SharedModule,
  ],
  providers: [
    AddressService,
    NameService,
    GoogleSheetService,
    PlaceService,
    ServiceService,
    ShiftService,
    SpreadsheetService,
    TimerService,
    TripService,
    WeekdayService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
