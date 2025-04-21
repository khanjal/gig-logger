import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateHelper } from '@helpers/date.helper';
import { MonthlyService } from '@services/sheets/monthly.service';
import { ShiftService } from '@services/sheets/shift.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';

@Component({
  selector: 'app-current-average',
  templateUrl: './current-average.component.html',
  styleUrls: ['./current-average.component.scss']
})

export class CurrentAverageComponent implements OnInit {
  @Input() date: string = DateHelper.getISOFormat();

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

  async ngOnInit() {
    await this.load();
  }

  async load() {
    // Load daily average
    this.currentDayAmount = 0;

    // Current amount
    let dayShifts = await this._shiftService.queryShifts("date", this.date);
    this.currentDayAmount = dayShifts.reduce((acc, shift) => acc + shift.grandTotal, 0);

    let dayOfWeek = DateHelper.getDayOfWeek(DateHelper.getDateFromISO(this.date));
    let weekday = (await this._weekdayService.query("day", dayOfWeek))[0];
    this.dailyAverage = !weekday || isNaN(weekday.dailyPrevAverage) ? 0 : weekday.dailyPrevAverage;

    // Load weekly average
    let mondayISO = DateHelper.getISOFormat(DateHelper.getMonday(new Date()));
    let currentWeekShifts = await this._shiftService.getShiftsByStartDate(mondayISO);
    this.currentWeekAmount = currentWeekShifts.reduce((acc, shift) => acc + shift.grandTotal, 0);

    let date = DateHelper.getISOFormat(DateHelper.getDateFromDays(7));
    let weekly = await this._weeklyService.getLastWeekFromDay(date);
    this.weeklyAverage = weekly?.average ?? 0;

    // Load monthly average
    let firstDayOfMonth = DateHelper.getFirstDayOfMonth(new Date());
    let currentMonthShifts = await this._shiftService.getShiftsByStartDate(firstDayOfMonth);
    this.currentMonthAmount = currentMonthShifts.reduce((acc, shift) => acc + shift.grandTotal, 0);
    
    let monthly = await this._monthlyService.find("month", DateHelper.getMonthYearString(new Date()));
    this.monthlyAverage = monthly?.average ?? 0;
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
    this._snackBar.open(`Showing ${states[nextIndex]} Average`);
  }
}
