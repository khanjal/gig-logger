import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AddressDialogComponent } from './address-dialog.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AddressDialogComponent', () => {
  let component: AddressDialogComponent;
  let fixture: ComponentFixture<AddressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddressDialogComponent ],
      imports: [ MatDialogRef ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
