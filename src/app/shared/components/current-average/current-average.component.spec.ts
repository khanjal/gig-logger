import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentAverageComponent } from './current-average.component';

describe('CurrentDayAverageComponent', () => {
  let component: CurrentAverageComponent;
  let fixture: ComponentFixture<CurrentAverageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentAverageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentAverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
