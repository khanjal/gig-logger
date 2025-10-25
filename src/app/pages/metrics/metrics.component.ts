// Imports
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartOptions, ChartData, Chart, registerables } from 'chart.js';
import { ShiftService } from '../../shared/services/sheets/shift.service';
import { Subscription as DexieSubscription } from 'dexie';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { CustomCalendarHeaderComponent } from '@components/ui/custom-calendar-header/custom-calendar-header.component';
import { CommonModule } from '@angular/common';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DateHelper } from '../../shared/helpers/date.helper';

// Chart.js registration
Chart.register(...registerables);
Chart.register(ChartDataLabels);

// Utility Functions
function formatDate(date: Date, type: 'day' | 'week' | 'month' | 'quarter' | 'year') {
  if (type === 'year') return date.getFullYear().toString();
  if (type === 'quarter') {
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${year}`;
  }
  if (type === 'month') return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  if (type === 'week') {
    const first = new Date(date);
    first.setDate(date.getDate() - date.getDay() + 1); // Monday
    const last = new Date(first);
    last.setDate(first.getDate() + 6); // Sunday
    return `${first.toLocaleDateString()} - ${last.toLocaleDateString()}`;
  }
  return date.toLocaleDateString();
}

function getAggregationType(start: Date, end: Date): 'day' | 'week' | 'month' | 'quarter' | 'year' {
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diff > 730) return 'year';
  if (diff > 365) return 'quarter';
  if (diff > 180) return 'month';
  if (diff > 31) return 'week';
  return 'day';
}

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatDatepickerModule, MatInputModule, MatNativeDateModule],
  providers: [ShiftService],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit, OnDestroy {
  readonly CustomCalendarHeaderComponent = CustomCalendarHeaderComponent;
  shifts: any[] = [];
  private dexieSubscriptions: DexieSubscription[] = [];

  // Chart Data
  tripsData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Total Trips', data: [], backgroundColor: '#f472b6', borderColor: '#be185d', borderWidth: 2, datalabels: { color: '#be185d', font: { weight: 'bold', size: 14 } } }] };
  distanceData: ChartData<'line'> = { labels: [], datasets: [] };
  payData: ChartData<'bar'> = { labels: [], datasets: [] };
  dailyEarningsData: ChartData<'bar'> = { labels: [], datasets: [] };
  servicePieData: ChartData<'pie'> = { labels: [], datasets: [] };
  yoyData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Chart Options
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: {
        display: (ctx) => {
          const chart = ctx.chart;
          const labelCount = chart.data.labels ? chart.data.labels.length : 0;
          if (labelCount > 20 || ctx.dataset.data[ctx.dataIndex] === 0) return false;
          const config: any = chart.config;
          const scales: any = chart.options.scales;
          if (config && config.type === 'bar' && scales && scales['x'] && scales['x'].stacked) {
            const dataIndex = ctx.dataIndex;
            const datasets = chart.data.datasets;
            let total = 0;
            datasets.forEach(ds => { if (Array.isArray(ds.data)) { total += Number(ds.data[dataIndex]) || 0; } });
            const value = Number(ctx.dataset.data[dataIndex]) || 0;
            if (total === 0 || value / total < 0.1) return false;
          }
          return true;
        },
        color: '#222',
        font: { weight: 'bold', size: 14 },
        formatter: (value, ctx) => Math.round(value),
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label || ''}: ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#222' } },
      y: { stacked: true, grid: { color: '#eee' }, ticks: { color: '#222' } }
    }
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: {
        display: (ctx) => {
          const chart = ctx.chart;
          const labelCount = chart.data.labels ? chart.data.labels.length : 0;
          return labelCount <= 20 && ctx.dataset.data[ctx.dataIndex] !== 0;
        },
        color: '#222',
        font: { weight: 'bold', size: 14 },
        formatter: (value, ctx) => Math.round(value),
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label || ''}: ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#222' } },
      y: { grid: { color: '#eee' }, ticks: { color: '#222' } }
    }
  };

  pieOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 16 },
        textShadowColor: '#222',
        textShadowBlur: 6,
        formatter: (value: number, ctx: any) => value > 0 ? value : '',
        display: (ctx: any) => ctx.dataset.data[ctx.dataIndex] > 0,
      }
    }
  };

  // Date Range
  range = new FormGroup({ start: new FormControl(), end: new FormControl() });

  constructor(private shiftService: ShiftService) {}

  // Helper to get YMD string from a shift
  private getShiftYMD(s: any): string {
    return (typeof s.date === 'string' && s.date.length === 10)
      ? s.date
      : DateHelper.toISO(new Date(s.date));
  }

  async filterByDate() {
    // Convert picked dates to YYYY-MM-DD strings (date only, LOCAL time)
    const startYMD = this.range.value.start ? DateHelper.toISO(new Date(this.range.value.start)) : '';
    const endYMD = this.range.value.end ? DateHelper.toISO(new Date(this.range.value.end)) : '';
    // Use the same DB query as stats: inclusive between
    let filtered = this.shifts;
    
    if (startYMD || endYMD) {
      filtered = await this.shiftService.getShiftsBetweenDates(startYMD, endYMD);
    }

    let aggType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day';
    let actualStart = startYMD ? DateHelper.getDateFromISO(startYMD) : null;
    let actualEnd = endYMD ? DateHelper.getDateFromISO(endYMD) : null;

    if ((!startYMD || !endYMD) && filtered.length > 0) {
      const dates = filtered.map(s => DateHelper.getDateFromISO(this.getShiftYMD(s)));
      actualStart = new Date(Math.min(...dates.map(d => d.getTime())));
      actualEnd = new Date(Math.max(...dates.map(d => d.getTime())));
    }

    if (actualStart && actualEnd) {
      aggType = getAggregationType(actualStart, actualEnd);
    }

    this.updateCharts(filtered, aggType);
    this.updateDailyEarnings(filtered, aggType);
    this.updateServicePie(filtered, aggType);
    this.updateYearlyComparison(filtered);
  }

  private sortLabels(labels: string[], aggType: 'day' | 'week' | 'month' | 'quarter' | 'year'): string[] {
    if (aggType === 'year') {
      // Sort years numerically
      return labels.sort((a, b) => parseInt(a) - parseInt(b));
    } else if (aggType === 'quarter') {
      // Sort quarters by year then quarter number (e.g., "Q1 2024", "Q4 2025")
      return labels.sort((a, b) => {
        const [qA, yearA] = a.split(' ');
        const [qB, yearB] = b.split(' ');
        const yearDiff = parseInt(yearA) - parseInt(yearB);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(qA.substring(1)) - parseInt(qB.substring(1));
      });
    } else if (aggType === 'month') {
      // Sort months chronologically (e.g., "Jan 2024", "Dec 2025")
      return labels.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (aggType === 'week' || aggType === 'day') {
      // Sort by the actual date (first date in the label)
      return labels.sort((a, b) => {
        const dateA = new Date(a.split(' - ')[0] || a);
        const dateB = new Date(b.split(' - ')[0] || b);
        return dateA.getTime() - dateB.getTime();
      });
    }
    return labels;
  }

  updateCharts(filteredShifts = this.shifts, aggType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day') {
    const grouped: { [label: string]: { trips: number; distance: number; pay: number; tips: number; bonus: number; cash: number } } = {};
    filteredShifts.forEach(s => {
      // Always use local date for label
      const d = DateHelper.getDateFromISO(this.getShiftYMD(s));
      let label = '';
      if (aggType === 'year') label = d.getFullYear().toString();
      else if (aggType === 'quarter') {
        const year = d.getFullYear();
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        label = `Q${quarter} ${year}`;
      } else if (aggType === 'month') {
        label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (aggType === 'week') {
        // Week label: Monday-Sunday, local
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        label = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
      } else {
        label = d.toLocaleDateString();
      }
      if (!grouped[label]) grouped[label] = { trips: 0, distance: 0, pay: 0, tips: 0, bonus: 0, cash: 0 };
      grouped[label].trips += s.totalTrips || 0;
      grouped[label].distance += s.totalDistance || 0;
      grouped[label].pay += s.totalPay || 0;
      grouped[label].tips += s.totalTips || 0;
      grouped[label].bonus += s.totalBonus || 0;
      grouped[label].cash += s.totalCash || 0;
    });
    const labels = this.sortLabels(Object.keys(grouped), aggType);
    this.tripsData = {
      labels,
      datasets: [{
        label: 'Total Trips',
        data: labels.map(l => grouped[l].trips),
        backgroundColor: '#f472b6',
        borderColor: '#be185d',
        borderWidth: 2,
        datalabels: { color: '#be185d', font: { weight: 'bold', size: 14 } }
      }]
    };
    this.distanceData = {
      labels,
      datasets: [{
        label: 'Total Distance',
        data: labels.map(l => grouped[l].distance),
        borderColor: '#10b981',
        fill: false,
      }]
    };
    this.payData = {
      labels,
      datasets: [
        { label: 'Pay', data: labels.map(l => grouped[l].pay), backgroundColor: '#f59e42' },
        { label: 'Tips', data: labels.map(l => grouped[l].tips), backgroundColor: '#10b981' },
        { label: 'Bonus', data: labels.map(l => grouped[l].bonus), backgroundColor: '#6366f1' },
        { label: 'Cash', data: labels.map(l => grouped[l].cash), backgroundColor: '#ef4444' }
      ]
    };
  }

  updateDailyEarnings(filteredShifts = this.shifts, aggType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day') {
    const earningsByLabel: { [label: string]: { [service: string]: number } } = {};
    const serviceSet = new Set<string>();
    filteredShifts.forEach(s => {
      // Always use local date for label
      const d = DateHelper.getDateFromISO(this.getShiftYMD(s));
      let label = '';
      if (aggType === 'year') label = d.getFullYear().toString();
      else if (aggType === 'quarter') {
        const year = d.getFullYear();
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        label = `Q${quarter} ${year}`;
      } else if (aggType === 'month') {
        label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (aggType === 'week') {
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        label = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
      } else {
        label = d.toLocaleDateString();
      }
      serviceSet.add(s.service);
      if (!earningsByLabel[label]) earningsByLabel[label] = {};
      earningsByLabel[label][s.service] = (earningsByLabel[label][s.service] || 0) + (s.grandTotal || 0);
    });
    const labels = this.sortLabels(Object.keys(earningsByLabel), aggType);
    const services = Array.from(serviceSet);
    this.dailyEarningsData = {
      labels,
      datasets: services.map((service, i) => ({
        label: service,
        data: labels.map(l => earningsByLabel[l][service] || 0),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e42', '#6366f1', '#ef4444', '#14b8a6', '#f472b6', '#fbbf24', '#a3e635', '#38bdf8'
        ][i % 10],
      }))
    };
  }

  updateServicePie(filteredShifts = this.shifts, aggType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day') {
    const serviceCounts: { [service: string]: number } = {};
    filteredShifts.forEach(s => {
      serviceCounts[s.service] = (serviceCounts[s.service] || 0) + (s.totalTrips || 0);
    });
    const labels = Object.keys(serviceCounts);
    const data = labels.map(l => serviceCounts[l]);
    this.servicePieData = {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e42', '#6366f1', '#ef4444', '#14b8a6'],
      }]
    };
  }

  updateYearlyComparison(filteredShifts = this.shifts) {
    const grouped: { [year: string]: { pay: number; tips: number; bonus: number; cash: number } } = {};
    filteredShifts.forEach(s => {
      const d = new Date(s.date);
      const year = d.getFullYear().toString();
      if (!grouped[year]) grouped[year] = { pay: 0, tips: 0, bonus: 0, cash: 0 };
      grouped[year].pay += s.totalPay || 0;
      grouped[year].tips += s.totalTips || 0;
      grouped[year].bonus += s.totalBonus || 0;
      grouped[year].cash += s.totalCash || 0;
    });
    const labels = Object.keys(grouped);
    this.yoyData = {
      labels,
      datasets: [
        { label: 'Pay', data: labels.map(y => grouped[y].pay), backgroundColor: '#f59e42' },
        { label: 'Tips', data: labels.map(y => grouped[y].tips), backgroundColor: '#10b981' },
        { label: 'Bonus', data: labels.map(y => grouped[y].bonus), backgroundColor: '#6366f1' },
        { label: 'Cash', data: labels.map(y => grouped[y].cash), backgroundColor: '#ef4444' }
      ]
    };
  }

  async ngOnInit() {
    this.dexieSubscriptions.push(
      this.shiftService.shifts$.subscribe(shifts => {
        this.shifts = shifts;
        this.filterByDate();
      })
    );
  }

  ngOnDestroy() {
    this.dexieSubscriptions.forEach(sub => sub.unsubscribe());
  }
}
