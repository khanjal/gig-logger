import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsQuickViewComponent } from './trips-quick-view.component';

describe('TripsQuickViewComponent', () => {
  let component: TripsQuickViewComponent;
  let fixture: ComponentFixture<TripsQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripsQuickViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
