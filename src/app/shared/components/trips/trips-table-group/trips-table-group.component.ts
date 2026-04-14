import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, SimpleChanges, Injector, inject, runInInjectionContext, afterNextRender } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';
import { sort } from '@helpers/sort.helper';
import { ITripGroup } from '@interfaces/trip-group.interface';
import { TripService } from '@services/sheets/trip.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { MatIcon } from '@angular/material/icon';
import { NgFor, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';

@Component({
    selector: 'app-trips-table-group',
    templateUrl: './trips-table-group.component.html',
    styleUrls: ['./trips-table-group.component.scss'],
    standalone: true,
    imports: [MatIcon, NgFor, NgClass, CurrencyPipe, DatePipe, TruncatePipe, NoSecondsPipe]
})
export class TripsTableGroupComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() title: string = "";
  @Input() link: string = "";
  @Input() days: number = 6;
  
  displayedColumns: string[] = [];
  tripGroups: ITripGroup[] = [];
  @ViewChildren('tableContainer') tableContainers!: QueryList<ElementRef>;
  isScrollable: boolean[] = [];
  prefers24Hour: boolean = false;
  private injector = inject(Injector);

  constructor(
    private _tripService: TripService,
    private _weekdayService: WeekdayService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Avoid duplicate initial load; ngOnInit handles first render.
    if (changes['days'] && !changes['days'].firstChange) {
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => {
          void this.loadAndCheck();
        });
      });
    }
  }

  ngOnInit(): void {
    this.displayedColumns = ['service', 'place', 'total', 'name', 'pickup', 'dropoff', 'address'];
    this.prefers24Hour = DateHelper.prefers24Hour();
    // Defer async hydration until after first paint to avoid NG0100 in dev mode.
    runInInjectionContext(this.injector, () => {
      afterNextRender(() => {
        void this.loadAndCheck();
      });
    });
  }

  ngAfterViewInit(): void {
    // Run after the current render cycle to avoid change-detection re-entrancy.
    queueMicrotask(() => this.checkScrollable());
  }

  checkScrollable() {
    if (!this.tableContainers) return;
    this.isScrollable = this.tableContainers.map((container: ElementRef) => {
      const el = container.nativeElement;
      return el.scrollWidth > el.clientWidth;
    });
  }

  private async loadAndCheck(): Promise<void> {
    await this.load();
    queueMicrotask(() => {
      this.checkScrollable();
      this.cdr.markForCheck();
    });
  }

  async load() {
    let sheetTrips = await this._tripService.getPreviousDays(this.days);
    sort(sheetTrips, '-id');
    
    // Get unique dates in trips and create groups
    let dates: string[] = [... new Set(sheetTrips.map(trip => trip.date))];

    const groupedResults = await Promise.all(dates.map(async (date) => {
      const trips = sheetTrips.filter(x => x.date === date);
      if (trips.length === 0) {
        return null;
      }

      const dayOfWeek = DateHelper.getDayOfWeek(new Date(DateHelper.getDateFromISO(date)));
      const weekday = (await this._weekdayService.query('day', dayOfWeek))[0];
      const orderedTrips = [...trips].reverse();

      return {
        date,
        trips: orderedTrips,
        amount: orderedTrips.filter(x => !x.exclude).reduce((acc, trip) => acc + trip.total, 0),
        average: weekday?.dailyPrevAverage ?? 0
      } as ITripGroup;
    }));

    // Assign once so template bindings do not see intermediate async mutations.
    this.tripGroups = groupedResults.filter((group): group is ITripGroup => group !== null);
  }
}
