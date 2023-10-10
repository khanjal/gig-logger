import { Component, OnInit } from '@angular/core';
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
    this.displayedColumns = ['service', 'trips', 'pay', 'tips', 'bonus'];
    await this.getServices();
  }

  async getServices() {
    this.services = await this._serviceService.getRemoteServices();
    console.log(this.services);
  }

  getTotalBonus() {
    return this.services.map(s => s.bonus).reduce((acc, value) => acc + value, 0);
  }

  getTotalPay() {
    return this.services.map(s => s.pay).reduce((acc, value) => acc + value, 0);
  }

  getTotalTips() {
    return this.services.map(s => s.tip).reduce((acc, value) => acc + value, 0);
  }

  getTotalTrips() {
    return this.services.map(s => s.visits).reduce((acc, value) => acc + value, 0);
  }
}
