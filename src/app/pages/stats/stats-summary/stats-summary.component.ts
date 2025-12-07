import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ITrip } from '@interfaces/trip.interface';
import { IShift } from '@interfaces/shift.interface';
import { IDaily } from '@interfaces/daily.interface';
import { TripsModalComponent } from '@components/ui/trips-modal/trips-modal.component';
import { NumberHelper } from '@helpers/number.helper';
import { StatHelper } from '@helpers/stat.helper';
import { DateHelper } from '@helpers/date.helper';

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
export class StatsSummaryComponent implements OnChanges {
  @Input() trips: ITrip[] = [];
  @Input() shifts: IShift[] = [];
  @Input() dailyData: IDaily[] = [];
  @Input() startDate?: string;
  @Input() endDate?: string;

  private readonly dialogConfig = {
    height: '600px',
    width: '600px',
    panelClass: 'custom-modalbox'
  } as const;

  private summaryCardsCache: ISummaryCard[] = [];

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trips'] || changes['shifts'] || changes['dailyData'] || changes['startDate'] || changes['endDate']) {
      this.summaryCardsCache = this.buildSummaryCards();
    }
  }

  get busiestDay() {
    return StatHelper.getBusiestDayFromDaily(this.dailyData, this.startDate, this.endDate);
  }

  get highestEarningDay() {
    return StatHelper.getHighestEarningDayFromDaily(this.dailyData, this.startDate, this.endDate);
  }

  get bestWeekdayPerTrip(): { label: string; value: number; dayIndex: number } | null {
    const map = StatHelper.getWeekdayAggregatesFromDaily(this.dailyData, this.startDate, this.endDate);
    let best: { label: string; value: number; dayIndex: number } | null = null;

    Object.entries(map).forEach(([weekday, stats]) => {
      if (!stats.trips) return;
      const avg = stats.total / stats.trips;
      const dayIndex = DateHelper.weekdayToIndex(weekday);
      if (dayIndex === undefined) return;
      if (!best || avg > best.value) {
        best = { label: weekday.substring(0, 3), value: avg, dayIndex };
      }
    });

    return best;
  }

  get bestWeekdayPerTime(): { label: string; value: number; dayIndex: number } | null {
    const map = StatHelper.getWeekdayAggregatesFromDaily(this.dailyData, this.startDate, this.endDate);
    let best: { label: string; value: number; dayIndex: number } | null = null;

    Object.entries(map).forEach(([weekday, stats]) => {
      if (!stats.count) return;
      const avg = stats.perTimeSum / stats.count;
      const dayIndex = DateHelper.weekdayToIndex(weekday);
      if (dayIndex === undefined) return;
      if (!best || avg > best.value) {
        best = { label: weekday.substring(0, 3), value: avg, dayIndex };
      }
    });

    return best;
  }

  executeAction(index: number): void {
    const action = this.summaryCards[index].action;
    if (action) {
      action();
    }
  }

  get summaryCards(): ISummaryCard[] {
    if (!this.summaryCardsCache.length) {
      this.summaryCardsCache = this.buildSummaryCards();
    }
    return this.summaryCardsCache;
  }

  private buildSummaryCards(): ISummaryCard[] {
    const lowestPayValue = this.lowestPay;
    const lowestTipValue = this.lowestNonZeroTip;
    const shortestTripValue = this.shortestTrip;

    return [
      {
        label: 'Total Trips',
        value: this.trips.length.toLocaleString(),
        highlight: true
      },
      {
        label: 'Total Earnings',
        value: `$${NumberHelper.formatNumber(this.totalEarnings)}`,
        highlight: true
      },
      {
        label: 'Average per Trip',
        value: `$${NumberHelper.formatNumber(this.averagePerTrip)}`,
        highlight: true
      },
      {
        label: 'Total Tips',
        value: `$${NumberHelper.formatNumber(this.totalTips)}`,
      },
      {
        label: 'Average Pay',
        value: `$${NumberHelper.formatNumber(this.averagePay)}`,
      },
      {
        label: 'Median Pay',
        value: `$${NumberHelper.formatNumber(this.medianPay)}`,
      },
      {
        label: 'Average Tip',
        value: `$${NumberHelper.formatNumber(this.averageTip)}`,
      },
      {
        label: 'Median Tip',
        value: `$${NumberHelper.formatNumber(this.medianTip)}`,
      },
      {
        label: 'Tip Percentage',
        value: `${this.tipPercentage.toFixed(1)}%`,
      },
      {
        label: 'Highest Tip',
        value: `$${NumberHelper.formatNumber(this.highestTip)}`,
        action: () => this.showTripsWithHighestTip()
      },
      {
        label: 'Lowest Tip (Non-Zero)',
        value: lowestTipValue !== null ? `$${NumberHelper.formatNumber(lowestTipValue)}` : '—',
        action: lowestTipValue !== null ? () => this.showTripsWithLowestTip() : undefined
      },
      {
        label: 'Total Bonus',
        value: `$${NumberHelper.formatNumber(this.totalBonus)}`,
      },
      {
        label: 'Highest Pay Trip',
        value: `$${NumberHelper.formatNumber(this.highestPay)}`,
        action: () => this.showTripsWithHighestPay()
      },
      {
        label: 'Lowest Pay Trip',
        value: lowestPayValue !== null ? `$${NumberHelper.formatNumber(lowestPayValue)}` : '—',
        action: lowestPayValue !== null ? () => this.showTripsWithLowestPay() : undefined
      },
      {
        label: 'Avg Per Mile',
        value: `$${NumberHelper.formatNumber(this.averagePerMile)}`,
      },
      {
        label: 'Best $/Mile',
        value: `$${NumberHelper.formatNumber(this.bestEarningsPerMile)}`,
        action: () => this.showTripsWithBestPerMile()
      },
      {
        label: 'Worst $/Mile',
        value: `$${NumberHelper.formatNumber(this.worstEarningsPerMile)}`,
        action: () => this.showTripsWithWorstPerMile()
      },
      {
        label: 'Busiest Day',
        value: this.busiestDay.count > 0 ? `${this.busiestDay.count} trips (${this.busiestDay.label})` : '—',
        action: this.busiestDay.count > 0 ? () => this.showBusiestDayTrips() : undefined
      },
      {
        label: 'Top Earning Day',
        value: this.highestEarningDay.total > 0 ? `$${NumberHelper.formatNumber(this.highestEarningDay.total)} (${this.highestEarningDay.label})` : '—',
        action: this.highestEarningDay.total > 0 ? () => this.showHighestEarningDayTrips() : undefined
      },
      {
        label: 'Top Weekday $/Trip',
        value: this.bestWeekdayPerTrip ? `$${NumberHelper.formatNumber(this.bestWeekdayPerTrip.value)} (${this.bestWeekdayPerTrip.label})` : '—',
      },
      {
        label: 'Top Weekday $/Time',
        value: this.bestWeekdayPerTime ? `$${NumberHelper.formatNumber(this.bestWeekdayPerTime.value)}/hr (${this.bestWeekdayPerTime.label})` : '—',
      },
      {
        label: 'Total Distance',
        value: `${NumberHelper.formatNumber(this.totalDistance)} mi`,
      },
      {
        label: 'Longest Trip',
        value: `${NumberHelper.formatNumber(this.longestTrip)} mi`,
        action: () => this.showLongestTrips()
      },
      {
        label: 'Shortest Trip',
        value: shortestTripValue !== null ? `${NumberHelper.formatNumber(shortestTripValue)} mi` : '—',
        action: shortestTripValue !== null ? () => this.showShortestTrips() : undefined
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

  get medianTip(): number {
    const tips = this.trips.map(t => t.tip || 0);
    return NumberHelper.median(tips);
  }

  get medianPay(): number {
    const pays = this.trips.map(t => t.pay || 0).filter(v => v > 0);
    return NumberHelper.median(pays);
  }

  get averagePay(): number {
    const pays = this.trips.map(t => t.pay || 0).filter(v => v > 0);
    return pays.length ? pays.reduce((acc, v) => acc + v, 0) / pays.length : 0;
  }

  get highestPay(): number {
    return this.trips.length > 0 ? Math.max(...this.trips.map(t => t.pay || 0)) : 0;
  }

  get lowestPay(): number | null {
    const nonZeroTrips = this.trips.filter(t => (t.pay || 0) > 0);
    return nonZeroTrips.length > 0 ? Math.min(...nonZeroTrips.map(t => t.pay || 0)) : null;
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

  get bestEarningsPerMile(): number {
    const perMile = this.trips
      .filter(t => (t.distance || 0) > 1)
      .map(t => (t.total || 0) / (t.distance || 1));
    return perMile.length ? Math.max(...perMile) : 0;
  }

  get worstEarningsPerMile(): number {
    const perMile = this.trips
      .filter(t => (t.distance || 0) > 1 && (t.pay || 0) > 0)
      .map(t => (t.total || 0) / (t.distance || 1));
    return perMile.length ? Math.min(...perMile) : 0;
  }

  get averageTip(): number {
    return this.trips.length > 0 ? this.totalTips / this.trips.length : 0;
  }

  get lowestNonZeroTip(): number | null {
    const nonZeroTips = this.trips.filter(t => (t.tip || 0) > 0);
    return nonZeroTips.length > 0 ? Math.min(...nonZeroTips.map(t => t.tip || 0)) : null;
  }

  get tipPercentage(): number {
    const baseEarnings = this.trips.map(t => (t.pay || 0) + (t.bonus || 0)).reduce((acc, val) => acc + val, 0);
    return baseEarnings > 0 ? (this.totalTips / baseEarnings) * 100 : 0;
  }

  get longestTrip(): number {
    return this.trips.length > 0 ? Math.max(...this.trips.map(t => t.distance || 0)) : 0;
  }

  get shortestTrip(): number | null {
    const nonZeroDistances = this.trips.filter(t => (t.distance || 0) > 0);
    return nonZeroDistances.length > 0 ? Math.min(...nonZeroDistances.map(t => t.distance || 0)) : null;
  }

  showTripsWithHighestTip(): void {
    const highest = this.highestTip;
    const trips = this.trips
      .filter(t => (t.tip || 0) === highest)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Trips with Highest Tip ($${NumberHelper.formatNumber(highest)})`, trips }
    });
  }

  showTripsWithLowestTip(): void {
    const lowest = this.lowestNonZeroTip;
    if (lowest === null) return;
    const trips = this.trips
      .filter(t => (t.tip || 0) === lowest && (t.tip || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Trips with Lowest Tip ($${NumberHelper.formatNumber(lowest)})`, trips }
    });
  }

  showLongestTrips(): void {
    const longest = this.longestTrip;
    const trips = this.trips
      .filter(t => (t.distance || 0) === longest && (t.distance || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Longest Trips (${NumberHelper.formatNumber(longest)} mi)`, trips }
    });
  }

  showShortestTrips(): void {
    const shortest = this.shortestTrip;
    if (shortest === null) return;
    const trips = this.trips
      .filter(t => (t.distance || 0) === shortest && (t.distance || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Shortest Trips (${NumberHelper.formatNumber(shortest)} mi)`, trips }
    });
  }

  showTripsWithHighestPay(): void {
    const highest = this.highestPay;
    const trips = this.trips
      .filter(t => (t.pay || 0) === highest && (t.pay || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Trips with Highest Pay ($${NumberHelper.formatNumber(highest)})`, trips }
    });
  }

  showTripsWithLowestPay(): void {
    const lowest = this.lowestPay;
    if (lowest === null) return;
    const trips = this.trips
      .filter(t => (t.pay || 0) === lowest && (t.pay || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Trips with Lowest Pay ($${NumberHelper.formatNumber(lowest)})`, trips }
    });
  }

  // Median drill-down intentionally omitted; median can be non-observed when even counts are averaged.

  showTripsWithBestPerMile(): void {
    const best = this.bestEarningsPerMile;
    const trips = this.trips
      .filter(t => (t.distance || 0) > 0 && NumberHelper.nearlyEqual((t.total || 0) / (t.distance || 1), best))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Trips with Best $/Mile ($${NumberHelper.formatNumber(best)})`, trips }
    });
  }

  showTripsWithWorstPerMile(): void {
    const worst = this.worstEarningsPerMile;
    const trips = this.trips
      .filter(t => (t.distance || 0) > 0 && NumberHelper.nearlyEqual((t.total || 0) / (t.distance || 1), worst))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Trips with Worst $/Mile ($${NumberHelper.formatNumber(worst)})`, trips }
    });
  }

  showBusiestDayTrips(): void {
    const { label, date } = this.busiestDay;
    // Filter trips by the busiest day's date
    const trips = this.trips.filter(t => {
      const tripDate = DateHelper.toISO(new Date(t.date));
      return tripDate === date;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Busiest Day (${label})`, trips }
    });
  }

  showHighestEarningDayTrips(): void {
    const { label, total, date } = this.highestEarningDay;
    // Filter trips by the highest earning day's date
    const trips = this.trips.filter(t => {
      const tripDate = DateHelper.toISO(new Date(t.date));
      return tripDate === date;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: `Top Earning Day ($${NumberHelper.formatNumber(total)}) - ${label}`, trips }
    });
  }


  showZeroTipTrips(): void {
    const trips = this.trips
      .filter(t => (t.tip || 0) === 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: 'Trips with $0 tip', trips }
    });
  }

  showCashTrips(): void {
    const trips = this.trips
      .filter(t => (t.cash || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title: 'Trips with cash collected', trips }
    });
  }
}