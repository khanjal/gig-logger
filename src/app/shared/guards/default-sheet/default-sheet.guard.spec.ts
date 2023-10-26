import { TestBed } from '@angular/core/testing';

import { DefaultSheetGuard } from './default-sheet.guard';
import { SpreadsheetService } from '@services/spreadsheet.service';

describe('DefaultSheetGuard', () => {
  let guard: DefaultSheetGuard;
  const mockSpreadsheetService = jasmine.createSpyObj("SpreadsheetService", ["getDefaultSheet"]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ 
        { provide: SpreadsheetService, useValue: mockSpreadsheetService}
      ],
    });
    guard = TestBed.inject(DefaultSheetGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
