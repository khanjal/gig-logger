import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TripFormComponent } from './trip-form.component';
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

describe('TripFormComponent', () => {
  let component: TripFormComponent;
  let fixture: ComponentFixture<TripFormComponent>;
  const mockAddressService = jasmine.createSpyObj("AddressService", ["getRemoteAddress", "getRemoteAddresses"]);
  const mockDeliveryService = jasmine.createSpyObj("DeliveryService", ["queryRemoteDeliveries", "getRemoteAddresses"]);
  const mockGigLoggerService = jasmine.createSpyObj("GigLoggerService", ["calculateShiftTotals"]);
  const mockNameService = jasmine.createSpyObj("NameService", ["findRemoteName", "getRemoteNames"]);
  const mockPlaceService = jasmine.createSpyObj("PlaceService", ["getRemotePlace", "getRemotePlaces"]);
  const mockRegionService = jasmine.createSpyObj("RegionService", ["filter", "get"]);
  const mockServiceService = jasmine.createSpyObj("ServiceService", ["filterRemoteServices", "getRemoteServices"]);
  const mockShiftService = jasmine.createSpyObj("ShiftService", ["addNewShift", "getPreviousWeekShifts", "queryLocalShifts", "queryRemoteShifts", "queryShiftByKey"]);
  const mockTimerService = jasmine.createSpyObj("TimerService", ["delay"]);
  const mockTripService = jasmine.createSpyObj("TripService", ["addTrip", "queryLocalTrips", "queryRemoteTrips", "updateLocalTrip"]);
  const mockTypeService = jasmine.createSpyObj("TypeService", ["filter"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule, MatSnackBarModule, TripFormComponent, MatAutocomplete],
    providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: AddressService, useValue: mockAddressService },
        { provide: DeliveryService, useValue: mockDeliveryService },
        { provide: GigLoggerService, useValue: mockGigLoggerService },
        { provide: NameService, useValue: mockNameService },
        { provide: PlaceService, useValue: mockPlaceService },
        { provide: RegionService, useValue: mockRegionService },
        { provide: ServiceService, useValue: mockServiceService },
        { provide: ShiftService, useValue: mockShiftService },
        { provide: TimerService, useValue: mockTimerService },
        { provide: TripService, useValue: mockTripService },
        { provide: TypeService, useValue: mockTypeService }
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(TripFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
