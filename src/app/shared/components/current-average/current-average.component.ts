import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateHelper } from '@helpers/date.helper';
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
  dailyAverage: number | undefined;

  currentWeekAmount: number = 0;
  weeklyAverage: number | undefined;

  showDailyAverage: boolean = true;
  showWeeklyAverage: boolean = false;
  showMonthlyAverage: boolean = false;

  constructor(
    private _snackBar: MatSnackBar,
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
    let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];
    this.dailyAverage = !weekday || isNaN(weekday.dailyPrevAverage) ? 0 : weekday.dailyPrevAverage;

    // Load weekly average
    let mondayISO = DateHelper.getISOFormat(DateHelper.getMonday(new Date()));
    let currentWeekShifts = await this._shiftService.getShiftsByStartDate(mondayISO);
    this.currentWeekAmount = currentWeekShifts.reduce((acc, shift) => acc + shift.grandTotal, 0);

    let date = DateHelper.getISOFormat(DateHelper.getDateFromDays(7));
    let weekly = await this._weeklyService.getLastWeekFromDay(date);
    let prevTotal = weekly?.average ?? 0;
    this.weeklyAverage = prevTotal;
  }

  toggle() {
    if(this.showDailyAverage) {
      this.showDailyAverage = false;
      this.showWeeklyAverage = true;
      this._snackBar.open("Showing Weekly Average");

      return;
    }

    if(this.showWeeklyAverage) {
      this.showWeeklyAverage = false;
      this.showDailyAverage = true;
      this._snackBar.open("Showing Daily Average");

      return;
    }
  }

}
