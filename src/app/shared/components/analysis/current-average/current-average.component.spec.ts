import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { CurrentAverageComponent } from './current-average.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrentAverageStateService } from '@services/current-average-state.service';

describe('CurrentAverageComponent', () => {
  let component: CurrentAverageComponent;
  let fixture: ComponentFixture<CurrentAverageComponent>;
  const mockCurrentAverageStateService = {
    setDate: jasmine.createSpy('setDate'),
    currentDayAmount: signal(0),
    currentMonthAmount: signal(0),
    currentWeekAmount: signal(0),
    dailyAverage: signal(0),
    weeklyAverage: signal(0),
    monthlyAverage: signal(0)
  };

  beforeEach(async () => {
    mockCurrentAverageStateService.setDate.calls.reset();
    mockCurrentAverageStateService.currentDayAmount.set(0);
    mockCurrentAverageStateService.currentMonthAmount.set(0);
    mockCurrentAverageStateService.currentWeekAmount.set(0);
    mockCurrentAverageStateService.dailyAverage.set(0);
    mockCurrentAverageStateService.weeklyAverage.set(0);
    mockCurrentAverageStateService.monthlyAverage.set(0);

    await TestBed.configureTestingModule({
    imports: [MatSnackBarModule, CurrentAverageComponent],
    providers: [
        { provide: CurrentAverageStateService, useValue: mockCurrentAverageStateService }
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(CurrentAverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates selected date in state service when date input changes', () => {
    component.date = '2026-04-16';

    expect(mockCurrentAverageStateService.setDate).toHaveBeenCalledWith('2026-04-16');
  });

  it('reads displayed values from the reactive state service', () => {
    mockCurrentAverageStateService.currentDayAmount.set(120.5);
    mockCurrentAverageStateService.currentWeekAmount.set(450);
    mockCurrentAverageStateService.currentMonthAmount.set(980);
    mockCurrentAverageStateService.dailyAverage.set(100);
    mockCurrentAverageStateService.weeklyAverage.set(425);
    mockCurrentAverageStateService.monthlyAverage.set(900);

    expect(component.currentDayAmount).toBe(120.5);
    expect(component.currentWeekAmount).toBe(450);
    expect(component.currentMonthAmount).toBe(980);
    expect(component.dailyAverage).toBe(100);
    expect(component.weeklyAverage).toBe(425);
    expect(component.monthlyAverage).toBe(900);
  });
});
