import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftTripsTableComponent } from './shift-trips-table.component';

describe('ShiftTripsTableComponent', () => {
  let component: ShiftTripsTableComponent;
  let fixture: ComponentFixture<ShiftTripsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftTripsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftTripsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
