import { Injectable, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { DateHelper } from '@helpers/date.helper';

import type { IMonthly } from '@interfaces/monthly.interface';
import type { IShift } from '@interfaces/shift.interface';
import type { IWeekday } from '@interfaces/weekday.interface';
import type { IWeekly } from '@interfaces/weekly.interface';

import { MonthlyService } from '@services/sheets/monthly.service';
import { ShiftService } from '@services/sheets/shift.service';
import { WeekdayService } from '@services/sheets/weekday.service';
import { WeeklyService } from '@services/sheets/weekly.service';

@Injectable({
  providedIn: 'root'
})
export class CurrentAverageStateService {
  private selectedDate = signal<string>(DateHelper.toISO());

  private shifts = toSignal(this._shiftService.shifts$, { initialValue: [] as IShift[] });
  private weekdays = toSignal(this._weekdayService.weekdays$, { initialValue: [] as IWeekday[] });
  private weeklyRows = toSignal(this._weeklyService.weekly$, { initialValue: [] as IWeekly[] });
  private monthlyRows = toSignal(this._monthlyService.monthly$, { initialValue: [] as IMonthly[] });

  readonly currentDayAmount = computed(() => {
    const date = this.selectedDate();
    const shifts = this.shifts().filter(shift => shift.date === date);
    return shifts.reduce((acc, shift) => acc + this.toFiniteNumber(shift.grandTotal), 0);
  });

  readonly currentWeekAmount = computed(() => {
    const selectedDate = DateHelper.parseLocalDate(this.selectedDate());
    const mondayDate = DateHelper.getMonday(new Date(selectedDate));
    const mondayISO = DateHelper.toISO(mondayDate);

    const shifts = this.shifts().filter(shift => shift.date >= mondayISO);
    return shifts.reduce((acc, shift) => acc + this.toFiniteNumber(shift.grandTotal), 0);
  });

  readonly currentMonthAmount = computed(() => {
    const selectedDate = DateHelper.parseLocalDate(this.selectedDate());
    const monthStart = DateHelper.getFirstDayOfMonth(selectedDate);

    const shifts = this.shifts().filter(shift => shift.date >= monthStart);
    return shifts.reduce((acc, shift) => acc + this.toFiniteNumber(shift.grandTotal), 0);
  });

  readonly dailyAverage = computed(() => {
    const selectedDate = DateHelper.parseLocalDate(this.selectedDate());
    const dayOfWeek = DateHelper.getDayOfWeek(selectedDate);
    const weekday = this.weekdays().find(row => row.day === dayOfWeek);

    return this.toFiniteNumber(weekday?.dailyPrevAverage);
  });

  readonly weeklyAverage = computed(() => {
    const selectedDate = this.selectedDate();
    const previousRows = this.weeklyRows()
      .filter(row => (row.begin ?? '') < selectedDate)
      .sort((left, right) => (left.begin ?? '').localeCompare(right.begin ?? ''));

    const latest = previousRows[previousRows.length - 1];
    return this.toFiniteNumber(latest?.average);
  });

  readonly monthlyAverage = computed(() => {
    const selectedDate = DateHelper.parseLocalDate(this.selectedDate());
    const monthYear = DateHelper.getMonthYearString(selectedDate);
    const monthly = this.monthlyRows().find(row => row.month === monthYear);

    return this.toFiniteNumber(monthly?.average);
  });

  constructor(
    private _monthlyService: MonthlyService,
    private _shiftService: ShiftService,
    private _weekdayService: WeekdayService,
    private _weeklyService: WeeklyService
  ) {}

  setDate(date: string | null | undefined): void {
    this.selectedDate.set(date || DateHelper.toISO());
  }

  private toFiniteNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
