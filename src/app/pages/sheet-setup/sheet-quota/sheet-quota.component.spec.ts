import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetQuotaComponent } from './sheet-quota.component';
import { SpreadsheetService } from '@services/spreadsheet.service';

describe('SheetQuotaComponent', () => {
  let component: SheetQuotaComponent;
  let fixture: ComponentFixture<SheetQuotaComponent>;
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["showEstimatedQuota"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SheetQuotaComponent ],
      providers: [ 
        { provide: SpreadsheetService, useValue: mockSpreadsheetService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
