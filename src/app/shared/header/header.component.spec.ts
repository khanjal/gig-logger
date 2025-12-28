import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { commonTestingImports, commonTestingProviders, createAuthGoogleServiceMock, createShiftServiceMock, createTripServiceMock } from '../../../test-harness';
import { AuthGoogleService } from '@services/auth-google.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const mockCommonService = jasmine.createSpyObj("CommonService", ["updateHeaderLink"], { onHeaderLinkUpdate: { subscribe: () => ({ unsubscribe: () => {} }) } });
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["querySpreadsheets"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, MatSnackBarModule, HeaderComponent],
      providers: [
        ...commonTestingProviders,
        { provide: CommonService, useValue: mockCommonService },
        { provide: SpreadsheetService, useValue: mockSpreadsheetService },
        { provide: AuthGoogleService, useValue: createAuthGoogleServiceMock() },
        { provide: ShiftService, useValue: createShiftServiceMock() },
        { provide: TripService, useValue: createTripServiceMock() }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
