import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { QuickFormComponent } from './quick-form.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AddressService } from '@services/address.service';
import { DeliveryService } from '@services/delivery.service';
import { GigLoggerService } from '@services/gig-logger.service';
import { NameService } from '@services/name.service';
import { PlaceService } from '@services/place.service';
import { RegionService } from '@services/region.service';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/trip.service';
import { TypeService } from '@services/type.service';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { DailyService } from '@services/daily.service';
import { MonthlyService } from '@services/monthly.service';
import { WeekdayService } from '@services/weekday.service';
import { WeeklyService } from '@services/weekly.service';
import { YearlyService } from '@services/yearly.service';
import { MatAutocomplete } from '@angular/material/autocomplete';

describe('QuickFormComponent', () => {
  let component: QuickFormComponent;
  let fixture: ComponentFixture<QuickFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickFormComponent, MatAutocomplete ],
      imports: [ MatDialogModule, MatSnackBarModule ],
      providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: []},
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
        TimerService,
        TripService,
        TypeService,
        WeekdayService,
        WeeklyService,
        YearlyService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
