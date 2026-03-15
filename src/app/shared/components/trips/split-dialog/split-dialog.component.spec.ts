import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { SplitDialogComponent } from './split-dialog.component';

describe('SplitDialogComponent', () => {
  let component: SplitDialogComponent;
  let fixture: ComponentFixture<SplitDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SplitDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [SplitDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(SplitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default selection to both', () => {
    expect(component.selection).toBe('both');
  });

  it('should close dialog without payload on cancel', () => {
    component.cancel();

    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should close dialog with selected value on confirm', () => {
    component.selection = 'customer';

    component.confirm();

    expect(dialogRefSpy.close).toHaveBeenCalledWith('customer');
  });
});
