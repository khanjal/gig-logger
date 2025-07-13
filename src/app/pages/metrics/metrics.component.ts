import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartOptions, ChartData, Chart, registerables } from 'chart.js';
import { ShiftService } from '../../shared/services/sheets/shift.service';
import { TripService } from '../../shared/services/sheets/trip.service';
import { Subscription as DexieSubscription } from 'dexie';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CustomCalendarHeaderComponent } from '@components/ui/custom-calendar-header/custom-calendar-header.component';
import { CommonModule } from '@angular/common';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables);
Chart.register(ChartDataLabels);

function getCurrentWeekRange(): { start: Date, end: Date } {
  const now = new Date();
  const day = now.getDay();
  // getDay: 0=Sun, 1=Mon, ..., 6=Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0,0,0,0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);
  return { start: monday, end: sunday };
}

function formatDate(date: Date, type: 'day' | 'week' | 'month' | 'quarter' | 'year') {
  if (type === 'year') {
    return date.getFullYear().toString();
  }
  if (type === 'quarter') {
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${year}`;
  }
  if (type === 'month') {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }
  if (type === 'week') {
    const first = new Date(date);
    first.setDate(date.getDate() - date.getDay() + 1); // Monday
    const last = new Date(first);
    last.setDate(first.getDate() + 6); // Sunday
    return `${first.toLocaleDateString()} - ${last.toLocaleDateString()}`;
  }
  // day
  return date.toLocaleDateString();
}

function getAggregationType(start: Date, end: Date): 'day' | 'week' | 'month' | 'quarter' | 'year' {
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diff > 730) return 'year'; // >2 years
  if (diff > 365) return 'quarter'; // >1 year
  if (diff > 180) return 'month';
  if (diff > 31) return 'week';
  return 'day';
}

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatDatepickerModule, MatInputModule, MatNativeDateModule],
  providers: [ShiftService, TripService],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit {
  readonly CustomCalendarHeaderComponent = CustomCalendarHeaderComponent;
  shifts: any[] = [];
  trips: any[] = [];
  private dexieSubscriptions: DexieSubscription[] = [];

  tripsData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Total Trips',
        data: [],
        backgroundColor: '#f472b6', // Changed to pink shade
        borderColor: '#be185d', // Darker pink for border
        borderWidth: 2,
        datalabels: {
          color: '#be185d',
          font: { weight: 'bold', size: 14 },
        }
      }
    ]
  };
  distanceData: ChartData<'line'> = { labels: [], datasets: [] };
  payData: ChartData<'bar'> = { labels: [], datasets: [] };
  startDate: Date | null = null;
  endDate: Date | null = null;
  dailyEarningsData: ChartData<'bar'> = { labels: [], datasets: [] };
  servicePieData: ChartData<'pie'> = { labels: [], datasets: [] };
  yoyData: ChartData<'bar'> = { labels: [], datasets: [] };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: {
        display: (ctx) => {
          // Only show datalabels for non-zero values and if chart isn't crowded
          const chart = ctx.chart;
          const labelCount = chart.data.labels ? chart.data.labels.length : 0;
          return labelCount <= 20 && ctx.dataset.data[ctx.dataIndex] !== 0;
        },
        color: '#222',
        font: {
          weight: 'bold',
          size: 14,
        },
        formatter: (value, ctx) => {
          // Round to nearest integer for display
          return Math.round(value);
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            // Show decimals in tooltip if needed
            return `${context.dataset.label || ''}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#222' }
      },
      y: {
        stacked: true,
        grid: { color: '#eee' },
        ticks: { color: '#222' }
      }
    }
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: {
        display: (ctx) => {
          // Only show datalabels for non-zero values and if chart isn't crowded
          const chart = ctx.chart;
          const labelCount = chart.data.labels ? chart.data.labels.length : 0;
          return labelCount <= 20 && ctx.dataset.data[ctx.dataIndex] !== 0;
        },
        color: '#222',
        font: {
          weight: 'bold',
          size: 14,
        },
        formatter: (value, ctx) => {
          // Round to nearest integer for display
          return Math.round(value);
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            // Show decimals in tooltip if needed
            return `${context.dataset.label || ''}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#222' }
      },
      y: {
        grid: { color: '#eee' },
        ticks: { color: '#222' }
      }
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

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  constructor(private shiftService: ShiftService, private tripService: TripService) {}

  filterByDate() {
    const startDate: Date | null = this.range.value.start;
    const endDate: Date | null = this.range.value.end;
    const filtered = this.shifts.filter(s => {
      const d = new Date(s.date);
      return (!startDate || d >= startDate) && (!endDate || d <= endDate);
    });
    let aggType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day';
    let actualStart = startDate;
    let actualEnd = endDate;
    if ((!startDate || !endDate) && filtered.length > 0) {
      // If no date range, use min/max dates from filtered data
      const dates = filtered.map(s => new Date(s.date));
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

  updateCharts(filteredShifts = this.shifts, aggType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day') {
    // Group by aggregation type
    const grouped: { [label: string]: { trips: number; distance: number; pay: number; tips: number; bonus: number; cash: number } } = {};
    filteredShifts.forEach(s => {
      const d = new Date(s.date);
      let label = '';
      if (aggType === 'year') {
        label = formatDate(new Date(d.getFullYear(), 0, 1), 'year');
      } else if (aggType === 'quarter') {
        label = formatDate(new Date(d.getFullYear(), d.getMonth(), 1), 'quarter');
      } else if (aggType === 'month') {
        label = formatDate(new Date(d.getFullYear(), d.getMonth(), 1), 'month');
      } else if (aggType === 'week') {
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        label = formatDate(monday, 'week');
      } else {
        label = formatDate(d, 'day');
      }
      if (!grouped[label]) {
        grouped[label] = { trips: 0, distance: 0, pay: 0, tips: 0, bonus: 0, cash: 0 };
      }
      grouped[label].trips += s.totalTrips || 0;
      grouped[label].distance += s.totalDistance || 0;
      grouped[label].pay += s.totalPay || 0;
      grouped[label].tips += s.totalTips || 0;
      grouped[label].bonus += s.totalBonus || 0;
      grouped[label].cash += s.totalCash || 0;
    });
    const labels = Object.keys(grouped);
    this.tripsData = {
      labels,
      datasets: [{
        label: 'Total Trips',
        data: labels.map(l => grouped[l].trips),
        backgroundColor: '#f472b6', // Pink shade
        borderColor: '#be185d', // Darker pink for border
        borderWidth: 2,
        datalabels: {
          color: '#be185d',
          font: { weight: 'bold', size: 14 },
        }
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
        {
          label: 'Pay',
          data: labels.map(l => grouped[l].pay),
          backgroundColor: '#f59e42',
        },
        {
          label: 'Tips',
          data: labels.map(l => grouped[l].tips),
          backgroundColor: '#10b981',
        },
        {
          label: 'Bonus',
          data: labels.map(l => grouped[l].bonus),
          backgroundColor: '#6366f1',
        },
        {
          label: 'Cash',
          data: labels.map(l => grouped[l].cash),
          backgroundColor: '#ef4444',
        }
      ]
    };
  }

  updateDailyEarnings(filteredShifts = this.shifts, aggType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day') {
    // Group by aggregation type and service
    const earningsByLabel: { [label: string]: { [service: string]: number } } = {};
    const serviceSet = new Set<string>();
    filteredShifts.forEach(s => {
      const d = new Date(s.date);
      let label = '';
      if (aggType === 'year') {
        label = formatDate(new Date(d.getFullYear(), 0, 1), 'year');
      } else if (aggType === 'quarter') {
        label = formatDate(new Date(d.getFullYear(), d.getMonth(), 1), 'quarter');
      } else if (aggType === 'month') {
        label = formatDate(new Date(d.getFullYear(), d.getMonth(), 1), 'month');
      } else if (aggType === 'week') {
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        label = formatDate(monday, 'week');
      } else {
        label = formatDate(d, 'day');
      }
      serviceSet.add(s.service);
      if (!earningsByLabel[label]) earningsByLabel[label] = {};
      earningsByLabel[label][s.service] = (earningsByLabel[label][s.service] || 0) + (s.grandTotal || 0);
    });
    const labels = Object.keys(earningsByLabel);
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
    // Group by aggregation type
    const serviceCounts: { [service: string]: number } = {};
    filteredShifts.forEach(s => {
      serviceCounts[s.service] = (serviceCounts[s.service] || 0) + 1;
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
    // Group by year
    const grouped: { [year: string]: { pay: number; tips: number; bonus: number; cash: number } } = {};
    filteredShifts.forEach(s => {
      const d = new Date(s.date);
      const year = d.getFullYear().toString();
      if (!grouped[year]) {
        grouped[year] = { pay: 0, tips: 0, bonus: 0, cash: 0 };
      }
      grouped[year].pay += s.totalPay || 0;
      grouped[year].tips += s.totalTips || 0;
      grouped[year].bonus += s.totalBonus || 0;
      grouped[year].cash += s.totalCash || 0;
    });
    const labels = Object.keys(grouped);
    this.yoyData = {
      labels,
      datasets: [
        {
          label: 'Pay',
          data: labels.map(y => grouped[y].pay),
          backgroundColor: '#f59e42',
        },
        {
          label: 'Tips',
          data: labels.map(y => grouped[y].tips),
          backgroundColor: '#10b981',
        },
        {
          label: 'Bonus',
          data: labels.map(y => grouped[y].bonus),
          backgroundColor: '#6366f1',
        },
        {
          label: 'Cash',
          data: labels.map(y => grouped[y].cash),
          backgroundColor: '#ef4444',
        }
      ]
    };
  }

  async ngOnInit() {
    // Do not set default date range to current week
    // this.range.setValue({ start: week.start, end: week.end });
    this.dexieSubscriptions.push(
      this.shiftService.shifts$.subscribe(shifts => {
        this.shifts = shifts;
        this.filterByDate();
      })
    );
    this.dexieSubscriptions.push(
      this.tripService.trips$.subscribe(trips => {
        this.trips = trips;
        // You can use trips for additional metrics
      })
    );
  }

  ngOnDestroy() {
    this.dexieSubscriptions.forEach(sub => sub.unsubscribe());
  }
}
