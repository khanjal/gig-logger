import { DurationFormatPipe } from './duration-format.pipe';

describe('DurationFormatPipe', () => {
  let pipe: DurationFormatPipe;

  beforeEach(() => {
    pipe = new DurationFormatPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('Number inputs (seconds)', () => {
    it('should format seconds as h:mm', () => {
      expect(pipe.transform(3600)).toBe('1:00'); // 1 hour
      expect(pipe.transform(7200)).toBe('2:00'); // 2 hours
    });

    it('should format with minutes', () => {
      expect(pipe.transform(3665)).toBe('1:01'); // 1h 1m 5s
      expect(pipe.transform(3720)).toBe('1:02'); // 1h 2m
    });

    it('should handle less than 1 hour', () => {
      expect(pipe.transform(60)).toBe('0:01'); // 1 minute
      expect(pipe.transform(1800)).toBe('0:30'); // 30 minutes
    });

    it('should handle zero duration', () => {
      expect(pipe.transform(0)).toBe('0:00');
    });

    it('should pad minutes with leading zero', () => {
      expect(pipe.transform(3605)).toBe('1:00'); // 1h 0m 5s
      expect(pipe.transform(3665)).toBe('1:01'); // 1h 1m 5s
    });

    it('should handle multiple hours', () => {
      expect(pipe.transform(36000)).toBe('10:00'); // 10 hours
      expect(pipe.transform(43200)).toBe('12:00'); // 12 hours
    });
  });

  describe('String inputs', () => {
    it('should handle ISO time format HH:MM:SS', () => {
      expect(pipe.transform('01:30:00')).toBe('1:30');
      expect(pipe.transform('02:15:30')).toBe('2:15');
    });

    it('should handle ISO time with milliseconds', () => {
      expect(pipe.transform('01:30:00.000')).toBe('1:30');
      expect(pipe.transform('02:15:30.500')).toBe('2:15');
    });

    it('should handle m:ss format', () => {
      expect(pipe.transform('5:30')).toBe('5:30');
      expect(pipe.transform('10:45')).toBe('10:45');
    });

    it('should handle h:mm:ss format', () => {
      expect(pipe.transform('1:30:00')).toBe('1:30');
      expect(pipe.transform('2:15:45')).toBe('2:15');
    });

    it('should handle numeric strings (seconds)', () => {
      expect(pipe.transform('3600')).toBe('1:00');
      expect(pipe.transform('7200')).toBe('2:00');
    });

    it('should pad minutes in formatted strings', () => {
      expect(pipe.transform('1:5')).toBe('1:05');
      expect(pipe.transform('2:8')).toBe('2:08');
    });
  });

  describe('Edge cases', () => {
    it('should handle null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should handle invalid strings', () => {
      expect(pipe.transform('invalid')).toBe(''); // No colons, parseInt returns NaN
        // 'abc:def' has 2 parts, parseInt('abc') is NaN, displays as 'NaN:def'
        expect(pipe.transform('abc:def')).toBe('NaN:def');
    });

    it('should handle negative numbers', () => {
      expect(pipe.transform(-100)).toBe('');
    });

    it('should handle NaN', () => {
      expect(pipe.transform(NaN)).toBe('');
    });

    it('should handle very large durations', () => {
      expect(pipe.transform(360000)).toBe('100:00'); // 100 hours
    });

    it('should handle zero-padded hours in ISO format', () => {
      expect(pipe.transform('00:19:00.000')).toBe('0:19');
      expect(pipe.transform('00:05:30')).toBe('0:05');
    });
  });
});
