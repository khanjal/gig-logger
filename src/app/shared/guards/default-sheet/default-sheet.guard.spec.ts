import { TestBed } from '@angular/core/testing';

import { DefaultSheetGuard } from './default-sheet.guard';
import { SpreadsheetService } from '@services/spreadsheet.service';

describe('DefaultSheetGuard', () => {
  let guard: DefaultSheetGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ SpreadsheetService ]
    });
    guard = TestBed.inject(DefaultSheetGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
