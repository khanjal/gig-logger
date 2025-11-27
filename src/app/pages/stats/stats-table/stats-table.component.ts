import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { IStatItem } from '@interfaces/stat-item.interface';
import { MatIcon } from '@angular/material/icon';
import { DecimalPipe, CurrencyPipe, NgIf, NgFor, NgClass } from '@angular/common';

@Component({
    selector: 'app-stats-table',
    templateUrl: './stats-table.component.html',
    styleUrls: ['./stats-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatIcon, DecimalPipe, CurrencyPipe, NgIf, NgFor, NgClass]
})
export class StatsTableComponent implements OnInit {
  @Input() items: IStatItem[] = [];
  @Input() name: string | undefined;

  displayedColumns: string[] = [];

  async ngOnInit(): Promise<void> {
    this.displayedColumns = ['name', 'trips', 'distance', 'pay', 'tips', 'bonus', 'total', 'cash', 'time', 'amountPerTrip', 'amountPerDistance'];
  }

    getAverage(property: string) {
        let total = this.items.map((s: any) => s[property]).reduce((acc, value) => acc + value, 0);
        let quanity = this.items.filter((x: any) => x[property] > 0).length;
        return total / quanity;
    }

  getTotal(property: string) {
    return this.items.map((s:any) => s[property]).reduce((acc, value) => acc + value, 0);
  }

}
