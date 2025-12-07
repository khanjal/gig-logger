import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TripsModalComponent } from './trips-modal.component';

describe('TripsModalComponent', () => {
  let component: TripsModalComponent;
  let fixture: ComponentFixture<TripsModalComponent>;
  const dialogRefSpy = { close: jasmine.createSpy('close') };
  const dialogData = { title: 'Test', trips: [] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsModalComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
