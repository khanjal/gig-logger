import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetAddFormComponent } from './sheet-add-form.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddressService } from '@services/sheets/address.service';
import { CommonService } from '@services/common.service';
import { DailyService } from '@services/sheets/daily.service';
import { DeliveryService } from '@services/delivery.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { MonthlyService } from '@services/sheets/monthly.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
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

describe('SheetSetupFormComponent', () => {
  let component: SheetAddFormComponent;
  let fixture: ComponentFixture<SheetAddFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatSnackBarModule, SheetAddFormComponent],
    providers: [
        HttpClient,
        HttpHandler,
        AddressService,
        DailyService,
        DeliveryService,
        GigLoggerService,
        MonthlyService,
        NameService,
        PlaceService,
        RegionService,
        ServiceService,
        ShiftService,
        SpreadsheetService,
        TripService,
        TypeService,
        WeekdayService,
        WeeklyService,
        YearlyService
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(SheetAddFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
