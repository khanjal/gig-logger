import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import { PendingChangesComponent } from './pending-changes.component';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IExpense } from '@interfaces/entities/expense.interface';

describe('PendingChangesComponent', () => {
  let tripService: jasmine.SpyObj<TripService>;
  let shiftService: jasmine.SpyObj<ShiftService>;
  let expensesService: jasmine.SpyObj<ExpensesService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let queryParams$: BehaviorSubject<Record<string, string>>;
  let routeSnapshotQueryParams: Record<string, string>;

  function createComponent(): PendingChangesComponent {
    queryParams$ = new BehaviorSubject<Record<string, string>>({});
    routeSnapshotQueryParams = {};

    TestBed.configureTestingModule({
      providers: [
        { provide: TripService, useValue: tripService },
        { provide: ShiftService, useValue: shiftService },
        { provide: ExpensesService, useValue: expensesService },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable(),
            get snapshot() {
              return { queryParams: routeSnapshotQueryParams };
            }
          }
        }
      ]
    });

    return TestBed.runInInjectionContext(() => new PendingChangesComponent());
  }

  beforeEach(() => {
    tripService = jasmine.createSpyObj<TripService>('TripService', ['getUnsaved']);
    shiftService = jasmine.createSpyObj<ShiftService>('ShiftService', ['getUnsavedShifts']);
    expensesService = jasmine.createSpyObj<ExpensesService>('ExpensesService', ['getUnsaved']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    tripService.getUnsaved.and.returnValue(Promise.resolve([]));
    shiftService.getUnsavedShifts.and.returnValue(Promise.resolve([]));
    expensesService.getUnsaved.and.returnValue(Promise.resolve([]));
  });

  it('should be created', () => {
    const comp = createComponent();
    expect(comp).toBeTruthy();
  });

  describe('load', () => {
    it('populates trips, shifts, and expenses from services', async () => {
      const trips = [{ id: 1, rowId: 1 } as ITrip];
      const shifts = [{ id: 2, rowId: 2, key: 'k1' } as IShift];
      const expenses = [{ id: 3, rowId: 3 } as IExpense];
      tripService.getUnsaved.and.returnValue(Promise.resolve(trips));
      shiftService.getUnsavedShifts.and.returnValue(Promise.resolve(shifts));
      expensesService.getUnsaved.and.returnValue(Promise.resolve(expenses));

      const comp = createComponent();
      await comp.load();

      expect(comp.trips()).toEqual(trips);
      expect(comp.shifts()).toEqual(shifts);
      expect(comp.expenses()).toEqual(expenses);
    });

    it('clears all lists when a service call throws', async () => {
      tripService.getUnsaved.and.returnValue(Promise.reject(new Error('fail')));

      const comp = createComponent();
      await comp.load();

      expect(comp.trips()).toEqual([]);
      expect(comp.shifts()).toEqual([]);
      expect(comp.expenses()).toEqual([]);
      expect(comp.duplicateShiftKeys().size).toBe(0);
    });

    it('flags duplicate shift keys', async () => {
      const shifts = [
        { id: 1, rowId: 1, key: 'dup' } as IShift,
        { id: 2, rowId: 2, key: 'dup' } as IShift
      ];
      shiftService.getUnsavedShifts.and.returnValue(Promise.resolve(shifts));

      const comp = createComponent();
      await comp.load();

      expect(comp.duplicateShiftKeys().has('dup')).toBeTrue();
    });
  });

  describe('sections / visibleSections / hasAnyPending', () => {
    it('reports zero counts and no pending sections when everything is empty', () => {
      const comp = createComponent();

      expect(comp.hasAnyPending()).toBeFalse();
      expect(comp.visibleSections()).toEqual([]);
      expect(comp.sections().every(s => s.count === 0)).toBeTrue();
    });

    it('only includes non-empty sections in visibleSections', async () => {
      tripService.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as ITrip]));

      const comp = createComponent();
      await comp.load();

      expect(comp.hasAnyPending()).toBeTrue();
      expect(comp.visibleSections().map(s => s.key)).toEqual(['trips']);
    });
  });

  describe('toggleFilter / isFilterActive', () => {
    it('excludes a section once toggled off', () => {
      const comp = createComponent();

      expect(comp.isFilterActive('trips')).toBeTrue();
      comp.toggleFilter('trips');
      expect(comp.isFilterActive('trips')).toBeFalse();
    });

    it('resets to showing all sections once the last active filter is toggled off', () => {
      const comp = createComponent();

      comp.toggleFilter('trips');
      comp.toggleFilter('shifts');
      comp.toggleFilter('expenses');

      expect(comp.isFilterActive('trips')).toBeTrue();
      expect(comp.isFilterActive('shifts')).toBeTrue();
      expect(comp.isFilterActive('expenses')).toBeTrue();
    });

    it('hides a populated section from visibleSections once filtered out', async () => {
      tripService.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as ITrip]));
      shiftService.getUnsavedShifts.and.returnValue(Promise.resolve([{ id: 2, rowId: 2 } as IShift]));

      const comp = createComponent();
      await comp.load();
      comp.toggleFilter('trips');

      expect(comp.visibleSections().map(s => s.key)).toEqual(['shifts']);
    });
  });

  describe('query-param section routing', () => {
    it('expands the requested section when the query param changes', () => {
      const comp = createComponent();

      queryParams$.next({ section: 'shifts' });
      TestBed.flushEffects();

      expect(comp.expandedSection()).toBe('shifts');
    });

    it('ignores an unrecognized section value', () => {
      const comp = createComponent();

      queryParams$.next({ section: 'bogus' });
      TestBed.flushEffects();

      expect(comp.expandedSection()).toBeNull();
    });
  });

  describe('applyDefaultExpansion (via load)', () => {
    it('expands the first non-empty section when no section query param is present', async () => {
      shiftService.getUnsavedShifts.and.returnValue(Promise.resolve([{ id: 1, rowId: 1 } as IShift]));
      expensesService.getUnsaved.and.returnValue(Promise.resolve([{ id: 2, rowId: 2 } as IExpense]));

      const comp = createComponent();
      await comp.load();

      expect(comp.expandedSection()).toBe('shifts');
    });

    it('leaves expandedSection null when nothing is pending', async () => {
      const comp = createComponent();
      await comp.load();

      expect(comp.expandedSection()).toBeNull();
    });

    it('does not override an explicit section query param', async () => {
      routeSnapshotQueryParams = { section: 'expenses' };
      expensesService.getUnsaved.and.returnValue(Promise.resolve([{ id: 1, rowId: 1 } as IExpense]));

      const comp = createComponent();
      comp.expandedSection.set('expenses');
      await comp.load();

      expect(comp.expandedSection()).toBe('expenses');
    });
  });

  describe('openTripEditor', () => {
    it('opens the trip form dialog and reloads on close', async () => {
      const afterClosed$ = of(undefined);
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosed$ } as unknown as ReturnType<MatDialog['open']>);
      const comp = createComponent();
      spyOn(comp, 'load').and.returnValue(Promise.resolve());

      comp.openTripEditor({ id: 1, rowId: 1 } as ITrip);

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(comp.load).toHaveBeenCalled();
    });
  });

  describe('openShiftEditor', () => {
    it('opens the shift form dialog and reloads on close', async () => {
      const afterClosed$ = of(undefined);
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosed$ } as unknown as ReturnType<MatDialog['open']>);
      const comp = createComponent();
      spyOn(comp, 'load').and.returnValue(Promise.resolve());

      comp.openShiftEditor({ id: 1, rowId: 1 } as IShift);

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(comp.load).toHaveBeenCalled();
    });
  });

  describe('openExpenseEditor', () => {
    it('navigates to the expenses page with the row queued for edit', () => {
      const comp = createComponent();

      comp.openExpenseEditor({ id: 1, rowId: 42 } as IExpense);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/expenses'], { queryParams: { edit: 42 } });
    });
  });

  describe('trackBy helpers', () => {
    it('trackBySection returns the section key', () => {
      const comp = createComponent();
      expect(comp.trackBySection(0, { key: 'trips', label: 'Trips', count: 1 })).toBe('trips');
    });

    it('trackByShift returns rowId when present', () => {
      const comp = createComponent();
      expect(comp.trackByShift(0, { rowId: 42 } as IShift)).toBe(42);
    });

    it('trackByShift returns key when rowId absent', () => {
      const comp = createComponent();
      expect(comp.trackByShift(1, { key: 'k1' } as IShift)).toBe('k1');
    });

    it('trackByShift falls back to index', () => {
      const comp = createComponent();
      expect(comp.trackByShift(7, {} as IShift)).toBe(7);
    });

    it('trackByTrip returns rowId when present', () => {
      const comp = createComponent();
      expect(comp.trackByTrip(0, { rowId: 100 } as ITrip)).toBe(100);
    });

    it('trackByTrip returns key when rowId absent', () => {
      const comp = createComponent();
      expect(comp.trackByTrip(2, { key: 'trip-key' } as ITrip)).toBe('trip-key');
    });

    it('trackByTrip falls back to index', () => {
      const comp = createComponent();
      expect(comp.trackByTrip(9, {} as ITrip)).toBe(9);
    });

    it('trackByExpense returns id when present', () => {
      const comp = createComponent();
      expect(comp.trackByExpense(0, { id: 5 } as IExpense)).toBe(5);
    });

    it('trackByExpense falls back to index', () => {
      const comp = createComponent();
      expect(comp.trackByExpense(3, {} as IExpense)).toBe(3);
    });
  });
});
