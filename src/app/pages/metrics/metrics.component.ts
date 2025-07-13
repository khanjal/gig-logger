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

Chart.register(...registerables);

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

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [BaseChartDirective, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatDatepickerModule, MatInputModule, MatNativeDateModule],
  providers: [ShiftService, TripService],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit {
  readonly CustomCalendarHeaderComponent = CustomCalendarHeaderComponent;
  shifts: any[] = [];
  trips: any[] = [];
  private dexieSubscriptions: DexieSubscription[] = [];

  tripsData: ChartData<'bar'> = { labels: [], datasets: [] };
  distanceData: ChartData<'line'> = { labels: [], datasets: [] };
  payData: ChartData<'bar'> = { labels: [], datasets: [] };
  startDate: Date | null = null;
  endDate: Date | null = null;
  dailyEarningsData: ChartData<'bar'> = { labels: [], datasets: [] };
  servicePieData: ChartData<'pie'> = { labels: [], datasets: [] };

  barOptions: ChartOptions = {
    responsive: true,
    plugins: { legend: { display: true } }
  };

  lineOptions: ChartOptions = {
    responsive: true,
    plugins: { legend: { display: true } }
  };

  pieOptions: ChartOptions = { responsive: true, plugins: { legend: { display: true } } };

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
    this.updateCharts(filtered);
    this.updateDailyEarnings(filtered);
    this.updateServicePie(filtered);
  }

  updateCharts(filteredShifts = this.shifts) {
    const dates = filteredShifts.map(s => s.date);
    this.tripsData = {
      labels: dates,
      datasets: [{
        label: 'Total Trips',
        data: filteredShifts.map(s => s.totalTrips),
        backgroundColor: '#3b82f6',
      }]
    };
    this.distanceData = {
      labels: dates,
      datasets: [{
        label: 'Total Distance',
        data: filteredShifts.map(s => s.totalDistance),
        borderColor: '#10b981',
        fill: false,
      }]
    };
    this.payData = {
      labels: dates,
      datasets: [{
        label: 'Total Pay',
        data: filteredShifts.map(s => s.totalPay),
        backgroundColor: '#f59e42',
      }]
    };
  }

  updateDailyEarnings(filteredShifts = this.shifts) {
    // Group by date and sum grandTotal
    const earningsByDate: { [date: string]: number } = {};
    filteredShifts.forEach(s => {
      earningsByDate[s.date] = (earningsByDate[s.date] || 0) + (s.grandTotal || 0);
    });
    const dates = Object.keys(earningsByDate).sort();
    this.dailyEarningsData = {
      labels: dates,
      datasets: [{
        label: 'Daily Earnings',
        data: dates.map(d => earningsByDate[d]),
        backgroundColor: '#6366f1',
      }]
    };
  }

  updateServicePie(filteredShifts = this.shifts) {
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

  async ngOnInit() {
    const week = getCurrentWeekRange();
    this.range.setValue({ start: week.start, end: week.end });
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
