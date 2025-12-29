import { OrdinalPipe } from './ordinal.pipe';

describe('OrdinalPipe', () => {
  let pipe: OrdinalPipe;

  beforeEach(() => {
    pipe = new OrdinalPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('st suffix', () => {
    it('should add st for 1', () => {
      expect(pipe.transform(1)).toBe('1st');
    });

    it('should add st for 21, 31, 41, etc', () => {
      expect(pipe.transform(21)).toBe('21st');
      expect(pipe.transform(31)).toBe('31st');
      expect(pipe.transform(41)).toBe('41st');
      expect(pipe.transform(101)).toBe('101st');
    });
  });

  describe('nd suffix', () => {
    it('should add nd for 2', () => {
      expect(pipe.transform(2)).toBe('2nd');
    });

    it('should add nd for 22, 32, 42, etc', () => {
      expect(pipe.transform(22)).toBe('22nd');
      expect(pipe.transform(32)).toBe('32nd');
      expect(pipe.transform(42)).toBe('42nd');
      expect(pipe.transform(102)).toBe('102nd');
    });
  });

  describe('rd suffix', () => {
    it('should add rd for 3', () => {
      expect(pipe.transform(3)).toBe('3rd');
    });

    it('should add rd for 23, 33, 43, etc', () => {
      expect(pipe.transform(23)).toBe('23rd');
      expect(pipe.transform(33)).toBe('33rd');
      expect(pipe.transform(43)).toBe('43rd');
      expect(pipe.transform(103)).toBe('103rd');
    });
  });

  describe('th suffix', () => {
    it('should add th for 4-10', () => {
      expect(pipe.transform(4)).toBe('4th');
      expect(pipe.transform(5)).toBe('5th');
      expect(pipe.transform(6)).toBe('6th');
      expect(pipe.transform(7)).toBe('7th');
      expect(pipe.transform(8)).toBe('8th');
      expect(pipe.transform(9)).toBe('9th');
      expect(pipe.transform(10)).toBe('10th');
    });

    it('should add th for 11, 12, 13', () => {
      expect(pipe.transform(11)).toBe('11th');
      expect(pipe.transform(12)).toBe('12th');
      expect(pipe.transform(13)).toBe('13th');
    });

    it('should add th for teen numbers ending in 1, 2, 3', () => {
      expect(pipe.transform(111)).toBe('111th');
      expect(pipe.transform(112)).toBe('112th');
      expect(pipe.transform(113)).toBe('113th');
      expect(pipe.transform(211)).toBe('211th');
    });

    it('should add th for 14-20', () => {
      expect(pipe.transform(14)).toBe('14th');
      expect(pipe.transform(15)).toBe('15th');
      expect(pipe.transform(20)).toBe('20th');
    });
  });

  describe('String inputs', () => {
    it('should handle numeric strings', () => {
      expect(pipe.transform('1')).toBe('1st');
      expect(pipe.transform('2')).toBe('2nd');
      expect(pipe.transform('3')).toBe('3rd');
      expect(pipe.transform('4')).toBe('4th');
    });

    it('should handle large numeric strings', () => {
      expect(pipe.transform('100')).toBe('100th');
      expect(pipe.transform('101')).toBe('101st');
    });
  });

  describe('Edge cases', () => {
    it('should handle null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(pipe.transform(undefined as any)).toBe('');
    });

    it('should handle invalid strings', () => {
      expect(pipe.transform('abc')).toBe('abc');
      expect(pipe.transform('not a number')).toBe('not a number');
    });

    it('should handle zero', () => {
      expect(pipe.transform(0)).toBe('0th');
    });

    it('should handle negative numbers', () => {
      // Negative numbers use modulo logic: -1 % 10 = -1, -1 % 100 = -1
      // So they end up as 'th' suffix
      expect(pipe.transform(-1)).toBe('-1th');
      expect(pipe.transform(-2)).toBe('-2th');
      expect(pipe.transform(-11)).toBe('-11th');
    });
  });

  describe('Large numbers', () => {
    it('should handle large numbers correctly', () => {
      expect(pipe.transform(1000)).toBe('1000th');
      expect(pipe.transform(1001)).toBe('1001st');
      expect(pipe.transform(1111)).toBe('1111th');
      expect(pipe.transform(1121)).toBe('1121st');
    });
  });
});
