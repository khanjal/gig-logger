import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftTripsQuickViewComponent } from './shift-trips-quick-view.component';

describe('ShiftTripsQuickViewComponent', () => {
  let component: ShiftTripsQuickViewComponent;
  let fixture: ComponentFixture<ShiftTripsQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftTripsQuickViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftTripsQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
