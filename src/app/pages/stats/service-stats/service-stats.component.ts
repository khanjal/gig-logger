import { Component, Input, OnInit } from '@angular/core';
import { sort } from '@helpers/sort.helper';
import { IService } from '@interfaces/service.interface';
import { IShift } from '@interfaces/shift.interface';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';

@Component({
  selector: 'app-service-stats',
  templateUrl: './service-stats.component.html',
  styleUrls: ['./service-stats.component.scss']
})
export class ServiceStatsComponent implements OnInit {
  @Input() date: string = "all";

  displayedColumns: string[] = [];
  services: IService[] = [];

  constructor(
    private _serviceService: ServiceService,
    private _shiftService: ShiftService
  ) {}

  async ngOnInit(): Promise<void> {
    this.displayedColumns = ['service', 'trips', 'pay', 'tips', 'bonus', 'total', 'cash'];

    await this.load();
  }

  async load() {
    this.services = [];
    if (this.date === "all") {
      await this.getServices();
    }
    else {
      await this.getShifts(this.date);
    }
  }

  async ngOnChanges() {
    await this.load();
  }

  async getServices() {
    this.services = await this._serviceService.getRemoteServices();
  }

  async getShifts(date: string) {
    let shifts = await this._shiftService.getRemoteTripsPreviousDate(date);
    let serviceList = shifts.map(s => s.service);
    serviceList = [...new Set(serviceList)].sort();

    serviceList.forEach(serviceName => {
      let service = {} as IService;

      service.service = serviceName;
      service.visits = shifts.filter(s => s.service === serviceName).map(s => s.totalTrips).reduce((acc, value) => acc + value, 0);
      service.pay = shifts.filter(s => s.service === serviceName).map(s => s.totalPay).reduce((acc, value) => acc + value, 0);
      service.tip = shifts.filter(s => s.service === serviceName).map(s => s.totalTips).reduce((acc, value) => acc + value, 0);
      service.bonus = shifts.filter(s => s.service === serviceName).map(s => s.totalBonus).reduce((acc, value) => acc + value, 0);
      service.total = shifts.filter(s => s.service === serviceName).map(s => s.grandTotal).reduce((acc, value) => acc + value, 0);
      service.cash = shifts.filter(s => s.service === serviceName).map(s => s.totalCash).reduce((acc, value) => acc + value, 0);

      this.services.push(service);
    })

    this.services = [...this.services]; // This refreshes the data for the table to display.
  }

  getTotal(property: string) {
    return this.services.map((s:any) => s[property]).reduce((acc, value) => acc + value, 0);
  }

}
