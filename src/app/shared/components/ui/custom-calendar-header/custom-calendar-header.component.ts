// https://stackblitz.com/edit/example-ng-date-range-picker-custom-ranges
// https://dev.to/paullaros/using-angular-materials-calendar-with-date-ranges-and-range-presets-221j
// https://qupaya.com/blog/angular-date-range-picker-with-custom-range-presets/

import type { OnDestroy} from '@angular/core';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import type {
  MatDateFormats} from '@angular/material/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MatCalendar } from '@angular/material/datepicker';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomRangePanelComponent } from './custom-range-panel/custom-range-panel.component';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-custom-calendar-header',
    templateUrl: './custom-calendar-header.component.html',
    styleUrls: ['./custom-calendar-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CustomRangePanelComponent, MatIcon]
})
export class CustomCalendarHeaderComponent<D> implements OnDestroy {
  private calendar = inject<MatCalendar<D>>(MatCalendar);
  private dateAdapter = inject<DateAdapter<D>>(DateAdapter);
  private dateFormats = inject<MatDateFormats>(MAT_DATE_FORMATS);

  private readonly destroy$ = new Subject<void>();

  constructor() {
    const calendar = this.calendar;
    const cdr = inject(ChangeDetectorRef);

    // make sure your header stays in sync with the calendar:
    calendar.stateChanges
      .pipe(takeUntil(this.destroy$)) // unsubscribe when destroyed
      .subscribe(() => cdr.markForCheck());
  }

  // active date label rendered between the arrow buttons
  public get periodLabel(): string {
    // use date adapter to format the label, e.g. "SEP 2020"
    return this.dateAdapter
      .format(this.calendar.activeDate, this.dateFormats.display.monthYearLabel)
      .toLocaleUpperCase();
  }

  // called when user clicks on one of the left buttons
  public previousClicked(mode: 'month' | 'year'): void {
    this.changeDate(mode, -1);
  }

  // called when user clicks on one of the right buttons
  public nextClicked(mode: 'month' | 'year'): void {
    this.changeDate(mode, 1);
  }

  private changeDate(mode: 'month' | 'year', amount: -1 | 1): void {
    // increment or decrement month or year
    this.calendar.activeDate =
      mode === 'month'
        ? this.dateAdapter.addCalendarMonths(this.calendar.activeDate, amount)
        : this.dateAdapter.addCalendarYears(this.calendar.activeDate, amount);
  }

  public ngOnDestroy(): void {
    this.destroy$.next(); // will trigger unsubscription in takeUntil
  }
}
