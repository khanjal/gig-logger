import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { AddressService } from '@services/address.service';
import { CommonService } from '@services/common.service';
import { DailyService } from '@services/daily.service';
import { DeliveryService } from '@services/delivery.service';
import { MonthlyService } from '@services/monthly.service';
import { NameService } from '@services/name.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { PlaceService } from '@services/place.service';
import { PollingService } from '@services/polling.service';
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
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PagesModule } from './app/pages/pages.module';
import { SharedModule } from './app/shared/shared.module';
import { AppComponent } from './app/app.component';
import { CommonModule } from '@angular/common';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(AppRoutingModule, CommonModule, FormsModule, MatIconModule, PagesModule, SharedModule),
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
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations()
    ]
})
  .catch(err => console.error(err));
