import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITrip } from '@interfaces/trip.interface';
import { IShift } from '@interfaces/shift.interface';

interface ISummaryCard {
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-stats-summary',
  templateUrl: './stats-summary.component.html',
  styleUrls: ['./stats-summary.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class StatsSummaryComponent {
  @Input() trips: ITrip[] = [];
  @Input() shifts: IShift[] = [];

  private formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num * 100) / 100);
  }

  get summaryCards(): ISummaryCard[] {
    return [
      {
        label: 'Total Trips',
        value: this.trips.length.toLocaleString(),
        highlight: true
      },
      {
        label: 'Total Earnings',
        value: `$${this.formatNumber(this.totalEarnings)}`,
        highlight: true
      },
      {
        label: 'Total Tips',
        value: `$${this.formatNumber(this.totalTips)}`,
      },
      {
        label: 'Average Tip',
        value: `$${this.formatNumber(this.averageTip)}`,
      },
      {
        label: 'Highest Tip',
        value: `$${this.formatNumber(this.highestTip)}`,
      },
      {
        label: 'Lowest Tip (Non-Zero)',
        value: `$${this.formatNumber(this.lowestNonZeroTip)}`,
      },
      {
        label: 'Tip Percentage',
        value: `${this.tipPercentage.toFixed(1)}%`,
      },
      {
        label: 'Total Bonus',
        value: `$${this.formatNumber(this.totalBonus)}`,
      },
      {
        label: 'Total Distance',
        value: `${this.formatNumber(this.totalDistance)} mi`,
      },
      {
        label: 'Average per Trip',
        value: `$${this.formatNumber(this.averagePerTrip)}`,
        highlight: true
      },
      {
        label: 'Highest Pay Trip',
        value: `$${this.formatNumber(this.highestPay)}`,
      },
      {
        label: 'Lowest Pay Trip',
        value: `$${this.formatNumber(this.lowestPay)}`,
      },
      {
        label: 'Avg Per Mile',
        value: `$${this.formatNumber(this.averagePerMile)}`,
      },
      {
        label: 'Zero Tip Trips',
        value: this.zeroTipTrips.toLocaleString(),
      },
      {
        label: 'Cash Trips',
        value: this.cashTrips.toLocaleString(),
      }
    ];
  }

  get totalEarnings(): number {
    return this.trips.map(t => t.total || 0).reduce((acc, val) => acc + val, 0);
  }

  get totalTips(): number {
    return this.trips.map(t => t.tip || 0).reduce((acc, val) => acc + val, 0);
  }

  get totalBonus(): number {
    return this.trips.map(t => t.bonus || 0).reduce((acc, val) => acc + val, 0);
  }

  get totalDistance(): number {
    return this.trips.map(t => t.distance || 0).reduce((acc, val) => acc + val, 0);
  }

  get averagePerTrip(): number {
    return this.trips.length > 0 ? this.totalEarnings / this.trips.length : 0;
  }

  get highestPay(): number {
    return this.trips.length > 0 ? Math.max(...this.trips.map(t => t.pay || 0)) : 0;
  }

  get lowestPay(): number {
    const nonZeroTrips = this.trips.filter(t => (t.pay || 0) > 0);
    return nonZeroTrips.length > 0 ? Math.min(...nonZeroTrips.map(t => t.pay || 0)) : 0;
  }

  get highestTip(): number {
    return this.trips.length > 0 ? Math.max(...this.trips.map(t => t.tip || 0)) : 0;
  }

  get zeroTipTrips(): number {
    return this.trips.filter(t => (t.tip || 0) === 0).length;
  }

  get cashTrips(): number {
    return this.trips.filter(t => (t.cash || 0) > 0).length;
  }

  get averagePerMile(): number {
    return this.totalDistance > 0 ? this.totalEarnings / this.totalDistance : 0;
  }

  get averageTip(): number {
    return this.trips.length > 0 ? this.totalTips / this.trips.length : 0;
  }

  get lowestNonZeroTip(): number {
    const nonZeroTips = this.trips.filter(t => (t.tip || 0) > 0);
    return nonZeroTips.length > 0 ? Math.min(...nonZeroTips.map(t => t.tip || 0)) : 0;
  }

  get tipPercentage(): number {
    const baseEarnings = this.trips.map(t => (t.pay || 0) + (t.bonus || 0)).reduce((acc, val) => acc + val, 0);
    return baseEarnings > 0 ? (this.totalTips / baseEarnings) * 100 : 0;
  }
}