import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickComponent } from './quick.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GigLoggerService } from '@services/gig-logger.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { ShiftService } from '@services/shift.service';
import { TripService } from '@services/trip.service';

describe('QuickComponent', () => {
  let component: QuickComponent;
  let fixture: ComponentFixture<QuickComponent>;
  const mockGigLoggerService = jasmine.createSpyObj("GigLoggerService", ["calculateShiftTotals"]);
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["loadSpreadsheetData", "querySpreadsheets"]);
  const mockShiftService = jasmine.createSpyObj("ShiftService", ["deleteService", "getUnsavedShifts", "queryShifts", "saveUnsavedShifts", "updateShift"]);
  const mockTripService = jasmine.createSpyObj("TripService", ["addTrip", "deleteTrip", "getSavedTrips", "getUnsavedTrips", "saveUnsavedTrips", "updateTrip"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickComponent ],
      imports: [ MatDialogModule, MatSnackBarModule ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: GigLoggerService, useValue: mockGigLoggerService },
        { provide: SpreadsheetService, useValue: mockSpreadsheetService },
        { provide: ShiftService, useValue: mockShiftService },
        { provide: TripService, useValue: mockTripService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
