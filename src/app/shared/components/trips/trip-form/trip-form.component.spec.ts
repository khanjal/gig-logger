import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TripFormComponent } from './trip-form.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AddressService } from '@services/sheets/address.service';
import { DeliveryService } from '@services/delivery.service';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { RegionService } from '@services/sheets/region.service';
import { ServiceService } from '@services/sheets/service.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';
import { TypeService } from '@services/sheets/type.service';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { DailyService } from '@services/sheets/daily.service';
import { MonthlyService } from '@services/sheets/monthly.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';
import { YearlyService } from '@services/sheets/yearly.service';
import { MatAutocomplete } from '@angular/material/autocomplete';

describe('TripFormComponent', () => {
  let component: TripFormComponent;
  let fixture: ComponentFixture<TripFormComponent>;
  const mockAddressService = jasmine.createSpyObj("AddressService", ["getRemoteAddress", "getRemoteAddresses"]);
  const mockDeliveryService = jasmine.createSpyObj("DeliveryService", ["queryRemoteDeliveries", "getRemoteAddresses"]);
  const mockGigWorkflowService = jasmine.createSpyObj("GigWorkflowService", ["calculateShiftTotals"]);
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
        { provide: GigWorkflowService, useValue: mockGigWorkflowService },
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
