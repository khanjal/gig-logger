import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TripService } from '@services/trip.service';
import { WeekdayService } from '@services/weekday.service';

@Component({
  selector: 'app-current-average',
  templateUrl: './current-average.component.html',
  styleUrls: ['./current-average.component.scss']
})

export class CurrentAverageComponent implements OnInit {
  @Input() date: string = new Date().toLocaleDateString();

  currentDayAmount: number = 0;
  dailyAverage: number | undefined;

  currentWeekAmount: number = 0;
  weeklyAverage: number | undefined;

  showDailyAverage: boolean = true;
  showWeeklyAverage: boolean = false;
  showMonthlyAverage: boolean = false;

  constructor(
    private _snackBar: MatSnackBar,
      private _tripService: TripService,
      private _weekdayService: WeekdayService
    ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    // Load daily average
    this.currentDayAmount = 0;
    // let dayOfWeek = new Date(this.date).toLocaleDateString('en-us', {weekday: 'short'});
    let dayOfWeek = new Date(this.date).getDay();
    let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];
    this.currentDayAmount = !weekday || isNaN(weekday.currentAmount) ? 0 : weekday.currentAmount;
    this.dailyAverage = !weekday || isNaN(weekday.dailyPrevAverage) ? 0 : weekday.dailyPrevAverage;

    // Load weekly average
    this.currentWeekAmount = await this._weekdayService.getCurrentTotal() ?? 0;
    let dailyTotal = await this._weekdayService.getDailyTotal();
    let prevTotal = await this._weekdayService.getPreviousTotal(); // TODO change this to the weekly rolling average (previous week)

    // Add unsaved trip amounts.
    let unsavedTrips = (await this._tripService.getUnsavedLocalTrips());
    let unsavedTripsAmount = unsavedTrips.filter(x => !x.exclude).reduce((n, {total}) => n + total, 0);
    this.currentWeekAmount = this.currentWeekAmount;
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
