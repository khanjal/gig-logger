import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomCalendarHeaderComponent } from './custom-calendar-header.component';
import { MatCalendar } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

describe('CustomCalendarHeaderComponent', () => {
  let component: CustomCalendarHeaderComponent<any>;
  let fixture: ComponentFixture<CustomCalendarHeaderComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomCalendarHeaderComponent ],
      providers: [ 
        { provide: MAT_DATE_FORMATS, useValue: [] },
        DateAdapter, 
        MatCalendar ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomCalendarHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
