import { TestBed } from '@angular/core/testing';
import { UnsavedDataService } from './unsaved-data.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { ExpensesService } from '@services/sheets/expenses.service';

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
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as any]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(true);
    });

    it('should return true when shifts have unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([{ id: 1 } as any]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(true);
    });

    it('should return true when expenses have unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as any]));

      const result = await service.hasUnsavedData();

      expect(result).toBe(true);
    });

    it('should return true when multiple services have unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as any, { id: 2 } as any]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([{ id: 1 } as any]));
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
        { id: 1 } as any,
        { id: 2 } as any,
        { id: 3 } as any
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
        { id: 1 } as any,
        { id: 2 } as any
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
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as any]));

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
        { id: 1 } as any,
        { id: 2 } as any
      ]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([
        { id: 1 } as any
      ]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([
        { id: 1 } as any,
        { id: 2 } as any,
        { id: 3 } as any
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

  describe('markAllAsSaved', () => {
    it('should call saveUnsaved on all services', async () => {
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.resolve());
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      await service.markAllAsSaved();

      expect(tripServiceSpy.saveUnsaved).toHaveBeenCalled();
      expect(shiftServiceSpy.saveUnsavedShifts).toHaveBeenCalled();
      expect(expensesServiceSpy.saveUnsaved).toHaveBeenCalled();
    });

    it('should call all save methods in parallel', async () => {
      let tripResolved = false;
      let shiftResolved = false;
      let expensesResolved = false;

      tripServiceSpy.saveUnsaved.and.returnValue(
        new Promise<void>(resolve => {
          setTimeout(() => {
            tripResolved = true;
            resolve();
          }, 10);
        })
      );

      shiftServiceSpy.saveUnsavedShifts.and.returnValue(
        new Promise<void>(resolve => {
          setTimeout(() => {
            shiftResolved = true;
            resolve();
          }, 10);
        })
      );

      expensesServiceSpy.saveUnsaved.and.returnValue(
        new Promise<void>(resolve => {
          setTimeout(() => {
            expensesResolved = true;
            resolve();
          }, 10);
        })
      );

      await service.markAllAsSaved();

      expect(tripResolved).toBe(true);
      expect(shiftResolved).toBe(true);
      expect(expensesResolved).toBe(true);
    });

    it('should handle errors from trip service', async () => {
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.reject(new Error('Trip save failed')));
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.resolve());
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      try {
        await service.markAllAsSaved();
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Trip save failed');
      }
    });

    it('should handle errors from shift service', async () => {
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.reject(new Error('Shift save failed')));
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      try {
        await service.markAllAsSaved();
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Shift save failed');
      }
    });

    it('should complete successfully when all saves succeed', async () => {
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.resolve());
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      await expectAsync(service.markAllAsSaved()).toBeResolved();
    });
  });

  describe('Integration Scenarios', () => {
    it('should detect unsaved data and get counts consistently', async () => {
      const mockTrips = [{ id: 1 }, { id: 2 }] as any[];
      const mockShifts = [{ id: 1 }] as any[];
      const mockExpenses = [] as any[];

      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve(mockTrips));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve(mockShifts));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve(mockExpenses));

      const hasUnsaved = await service.hasUnsavedData();
      const counts = await service.getUnsavedCounts();

      expect(hasUnsaved).toBe(true);
      expect(counts.total).toBe(3);
    });

    it('should mark all as saved after detecting unsaved data', async () => {
      tripServiceSpy.getUnsaved.and.returnValue(Promise.resolve([{ id: 1 } as any]));
      shiftServiceSpy.getUnsavedShifts.and.returnValue(Promise.resolve([]));
      expensesServiceSpy.getUnsaved.and.returnValue(Promise.resolve([]));
      tripServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());
      shiftServiceSpy.saveUnsavedShifts.and.returnValue(Promise.resolve());
      expensesServiceSpy.saveUnsaved.and.returnValue(Promise.resolve());

      const hasUnsaved = await service.hasUnsavedData();
      expect(hasUnsaved).toBe(true);

      await service.markAllAsSaved();

      expect(tripServiceSpy.saveUnsaved).toHaveBeenCalled();
      expect(shiftServiceSpy.saveUnsavedShifts).toHaveBeenCalled();
      expect(expensesServiceSpy.saveUnsaved).toHaveBeenCalled();
    });
  });
});
