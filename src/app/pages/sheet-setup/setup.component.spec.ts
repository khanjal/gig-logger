import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { SetupComponent } from './setup.component';
import { CommonService } from '@services/common.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { AddressService } from '@services/address.service';
import { DailyService } from '@services/daily.service';
import { DeliveryService } from '@services/delivery.service';
import { MonthlyService } from '@services/monthly.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { TripService } from '@services/trip.service';
import { TypeService } from '@services/type.service';
import { WeekdayService } from '@services/weekday.service';
import { WeeklyService } from '@services/weekly.service';
import { YearlyService } from '@services/yearly.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';

describe('SheetSetupComponent', () => {
  let component: SetupComponent;
  let fixture: ComponentFixture<SetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetupComponent ],
      imports: [ MatSnackBarModule ],
      providers: [ 
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: []},
        HttpClient,
        HttpHandler,
        AddressService,
        CommonService,
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
        TimerService,
        TripService,
        TypeService,
        WeekdayService,
        WeeklyService,
        YearlyService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
