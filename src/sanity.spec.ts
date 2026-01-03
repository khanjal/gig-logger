import { TestBed } from '@angular/core/testing';

describe('Sanity', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  it('runs a basic truthy test', () => {
    expect(true).toBeTrue();
  });
});
