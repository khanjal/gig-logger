import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openSnackbar } from '@utils/snackbar.util';
import { DateHelper } from '@helpers/date.helper';
import { MonthlyService } from '@services/sheets/monthly.service';
import { ShiftService } from '@services/sheets/shift.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';
import { NgIf, CurrencyPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-current-average',
    templateUrl: './current-average.component.html',
    styleUrls: ['./current-average.component.scss'],
    standalone: true,
    imports: [NgIf, MatIcon, CurrencyPipe]
})

export class CurrentAverageComponent {
  @Input() date: string = DateHelper.toISO();

  currentDayAmount: number = 0;
  currentMonthAmount: number = 0;
  currentWeekAmount: number = 0;
  
  dailyAverage: number = 0;
  weeklyAverage: number = 0;
  monthlyAverage: number = 0;

  showDailyAverage: boolean = true;
  showWeeklyAverage: boolean = false;
  showMonthlyAverage: boolean = false;

  constructor(
    private _snackBar: MatSnackBar,
    private _monthlyService: MonthlyService,
    private _shiftService: ShiftService,
    private _weekdayService: WeekdayService,
    private _weeklyService: WeeklyService
    ) {}

  private toFiniteNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async load() {
    // Current amount
    let dayShifts = await this._shiftService.query("date", this.date);
    const nextCurrentDayAmount = dayShifts.reduce((acc, shift) => acc + this.toFiniteNumber(shift.grandTotal), 0);

    let dayOfWeek = DateHelper.getDayOfWeek(DateHelper.getDateFromISO(this.date));
    const weekdayRows = this._weekdayService.query
      ? await this._weekdayService.query("day", dayOfWeek)
      : [];
    let weekday = weekdayRows?.[0];
    const nextDailyAverage = this.toFiniteNumber(weekday?.dailyPrevAverage);

    // Load weekly average
    let mondayISO = DateHelper.toISO(DateHelper.getMonday(new Date()));
    let currentWeekShifts = await this._shiftService.getShiftsByStartDate(mondayISO);
    const nextCurrentWeekAmount = currentWeekShifts.reduce((acc, shift) => acc + this.toFiniteNumber(shift.grandTotal), 0);

    let date = DateHelper.toISO(DateHelper.getDateFromDays(7));
    let weekly = await this._weeklyService.getLastWeekFromDay(date);
    const nextWeeklyAverage = this.toFiniteNumber(weekly?.average);

    // Load monthly average
    let firstDayOfMonth = DateHelper.getFirstDayOfMonth(new Date());
    let currentMonthShifts = await this._shiftService.getShiftsByStartDate(firstDayOfMonth);
    const nextCurrentMonthAmount = currentMonthShifts.reduce((acc, shift) => acc + this.toFiniteNumber(shift.grandTotal), 0);
    
    let monthly = await this._monthlyService.find("month", DateHelper.getMonthYearString(new Date()));
    const nextMonthlyAverage = this.toFiniteNumber(monthly?.average);

    // Apply after the current change-detection turn to avoid NG0100 when
    // parent components trigger load() during their own render lifecycle.
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.currentDayAmount = nextCurrentDayAmount;
        this.dailyAverage = nextDailyAverage;
        this.currentWeekAmount = nextCurrentWeekAmount;
        this.weeklyAverage = nextWeeklyAverage;
        this.currentMonthAmount = nextCurrentMonthAmount;
        this.monthlyAverage = nextMonthlyAverage;
        resolve();
      }, 0);
    });
  }

  toggle() {
    const states = ['Daily', 'Weekly', 'Monthly'];
    const currentIndex = states.findIndex(state => this[`show${state}Average` as keyof CurrentAverageComponent]);
    const nextIndex = (currentIndex + 1) % states.length;
  
    // Reset all states
    this.showDailyAverage = false;
    this.showWeeklyAverage = false;
    this.showMonthlyAverage = false;
  
    // Set the next state
    const key = `show${states[nextIndex]}Average` as 'showDailyAverage' | 'showWeeklyAverage' | 'showMonthlyAverage';
    this[key] = true;
  
    // Show a snackbar message
    openSnackbar(this._snackBar, `Showing ${states[nextIndex]} Average`);
  }
}
