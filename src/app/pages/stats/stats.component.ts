import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CustomCalendarHeaderComponent } from '@components/custom-calendar-header/custom-calendar-header.component';
import { DateHelper } from '@helpers/date.helper';
import { IService } from '@interfaces/service.interface';
import { IShift } from '@interfaces/shift.interface';
import { IStatItem } from '@interfaces/stat-item.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ServiceService } from '@services/service.service';
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
    private _serviceService: ServiceService,
    private _shiftService: ShiftService,
    private _tripService: TripService
  ) {}

  async ngOnInit(): Promise<void> {

    this.dateChanged();
  }

  async dateChanged() {
    var startDate = "2000-01-01";
    var endDate = DateHelper.getISOFormat();

    if (this.range.valid && this.range.value.start && this.range.value.end) {
      startDate = DateHelper.getISOFormat(this.range.value.start);
      endDate = DateHelper.getISOFormat(this.range.value.end);
    }

    // TODO see if there's a way to use stats from services, types, and places.
    await this.getShiftsRange(startDate, endDate); 
    await this.getTripsRange(startDate, endDate); 
    
    console.log(this.services);
  }

  async getShiftsRange(startDate: string, endDate: string) {
    let shifts = await this._shiftService.getRemoteShiftsBetweenDates(startDate, endDate);
    
    this.getServices(shifts);
  }

  async getTripsRange(startDate: string, endDate: string) {
    let trips = await this._tripService.getRemoteTripsBetweenDates(startDate, endDate);
    
    this.getPlaces(trips);
    this.getTypes(trips);
  }

  getPlaces(trips: ITrip[]) {
    let placeList = trips.map(s => s.place);
    placeList = [...new Set(placeList)].sort();
    let items: IStatItem[] = [];

    placeList.forEach(name => {
      let item = {} as IStatItem;

      item.name = name;
      item.trips = trips.filter(s => s.place === name && !s.exclude).length;
      item.pay = trips.filter(s => s.place === name && !s.exclude).map(s => s.pay).reduce((acc, value) => acc + value, 0);
      item.tip = trips.filter(s => s.place === name && !s.exclude).map(s => s.tip).reduce((acc, value) => acc + value, 0);
      item.bonus = trips.filter(s => s.place === name && !s.exclude).map(s => s.bonus).reduce((acc, value) => acc + value, 0);
      item.total = trips.filter(s => s.place === name && !s.exclude).map(s => s.total).reduce((acc, value) => acc + value, 0);
      item.cash = trips.filter(s => s.place === name && !s.exclude).map(s => s.cash).reduce((acc, value) => acc + value, 0);

      items.push(item);
    })

    this.places = [...items]; // This refreshes the data for the table to display.
  }

  getTypes(trips: ITrip[]) {
    let typeList = trips.map(s => s.type);
    typeList = [...new Set(typeList)].sort();
    let items: IStatItem[] = [];

    typeList.forEach(name => {
      let item = {} as IStatItem;

      item.name = name;
      item.trips = trips.filter(s => s.type === name).length;
      item.pay = trips.filter(s => s.type === name && !s.exclude).map(s => s.pay).reduce((acc, value) => acc + value, 0);
      item.tip = trips.filter(s => s.type === name && !s.exclude).map(s => s.tip).reduce((acc, value) => acc + value, 0);
      item.bonus = trips.filter(s => s.type === name && !s.exclude).map(s => s.bonus).reduce((acc, value) => acc + value, 0);
      item.total = trips.filter(s => s.type === name && !s.exclude).map(s => s.total).reduce((acc, value) => acc + value, 0);
      item.cash = trips.filter(s => s.type === name && !s.exclude).map(s => s.cash).reduce((acc, value) => acc + value, 0);

      items.push(item);
    })

    this.types = [...items]; // This refreshes the data for the table to display.
  }

  getServices(shifts: IShift[]) {
    let serviceList = shifts.map(s => s.service);
    serviceList = [...new Set(serviceList)].sort();
    let items: IStatItem[] = [];

    serviceList.forEach(name => {
      let item = {} as IStatItem;

      item.name = name;
      item.trips = shifts.filter(s => s.service === name).map(s => s.totalTrips).reduce((acc, value) => acc + value, 0);
      item.pay = shifts.filter(s => s.service === name).map(s => s.totalPay).reduce((acc, value) => acc + value, 0);
      item.tip = shifts.filter(s => s.service === name).map(s => s.totalTips).reduce((acc, value) => acc + value, 0);
      item.bonus = shifts.filter(s => s.service === name).map(s => s.totalBonus).reduce((acc, value) => acc + value, 0);
      item.total = shifts.filter(s => s.service === name).map(s => s.grandTotal).reduce((acc, value) => acc + value, 0);
      item.cash = shifts.filter(s => s.service === name).map(s => s.totalCash).reduce((acc, value) => acc + value, 0);

      items.push(item);
    })

    this.services = [...items];
  }
}
