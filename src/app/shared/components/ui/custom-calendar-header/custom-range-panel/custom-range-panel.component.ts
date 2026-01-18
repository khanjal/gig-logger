import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDateRangePicker } from '@angular/material/datepicker';
import { DateHelper } from '@helpers/date.helper';
import { NgFor, CommonModule } from '@angular/common';

const customPresets = [
    'Today',
    'Yesterday',
    'This week',
    'Last week',
    'This month',
    'Last month',
    'This year',
    'Last year',
    'Last 7 days',
    'Last 30 days',
] as const; // convert to readonly tuple of string literals

// equivalent to "today" | "last 7 days" | ... | "last year"
type CustomPreset = typeof customPresets[number];

@Component({
    selector: 'app-custom-range-panel',
    templateUrl: './custom-range-panel.component.html',
    styleUrls: ['./custom-range-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, NgFor],
})
export class CustomRangePanelComponent<D> {
  // list of range presets we want to provide:
  readonly customPresets = customPresets;
  selectedPreset: string | null = null;

  // Precompute date ranges during initialization
  private readonly precomputedRanges: Record<CustomPreset, [start: D, end: D]> = this.customPresets.reduce((acc, preset) => {
    acc[preset] = this.calculateDateRange(preset);
    return acc;
  }, {} as Record<CustomPreset, [start: D, end: D]>);

  constructor(
    private dateAdapter: DateAdapter<D>,
    private picker: MatDateRangePicker<D>
  ) {}

  // called when user selects a range preset:
  selectRange(rangeName: CustomPreset): void {
    this.selectedPreset = rangeName;
    const [start, end] = this.precomputedRanges[rangeName];
    this.picker.select(start);
    this.picker.select(end);
    this.picker.close();
  }

  private calculateDateRange(rangeName: CustomPreset): [start: D, end: D] {
    const today = this.today;
    const year = this.dateAdapter.getYear(today);

    switch (rangeName) {
      case 'Today':
            return [today, today];
        case 'Yesterday': {
            const date = this.dateAdapter.addCalendarDays(today, -1);
            return [date, date];
        }
      case 'This week': {
        return this.calculateWeek(today);
      }
      case 'This month': {
        return this.calculateMonth(today);
      }
      case 'This year': {
        const start = this.dateAdapter.createDate(year, 0, 1);
        const end = this.dateAdapter.createDate(year, 11, 31);
        return [start, end];
      }
      case 'Last week': {
        const thisDayLastWeek = this.dateAdapter.addCalendarDays(today, -7);
        return this.calculateWeek(thisDayLastWeek);
      }
      case 'Last month': {
        const thisDayLastMonth = this.dateAdapter.addCalendarMonths(today, -1);
        return this.calculateMonth(thisDayLastMonth);
      }
      case 'Last year': {
        const start = this.dateAdapter.createDate(year - 1, 0, 1);
        const end = this.dateAdapter.createDate(year - 1, 11, 31);
        return [start, end];
        }
        case 'Last 7 days': {
            const start = this.dateAdapter.addCalendarDays(today, -6);
            return [start, today];
        }
        case 'Last 30 days': {
            const start = this.dateAdapter.addCalendarDays(today, -29);
            return [start, today];
        }
      default:
        // exhaustiveness check;
        // rangeName has type never, if every possible value is handled in the switch cases.
        // Otherwise, the following line will result in compiler error:
        // "Type 'string' is not assignable to type '[start: D, end: D]'"
        return rangeName;
    }
  }

  private calculateMonth(forDay: D): [start: D, end: D] {
    const year = this.dateAdapter.getYear(forDay);
    const month = this.dateAdapter.getMonth(forDay);
    const start = this.dateAdapter.createDate(year, month, 1);
    const end = this.dateAdapter.addCalendarDays(
      start,
      this.dateAdapter.getNumDaysInMonth(forDay) - 1
    );
    return [start, end];
  }

  private calculateWeek(forDay: D): [start: D, end: D] {
    const deltaStart = DateHelper.getFirstDayOfWeek() - DateHelper.getDayOfWeek(<Date>forDay);
    const start = this.dateAdapter.addCalendarDays(forDay, deltaStart);
    const end = this.dateAdapter.addCalendarDays(start, 6);
    return [start, end];
  }

  private get today(): D {
    const today = this.dateAdapter.getValidDateOrNull(new Date());
    if (today === null) {
      throw new Error('date creation failed');
    }
    return today;
  }

  // Lazy load touch-ui class
  @HostBinding('class.touch-ui')
  get isTouchUi(): boolean {
    return this.picker.touchUi;
  }
}
