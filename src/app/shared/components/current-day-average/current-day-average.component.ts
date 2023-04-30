import { Component, Input, OnInit } from '@angular/core';
import { WeekdayService } from '@services/weekday.service';

@Component({
  selector: 'app-current-day-average',
  templateUrl: './current-day-average.component.html',
  styleUrls: ['./current-day-average.component.scss']
})

export class CurrentDayAverageComponent implements OnInit {
  @Input() date: string = new Date().toLocaleDateString();

  currentDayAmount: number = 0;
  dailyAverage: number | undefined;

  currentWeekAmount: number = 0;
  weeklyAverage: number | undefined;

  showDailyAverage: boolean = true;
  showWeeklyAverage: boolean = false;
  showMonthlyAverage: boolean = false;

  constructor(
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
    this.currentDayAmount = weekday.currentAmount;
    this.dailyAverage = weekday.dailyPrevAverage;

    // Load weekly average
    this.currentWeekAmount = 0;
    let weekTotal = (await this._weekdayService.queryWeekdays("day", "Tot"))[0];
    this.currentWeekAmount = weekTotal.currentAmount + this.currentDayAmount;
    this.weeklyAverage = weekTotal.dailyPrevAverage;
  }

  toggle() {
    if(this.showDailyAverage) {
      this.showDailyAverage = false;
      this.showWeeklyAverage = true;

      return;
    }

    if(this.showWeeklyAverage) {
      this.showWeeklyAverage = false;
      this.showDailyAverage = true;

      return;
    }
  }

}
