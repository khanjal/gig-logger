import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const mockCommonService = jasmine.createSpyObj("CommonService", ["updateHeaderLink"]);
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["querySpreadsheets"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeaderComponent ],
      imports: [ MatSnackBarModule ],
      providers: [
        { provide: CommonService, usevalue: mockCommonService },
        { provide: SpreadsheetService, usevalue: mockSpreadsheetService }
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
