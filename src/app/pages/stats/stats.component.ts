import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomCalendarHeaderComponent } from '@components/ui/custom-calendar-header/custom-calendar-header.component';
import { ActionEnum } from '@enums/action.enum';
import { DateHelper } from '@helpers/date.helper';
import { IShift } from '@interfaces/shift.interface';
import { IStatItem } from '@interfaces/stat-item.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker } from '@angular/material/datepicker';
import { StatsTableComponent } from './stats-table/stats-table.component';
import { StatsSummaryComponent } from './stats-summary/stats-summary.component';
import { DailyService } from '@services/sheets/daily.service';
import { IDaily } from '@interfaces/daily.interface';

@Component({
    selector: 'app-stats',
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, MatFormField, MatLabel, MatDateRangeInput, FormsModule, ReactiveFormsModule, MatStartDate, MatEndDate, MatDatepickerToggle, MatSuffix, MatDateRangePicker, StatsTableComponent, StatsSummaryComponent]
})
export class StatsComponent implements OnInit {
  readonly CustomCalendarHeaderComponent = CustomCalendarHeaderComponent;
  places: IStatItem[] = [];
  services: IStatItem[] = [];
  types: IStatItem[] = [];
  regions: IStatItem[] = [];
  trips: ITrip[] = [];
  shifts: IShift[] = [];
  dailyData: IDaily[] = [];
  startDate: string = "2000-01-01";
  endDate: string = DateHelper.toISO();

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  constructor(
    private _shiftService: ShiftService,
    private _tripService: TripService,
    private _dailyService: DailyService
  ) {
      this._dailyService.daily$
        .pipe(takeUntilDestroyed())
        .subscribe((data: IDaily[] | undefined) => {
          this.dailyData = data || [];
        });
  }

  async ngOnInit(): Promise<void> {

    this.dateChanged();
  }

  async dateChanged() {
    this.startDate = "2000-01-01";
    this.endDate = DateHelper.toISO();

    if (!(this.range.valid && 
        ((!this.range.value.start && !this.range.value.end) ||
        (this.range.value.start && this.range.value.end)))) {
          return;
    }    
    
    if (this.range.value.start && this.range.value.end) {
      this.startDate = DateHelper.toISO(this.range.value.start);
      this.endDate = DateHelper.toISO(this.range.value.end);
    }

    await this.getShiftsRange(this.startDate, this.endDate);
    await this.getTripsRange(this.startDate, this.endDate);
  }

  async getShiftsRange(startDate: string, endDate: string) {
    let shifts = await this._shiftService.getShiftsBetweenDates(startDate, endDate);
    this.shifts = shifts;
    this.services = this.getShiftList(shifts, "service");
    this.regions = this.getShiftList(shifts, "region");
  }

  async getTripsRange(startDate: string, endDate: string) {
    let trips = (await this._tripService.getBetweenDates(startDate, endDate)).filter(x => !x.exclude || x.action === ActionEnum.Delete);
    this.trips = trips;
    this.places = this.getTripList(trips, "place");
    this.types = this.getTripList(trips, "type");
  }

  getTripList(trips: ITrip[], name: string): IStatItem[] {
    let itemList = trips.map((x:any) => x[name]);
    itemList = [...new Set(itemList)].sort();
    let items: IStatItem[] = [];

    itemList.forEach(itemName => {
      let item = {} as IStatItem;
      let tripFilter = trips.filter((x:any) => x[name] === itemName);

      item.name = itemName;
      item.trips = tripFilter.length;
      item.distance = tripFilter.map(x => x.distance || 0).reduce((acc, value) => acc + value, 0);
      item.pay = tripFilter.map(x => x.pay || 0).reduce((acc, value) => acc + value, 0);
      item.tip = tripFilter.map(x => x.tip || 0).reduce((acc, value) => acc + value, 0);
      item.bonus = tripFilter.map(x => x.bonus || 0).reduce((acc, value) => acc + value, 0);
      item.total = tripFilter.map(x => x.total || 0).reduce((acc, value) => acc + value, 0);
      item.cash = tripFilter.map(x => x.cash || 0).reduce((acc, value) => acc + value, 0);

      item.amountPerTrip = item.total / item.trips;
      item.amountPerDistance = item.total / (!item.distance ? 1 : item.distance);
      item.amountPerTime = tripFilter.map(x => x.amountPerTime || 0).reduce((acc, value) => acc + value, 0) / item.trips;

      items.push(item);
    })

    return items;
  }

  getShiftList(shifts: IShift[], name: string): IStatItem[] {
    let itemList = shifts.map((x:any) => x[name]);
    itemList = [...new Set(itemList)].sort();
    let items: IStatItem[] = [];

    itemList.forEach(itemName => {
      let item = {} as IStatItem;
      let shiftFilter = shifts.filter((x:any) => x[name] === itemName);

      item.name = itemName;
      item.trips = shiftFilter.map(x => x.totalTrips || 0).reduce((acc, value) => acc + value, 0);
      item.distance = shiftFilter.map(x => x.totalDistance || 0).reduce((acc, value) => acc + value, 0);
      item.pay = shiftFilter.map(x => x.totalPay || 0).reduce((acc, value) => acc + value, 0);
      item.tip = shiftFilter.map(x => x.totalTips || 0).reduce((acc, value) => acc + value, 0);
      item.bonus = shiftFilter.map(x => x.totalBonus || 0).reduce((acc, value) => acc + value, 0);
      item.total = shiftFilter.map(x => x.grandTotal || 0).reduce((acc, value) => acc + value, 0);
      item.cash = shiftFilter.map(x => x.totalCash || 0).reduce((acc, value) => acc + value, 0);

      item.amountPerTrip = item.total / (!item.trips ? 1 : item.trips);
      item.amountPerDistance = item.total / (!item.distance ? 1 : item.distance);
      item.amountPerTime = shiftFilter.map(x => x.amountPerTime || 0).reduce((acc, value) => acc + value, 0) / shiftFilter.length;

      items.push(item);
    })

    return items;
  }
}
