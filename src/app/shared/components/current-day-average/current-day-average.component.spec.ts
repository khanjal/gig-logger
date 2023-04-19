import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentDayAverageComponent } from './current-day-average.component';

describe('CurrentDayAverageComponent', () => {
  let component: CurrentDayAverageComponent;
  let fixture: ComponentFixture<CurrentDayAverageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentDayAverageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentDayAverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
