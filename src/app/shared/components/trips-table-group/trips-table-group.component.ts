import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';
import { sort } from '@helpers/sort.helper';
import { ITripGroup } from '@interfaces/trip-group.interface';
import { DailyService } from '@services/daily.service';
import { TripService } from '@services/trip.service';
import { WeekdayService } from '@services/weekday.service';

@Component({
  selector: 'app-trips-table-group',
  templateUrl: './trips-table-group.component.html',
  styleUrls: ['./trips-table-group.component.scss']
})
export class TripsTableGroupComponent implements OnInit, OnChanges {
  @Input() title: string = "";
  @Input() link: string = "";
  @Input() days: number = 6;
  
  displayedColumns: string[] = [];
  tripGroups: ITripGroup[] = [];
  
  constructor(
    private _dailyService: DailyService,
    private _tripService: TripService,
    private _weekdayService: WeekdayService
  ) {}
  
  async ngOnChanges() {
    // console.log("TripsTableGroup: OnChanges");
    await this.load();
  }

  async ngOnInit() {
    // console.log("TripsTableGroup: OnInit");
    this.displayedColumns = ['service', 'place', 'total', 'name', 'pickup', 'dropoff', 'address'];
    await this.load();
  }

  async load() {
    // console.log("TripsTableGroup: Loading");
    let sheetTrips = await this._tripService.getTripsPreviousDays(this.days);
    sort(sheetTrips, '-id');
    // Get unique dates in trips.
    let dates: string[] = [... new Set(sheetTrips.map(trip => trip.date))];
    this.tripGroups = [];
    // console.log(this.trips);
    
    for (const date of dates) {
      let tripGroup = {} as ITripGroup;
      let trips = sheetTrips.filter(x => x.date === date);

      if (trips.length === 0) {
        continue;
      }

      let dayOfWeek = DateHelper.getDayOfWeek(new Date(DateHelper.getDateFromISO(date)));
      let day = (await this._dailyService.queryDaily("date", date))[0];
      let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];

      tripGroup.date = date;
      tripGroup.trips = trips;
      tripGroup.amount = day?.total ?? 0;
      tripGroup.average = weekday?.dailyPrevAverage ?? 0;

      this.tripGroups.push(tripGroup);
    };
  }
}
