import { Component, OnInit, effect, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IExpense } from '@interfaces/entities/expense.interface';
import { ShiftHelper } from '@helpers/shift.helper';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import { ShiftsQuickViewComponent } from '@components/shifts/shifts-quick-view/shifts-quick-view.component';
import { ExpensesQuickViewComponent } from '@components/expenses/expenses-quick-view/expenses-quick-view.component';
import { MatDialog } from '@angular/material/dialog';
import { TripFormComponent } from '@components/trips/trip-form/trip-form.component';
import { ShiftFormComponent } from '@components/shifts/shift-form/shift-form.component';

@Component({
  selector: 'app-pending-changes',
  standalone: true,
  imports: [MatExpansionModule, MatListModule, MatButtonModule, MatIconModule, RouterModule, TripsQuickViewComponent, ShiftsQuickViewComponent, ExpensesQuickViewComponent],
  templateUrl: './pending-changes.component.html',
  styleUrls: ['./pending-changes.component.scss']
})
export class PendingChangesComponent implements OnInit {
  private unsavedService = inject(UnsavedDataService);
  private tripService = inject(TripService);
  private shiftService = inject(ShiftService);
  private expensesService = inject(ExpensesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  trips = signal<ITrip[]>([]);
  shifts = signal<IShift[]>([]);
  expenses = signal<IExpense[]>([]);
  duplicateShiftKeys = signal<Set<string>>(new Set());
  expandedShifts = signal(false);
  expandedTrips = signal(false);
  expandedExpenses = signal(false);

  private queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });
  private lastHandledSection: string | undefined;

  constructor() {
    effect(() => {
      const section = this.queryParams()['section'];
      if (section === this.lastHandledSection) {
        return;
      }

      this.lastHandledSection = section;
      this.handleSection(section);
    });
  }

  trackByShift(index: number, s: IShift): string | number {
    return s?.rowId ?? s?.key ?? index;
  }

  trackByTrip(index: number, t: ITrip): string | number {
    return t?.rowId ?? t?.key ?? index;
  }

  trackByExpense(index: number, e: IExpense): string | number {
    return e?.id ?? e?.rowId ?? index;
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private handleSection(section?: string): void {
    if (!section) return;
    if (section === 'shifts') {
      this.expandedShifts.set(true);
      this.expandedTrips.set(false);
      this.expandedExpenses.set(false);
    } else if (section === 'trips') {
      this.expandedTrips.set(true);
      this.expandedShifts.set(false);
      this.expandedExpenses.set(false);
    } else if (section === 'expenses') {
      this.expandedExpenses.set(true);
      this.expandedTrips.set(false);
      this.expandedShifts.set(false);
    }

    // Wait a tick for panels to expand/collapse, then scroll
    setTimeout(() => {
      const el = document.getElementById(`${section}-panel`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  public async load(): Promise<void> {
    try {
      this.trips.set(await this.tripService.getUnsaved());
      const unsavedShifts = await this.shiftService.getUnsavedShifts();
      this.shifts.set(unsavedShifts);
      this.duplicateShiftKeys.set(ShiftHelper.getDuplicateShiftKeys(unsavedShifts));
      this.expenses.set(await this.expensesService.getUnsaved());
    } catch {
      this.trips.set([]);
      this.shifts.set([]);
      this.expenses.set([]);
      this.duplicateShiftKeys.set(new Set());
    }
    this.applyDefaultExpansion();
  }

  /**
   * When no section was explicitly requested via query param, open the first
   * non-empty section so the page never lands on an all-collapsed accordion.
   */
  private applyDefaultExpansion(): void {
    const section = this.route.snapshot.queryParams['section'];
    if (section === 'shifts' || section === 'trips' || section === 'expenses') return;

    const hasTrips = this.trips().length > 0;
    const hasShifts = this.shifts().length > 0;
    this.expandedTrips.set(hasTrips);
    this.expandedShifts.set(!hasTrips && hasShifts);
    this.expandedExpenses.set(!hasTrips && !hasShifts && this.expenses().length > 0);
  }

  openTripEditor(t: ITrip): void {
    this.dialog
      .open(TripFormComponent, {
        width: '720px',
        maxHeight: 'calc(100vh - 96px)',
        panelClass: ['custom-modalbox', 'responsive-dialog'],
        data: { id: t.id, rowId: t.rowId }
      })
      .afterClosed()
      .subscribe(() => void this.load());
  }

  openShiftEditor(s: IShift): void {
    this.dialog
      .open(ShiftFormComponent, {
        width: '720px',
        maxHeight: 'calc(100vh - 96px)',
        panelClass: ['custom-modalbox', 'responsive-dialog'],
        data: { id: s.id, rowId: s.rowId }
      })
      .afterClosed()
      .subscribe(() => void this.load());
  }

  openExpenseEditor(e: IExpense): void {
    // Expenses are edited inline on the expenses page; open it on that row.
    this.router.navigate(['/expenses'], { queryParams: { edit: e.rowId } });
  }
}
