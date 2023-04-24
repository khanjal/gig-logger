import { TestBed } from '@angular/core/testing';

import { DefaultSheetGuard } from './default-sheet.guard';

describe('DefaultSheetGuard', () => {
  let guard: DefaultSheetGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(DefaultSheetGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
