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
  subValue?: string;
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
    // Cached summary values
    private _totalEarnings = 0;
    private _totalTips = 0;
    private _totalBonus = 0;
    private _totalDistance = 0;
    private _averagePerTrip = 0;
    private _medianTip = 0;
    private _medianPay = 0;
    private _averagePay = 0;
    private _highestPay = 0;
    private _lowestPay: number | null = null;
    private _highestTip = 0;
    private _zeroTipTrips = 0;
    private _cashTrips = 0;
    private _averagePerMile = 0;
    private _bestEarningsPerMile = 0;
    private _worstEarningsPerMile = 0;
    private _averageTip = 0;
    private _lowestNonZeroTip: number | null = null;
    private _tipPercentage = 0;
    private _longestTrip = 0;
    private _shortestTrip: number | null = null;
  @Input() trips: ITrip[] = [];
  @Input() dailyData: IDaily[] = [];
  @Input() startDate?: string;
  @Input() endDate?: string;

  private readonly dialogConfig = {
    height: '600px',
    width: '600px',
    panelClass: 'custom-modalbox'
  } as const;

  summaryCards: ISummaryCard[] = [];

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trips'] || changes['shifts'] || changes['dailyData'] || changes['startDate'] || changes['endDate']) {
      // Compute and cache all expensive summary values
      const trips = this.trips;
      this._totalEarnings = trips.map(t => t.total || 0).reduce((acc, val) => acc + val, 0);
      this._totalTips = trips.map(t => t.tip || 0).reduce((acc, val) => acc + val, 0);
      this._totalBonus = trips.map(t => t.bonus || 0).reduce((acc, val) => acc + val, 0);
      this._totalDistance = trips.map(t => t.distance || 0).reduce((acc, val) => acc + val, 0);
      this._averagePerTrip = trips.length > 0 ? this._totalEarnings / trips.length : 0;
      this._medianTip = NumberHelper.median(trips.map(t => t.tip || 0));
      this._medianPay = NumberHelper.median(trips.map(t => t.pay || 0).filter(v => v > 0));
      const pays = trips.map(t => t.pay || 0).filter(v => v > 0);
      this._averagePay = pays.length ? pays.reduce((acc, v) => acc + v, 0) / pays.length : 0;
      this._highestPay = trips.length > 0 ? Math.max(...trips.map(t => t.pay || 0)) : 0;
      const nonZeroTrips = trips.filter(t => (t.pay || 0) > 0);
      this._lowestPay = nonZeroTrips.length > 0 ? Math.min(...nonZeroTrips.map(t => t.pay || 0)) : null;
      this._highestTip = trips.length > 0 ? Math.max(...trips.map(t => t.tip || 0)) : 0;
      this._zeroTipTrips = trips.filter(t => (t.tip || 0) === 0).length;
      this._cashTrips = trips.filter(t => (t.cash || 0) > 0).length;
      this._averagePerMile = this._totalDistance > 0 ? this._totalEarnings / this._totalDistance : 0;
      const perMile = trips.filter(t => (t.distance || 0) > 1 && (t.pay || 0) > 0).map(t => (t.total || 0) / (t.distance || 1));
      this._bestEarningsPerMile = perMile.length ? Math.max(...perMile) : 0;
      this._worstEarningsPerMile = perMile.length ? Math.min(...perMile) : 0;
      this._averageTip = trips.length > 0 ? this._totalTips / trips.length : 0;
      const nonZeroTips = trips.filter(t => (t.tip || 0) > 0);
      this._lowestNonZeroTip = nonZeroTips.length > 0 ? Math.min(...nonZeroTips.map(t => t.tip || 0)) : null;
      const baseEarnings = trips.map(t => (t.pay || 0) + (t.bonus || 0)).reduce((acc, val) => acc + val, 0);
      this._tipPercentage = baseEarnings > 0 ? (this._totalTips / baseEarnings) * 100 : 0;
      this._longestTrip = trips.length > 0 ? Math.max(...trips.map(t => t.distance || 0)) : 0;
      const nonZeroDistances = trips.filter(t => (t.distance || 0) > 0);
      this._shortestTrip = nonZeroDistances.length > 0 ? Math.min(...nonZeroDistances.map(t => t.distance || 0)) : null;
      this.summaryCards = this.buildSummaryCards();
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
        best = { label: DateHelper.expandWeekday(weekday), value: avg, dayIndex };
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
        best = { label: DateHelper.expandWeekday(weekday), value: avg, dayIndex };
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
        label: 'Total Bonus',
        value: `$${NumberHelper.formatNumber(this.totalBonus)}`,
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
        label: 'Lowest Tip',
        value: lowestTipValue !== null ? `$${NumberHelper.formatNumber(lowestTipValue)}` : '—',
        action: lowestTipValue !== null ? () => this.showTripsWithLowestTip() : undefined
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
        value: this.busiestDay.count > 0 ? `${this.busiestDay.count} trips` : '—',
        subValue: this.busiestDay.count > 0 ? this.busiestDay.label : undefined,
        action: this.busiestDay.count > 0 ? () => this.showBusiestDayTrips() : undefined
      },
      {
        label: 'Top Earning Day',
        value: this.highestEarningDay.total > 0 ? `$${NumberHelper.formatNumber(this.highestEarningDay.total)}` : '—',
        subValue: this.highestEarningDay.total > 0 ? this.highestEarningDay.label : undefined,
        action: this.highestEarningDay.total > 0 ? () => this.showHighestEarningDayTrips() : undefined
      },
      {
        label: 'Top Weekday $/Trip',
        value: this.bestWeekdayPerTrip ? `$${NumberHelper.formatNumber(this.bestWeekdayPerTrip.value)}` : '—',
        subValue: this.bestWeekdayPerTrip ? this.bestWeekdayPerTrip.label : undefined,
      },
      {
        label: 'Top Weekday $/Time',
        value: this.bestWeekdayPerTime ? `$${NumberHelper.formatNumber(this.bestWeekdayPerTime.value)}/hr` : '—',
        subValue: this.bestWeekdayPerTime ? this.bestWeekdayPerTime.label : undefined,
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


  get totalEarnings(): number { return this._totalEarnings; }
  get totalTips(): number { return this._totalTips; }
  get totalBonus(): number { return this._totalBonus; }
  get totalDistance(): number { return this._totalDistance; }
  get averagePerTrip(): number { return this._averagePerTrip; }
  get medianTip(): number { return this._medianTip; }
  get medianPay(): number { return this._medianPay; }
  get averagePay(): number { return this._averagePay; }
  get highestPay(): number { return this._highestPay; }
  get lowestPay(): number | null { return this._lowestPay; }
  get highestTip(): number { return this._highestTip; }
  get zeroTipTrips(): number { return this._zeroTipTrips; }
  get cashTrips(): number { return this._cashTrips; }
  get averagePerMile(): number { return this._averagePerMile; }
  get bestEarningsPerMile(): number { return this._bestEarningsPerMile; }
  get worstEarningsPerMile(): number { return this._worstEarningsPerMile; }
  get averageTip(): number { return this._averageTip; }
  get lowestNonZeroTip(): number | null { return this._lowestNonZeroTip; }
  get tipPercentage(): number { return this._tipPercentage; }
  get longestTrip(): number { return this._longestTrip; }
  get shortestTrip(): number | null { return this._shortestTrip; }

  private openTripsModal(title: string, filterFn: (trip: ITrip) => boolean): void {
    const trips = this.trips
      .filter(filterFn)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dialog.open(TripsModalComponent, {
      ...this.dialogConfig,
      data: { title, trips }
    });
  }

  showTripsWithHighestTip(): void {
    const highest = this.highestTip;
    this.openTripsModal(
      `Trips with Highest Tip ($${NumberHelper.formatNumber(highest)})`,
      t => (t.tip || 0) === highest
    );
  }

  showTripsWithLowestTip(): void {
    const lowest = this.lowestNonZeroTip;
    if (lowest === null) return;
    this.openTripsModal(
      `Trips with Lowest Tip ($${NumberHelper.formatNumber(lowest)})`,
      t => (t.tip || 0) === lowest && (t.tip || 0) > 0
    );
  }

  showLongestTrips(): void {
    const longest = this.longestTrip;
    this.openTripsModal(
      `Longest Trips (${NumberHelper.formatNumber(longest)} mi)`,
      t => (t.distance || 0) === longest && (t.distance || 0) > 0
    );
  }

  showShortestTrips(): void {
    const shortest = this.shortestTrip;
    if (shortest === null) return;
    this.openTripsModal(
      `Shortest Trips (${NumberHelper.formatNumber(shortest)} mi)`,
      t => (t.distance || 0) === shortest && (t.distance || 0) > 0
    );
  }

  showTripsWithHighestPay(): void {
    const highest = this.highestPay;
    this.openTripsModal(
      `Trips with Highest Pay ($${NumberHelper.formatNumber(highest)})`,
      t => (t.pay || 0) === highest && (t.pay || 0) > 0
    );
  }

  showTripsWithLowestPay(): void {
    const lowest = this.lowestPay;
    if (lowest === null) return;
    this.openTripsModal(
      `Trips with Lowest Pay ($${NumberHelper.formatNumber(lowest)})`,
      t => (t.pay || 0) === lowest && (t.pay || 0) > 0
    );
  }

  // Median drill-down intentionally omitted; median can be non-observed when even counts are averaged.

  showTripsWithBestPerMile(): void {
    const best = this.bestEarningsPerMile;
    this.openTripsModal(
      `Trips with Best $/Mile ($${NumberHelper.formatNumber(best)})`,
      t => (t.distance || 0) > 1 && NumberHelper.nearlyEqual((t.total || 0) / (t.distance || 1), best)
    );
  }

  showTripsWithWorstPerMile(): void {
    const worst = this.worstEarningsPerMile;
    this.openTripsModal(
      `Trips with Worst $/Mile ($${NumberHelper.formatNumber(worst)})`,
      t => (t.distance || 0) > 1 && NumberHelper.nearlyEqual((t.total || 0) / (t.distance || 1), worst)
    );
  }

  showBusiestDayTrips(): void {
    const { label, date } = this.busiestDay;
    this.openTripsModal(
      `Busiest Day (${label})`,
      t => t.date === date
    );
  }

  showHighestEarningDayTrips(): void {
    const { label, total, date } = this.highestEarningDay;
    this.openTripsModal(
      `Top Earning Day ($${NumberHelper.formatNumber(total)}) - ${label}`,
      t => t.date === date
    );
  }

  showZeroTipTrips(): void {
    this.openTripsModal('Trips with $0 tip', t => (t.tip || 0) === 0);
  }

  showCashTrips(): void {
    this.openTripsModal('Trips with cash collected', t => (t.cash || 0) > 0);
  }
}