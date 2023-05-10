import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsTableGroupComponent } from './trips-table-group.component';

describe('TripsTableGroupComponent', () => {
  let component: TripsTableGroupComponent;
  let fixture: ComponentFixture<TripsTableGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripsTableGroupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsTableGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
