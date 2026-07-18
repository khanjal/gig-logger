import { Injectable, inject } from '@angular/core';
import { merge, from } from 'rxjs';
import { switchMap, shareReplay } from 'rxjs/operators';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { IExpense } from '@interfaces/entities/expense.interface';

export interface IUnsavedItems {
  unsavedTrips: ITrip[];
  unsavedShifts: IShift[];
  unsavedExpenses: IExpense[];
}

@Injectable({ providedIn: 'root' })
export class UnsavedDataService {
  private tripService = inject(TripService);
  private shiftService = inject(ShiftService);
  private expensesService = inject(ExpensesService);


  /** Reactive stream that emits a boolean whenever any entity's unsaved state changes. */
  readonly unsavedData$ = merge(
    this.tripService.trips$,
    this.shiftService.shifts$,
    this.expensesService.expenses$
  ).pipe(
    switchMap(() => from(this.hasUnsavedData())),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  /** Fetches all three unsaved item lists in parallel as a single snapshot. */
  private async fetchUnsaved(): Promise<{ trips: ITrip[]; shifts: IShift[]; expenses: IExpense[] }> {
    const [trips, shifts, expenses] = await Promise.all([
      this.tripService.getUnsaved(),
      this.shiftService.getUnsavedShifts(),
      this.expensesService.getUnsaved()
    ]);
    return { trips, shifts, expenses };
  }

  async hasUnsavedData(): Promise<boolean> {
    const { total } = await this.getUnsavedCounts();
    return total > 0;
  }

  async getUnsavedCounts(): Promise<{ trips: number; shifts: number; expenses: number; total: number }> {
    const { trips, shifts, expenses } = await this.fetchUnsaved();
    return {
      trips: trips.length,
      shifts: shifts.length,
      expenses: expenses.length,
      total: trips.length + shifts.length + expenses.length
    };
  }

  async collectUnsavedItems(): Promise<IUnsavedItems> {
    const { trips, shifts, expenses } = await this.fetchUnsaved();
    return { unsavedTrips: trips, unsavedShifts: shifts, unsavedExpenses: expenses };
  }

  /**
   * Marks the items that were included in a completed save cycle as saved,
   * using the save-start timestamp and synced-ID sets to protect any records
   * that were edited after the save payload was collected.
   */
  async commitSavedItems(
    saveStartedAt: number,
    syncedTripIds: ReadonlySet<number>,
    syncedShiftIds: ReadonlySet<number>,
    syncedExpenseIds: ReadonlySet<number>
  ): Promise<void> {
    await Promise.all([
      this.tripService.saveUnsaved(saveStartedAt, syncedTripIds),
      this.shiftService.saveUnsavedShifts(saveStartedAt, syncedShiftIds),
      this.expensesService.saveUnsaved(saveStartedAt, syncedExpenseIds)
    ]);
  }
}
