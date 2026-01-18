// @ts-nocheck
import { Component, Input, OnChanges, OnInit, SimpleChanges, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ITrip } from '@interfaces/trip.interface';
import { IDaily } from '@interfaces/daily.interface';
import { ITripStatistics } from '@interfaces/trip-statistics.interface';
import { TripsModalComponent } from '@components/ui/trips-modal/trips-modal.component';
import { NumberHelper } from '@helpers/number.helper';
import { StatHelper } from '@helpers/stat.helper';
import { DateHelper } from '@helpers/date.helper';
import { DailyService } from '@services/sheets/daily.service';

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
export class StatsSummaryComponent implements OnChanges, OnInit {
  private stats: ITripStatistics = this.createEmptyStats();
  dailyData: IDaily[] = [];

  @Input() trips: ITrip[] = [];
  @Input() startDate?: string;
  @Input() endDate?: string;

  private readonly dialogConfig = {
    height: '550px',
    width: '600px',
    panelClass: 'custom-modalbox'
  } as const;

  summaryCards: ISummaryCard[] = [];

  // Memoized computed properties
  private _cachedBusiestDay: { date: string; trips: number } | null = null;
  private _cachedHighestEarningDay: { date: string; total: number } | null = null;
  private _cachedBestWeekdayPerTrip: { label: string; value: number; dayIndex: number } | null = null;
  private _cachedBestWeekdayPerTime: { label: string; value: number; dayIndex: number } | null = null;

