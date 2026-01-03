import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { SetupComponent } from './setup.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';

describe('SheetSetupComponent', () => {
  let component: SetupComponent;
  let fixture: ComponentFixture<SetupComponent>;
  const mockCommonService = jasmine.createSpyObj("CommonService", ["updateHeaderLink"]);
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["getSpreadsheets", "querySpreadsheets", "update", "deleteSpreadsheet", "deleteData"]);
  const mockTimerService = jasmine.createSpyObj("TimerService", ["delay"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, MatSnackBarModule, SetupComponent],
      providers: [
        ...commonTestingProviders,
        { provide: CommonService, useValue: mockCommonService },
        { provide: SpreadsheetService, useValue: mockSpreadsheetService },
        { provide: TimerService, useValue: mockTimerService }
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
