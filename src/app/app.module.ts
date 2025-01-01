import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { PagesModule } from './pages/pages.module';
import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';

import { AddressService } from '@services/address.service';
import { CommonService } from '@services/common.service';
import { DailyService } from '@services/daily.service';
import { DeliveryService } from '@services/delivery.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { MonthlyService } from '@services/monthly.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/trip.service';
import { TypeService } from '@services/type.service';
import { WeekdayService } from '@services/weekday.service';
import { WeeklyService } from '@services/weekly.service';
import { YearlyService } from '@services/yearly.service';

@NgModule({ declarations: [
        AppComponent
    ],
    bootstrap: [AppComponent], imports: [AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        MatIconModule,
        PagesModule,
        SharedModule], providers: [
        AddressService,
        CommonService,
        DailyService,
        DeliveryService,
        MonthlyService,
        NameService,
        GigLoggerService,
        PlaceService,
        RegionService,
        ServiceService,
        ShiftService,
        SpreadsheetService,
        TimerService,
        TripService,
        TypeService,
        WeekdayService,
        WeeklyService,
        YearlyService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
