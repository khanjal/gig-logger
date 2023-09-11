import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ITripGroup } from '@interfaces/trip-group.interface';
import { ITrip } from '@interfaces/trip.interface';
import { WeekdayService } from '@services/weekday.service';

@Component({
  selector: 'app-trips-table-group',
  templateUrl: './trips-table-group.component.html',
  styleUrls: ['./trips-table-group.component.scss']
})
export class TripsTableGroupComponent implements OnInit, OnChanges {
  @Input() title: string = "";
  @Input() link: string = "";
  @Input() trips: ITrip[] = [];
  
  displayedColumns: string[] = [];
  tripGroups: ITripGroup[] = [];
  
  constructor(
    private _weekdayService: WeekdayService
  ) {}
  
  async ngOnChanges(changes: SimpleChanges) {
    // console.log("TripsTableGroup: OnChanges");
    await this.load();
  }

  async ngOnInit() {
    // console.log("TripsTableGroup: OnInit");
    this.displayedColumns = ['service', 'place', 'pickup', 'dropoff', 'total', 'name', 'address'];
    await this.load();
  }

  async load() {
    // console.log("TripsTableGroup: Loading");
    // Get unique dates in trips.
    let dates: string[] = [... new Set(this.trips.map(trip => trip.date))];
    this.tripGroups = [];
    // console.log(this.trips);
    
    dates.forEach(async date => {
      let tripGroup = {} as ITripGroup;
      let trips = this.trips.filter(x => x.date === date);
      //let dayOfWeek = new Date(date).toLocaleDateString('en-us', {weekday: 'short'});
      let dayOfWeek = new Date(date).getDay();
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];

      tripGroup.date = date;
      tripGroup.trips = trips;
      tripGroup.amount = trips.filter(x => !x.exclude).reduce((n, {total}) => n + total, 0);
      tripGroup.average = weekday?.dailyPrevAverage ?? 0;

      // Double check that amount is a number
      tripGroup.amount = isNaN(tripGroup.amount) ? 0 : tripGroup.amount;

      this.tripGroups.push(tripGroup);
    });
  }
}
