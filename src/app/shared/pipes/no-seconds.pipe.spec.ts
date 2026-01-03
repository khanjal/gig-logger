import { NoSecondsPipe } from './no-seconds.pipe';

describe('NoSecondsPipe', () => {
  let pipe: NoSecondsPipe;

  beforeEach(() => {
    pipe = new NoSecondsPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('24-hour format', () => {
    it('should format HH:MM:SS as HH:MM', () => {
      expect(pipe.transform('14:30:00', true)).toBe('14:30');
      expect(pipe.transform('09:15:30', true)).toBe('09:15');
    });

    it('should handle times without seconds', () => {
      expect(pipe.transform('14:30', true)).toBe('14:30');
      expect(pipe.transform('09:15', true)).toBe('09:15');
    });

    it('should convert 12-hour to 24-hour', () => {
      expect(pipe.transform('2:30 PM', true)).toBe('14:30');
      expect(pipe.transform('9:15 AM', true)).toBe('09:15');
    });

    it('should handle noon and midnight', () => {
      expect(pipe.transform('12:00 PM', true)).toBe('12:00');
      expect(pipe.transform('12:00 AM', true)).toBe('00:00');
    });

    it('should pad hours with leading zero', () => {
      expect(pipe.transform('9:30 AM', true)).toBe('09:30');
      expect(pipe.transform('5:45 AM', true)).toBe('05:45');
    });
  });

  describe('12-hour format', () => {
    it('should format HH:MM:SS as h:MM AM/PM', () => {
      expect(pipe.transform('14:30:00', false)).toBe('2:30 PM');
      expect(pipe.transform('09:15:30', false)).toBe('9:15 AM');
    });

    it('should handle times without seconds', () => {
      expect(pipe.transform('14:30', false)).toBe('2:30 PM');
      expect(pipe.transform('09:15', false)).toBe('9:15 AM');
    });

    it('should preserve 12-hour format', () => {
      expect(pipe.transform('2:30 PM', false)).toBe('2:30 PM');
      expect(pipe.transform('9:15 AM', false)).toBe('9:15 AM');
    });

    it('should handle noon and midnight', () => {
      expect(pipe.transform('12:00', false)).toBe('12:00 PM');
      expect(pipe.transform('00:00', false)).toBe('12:00 AM');
    });

    it('should remove leading zeros', () => {
      expect(pipe.transform('09:15 AM', false)).toBe('9:15 AM');
      expect(pipe.transform('08:30 AM', false)).toBe('8:30 AM');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should handle null', () => {
      expect(pipe.transform(null as any)).toBe('');
    });

    it('should handle undefined', () => {
      expect(pipe.transform(undefined as any)).toBe('');
    });

    it('should handle times with milliseconds', () => {
      expect(pipe.transform('14:30:00.000', true)).toBe('14:30');
      expect(pipe.transform('09:15:30.500', false)).toBe('9:15 AM');
    });

    it('should handle case-insensitive AM/PM', () => {
      expect(pipe.transform('2:30 pm', true)).toBe('14:30');
      expect(pipe.transform('9:15 am', true)).toBe('09:15');
    });

    it('should handle AM/PM without space', () => {
      expect(pipe.transform('2:30PM', true)).toBe('14:30');
      expect(pipe.transform('9:15AM', true)).toBe('09:15');
    });
  });

  describe('Default parameter (12-hour)', () => {
    it('should default to 12-hour format when use24Hour is omitted', () => {
      expect(pipe.transform('14:30:00')).toBe('2:30 PM');
      expect(pipe.transform('09:15:30')).toBe('9:15 AM');
    });
  });

  describe('Special times', () => {
    it('should handle start of day', () => {
      expect(pipe.transform('00:00:00', true)).toBe('00:00');
      expect(pipe.transform('00:00:00', false)).toBe('12:00 AM');
    });

    it('should handle end of day', () => {
      expect(pipe.transform('23:59:59', true)).toBe('23:59');
      expect(pipe.transform('23:59:59', false)).toBe('11:59 PM');
    });

    it('should handle 1 AM and 1 PM', () => {
      expect(pipe.transform('01:00:00', true)).toBe('01:00');
      expect(pipe.transform('01:00:00', false)).toBe('1:00 AM');
      expect(pipe.transform('13:00:00', true)).toBe('13:00');
      expect(pipe.transform('13:00:00', false)).toBe('1:00 PM');
    });
  });
});
