import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';
import { sort } from '@helpers/sort.helper';
import { ITripGroup } from '@interfaces/trip-group.interface';
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
  days: number = 6;
  
  displayedColumns: string[] = [];
  tripGroups: ITripGroup[] = [];
  
  constructor(
    private _tripService: TripService,
    private _weekdayService: WeekdayService
  ) {}
  
  async ngOnChanges(changes: SimpleChanges) {
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
    let sheetTrips = await this._tripService.getRemoteTripsPreviousDays(this.days);
    sort(sheetTrips, '-id');
    // Get unique dates in trips.
    let dates: string[] = [... new Set(sheetTrips.map(trip => trip.date))];
    this.tripGroups = [];
    // console.log(this.trips);
    
    dates.forEach(async date => {
      let tripGroup = {} as ITripGroup;
      let trips = sheetTrips.filter(x => x.date === date);
      let dayOfWeek = DateHelper.getDayOfWeek(new Date(date));
      let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];

      tripGroup.date = date;
      tripGroup.trips = trips;

      // console.log(`${dayOfWeek} | ${DateHelper.getDayOfWeek(new Date())}`);
      if (dayOfWeek > DateHelper.getDayOfWeek(new Date())) {
        tripGroup.amount = weekday?.previousAmount ?? 0;
      }
      else {
        tripGroup.amount = weekday?.currentAmount ?? 0;
      }

      tripGroup.average = weekday?.dailyPrevAverage ?? 0;

      // Double check that amount is a number
      tripGroup.amount = isNaN(tripGroup.amount) ? 0 : tripGroup.amount;
      // console.log(tripGroup.amount);

      this.tripGroups.push(tripGroup);
    });
  }
}
