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
    let dayOfWeek = new Date(this.date).toLocaleDateString('en-us', {weekday: 'short'});
    let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];
    this.currentDayAmount = isNaN(weekday.currentAmount) ? 0 : weekday.currentAmount;
    this.dailyAverage = weekday.dailyPrevAverage;

    // Load weekly average
    this.currentWeekAmount = 0;
    let weekTotal = (await this._weekdayService.queryWeekdays("day", "Tot"))[0];

    // Add unsaved trip amounts.
    let unsavedTrips = (await this._tripService.getLocalTrips()).filter(x => x.saved === "false");
    let unsavedTripsAmount = unsavedTrips.reduce((n, {total}) => n + total, 0);
    this.currentWeekAmount = (isNaN(weekTotal.currentAmount) ? 0 : weekTotal.currentAmount) + unsavedTripsAmount;
    this.weeklyAverage = weekTotal.dailyPrevAverage;
  }

  toggle() {
    if(this.showDailyAverage) {
      this.showDailyAverage = false;
      this.showWeeklyAverage = true;
      this._snackBar.open("Showing weekly average");

      return;
    }

    if(this.showWeeklyAverage) {
      this.showWeeklyAverage = false;
      this.showDailyAverage = true;
      this._snackBar.open("Showing daily average");

      return;
    }
  }

}
