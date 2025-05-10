import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentAverageComponent } from './current-average.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';

describe('CurrentAverageComponent', () => {
  let component: CurrentAverageComponent;
  let fixture: ComponentFixture<CurrentAverageComponent>;
  const mockWeekdayService = jasmine.createSpyObj("WeekdayService", ["getCurrentTotal", "queryWeekdays"]);
  const mockWeeklyService = jasmine.createSpyObj("WeeklyService", ["getLastWeekFromDay"]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatSnackBarModule, CurrentAverageComponent],
    providers: [
        { provide: WeekdayService, useValue: mockWeekdayService },
        { provide: WeeklyService, useValue: mockWeeklyService }
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
});
