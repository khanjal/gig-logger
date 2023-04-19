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

  currentAverage: number = 0;
  weeklyAverage: number | undefined;

  constructor(
      private _tripService: TripService,
      private _weekdayService: WeekdayService
    ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.currentAverage = 0;
    let dayOfWeek = new Date(this.date).toLocaleDateString('en-us', {weekday: 'short'});
    let averageQuery = await this._weekdayService.queryWeekdays("day", dayOfWeek);
    this.weeklyAverage = averageQuery[0].previousAverage;

    let todaysTrips = [... await this._tripService.queryLocalTrips("date", this.date),
                      ...await this._tripService.queryRemoteTrips("date", this.date)];

    todaysTrips.forEach(trip => {
      this.currentAverage += trip.total;
    });
  }

  

}
