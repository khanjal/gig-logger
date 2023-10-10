import { Component, Input, OnInit } from '@angular/core';
import { IService } from '@interfaces/service.interface';
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
    console.log(this.date);
    this.displayedColumns = ['service', 'trips', 'pay', 'tips', 'bonus', 'total', 'cash'];
    await this.getServices();
  }

  async getServices() {
    this.services = await this._serviceService.getRemoteServices();
    console.log(this.services);
  }

  getTotal(property: string) {
    return this.services.map((s:any) => s[property]).reduce((acc, value) => acc + value, 0);
  }

}
