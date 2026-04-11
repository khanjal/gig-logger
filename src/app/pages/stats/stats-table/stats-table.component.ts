import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
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
export class StatsTableComponent implements OnInit, OnChanges {
  @Input() items: IStatItem[] = [];
  @Input() name: string | undefined;

  displayedColumns: string[] = [];
  lowerCaseName = '';
  totals = {
    trips: 0,
    distance: 0,
    pay: 0,
    tip: 0,
    bonus: 0,
    total: 0,
    cash: 0
  };
  averages = {
    amountPerTime: 0,
    amountPerTrip: 0,
    amountPerDistance: 0
  };

  ngOnInit(): void {
    this.displayedColumns = ['name', 'trips', 'distance', 'pay', 'tips', 'bonus', 'total', 'cash', 'time', 'amountPerTrip', 'amountPerDistance'];
    this.updateDerivedStats();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['name']) {
      this.updateDerivedStats();
    }
  }

  private updateDerivedStats(): void {
    this.lowerCaseName = this.name?.toLowerCase() || '';

    const totals = {
      trips: 0,
      distance: 0,
      pay: 0,
      tip: 0,
      bonus: 0,
      total: 0,
      cash: 0
    };

    const averageTotals = {
      amountPerTime: 0,
      amountPerTrip: 0,
      amountPerDistance: 0
    };
    const averageCounts = {
      amountPerTime: 0,
      amountPerTrip: 0,
      amountPerDistance: 0
    };

    this.items.forEach(item => {
      totals.trips += item.trips || 0;
      totals.distance += item.distance || 0;
      totals.pay += item.pay || 0;
      totals.tip += item.tip || 0;
      totals.bonus += item.bonus || 0;
      totals.total += item.total || 0;
      totals.cash += item.cash || 0;

      if ((item.amountPerTime || 0) > 0) {
        averageTotals.amountPerTime += item.amountPerTime || 0;
        averageCounts.amountPerTime += 1;
      }
      if ((item.amountPerTrip || 0) > 0) {
        averageTotals.amountPerTrip += item.amountPerTrip || 0;
        averageCounts.amountPerTrip += 1;
      }
      if ((item.amountPerDistance || 0) > 0) {
        averageTotals.amountPerDistance += item.amountPerDistance || 0;
        averageCounts.amountPerDistance += 1;
      }
    });

    this.totals = totals;
    this.averages = {
      amountPerTime: averageCounts.amountPerTime > 0 ? averageTotals.amountPerTime / averageCounts.amountPerTime : 0,
      amountPerTrip: averageCounts.amountPerTrip > 0 ? averageTotals.amountPerTrip / averageCounts.amountPerTrip : 0,
      amountPerDistance: averageCounts.amountPerDistance > 0 ? averageTotals.amountPerDistance / averageCounts.amountPerDistance : 0
    };
  }

}
