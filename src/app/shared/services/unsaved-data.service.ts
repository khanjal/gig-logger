import { Injectable } from '@angular/core';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import type { ITrip } from '@interfaces/trip.interface';
import type { IShift } from '@interfaces/shift.interface';
import type { IExpense } from '@interfaces/expense.interface';

export interface IUnsavedItems {
  unsavedTrips: ITrip[];
  unsavedShifts: IShift[];
  unsavedExpenses: IExpense[];
}

@Injectable({ providedIn: 'root' })
export class UnsavedDataService {
  constructor(
    private tripService: TripService,
    private shiftService: ShiftService,
    private expensesService: ExpensesService
  ) {}

  async hasUnsavedData(): Promise<boolean> {
    const [trips, shifts, expenses] = await Promise.all([
      this.tripService.getUnsaved(),
      this.shiftService.getUnsavedShifts(),
      this.expensesService.getUnsaved()
    ]);
    return trips.length > 0 || shifts.length > 0 || expenses.length > 0;
  }

  async getUnsavedCounts(): Promise<{ trips: number; shifts: number; expenses: number; total: number }> {
    const [trips, shifts, expenses] = await Promise.all([
      this.tripService.getUnsaved(),
      this.shiftService.getUnsavedShifts(),
      this.expensesService.getUnsaved()
    ]);
    return {
      trips: trips.length,
      shifts: shifts.length,
      expenses: expenses.length,
      total: trips.length + shifts.length + expenses.length
    };
  }

  /** Fetches all three unsaved item lists in parallel as a single snapshot. */
  async collectUnsavedItems(): Promise<IUnsavedItems> {
    const [unsavedTrips, unsavedShifts, unsavedExpenses] = await Promise.all([
      this.tripService.getUnsaved(),
      this.shiftService.getUnsavedShifts(),
      this.expensesService.getUnsaved()
    ]);
    return { unsavedTrips, unsavedShifts, unsavedExpenses };
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
