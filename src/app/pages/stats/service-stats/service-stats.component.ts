import { Component, OnInit } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';
import { IService } from '@interfaces/service.interface';
import { ServiceService } from '@services/service.service';
import { ShiftService } from '@services/shift.service';

@Component({
  selector: 'app-service-stats',
  templateUrl: './service-stats.component.html',
  styleUrls: ['./service-stats.component.scss']
})
export class ServiceStatsComponent implements OnInit {
  displayedColumns: string[] = [];
  services: IService[] = [];

  constructor(
    private _serviceService: ServiceService,
    private _shiftService: ShiftService
  ) {}

  async ngOnInit(): Promise<void> {
    this.displayedColumns = ['service', 'trips', 'pay', 'tips', 'bonus', 'total', 'cash'];
    await this.getServices();

    var date = new Date();
    // Today
    let today = DateHelper.getISOFormat(DateHelper.getDateFromDays());
    console.log(today);
    // Yesterday
    let yesterday = DateHelper.getISOFormat(DateHelper.getDateFromDays(1));
    console.log(yesterday);
    // This week
    let thisWeek = DateHelper.getISOFormat(DateHelper.getMonday());
    console.log(thisWeek);
    // Last Week
    let lastWeek = DateHelper.getISOFormat(DateHelper.getMonday(DateHelper.getDateFromDays(7)));
    console.log(lastWeek);
    // This month
    var thisMonth = DateHelper.getISOFormat(new Date(date.getFullYear(), date.getMonth(), 1));
    console.log(thisMonth);
    // last month
    var lastMonth = DateHelper.getISOFormat(new Date(date.getFullYear(), date.getMonth()-1, 1));
    console.log(lastMonth);
    // this year
    var thisYear = DateHelper.getISOFormat(new Date(date.getFullYear(), 0, 1));
    console.log(thisYear);
    // all
  }

  async getServices() {
    this.services = await this._serviceService.getRemoteServices();
    console.log(this.services);
  }

  getTotal(property: string) {
    return this.services.map((s:any) => s[property]).reduce((acc, value) => acc + value, 0);
  }

}
