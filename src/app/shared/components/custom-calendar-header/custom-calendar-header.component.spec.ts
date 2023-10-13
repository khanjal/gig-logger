import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomCalendarHeaderComponent } from './custom-calendar-header.component';

describe('CustomCalendarHeaderComponent', () => {
  let component: CustomCalendarHeaderComponent;
  let fixture: ComponentFixture<CustomCalendarHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomCalendarHeaderComponent ]
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
