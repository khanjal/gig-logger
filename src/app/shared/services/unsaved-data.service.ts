import { Injectable } from '@angular/core';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { ExpensesService } from '@services/sheets/expenses.service';

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

  async markAllAsSaved(): Promise<void> {
    await Promise.all([
      this.tripService.saveUnsaved(),
      this.shiftService.saveUnsavedShifts(),
      this.expensesService.saveUnsaved()
    ]);
  }
}
