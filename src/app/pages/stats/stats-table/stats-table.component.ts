import { Component, Input, OnInit } from '@angular/core';
import { IStatItem } from '@interfaces/stat-item.interface';

@Component({
  selector: 'app-stats-table',
  templateUrl: './stats-table.component.html',
  styleUrls: ['./stats-table.component.scss']
})
export class StatsTableComponent implements OnInit {
  @Input() items: IStatItem[] = [];
  @Input() name: string | undefined;

  displayedColumns: string[] = [];

  async ngOnInit(): Promise<void> {
    this.displayedColumns = ['name', 'trips', 'distance', 'pay', 'tips', 'bonus', 'total', 'cash', 'time', 'amountPerTrip', 'amountPerDistance'];
  }

  getAverage(property: string) {
    let total = this.items.map((s:any) => s[property]).reduce((acc, value) => acc + value, 0);
    return total / this.items.map((s:any) => s[property]).length;
  }

  getTotal(property: string) {
    return this.items.map((s:any) => s[property]).reduce((acc, value) => acc + value, 0);
  }

}
