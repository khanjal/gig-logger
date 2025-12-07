import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsModalComponent } from './trips-modal.component';

describe('TripsModalComponent', () => {
  let component: TripsModalComponent;
  let fixture: ComponentFixture<TripsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TripsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
