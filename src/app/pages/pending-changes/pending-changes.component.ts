import { Component, OnInit, effect, signal, computed, inject } from '@angular/core';
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
import { BaseRectButtonComponent } from '@components/base';

/** A pending-changes entity type. Add a new one here, to `SECTION_LABELS`, and to `itemsFor()`. */
type PendingSectionKey = 'trips' | 'shifts' | 'expenses';

interface IPendingSection {
  key: PendingSectionKey;
  label: string;
  count: number;
}

const SECTION_KEYS: PendingSectionKey[] = ['trips', 'shifts', 'expenses'];
const SECTION_LABELS: Record<PendingSectionKey, string> = {
  trips: 'Trips',
  shifts: 'Shifts',
  expenses: 'Expenses'
};

@Component({
  selector: 'app-pending-changes',
  standalone: true,
  imports: [MatExpansionModule, MatListModule, MatButtonModule, MatIconModule, RouterModule, TripsQuickViewComponent, ShiftsQuickViewComponent, ExpensesQuickViewComponent, BaseRectButtonComponent],
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

  /** Which single section is currently expanded (accordion is single-select). */
  expandedSection = signal<PendingSectionKey | null>(null);
  /** Which section types are visible; empty means "show all". */
  private typeFilter = signal<Set<PendingSectionKey>>(new Set(SECTION_KEYS));

  sections = computed<IPendingSection[]>(() =>
    SECTION_KEYS.map(key => ({ key, label: SECTION_LABELS[key], count: this.itemsFor(key).length }))
  );

  visibleSections = computed(() =>
    this.sections().filter(section => section.count > 0 && this.typeFilter().has(section.key))
  );

  hasAnyPending = computed(() => this.sections().some(section => section.count > 0));

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

  trackBySection(index: number, section: IPendingSection): PendingSectionKey {
    return section.key;
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

  itemsFor(key: PendingSectionKey): (ITrip | IShift | IExpense)[] {
    switch (key) {
      case 'trips':
        return this.trips();
      case 'shifts':
        return this.shifts();
      case 'expenses':
        return this.expenses();
    }
  }

  isFilterActive(key: PendingSectionKey): boolean {
    return this.typeFilter().has(key);
  }

  toggleFilter(key: PendingSectionKey): void {
    const next = new Set(this.typeFilter());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    // Never leave the filter empty - that reads as "nothing pending" when it isn't.
    this.typeFilter.set(next.size > 0 ? next : new Set(SECTION_KEYS));
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private isSectionKey(value: string | undefined): value is PendingSectionKey {
    return !!value && (SECTION_KEYS as string[]).includes(value);
  }

  private handleSection(section?: string): void {
    if (!this.isSectionKey(section)) return;

    this.expandedSection.set(section);

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
    if (this.isSectionKey(section)) return;

    this.expandedSection.set(this.sections().find(s => s.count > 0)?.key ?? null);
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