  constructor(private dialog: MatDialog, private dailyService: DailyService, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    this.dailyService.daily$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.dailyData = data || [];
        this.refreshSummary();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trips'] || changes['startDate'] || changes['endDate']) {
      this.refreshSummary();
    }
  }

  private refreshSummary(): void {
    this.stats = this.calculateStatistics(this.trips);
    
    // Memoize computed properties to avoid recalculating on every template evaluation
    this._cachedBusiestDay = StatHelper.getBusiestDayFromDaily(this.dailyData, this.startDate, this.endDate);
    this._cachedHighestEarningDay = StatHelper.getHighestEarningDayFromDaily(this.dailyData, this.startDate, this.endDate);
    this._cachedBestWeekdayPerTrip = this.calculateBestWeekdayPerTrip();
    this._cachedBestWeekdayPerTime = this.calculateBestWeekdayPerTime();
    
    this.summaryCards = this.buildSummaryCards();
  }

  private createEmptyStats(): ITripStatistics {
    return {
      totalEarnings: 0,
      totalTips: 0,
      totalBonus: 0,
      totalDistance: 0,
      averagePerTrip: 0,
      medianTip: 0,
      medianPay: 0,
      averagePay: 0,
      highestPay: 0,
      lowestPay: null,
      highestTip: 0,
      zeroTipTrips: 0,
      cashTrips: 0,
      averagePerMile: 0,
      bestEarningsPerMile: 0,
      worstEarningsPerMile: 0,
      averageTip: 0,
      lowestNonZeroTip: null,
      tipPercentage: 0,
      longestTrip: 0,
      shortestTrip: null
    };
  }

  private calculateStatistics(trips: ITrip[]): ITripStatistics {
    if (trips.length === 0) {
      return this.createEmptyStats();
    }

    const totalEarnings = trips.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalTips = trips.reduce((sum, t) => sum + (t.tip || 0), 0);
    const totalBonus = trips.reduce((sum, t) => sum + (t.bonus || 0), 0);
    const totalDistance = trips.reduce((sum, t) => sum + (t.distance || 0), 0);

    const pays = trips.map(t => t.pay || 0).filter(v => v > 0);
    const nonZeroTips = trips.filter(t => (t.tip || 0) > 0);
    const nonZeroDistances = trips.filter(t => (t.distance || 0) > 0);
    const perMileTrips = trips.filter(t => (t.distance || 0) > 1 && (t.pay || 0) > 0);
    const perMile = perMileTrips.map(t => (t.total || 0) / (t.distance || 1));

    const baseEarnings = trips.reduce((sum, t) => sum + (t.pay || 0) + (t.bonus || 0), 0);

    return {
      totalEarnings,
      totalTips,
      totalBonus,
      totalDistance,
      averagePerTrip: totalEarnings / trips.length,
      medianTip: NumberHelper.median(trips.map(t => t.tip || 0)),
      medianPay: NumberHelper.median(pays),
      averagePay: pays.length ? pays.reduce((sum, v) => sum + v, 0) / pays.length : 0,
      highestPay: Math.max(...trips.map(t => t.pay || 0)),
      lowestPay: pays.length > 0 ? Math.min(...pays) : null,
      highestTip: Math.max(...trips.map(t => t.tip || 0)),
      zeroTipTrips: trips.filter(t => (t.tip || 0) === 0).length,
      cashTrips: trips.filter(t => (t.cash || 0) > 0).length,
      averagePerMile: totalDistance > 0 ? totalEarnings / totalDistance : 0,
      bestEarningsPerMile: perMile.length ? Math.max(...perMile) : 0,
      worstEarningsPerMile: perMile.length ? Math.min(...perMile) : 0,
      averageTip: totalTips / trips.length,
      lowestNonZeroTip: nonZeroTips.length > 0 ? Math.min(...nonZeroTips.map(t => t.tip || 0)) : null,
      tipPercentage: baseEarnings > 0 ? (totalTips / baseEarnings) * 100 : 0,
      longestTrip: Math.max(...trips.map(t => t.distance || 0)),
      shortestTrip: nonZeroDistances.length > 0 ? Math.min(...nonZeroDistances.map(t => t.distance || 0)) : null
    };
  }

  get busiestDay() {
    return this._cachedBusiestDay;
  }

  get highestEarningDay() {
    return this._cachedHighestEarningDay;
  }

  get bestWeekdayPerTrip(): { label: string; value: number; dayIndex: number } | null {
    return this._cachedBestWeekdayPerTrip;
  }

  get bestWeekdayPerTime(): { label: string; value: number; dayIndex: number } | null {
    return this._cachedBestWeekdayPerTime;
  }

  private calculateBestWeekdayPerTrip(): { label: string; value: number; dayIndex: number } | null {
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

  private calculateBestWeekdayPerTime(): { label: string; value: number; dayIndex: number } | null {
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
    const s = this.stats;

    return [
      {
        label: 'Total Trips',
        value: this.trips.length.toLocaleString(),
        highlight: true
      },
      {
        label: 'Total Earnings',
        value: `$${NumberHelper.formatNumber(s.totalEarnings)}`,
        highlight: true
      },
      {
        label: 'Average per Trip',
        value: `$${NumberHelper.formatNumber(s.averagePerTrip)}`,
        highlight: true
      },
      {
        label: 'Total Tips',
        value: `$${NumberHelper.formatNumber(s.totalTips)}`,
      },
      {
        label: 'Average Pay',
        value: `$${NumberHelper.formatNumber(s.averagePay)}`,
      },
      {
        label: 'Median Pay',
        value: `$${NumberHelper.formatNumber(s.medianPay)}`,
      },
      {
        label: 'Average Tip',
        value: `$${NumberHelper.formatNumber(s.averageTip)}`,
      },
      {
        label: 'Median Tip',
        value: `$${NumberHelper.formatNumber(s.medianTip)}`,
      },
      {
        label: 'Total Bonus',
        value: `$${NumberHelper.formatNumber(s.totalBonus)}`,
      },
      {
        label: 'Tip Percentage',
        value: `${s.tipPercentage.toFixed(1)}%`,
      },
      {
        label: 'Highest Tip',
        value: `$${NumberHelper.formatNumber(s.highestTip)}`,
        action: () => this.showTripsWithHighestTip()
      },
      {
        label: 'Lowest Tip',
        value: s.lowestNonZeroTip !== null ? `$${NumberHelper.formatNumber(s.lowestNonZeroTip)}` : '—',
        action: s.lowestNonZeroTip !== null ? () => this.showTripsWithLowestTip() : undefined
      },
      {
        label: 'Highest Pay Trip',
        value: `$${NumberHelper.formatNumber(s.highestPay)}`,
        action: () => this.showTripsWithHighestPay()
      },
      {
        label: 'Lowest Pay Trip',
        value: s.lowestPay !== null ? `$${NumberHelper.formatNumber(s.lowestPay)}` : '—',
        action: s.lowestPay !== null ? () => this.showTripsWithLowestPay() : undefined
      },
      {
        label: 'Avg Per Mile',
        value: `$${NumberHelper.formatNumber(s.averagePerMile)}`,
      },
      {
        label: 'Best $/Mile',
        value: `$${NumberHelper.formatNumber(s.bestEarningsPerMile)}`,
        action: () => this.showTripsWithBestPerMile()
      },
      {
        label: 'Worst $/Mile',
        value: `$${NumberHelper.formatNumber(s.worstEarningsPerMile)}`,
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
        value: `${NumberHelper.formatNumber(s.totalDistance)} mi`,
      },
      {
        label: 'Longest Trip',
        value: `${NumberHelper.formatNumber(s.longestTrip)} mi`,
        action: () => this.showLongestTrips()
      },
      {
        label: 'Shortest Trip',
        value: s.shortestTrip !== null ? `${NumberHelper.formatNumber(s.shortestTrip)} mi` : '—',
        action: s.shortestTrip !== null ? () => this.showShortestTrips() : undefined
      },
      {
        label: 'Zero Tip Trips',
        value: s.zeroTipTrips.toLocaleString(),
        action: s.zeroTipTrips > 0 ? () => this.showZeroTipTrips() : undefined
      },
      {
        label: 'Cash Trips',
        value: s.cashTrips.toLocaleString(),
        action: s.cashTrips > 0 ? () => this.showCashTrips() : undefined
      }
    ];
  }

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
    const highest = this.stats.highestTip;
    this.openTripsModal(
      `Trips with Highest Tip ($${NumberHelper.formatNumber(highest)})`,
      t => (t.tip || 0) === highest
    );
  }

  showTripsWithLowestTip(): void {
    const lowest = this.stats.lowestNonZeroTip;
    if (lowest === null) return;
    this.openTripsModal(
      `Trips with Lowest Tip ($${NumberHelper.formatNumber(lowest)})`,
      t => (t.tip || 0) === lowest && (t.tip || 0) > 0
    );
  }

  showLongestTrips(): void {
    const longest = this.stats.longestTrip;
    this.openTripsModal(
      `Longest Trips (${NumberHelper.formatNumber(longest)} mi)`,
      t => (t.distance || 0) === longest && (t.distance || 0) > 0
    );
  }

  showShortestTrips(): void {
    const shortest = this.stats.shortestTrip;
    if (shortest === null) return;
    this.openTripsModal(
      `Shortest Trips (${NumberHelper.formatNumber(shortest)} mi)`,
      t => (t.distance || 0) === shortest && (t.distance || 0) > 0
    );
  }

  showTripsWithHighestPay(): void {
    const highest = this.stats.highestPay;
    this.openTripsModal(
      `Trips with Highest Pay ($${NumberHelper.formatNumber(highest)})`,
      t => (t.pay || 0) === highest && (t.pay || 0) > 0
    );
  }

  showTripsWithLowestPay(): void {
    const lowest = this.stats.lowestPay;
    if (lowest === null) return;
    this.openTripsModal(
      `Trips with Lowest Pay ($${NumberHelper.formatNumber(lowest)})`,
      t => (t.pay || 0) === lowest && (t.pay || 0) > 0
    );
  }

  // Median drill-down intentionally omitted; median can be non-observed when even counts are averaged.

  showTripsWithBestPerMile(): void {
    const best = this.stats.bestEarningsPerMile;
    this.openTripsModal(
      `Trips with Best $/Mile ($${NumberHelper.formatNumber(best)})`,
      t => (t.distance || 0) > 1 && NumberHelper.nearlyEqual((t.total || 0) / (t.distance || 1), best)
    );
  }

  showTripsWithWorstPerMile(): void {
    const worst = this.stats.worstEarningsPerMile;
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

  // Accessor methods for backward compatibility if needed
  get totalEarnings(): number { return this.stats.totalEarnings; }
  get totalTips(): number { return this.stats.totalTips; }
  get totalBonus(): number { return this.stats.totalBonus; }
  get totalDistance(): number { return this.stats.totalDistance; }
  get averagePerTrip(): number { return this.stats.averagePerTrip; }
  get medianTip(): number { return this.stats.medianTip; }
  get medianPay(): number { return this.stats.medianPay; }
  get averagePay(): number { return this.stats.averagePay; }
  get highestPay(): number { return this.stats.highestPay; }
  get lowestPay(): number | null { return this.stats.lowestPay; }
  get highestTip(): number { return this.stats.highestTip; }
  get zeroTipTrips(): number { return this.stats.zeroTipTrips; }
  get cashTrips(): number { return this.stats.cashTrips; }
  get averagePerMile(): number { return this.stats.averagePerMile; }
  get bestEarningsPerMile(): number { return this.stats.bestEarningsPerMile; }
  get worstEarningsPerMile(): number { return this.stats.worstEarningsPerMile; }
  get averageTip(): number { return this.stats.averageTip; }
  get lowestNonZeroTip(): number | null { return this.stats.lowestNonZeroTip; }
  get tipPercentage(): number { return this.stats.tipPercentage; }
  get longestTrip(): number { return this.stats.longestTrip; }
  get shortestTrip(): number | null { return this.stats.shortestTrip; }
}