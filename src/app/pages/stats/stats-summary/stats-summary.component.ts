import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ITrip } from '@interfaces/trip.interface';
import { IShift } from '@interfaces/shift.interface';
import { TripsModalComponent } from '@components/ui/trips-modal/trips-modal.component';

interface ISummaryCard {
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
  action?: () => void;
}

@Component({
  selector: 'app-stats-summary',
  templateUrl: './stats-summary.component.html',
  styleUrls: ['./stats-summary.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatTooltipModule]
})
export class StatsSummaryComponent {
  @Input() trips: ITrip[] = [];
  @Input() shifts: IShift[] = [];

  constructor(private dialog: MatDialog) {}

  private formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num * 100) / 100);
  }

  executeAction(index: number): void {
    const action = this.summaryCards[index].action;
    if (action) {
      action();
    }
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
        label: 'Average per Trip',
        value: `$${this.formatNumber(this.averagePerTrip)}`,
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
        label: 'Tip Percentage',
        value: `${this.tipPercentage.toFixed(1)}%`,
      },
      {
        label: 'Highest Tip',
        value: `$${this.formatNumber(this.highestTip)}`,
        action: () => this.showTripsWithHighestTip()
      },
      {
        label: 'Lowest Tip (Non-Zero)',
        value: `$${this.formatNumber(this.lowestNonZeroTip)}`,
        action: () => this.showTripsWithLowestTip()
      },
      {
        label: 'Total Bonus',
        value: `$${this.formatNumber(this.totalBonus)}`,
      },
      {
        label: 'Highest Pay Trip',
        value: `$${this.formatNumber(this.highestPay)}`,
        action: () => this.showTripsWithHighestPay()
      },
      {
        label: 'Lowest Pay Trip',
        value: `$${this.formatNumber(this.lowestPay)}`,
        action: () => this.showTripsWithLowestPay()
      },
      {
        label: 'Avg Per Mile',
        value: `$${this.formatNumber(this.averagePerMile)}`,
      },
      {
        label: 'Total Distance',
        value: `${this.formatNumber(this.totalDistance)} mi`,
      },
      {
        label: 'Longest Trip',
        value: `${this.formatNumber(this.longestTrip)} mi`,
        action: () => this.showLongestTrips()
      },
      {
        label: 'Shortest Trip',
        value: `${this.formatNumber(this.shortestTrip)} mi`,
        action: () => this.showShortestTrips()
      },
      {
        label: 'Zero Tip Trips',
        value: this.zeroTipTrips.toLocaleString(),
        action: () => this.showZeroTipTrips()
      },
      {
        label: 'Cash Trips',
        value: this.cashTrips.toLocaleString(),
        action: () => this.showCashTrips()
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

  get longestTrip(): number {
    return this.trips.length > 0 ? Math.max(...this.trips.map(t => t.distance || 0)) : 0;
  }

  get shortestTrip(): number {
    const nonZeroDistances = this.trips.filter(t => (t.distance || 0) > 0);
    return nonZeroDistances.length > 0 ? Math.min(...nonZeroDistances.map(t => t.distance || 0)) : 0;
  }

  showTripsWithHighestTip(): void {
    const highest = this.highestTip;
    const trips = this.trips
      .filter(t => (t.tip || 0) === highest)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      data: { title: `Trips with Highest Tip ($${this.formatNumber(highest)})`, trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }

  showTripsWithLowestTip(): void {
    const lowest = this.lowestNonZeroTip;
    const trips = this.trips
      .filter(t => (t.tip || 0) === lowest && (t.tip || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      data: { title: `Trips with Lowest Tip ($${this.formatNumber(lowest)})`, trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }

  showLongestTrips(): void {
    const longest = this.longestTrip;
    const trips = this.trips
      .filter(t => (t.distance || 0) === longest && (t.distance || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      data: { title: `Longest Trips (${this.formatNumber(longest)} mi)`, trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }

  showShortestTrips(): void {
    const shortest = this.shortestTrip;
    const trips = this.trips
      .filter(t => (t.distance || 0) === shortest && (t.distance || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      data: { title: `Shortest Trips (${this.formatNumber(shortest)} mi)`, trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }

  showTripsWithHighestPay(): void {
    const highest = this.highestPay;
    const trips = this.trips
      .filter(t => (t.pay || 0) === highest && (t.pay || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      data: { title: `Trips with Highest Pay ($${this.formatNumber(highest)})`, trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }

  showTripsWithLowestPay(): void {
    const lowest = this.lowestPay;
    const trips = this.trips
      .filter(t => (t.pay || 0) === lowest && (t.pay || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      data: { title: `Trips with Lowest Pay ($${this.formatNumber(lowest)})`, trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }

  showZeroTipTrips(): void {
    const trips = this.trips
      .filter(t => (t.tip || 0) === 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      data: { title: 'Trips with $0 tip', trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }

  showCashTrips(): void {
    const trips = this.trips
      .filter(t => (t.cash || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      data: { title: 'Trips with cash collected', trips },
      height: '600px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }
}