import { Component, Input, OnInit } from '@angular/core';
import { TripService } from '@services/trip.service';
import { WeekdayService } from '@services/weekday.service';

@Component({
  selector: 'app-current-day-average',
  templateUrl: './current-day-average.component.html',
  styleUrls: ['./current-day-average.component.scss']
})

export class CurrentDayAverageComponent implements OnInit {
  @Input() date: string = new Date().toLocaleDateString();

  currentAmount: number = 0;
  dailyAverage: number | undefined;

  constructor(
      private _tripService: TripService,
      private _weekdayService: WeekdayService
    ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.currentAmount = 0;
    let dayOfWeek = new Date(this.date).toLocaleDateString('en-us', {weekday: 'short'});
    let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];
    this.currentAmount = weekday.currentAmount;
    this.dailyAverage = weekday.dailyPrevAverage;
  }

  

}
