import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';
import { sort } from '@helpers/sort.helper';
import { ITripGroup } from '@interfaces/trip-group.interface';
import { TripService } from '@services/sheets/trip.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { MatIcon } from '@angular/material/icon';
import { NgFor, NgClass, NgStyle, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { NoSecondsPipe } from '../../pipes/no-seconds.pipe';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
    selector: 'app-trips-table-group',
    templateUrl: './trips-table-group.component.html',
    styleUrls: ['./trips-table-group.component.scss'],
    standalone: true,
    imports: [MatIcon, NgFor, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, NgClass, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, NgStyle, CurrencyPipe, DatePipe, NoSecondsPipe, TruncatePipe]
})
export class TripsTableGroupComponent implements OnInit, OnChanges {
  @Input() title: string = "";
  @Input() link: string = "";
  @Input() days: number = 6;
  
  displayedColumns: string[] = [];
  tripGroups: ITripGroup[] = [];
  
  constructor(
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
    let sheetTrips = await this._tripService.getPreviousDays(this.days);
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
      let weekday = (await this._weekdayService.query("day", dayOfWeek))[0];

      tripGroup.date = date;
      tripGroup.trips = trips;
      tripGroup.amount = trips.filter(x => !x.exclude).reduce((acc, trip) => acc + trip.total, 0);
      tripGroup.average = weekday?.dailyPrevAverage ?? 0;

      this.tripGroups.push(tripGroup);
    };
  }
}
