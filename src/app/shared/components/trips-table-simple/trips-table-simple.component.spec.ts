import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsTableSimpleComponent } from './trips-table-simple.component';

describe('TripsTableSimpleComponent', () => {
  let component: TripsTableSimpleComponent;
  let fixture: ComponentFixture<TripsTableSimpleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripsTableSimpleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsTableSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
