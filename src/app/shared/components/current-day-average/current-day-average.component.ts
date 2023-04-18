import { Component, OnInit } from '@angular/core';
import { TripService } from '@services/trip.service';
import { WeekdayService } from '@services/weekday.service';

@Component({
  selector: 'app-current-day-average',
  templateUrl: './current-day-average.component.html',
  styleUrls: ['./current-day-average.component.scss']
})

export class CurrentDayAverageComponent implements OnInit {
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
    let today = new Date();
    let averageQuery = await this._weekdayService.queryWeekdays("day", today.toLocaleDateString('en-us', {weekday: 'short'}));
    this.weeklyAverage = averageQuery[0].dailyAverage;

    let todaysTrips = [... await this._tripService.queryLocalTrips("date", today.toLocaleDateString()),
                      ...await this._tripService.queryRemoteTrips("date", today.toLocaleDateString())];

    todaysTrips.forEach(trip => {
      this.currentAverage += trip.total;
    });
  }

  

}
