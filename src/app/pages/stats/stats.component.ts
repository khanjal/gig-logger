import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CustomCalendarHeaderComponent } from '@components/custom-calendar-header/custom-calendar-header.component';
import { DateHelper } from '@helpers/date.helper';
import { IService } from '@interfaces/service.interface';
import { IShift } from '@interfaces/shift.interface';
import { IStatItem } from '@interfaces/stat-item.interface';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  readonly CustomCalendarHeaderComponent = CustomCalendarHeaderComponent;
  services: IStatItem[] = [];

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  constructor(
    private _serviceService: ServiceService,
    private _shiftService: ShiftService
  ) {}

  async ngOnInit(): Promise<void> {

    this.dateChanged();
  }

  async dateChanged() {
    if (this.range.valid && this.range.value.start && this.range.value.end) {
      var startDate = DateHelper.getISOFormat(this.range.value.start);
      var endDate = DateHelper.getISOFormat(this.range.value.end);

      await this.getShiftsRange(startDate, endDate);
    }
    else {
      // this.services = await this._serviceService.getRemoteServices();
    }
    
    console.log(this.services);
  }

  async getShiftsRange(startDate: string, endDate: string) {
    let shifts = await this._shiftService.getRemoteTripsBetweenDates(startDate, endDate);
    
    this.getServices(shifts);
  }

  getServices(shifts: IShift[]) {
    let serviceList = shifts.map(s => s.service);
    serviceList = [...new Set(serviceList)].sort();
    let services: IStatItem[] = [];

    serviceList.forEach(serviceName => {
      let service = {} as IStatItem;

      service.name = serviceName;
      service.trips = shifts.filter(s => s.service === serviceName).map(s => s.totalTrips).reduce((acc, value) => acc + value, 0);
      service.pay = shifts.filter(s => s.service === serviceName).map(s => s.totalPay).reduce((acc, value) => acc + value, 0);
      service.tip = shifts.filter(s => s.service === serviceName).map(s => s.totalTips).reduce((acc, value) => acc + value, 0);
      service.bonus = shifts.filter(s => s.service === serviceName).map(s => s.totalBonus).reduce((acc, value) => acc + value, 0);
      service.total = shifts.filter(s => s.service === serviceName).map(s => s.grandTotal).reduce((acc, value) => acc + value, 0);
      service.cash = shifts.filter(s => s.service === serviceName).map(s => s.totalCash).reduce((acc, value) => acc + value, 0);

      services.push(service);
    })

    this.services = [...services]; // This refreshes the data for the table to display.
  }
}
