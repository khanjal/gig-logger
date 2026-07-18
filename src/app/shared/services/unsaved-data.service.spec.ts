import { TestBed } from '@angular/core/testing';
import { UnsavedDataService } from './unsaved-data.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { IExpense } from '@interfaces/entities/expense.interface';

describe('UnsavedDataService', () => {
  let service: UnsavedDataService;
  let tripServiceSpy: jasmine.SpyObj<TripService>;
  let shiftServiceSpy: jasmine.SpyObj<ShiftService>;
  let expensesServiceSpy: jasmine.SpyObj<ExpensesService>;

  beforeEach(() => {
    const tripSpy = jasmine.createSpyObj('TripService', ['getUnsaved', 'saveUnsaved']);
    const shiftSpy = jasmine.createSpyObj('ShiftService', ['getUnsavedShifts', 'saveUnsavedShifts']);
    const expensesSpy = jasmine.createSpyObj('ExpensesService', ['getUnsaved', 'saveUnsaved']);

    TestBed.configureTestingModule({
      providers: [
        UnsavedDataService,
        { provide: TripService, useValue: tripSpy },
        { provide: ShiftService, useValue: shiftSpy },
        { provide: ExpensesService, useValue: expensesSpy }
      ]
    });

    service = TestBed.inject(UnsavedDataService);
    tripServiceSpy = TestBed.inject(TripService) as jasmine.SpyObj<TripService>;
    shiftServiceSpy = TestBed.inject(ShiftService) as jasmine.SpyObj<ShiftService>;
    expensesServiceSpy = TestBed.inject(ExpensesService) as jasmine.SpyObj<ExpensesService>;
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('hasUnsavedData', () => {
    it('should return false when all services have no unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(false);
      expect(tripServiceSpy.getUnsaved).toHaveBeenCalled();
      expect(shiftServiceSpy.getUnsavedShifts).toHaveBeenCalled();
      expect(expensesServiceSpy.getUnsaved).toHaveBeenCalled();
    });

    it('should return true when trips have unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as unknown as ITrip]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(true);
    });

    it('should return true when shifts have unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([{ id: 1 } as unknown as IShift]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(true);
    });

    it('should return true when expenses have unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as unknown as IExpense]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(true);
    });

    it('should return true when multiple services have unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as unknown as ITrip, { id: 2 } as unknown as ITrip]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([{ id: 1 } as unknown as IShift]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(true);
    });

    it('should call all services in parallel', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      await service.hasUnsavedData();

      // All should be called (Promise.all pattern)
      expect(tripServiceSpy.getUnsaved).toHaveBeenCalledTimes(1);
      expect(shiftServiceSpy.getUnsavedShifts).toHaveBeenCalledTimes(1);
      expect(expensesServiceSpy.getUnsaved).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUnsavedCounts', () => {
    it('should return zero counts when no unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.getUnsavedCounts();

      expect(result).toEqual({
        trips: 0,
        shifts: 0,
        expenses: 0,
        total: 0
      });
    });

    it('should return correct counts for trips only', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([
        { id: 1 } as unknown as ITrip,
        { id: 2 } as unknown as ITrip,
        { id: 3 } as unknown as ITrip
      ]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.getUnsavedCounts();

      expect(result).toEqual({
        trips: 3,
        shifts: 0,
        expenses: 0,
        total: 3
      });
    });

    it('should return correct counts for shifts only', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([
        { id: 1 } as unknown as IShift,
        { id: 2 } as unknown as IShift
      ]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.getUnsavedCounts();

      expect(result).toEqual({
        trips: 0,
        shifts: 2,
        expenses: 0,
        total: 2
      });
    });

    it('should return correct counts for expenses only', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as unknown as IExpense]));

      const result = await service.getUnsavedCounts();

      expect(result).toEqual({
        trips: 0,
        shifts: 0,
        expenses: 1,
        total: 1
      });
    });

    it('should return correct total count for mixed unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([
        { id: 1 } as unknown as ITrip,
        { id: 2 } as unknown as ITrip
      ]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([
        { id: 1 } as unknown as IShift
      ]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([
        { id: 1 } as unknown as IExpense,
        { id: 2 } as unknown as IExpense,
        { id: 3 } as unknown as IExpense
      ]));

      const result = await service.getUnsavedCounts();

      expect(result).toEqual({
        trips: 2,
        shifts: 1,
        expenses: 3,
        total: 6
      });
    });

    it('should call all services in parallel', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      await service.getUnsavedCounts();

      expect(tripServiceSpy.getUnsaved).toHaveBeenCalledTimes(1);
      expect(shiftServiceSpy.getUnsavedShifts).toHaveBeenCalledTimes(1);
      expect(expensesServiceSpy.getUnsaved).toHaveBeenCalledTimes(1);
    });
  });

  describe('collectUnsavedItems', () => {
    it('should return all three unsaved lists in a single call', async () => {
      const mockTrips = [{ id: 1 }] as unknown as ITrip[];
      const mockShifts = [{ id: 2 }] as unknown as IShift[];
      const mockExpenses = [{ id: 3 }] as unknown as IExpense[];
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve(mockTrips));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve(mockShifts));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve(mockExpenses));

      const result = await service.collectUnsavedItems();

      expect(result.unsavedTrips).toEqual(mockTrips);
      expect(result.unsavedShifts).toEqual(mockShifts);
      expect(result.unsavedExpenses).toEqual(mockExpenses);
    });

    it('should return empty arrays when nothing is unsaved', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.collectUnsavedItems();

      expect(result.unsavedTrips).toEqual([]);
      expect(result.unsavedShifts).toEqual([]);
      expect(result.unsavedExpenses).toEqual([]);
    });
  });

  describe('commitSavedItems', () => {
    it('should forward saveStartedAt and syncedIds to each domain service', async () => {
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.resolve());
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      const ts = 1000;
      const tripIds = new Set([1, 2]);
      const shiftIds = new Set([3]);
      const expenseIds = new Set<number>();

      await service.commitSavedItems(ts, tripIds, shiftIds, expenseIds);

      expect(tripServiceSpy.saveUnsaved).toHaveBeenCalledWith(ts, tripIds);
      expect(shiftServiceSpy.saveUnsavedShifts).toHaveBeenCalledWith(ts, shiftIds);
      expect(expensesServiceSpy.saveUnsaved).toHaveBeenCalledWith(ts, expenseIds);
    });

    it('should run all three commits in parallel', async () => {
      let tripResolved = false;
      let shiftResolved = false;
      let expensesResolved = false;

      tripServiceSpy.saveUnsaved.and.returnValue(
        new Promise<void>(resolve => setTimeout(() => { tripResolved = true; resolve(); }, 10))
      );
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(
        new Promise<void>(resolve => setTimeout(() => { shiftResolved = true; resolve(); }, 10))
      );
      expensesServiceSpy.saveUnsaved.and.returnValue(
        new Promise<void>(resolve => setTimeout(() => { expensesResolved = true; resolve(); }, 10))
      );

      await service.commitSavedItems(Date.now(), new Set(), new Set(), new Set());

      expect(tripResolved).toBe(true);
      expect(shiftResolved).toBe(true);
      expect(expensesResolved).toBe(true);
    });

    it('should propagate errors from any domain service', async () => {
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.reject(new Error('Trip commit failed')));
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.resolve());
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      await expectAsync(
        service.commitSavedItems(Date.now(), new Set(), new Set(), new Set())
      ).toBeRejectedWithError('Trip commit failed');
    });
  });

  describe('Integration Scenarios', () => {
    it('should detect unsaved data and get counts consistently', async () => {
      const mockTrips = [{ id: 1 }, { id: 2 }] as unknown as ITrip[];
      const mockShifts = [{ id: 1 }] as unknown as IShift[];
      const mockExpenses: IExpense[] = [];

      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve(mockTrips));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve(mockShifts));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve(mockExpenses));

      const hasUnsaved = await service.hasUnsavedData();
      const counts = await service.getUnsavedCounts();

      expect(hasUnsaved).toBe(true);
      expect(counts.total).toBe(3);
    });

    it('should commit saved items after detecting unsaved data', async () => {
      const mockTrips = [{ id: 1 }] as unknown as ITrip[];
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve(mockTrips));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.resolve());
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      const { unsavedTrips, unsavedShifts, unsavedExpenses } = await service.collectUnsavedItems();
      const ts = Date.now();
      const tripIds = new Set(unsavedTrips.map((t: ITrip) => t.id as number));
      const shiftIds = new Set(unsavedShifts.map((s: IShift) => s.id as number));
      const expenseIds = new Set(unsavedExpenses.map((e: IExpense) => e.id as number));

      await service.commitSavedItems(ts, tripIds, shiftIds, expenseIds);

      expect(tripServiceSpy.saveUnsaved).toHaveBeenCalledWith(ts, tripIds);
      expect(shiftServiceSpy.saveUnsavedShifts).toHaveBeenCalledWith(ts, shiftIds);
      expect(expensesServiceSpy.saveUnsaved).toHaveBeenCalledWith(ts, expenseIds);
    });
  });
});
