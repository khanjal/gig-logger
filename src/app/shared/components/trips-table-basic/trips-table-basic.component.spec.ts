import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsTableBasicComponent } from './trips-table-basic.component';

describe('TripsTableBasicComponent', () => {
  let component: TripsTableBasicComponent;
  let fixture: ComponentFixture<TripsTableBasicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripsTableBasicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsTableBasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
