import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyStatsComponent } from './weekly-stats.component';

describe('WeeklyStatsComponent', () => {
  let component: WeeklyStatsComponent;
  let fixture: ComponentFixture<WeeklyStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeeklyStatsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeeklyStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
