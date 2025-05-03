import { NgModule, isDevMode } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { PagesModule } from './pages/pages.module';

import { AppComponent } from './app.component';

import { AddressService } from '@services/sheets/address.service';
import { CommonService } from '@services/common.service';
import { DailyService } from '@services/sheets/daily.service';
import { DeliveryService } from '@services/delivery.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { MonthlyService } from '@services/sheets/monthly.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { PollingService } from '@services/polling.service';
import { RegionService } from '@services/sheets/region.service';
import { ServiceService } from '@services/sheets/service.service';
import { ShiftService } from '@services/sheets/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';
import { TypeService } from '@services/sheets/type.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';
import { YearlyService } from '@services/sheets/yearly.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HeaderComponent } from "./shared/header/header.component";

@NgModule({ declarations: [
    ],
    imports: [AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MatIconModule,
    PagesModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
    }), HeaderComponent], 
    providers: [
        AddressService,
        CommonService,
        DailyService,
        DeliveryService,
        MonthlyService,
        NameService,
        GigLoggerService,
        PlaceService,
        PollingService,
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
