import { Component, DestroyRef, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { forkJoin, from } from 'rxjs';
import { filter, map, startWith, switchMap } from 'rxjs/operators';
import { StatsTableComponent } from './stats-table/stats-table.component';
import { StatsSummaryComponent } from './stats-summary/stats-summary.component';

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
  private readonly destroyRef = inject(DestroyRef);
  places = signal<IStatItem[]>([]);
  services = signal<IStatItem[]>([]);
  types = signal<IStatItem[]>([]);
  regions = signal<IStatItem[]>([]);
  trips = signal<ITrip[]>([]);
  shifts = signal<IShift[]>([]);
  startDate = signal<string>('2000-01-01');
  endDate = signal<string>(DateHelper.toISO());

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  constructor(
    private _shiftService: ShiftService,
    private _tripService: TripService
  ) {}

  ngOnInit(): void {
    this.range.valueChanges
      .pipe(
        startWith(this.range.value),
        map(() => this.getDateRange()),
        filter((dateRange): dateRange is { startDate: string; endDate: string } => !!dateRange),
        switchMap(({ startDate, endDate }) =>
          forkJoin({
            shifts: from(this._shiftService.getShiftsBetweenDates(startDate, endDate)),
            trips: from(this._tripService.getBetweenDates(startDate, endDate)),
          }).pipe(map(({ shifts, trips }) => ({ startDate, endDate, shifts, trips })))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ startDate, endDate, shifts, trips }) => {
        this.startDate.set(startDate);
        this.endDate.set(endDate);

        this.shifts.set(shifts);
        this.services.set(this.getShiftList(shifts, 'service'));
        this.regions.set(this.getShiftList(shifts, 'region'));

        const filteredTrips = trips.filter(x => !x.exclude || x.action === ActionEnum.Delete);
        this.trips.set(filteredTrips);
        this.places.set(this.getTripList(filteredTrips, 'place'));
        this.types.set(this.getTripList(filteredTrips, 'type'));
      });
  }

  private getDateRange(): { startDate: string; endDate: string } | null {
    const defaultStartDate = '2000-01-01';
    const defaultEndDate = DateHelper.toISO();

    if (!(this.range.valid && 
        ((!this.range.value.start && !this.range.value.end) ||
        (this.range.value.start && this.range.value.end)))) {
          return null;
    }    
    
    let startDate = defaultStartDate;
    let endDate = defaultEndDate;

    if (this.range.value.start && this.range.value.end) {
      startDate = DateHelper.toISO(this.range.value.start);
      endDate = DateHelper.toISO(this.range.value.end);
    }

    return { startDate, endDate };
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
