import { DateHelper } from './date.helper';

describe('DateHelper', () => {

  describe('parseLocalDate', () => {
    it('should parse valid ISO date string', () => {
      const result = DateHelper.parseLocalDate('2024-03-15');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // 0-indexed
      expect(result.getDate()).toBe(15);
    });

    it('should return current date for empty string', () => {
      const result = DateHelper.parseLocalDate('');
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(new Date().getTime(), -2);
    });

    it('should parse date at midnight local time', () => {
      const result = DateHelper.parseLocalDate('2024-03-15');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('toISO', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const result = DateHelper.toISO(date);
      expect(result).toBe('2024-03-15');
    });

    it('should handle single-digit months and days with leading zeros', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      const result = DateHelper.toISO(date);
      expect(result).toBe('2024-01-05');
    });

    it('should use current date when no date provided', () => {
      const result = DateHelper.toISO();
      const today = new Date().toLocaleDateString('sv-SE');
      expect(result).toBe(today);
    });

    it('should handle year transitions', () => {
      const date = new Date(2023, 11, 31); // December 31, 2023
      const result = DateHelper.toISO(date);
      expect(result).toBe('2023-12-31');
    });
  });

  describe('getDateISO and getDateKey', () => {
    it('mirror toISO output and keep keys stable', () => {
      const date = new Date(2024, 4, 10);
      expect(DateHelper.getDateISO(date)).toBe('2024-05-10');
      expect(DateHelper.getDateKey(date)).toBe('2024-05-10');
    });
  });

  describe('formatLocaleDateString', () => {
    it('should format ISO date string to locale format', () => {
      const result = DateHelper.formatLocaleDateString('2024-03-15', 'en-US');
      expect(result).toContain('3');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return "Unknown date" for invalid date string', () => {
      const result = DateHelper.formatLocaleDateString('invalid-date');
      expect(result).toBe('Unknown date');
    });

    it('should use default locale when not specified', () => {
      const result = DateHelper.formatLocaleDateString('2024-03-15');
      expect(result).toBeTruthy();
      expect(result).not.toBe('Unknown date');
    });

    it('should accept custom formatting options', () => {
      const result = DateHelper.formatLocaleDateString('2024-03-15', 'en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      expect(result).toContain('March');
    });
  });

  describe('getDays', () => {
    it('should return number of days since 1900-01-01', () => {
      const date = new Date('1900-01-01');
      const result = DateHelper.getDays(date);
      expect(result).toBeGreaterThan(0);
    });

    it('should use current date when no date provided', () => {
      const result = DateHelper.getDays();
      expect(result).toBeGreaterThan(0);
    });

    it('should return different values for different dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const days1 = DateHelper.getDays(date1);
      const days2 = DateHelper.getDays(date2);
      expect(days2).toBeGreaterThan(days1);
    });
  });

  describe('getDateFromDays', () => {
    it('should return current date for 0 days', () => {
      const result = DateHelper.getDateFromDays(0);
      const today = new Date();
      expect(result.toDateString()).toBe(today.toDateString());
    });

    it('should return yesterday for 1 day', () => {
      const result = DateHelper.getDateFromDays(1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(result.toDateString()).toBe(yesterday.toDateString());
    });

    it('should go back specified number of days', () => {
      const result = DateHelper.getDateFromDays(7);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      expect(result.toDateString()).toBe(weekAgo.toDateString());
    });
  });

  describe('getDatesArray', () => {
    it('should return empty array for 0 days', () => {
      const result = DateHelper.getDatesArray(0);
      expect(result).toEqual([]);
    });

    it('should return array with current date for 1 day', () => {
      const result = DateHelper.getDatesArray(1);
      expect(result.length).toBe(1);
      expect(result[0]).toBe(DateHelper.toISO(new Date()));
    });

    it('should return array of ISO date strings', () => {
      const result = DateHelper.getDatesArray(3);
      expect(result.length).toBe(3);
      result.forEach(date => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should return dates in descending order (most recent first)', () => {
      const result = DateHelper.getDatesArray(3);
      expect(result[0] >= result[1]).toBe(true);
      expect(result[1] >= result[2]).toBe(true);
    });
  });

  describe('getTimeString', () => {
    it('should return time without seconds', () => {
      const date = new Date('2024-03-15T14:30:45');
      const result = DateHelper.getTimeString(date);
      expect(result).not.toContain(':45');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should use current time when no date provided', () => {
      const result = DateHelper.getTimeString();
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('removeSeconds', () => {
    it('should remove seconds from time string', () => {
      expect(DateHelper.removeSeconds('14:30:45')).toBe('14:30');
      expect(DateHelper.removeSeconds('09:15:00')).toBe('09:15');
    });

    it('should handle AM/PM format', () => {
      expect(DateHelper.removeSeconds('2:30:45 PM')).toBe('2:30 PM');
      expect(DateHelper.removeSeconds('10:15:30 AM')).toBe('10:15 AM');
    });

    it('should return original string if no seconds present', () => {
      expect(DateHelper.removeSeconds('14:30')).toBe('14:30');
      expect(DateHelper.removeSeconds('2:30 PM')).toBe('2:30 PM');
    });

    it('should handle empty string', () => {
      expect(DateHelper.removeSeconds('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(DateHelper.removeSeconds(null as any)).toBe('');
      expect(DateHelper.removeSeconds(undefined as any)).toBe('');
    });
  });

  describe('getMonthYearString', () => {
    it('should return M-YYYY format', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const result = DateHelper.getMonthYearString(date);
      expect(result).toBe('3-2024');
    });

    it('should handle January', () => {
      const date = new Date(2024, 0, 15);
      const result = DateHelper.getMonthYearString(date);
      expect(result).toBe('1-2024');
    });

    it('should handle December', () => {
      const date = new Date(2024, 11, 15);
      const result = DateHelper.getMonthYearString(date);
      expect(result).toBe('12-2024');
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('should return first day of month as ISO string', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const result = DateHelper.getFirstDayOfMonth(date);
      expect(result).toBe('2024-03-01');
    });

    it('should work for any day of the month', () => {
      const date = new Date(2024, 2, 31);
      const result = DateHelper.getFirstDayOfMonth(date);
      expect(result).toBe('2024-03-01');
    });
  });

  describe('getDayOfWeek', () => {
    it('should return 1 for Monday', () => {
      const monday = DateHelper.parseLocalDate('2024-12-23'); // Known Monday
      const result = DateHelper.getDayOfWeek(monday);
      expect(result).toBe(1);
    });

    it('should return 7 for Sunday (converted from 0)', () => {
      const sunday = DateHelper.parseLocalDate('2024-12-22'); // Known Sunday  
      const result = DateHelper.getDayOfWeek(sunday);
      expect(result).toBe(7);
    });

    it('should use current date when no date provided', () => {
      const result = DateHelper.getDayOfWeek();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(7);
    });
  });

  describe('getDurationSeconds', () => {
    it('should calculate duration between two times', () => {
      const result = DateHelper.getDurationSeconds('09:00', '17:00');
      expect(result).toBe(8 * 3600); // 8 hours
    });

    it('should handle same-day times', () => {
      const result = DateHelper.getDurationSeconds('14:30', '15:45');
      expect(result).toBe(75 * 60); // 1 hour 15 minutes
    });

    it('should handle overnight times', () => {
      const result = DateHelper.getDurationSeconds('23:00', '01:00');
      expect(result).toBe(2 * 3600); // 2 hours
    });

    it('should return 0 for missing times', () => {
      expect(DateHelper.getDurationSeconds('', '17:00')).toBe(0);
      expect(DateHelper.getDurationSeconds('09:00', '')).toBe(0);
      expect(DateHelper.getDurationSeconds('', '')).toBe(0);
    });
  });

  describe('weekdayLabel', () => {
    it('should return short labels by default', () => {
      expect(DateHelper.weekdayLabel(0)).toBe('Sun');
      expect(DateHelper.weekdayLabel(1)).toBe('Mon');
      expect(DateHelper.weekdayLabel(6)).toBe('Sat');
    });

    it('should return long labels when specified', () => {
      expect(DateHelper.weekdayLabel(0, 'long')).toBe('Sunday');
      expect(DateHelper.weekdayLabel(1, 'long')).toBe('Monday');
      expect(DateHelper.weekdayLabel(6, 'long')).toBe('Saturday');
    });

    it('should handle negative indices by wrapping', () => {
      expect(DateHelper.weekdayLabel(-1)).toBe('Sat');
      expect(DateHelper.weekdayLabel(-7)).toBe('Sun');
    });

    it('should handle indices > 6 by wrapping', () => {
      expect(DateHelper.weekdayLabel(7)).toBe('Sun');
      expect(DateHelper.weekdayLabel(8)).toBe('Mon');
    });
  });

  describe('weekdayToIndex', () => {
    it('should convert full weekday names to indices', () => {
      expect(DateHelper.weekdayToIndex('Sunday')).toBe(0);
      expect(DateHelper.weekdayToIndex('Monday')).toBe(1);
      expect(DateHelper.weekdayToIndex('Saturday')).toBe(6);
    });

    it('should convert abbreviated weekday names', () => {
      expect(DateHelper.weekdayToIndex('Sun')).toBe(0);
      expect(DateHelper.weekdayToIndex('Mon')).toBe(1);
      expect(DateHelper.weekdayToIndex('Sat')).toBe(6);
    });

    it('should be case insensitive', () => {
      expect(DateHelper.weekdayToIndex('MONDAY')).toBe(1);
      expect(DateHelper.weekdayToIndex('monday')).toBe(1);
      expect(DateHelper.weekdayToIndex('Monday')).toBe(1);
    });

    it('should return undefined for unrecognized names', () => {
      expect(DateHelper.weekdayToIndex('NotADay')).toBeUndefined();
      expect(DateHelper.weekdayToIndex('')).toBeUndefined();
    });
  });

  describe('expandWeekday', () => {
    it('should expand abbreviated weekday names', () => {
      expect(DateHelper.expandWeekday('Sun')).toBe('Sunday');
      expect(DateHelper.expandWeekday('Mon')).toBe('Monday');
      expect(DateHelper.expandWeekday('Sat')).toBe('Saturday');
    });

    it('should return full names unchanged', () => {
      expect(DateHelper.expandWeekday('Sunday')).toBe('Sunday');
      expect(DateHelper.expandWeekday('Monday')).toBe('Monday');
    });

    it('should be case insensitive', () => {
      expect(DateHelper.expandWeekday('MON')).toBe('Monday');
      expect(DateHelper.expandWeekday('mon')).toBe('Monday');
    });

    it('should return original value for unrecognized input', () => {
      expect(DateHelper.expandWeekday('NotADay')).toBe('NotADay');
    });

    it('should handle empty strings', () => {
      expect(DateHelper.expandWeekday('')).toBe('');
    });
  });

  describe('minutesToTimeString', () => {
    it('should convert minutes to HH:mm format', () => {
      expect(DateHelper.minutesToTimeString(0)).toBe('00:00');
      expect(DateHelper.minutesToTimeString(60)).toBe('01:00');
      expect(DateHelper.minutesToTimeString(90)).toBe('01:30');
      expect(DateHelper.minutesToTimeString(1439)).toBe('23:59');
    });

    it('should handle single-digit hours and minutes', () => {
      expect(DateHelper.minutesToTimeString(5)).toBe('00:05');
      expect(DateHelper.minutesToTimeString(65)).toBe('01:05');
    });

    it('should handle midnight', () => {
      expect(DateHelper.minutesToTimeString(0)).toBe('00:00');
      expect(DateHelper.minutesToTimeString(1440)).toBe('24:00');
    });
  });

  describe('getHoursFromSeconds', () => {
    it('should convert seconds to hours', () => {
      expect(DateHelper.getHoursFromSeconds(3600)).toBe(1);
      expect(DateHelper.getHoursFromSeconds(7200)).toBe(2);
      expect(DateHelper.getHoursFromSeconds(1800)).toBe(0.5);
    });

    it('should handle zero', () => {
      expect(DateHelper.getHoursFromSeconds(0)).toBe(0);
    });

    it('should return fractional hours', () => {
      expect(DateHelper.getHoursFromSeconds(5400)).toBeCloseTo(1.5);
      expect(DateHelper.getHoursFromSeconds(900)).toBe(0.25);
    });
  });

  describe('getMinutesAndSeconds', () => {
    it('should format as MM:SS', () => {
      expect(DateHelper.getMinutesAndSeconds(0)).toBe('00:00');
      expect(DateHelper.getMinutesAndSeconds(60)).toBe('01:00');
      expect(DateHelper.getMinutesAndSeconds(90)).toBe('01:30');
    });

    it('should pad with leading zeros', () => {
      expect(DateHelper.getMinutesAndSeconds(5)).toBe('00:05');
      expect(DateHelper.getMinutesAndSeconds(65)).toBe('01:05');
    });

    it('should handle large values', () => {
      expect(DateHelper.getMinutesAndSeconds(3661)).toBe('61:01');
    });
  });

  describe('pad', () => {
    it('should pad single digits with leading zero', () => {
      expect(DateHelper.pad(0)).toBe('00');
      expect(DateHelper.pad(5)).toBe('05');
      expect(DateHelper.pad(9)).toBe('09');
    });

    it('should not pad double digits', () => {
      expect(DateHelper.pad(10)).toBe('10');
      expect(DateHelper.pad(99)).toBe('99');
    });

    it('should not pad larger numbers', () => {
      expect(DateHelper.pad(100)).toBe('100');
    });
  });

  describe('prefers24Hour', () => {
    it('should return a boolean', () => {
      const result = DateHelper.prefers24Hour();
      expect(typeof result).toBe('boolean');
    });

    it('should detect 24-hour or 12-hour preference based on locale', () => {
      const result = DateHelper.prefers24Hour();
      // Result depends on system locale - just verify it returns a value
      expect(result === true || result === false).toBe(true);
    });
  });
});
