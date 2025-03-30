import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CustomCalendarHeaderComponent } from '@components/custom-calendar-header/custom-calendar-header.component';
import { ActionEnum } from '@enums/action.enum';
import { DateHelper } from '@helpers/date.helper';
import { IShift } from '@interfaces/shift.interface';
import { IStatItem } from '@interfaces/stat-item.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ShiftService } from '@services/shift.service';
import { TripService } from '@services/trip.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  readonly CustomCalendarHeaderComponent = CustomCalendarHeaderComponent;
  places: IStatItem[] = [];
  services: IStatItem[] = [];
  types: IStatItem[] = [];

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  constructor(
    private _shiftService: ShiftService,
    private _tripService: TripService
  ) {}

  async ngOnInit(): Promise<void> {

    this.dateChanged();
  }

  async dateChanged() {
    var startDate = "2000-01-01";
    var endDate = DateHelper.getISOFormat();

    if (!(this.range.valid && 
        ((!this.range.value.start && !this.range.value.end) ||
        (this.range.value.start && this.range.value.end)))) {
          return;
    }

    // console.log(`${this.range.valid} | ${this.range.value.start} | ${this.range.value.end}`);
    if (this.range.value.start && this.range.value.end) {
      startDate = DateHelper.getISOFormat(this.range.value.start);
      endDate = DateHelper.getISOFormat(this.range.value.end);
    }

    await this.getShiftsRange(startDate, endDate); 
    await this.getTripsRange(startDate, endDate); 
  }

  async getShiftsRange(startDate: string, endDate: string) {
    let shifts = await this._shiftService.getShiftsBetweenDates(startDate, endDate);
    
    this.services = this.getShiftList(shifts, "service");
  }

  async getTripsRange(startDate: string, endDate: string) {
    let trips = (await this._tripService.getBetweenDates(startDate, endDate)).filter(x => !x.exclude || x.action === ActionEnum.Delete);
    
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
      item.distance = tripFilter.filter(x => x.distance).map(x => x.distance).reduce((acc, value) => acc + value, 0);
      item.pay = tripFilter.filter(x => x.pay).map(x => x.pay).reduce((acc, value) => acc + value, 0);
      item.tip = tripFilter.filter(x => x.tip).map(x => x.tip).reduce((acc, value) => acc + value, 0);
      item.bonus = tripFilter.filter(x => x.bonus).map(x => x.bonus).reduce((acc, value) => acc + value, 0);
      item.total = tripFilter.filter(x => x.total).map(x => x.total).reduce((acc, value) => acc + value, 0);
      item.cash = tripFilter.filter(x => x.cash).map(x => x.cash).reduce((acc, value) => acc + value, 0);

      item.amountPerTrip = item.total / item.trips;
      item.amountPerDistance = item.total / (!item.distance ? 1 : item.distance);
      item.amountPerTime = tripFilter.filter(x => x.amountPerTime).map(x => x.amountPerTime).reduce((acc, value) => acc + value, 0) / item.trips;

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
      item.trips = shiftFilter.filter(x => x.totalTrips).map(x => x.totalTrips).reduce((acc, value) => acc + value, 0);
      item.distance = shiftFilter.filter(x => x.totalDistance).map(x => x.totalDistance).reduce((acc, value) => acc + value, 0);
      item.pay = shiftFilter.filter(x => x.totalPay).map(x => x.totalPay).reduce((acc, value) => acc + value, 0);
      item.tip = shiftFilter.filter(x => x.totalTips).map(x => x.totalTips).reduce((acc, value) => acc + value, 0);
      item.bonus = shiftFilter.filter(x => x.totalBonus).map(x => x.totalBonus).reduce((acc, value) => acc + value, 0);
      item.total = shiftFilter.filter(x => x.grandTotal).map(x => x.grandTotal).reduce((acc, value) => acc + value, 0);
      item.cash = shiftFilter.filter(x => x.totalCash).map(x => x.totalCash).reduce((acc, value) => acc + value, 0);

      item.amountPerTrip = item.total / (!item.trips ? 1 : item.trips);
      item.amountPerDistance = item.total / (!item.distance ? 1 : item.distance);
      item.amountPerTime = shiftFilter.filter(x => x.amountPerTime).map(x => x.amountPerTime).reduce((acc, value) => acc + value, 0) / shiftFilter.length;

      items.push(item);
    })

    return items;
  }
}
