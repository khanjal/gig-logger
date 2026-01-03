import { ShiftCreationHelper } from './shift-creation.helper';
import { DateHelper } from '@helpers/date.helper';
import { IShift } from '@interfaces/shift.interface';

describe('ShiftCreationHelper', () => {
  describe('createDefaultShift', () => {
    it('creates a shift with provided date and generated key', () => {
      const date = '2024-05-01';
      spyOn(DateHelper, 'getDateISO').and.callThrough();
      spyOn(DateHelper, 'getDateKey').and.callThrough();

      const shift = ShiftCreationHelper.createDefaultShift(date);

      expect(shift.date).toBe(date);
      expect(shift.key).toBe(DateHelper.getDateKey(new Date(date)));
      expect(shift.saved).toBeFalse();
      expect(shift.trips).toBe(0);
    });

    it('defaults to today when no date provided', () => {
      spyOn(DateHelper, 'getDateISO').and.returnValue('2024-06-02');
      spyOn(DateHelper, 'getDateKey').and.returnValue('2024-06-02-key');

      const shift = ShiftCreationHelper.createDefaultShift();

      expect(DateHelper.getDateISO).toHaveBeenCalled();
      expect(DateHelper.getDateKey).toHaveBeenCalled();
      expect(shift.date).toBe('2024-06-02');
      expect(shift.key).toBe('2024-06-02-key');
    });
  });

  describe('isValidShift', () => {
    it('returns true when date and key are present', () => {
      const shift: IShift = { date: '2024-05-01', key: 'k', rowId: 1 } as IShift;

      expect(ShiftCreationHelper.isValidShift(shift)).toBeTrue();
    });

    it('returns false when required fields are missing', () => {
      const shift = { } as IShift;

      expect(ShiftCreationHelper.isValidShift(shift)).toBeFalse();
    });
  });

  describe('generateShiftKey', () => {
    it('delegates to DateHelper.getDateKey', () => {
      const date = new Date('2024-07-03');
      spyOn(DateHelper, 'getDateKey').and.returnValue('key-2024-07-03');

      const key = ShiftCreationHelper.generateShiftKey(date);

      expect(DateHelper.getDateKey).toHaveBeenCalledWith(date);
      expect(key).toBe('key-2024-07-03');
    });
  });
});
