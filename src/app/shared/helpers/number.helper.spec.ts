import { NumberHelper } from './number.helper';

describe('NumberHelper', () => {

  describe('convertWordToNumber', () => {
    it('should convert single digit words', () => {
      expect(NumberHelper.convertWordToNumber('zero')).toBe(0);
      expect(NumberHelper.convertWordToNumber('one')).toBe(1);
      expect(NumberHelper.convertWordToNumber('five')).toBe(5);
      expect(NumberHelper.convertWordToNumber('nine')).toBe(9);
    });

    it('should convert teen numbers', () => {
      expect(NumberHelper.convertWordToNumber('ten')).toBe(10);
      expect(NumberHelper.convertWordToNumber('eleven')).toBe(11);
      expect(NumberHelper.convertWordToNumber('fifteen')).toBe(15);
      expect(NumberHelper.convertWordToNumber('nineteen')).toBe(19);
    });

    it('should convert tens', () => {
      expect(NumberHelper.convertWordToNumber('twenty')).toBe(20);
      expect(NumberHelper.convertWordToNumber('thirty')).toBe(30);
      expect(NumberHelper.convertWordToNumber('fifty')).toBe(50);
      expect(NumberHelper.convertWordToNumber('ninety')).toBe(90);
    });

    it('should convert compound numbers with hyphen', () => {
      expect(NumberHelper.convertWordToNumber('twenty-one')).toBe(21);
      expect(NumberHelper.convertWordToNumber('thirty-five')).toBe(35);
      expect(NumberHelper.convertWordToNumber('ninety-nine')).toBe(99);
    });

    it('should convert compound numbers with space', () => {
      expect(NumberHelper.convertWordToNumber('twenty one')).toBe(21);
      expect(NumberHelper.convertWordToNumber('forty two')).toBe(42);
    });

    it('should be case insensitive', () => {
      expect(NumberHelper.convertWordToNumber('FIVE')).toBe(5);
      expect(NumberHelper.convertWordToNumber('Twenty-Three')).toBe(23);
    });

    it('should handle whitespace', () => {
      expect(NumberHelper.convertWordToNumber('  five  ')).toBe(5);
    });

    it('should return NaN for unrecognized words', () => {
      expect(NumberHelper.convertWordToNumber('banana')).toBeNaN();
      expect(NumberHelper.convertWordToNumber('onetwothree')).toBeNaN();
    });

    it('should handle hundred', () => {
      expect(NumberHelper.convertWordToNumber('hundred')).toBe(100);
    });
  });

  describe('getNumberFromString', () => {
    it('should extract numbers from strings with currency', () => {
      expect(NumberHelper.getNumberFromString('$123.45')).toBe(123.45);
      expect(NumberHelper.getNumberFromString('€99.99')).toBe(99.99);
    });

    it('should extract numbers from strings with text', () => {
      expect(NumberHelper.getNumberFromString('Total: 42 items')).toBe(42);
      expect(NumberHelper.getNumberFromString('Price is $19.95 USD')).toBe(19.95);
    });

    it('should handle negative numbers', () => {
      expect(NumberHelper.getNumberFromString('-50')).toBe(-50);
      expect(NumberHelper.getNumberFromString('$-25.50')).toBe(-25.5);
    });

    it('should handle decimals', () => {
      expect(NumberHelper.getNumberFromString('123.456')).toBe(123.456);
      expect(NumberHelper.getNumberFromString('.5')).toBe(0.5);
    });

    it('should return 0 for empty string', () => {
      expect(NumberHelper.getNumberFromString('')).toBe(0);
      expect(NumberHelper.getNumberFromString()).toBe(0);
    });

    it('should return 0 for strings with no numbers', () => {
      expect(NumberHelper.getNumberFromString('no numbers here')).toBe(0);
    });

    it('should handle comma separators', () => {
      expect(NumberHelper.getNumberFromString('1,234.56')).toBe(1234.56);
      expect(NumberHelper.getNumberFromString('$1,000,000')).toBe(1000000);
    });
  });

  describe('getDataSize', () => {
    it('should return "0B" for zero bytes', () => {
      expect(NumberHelper.getDataSize(0)).toBe('0B');
      expect(NumberHelper.getDataSize()).toBe('0B');
    });

    it('should format bytes', () => {
      expect(NumberHelper.getDataSize(500)).toBe('500 B');
      expect(NumberHelper.getDataSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes', () => {
      expect(NumberHelper.getDataSize(1025)).toBe('1 KB');
      expect(NumberHelper.getDataSize(2048)).toBe('2 KB');
      expect(NumberHelper.getDataSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(NumberHelper.getDataSize(1048577)).toBe('1 MB');
      expect(NumberHelper.getDataSize(5242880)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(NumberHelper.getDataSize(1073741825)).toBe('1 GB');
      expect(NumberHelper.getDataSize(5368709120)).toBe('5 GB');
    });

    it('should use specified decimal places', () => {
      expect(NumberHelper.getDataSize(1536, 0)).toBe('2 KB');
      expect(NumberHelper.getDataSize(1536, 3)).toBe('1.5 KB');
    });

    it('should default to 2 decimal places', () => {
      const result = NumberHelper.getDataSize(1234567);
      expect(result).toMatch(/^1\.18 MB$/);
    });
  });

  describe('toNullableNumber', () => {
    it('should return null for empty string', () => {
      expect(NumberHelper.toNullableNumber('')).toBeNull();
    });

    it('should return null for null', () => {
      expect(NumberHelper.toNullableNumber(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(NumberHelper.toNullableNumber(undefined)).toBeNull();
    });

    it('should return original value for valid numbers', () => {
      expect(NumberHelper.toNullableNumber(42)).toBe(42);
      expect(NumberHelper.toNullableNumber(0)).toBe(0);
      expect(NumberHelper.toNullableNumber(-5)).toBe(-5);
      expect(NumberHelper.toNullableNumber(3.14)).toBe(3.14);
    });

    it('should return original value for numeric strings', () => {
      expect(NumberHelper.toNullableNumber('42')).toBe('42');
      expect(NumberHelper.toNullableNumber('0')).toBe('0');
    });
  });

  describe('toNumber', () => {
    it('should convert valid numbers', () => {
      expect(NumberHelper.toNumber(42)).toBe(42);
      expect(NumberHelper.toNumber('42')).toBe(42);
      expect(NumberHelper.toNumber(3.14)).toBe(3.14);
      expect(NumberHelper.toNumber('3.14')).toBe(3.14);
    });

    it('should return 0 for null or undefined', () => {
      expect(NumberHelper.toNumber(null)).toBe(0);
      expect(NumberHelper.toNumber(undefined)).toBe(0);
    });

    it('should return 0 for invalid values', () => {
      expect(NumberHelper.toNumber('abc')).toBe(0);
      expect(NumberHelper.toNumber('')).toBe(0);
      expect(NumberHelper.toNumber(NaN)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(NumberHelper.toNumber(-42)).toBe(-42);
      expect(NumberHelper.toNumber('-42')).toBe(-42);
    });

    it('should handle zero', () => {
      expect(NumberHelper.toNumber(0)).toBe(0);
      expect(NumberHelper.toNumber('0')).toBe(0);
    });
  });

  describe('roundToTwo', () => {
    it('should round to two decimals', () => {
      expect(NumberHelper.roundToTwo(1.234)).toBe(1.23);
      expect(NumberHelper.roundToTwo(1.235)).toBe(1.24);
      expect(NumberHelper.roundToTwo(1.999)).toBe(2);
    });

    it('should handle whole numbers', () => {
      expect(NumberHelper.roundToTwo(5)).toBe(5);
      expect(NumberHelper.roundToTwo(10)).toBe(10);
    });

    it('should handle negative numbers', () => {
      expect(NumberHelper.roundToTwo(-1.234)).toBe(-1.23);
      expect(NumberHelper.roundToTwo(-1.235)).toBe(-1.24);
    });

    it('should handle zero', () => {
      expect(NumberHelper.roundToTwo(0)).toBe(0);
      expect(NumberHelper.roundToTwo(0.001)).toBe(0);
    });

    it('should handle values already with two decimals', () => {
      expect(NumberHelper.roundToTwo(1.23)).toBe(1.23);
      expect(NumberHelper.roundToTwo(99.99)).toBe(99.99);
    });
  });

  describe('median', () => {
    it('should return 0 for empty array', () => {
      expect(NumberHelper.median([])).toBe(0);
    });

    it('should return single value for array with one element', () => {
      expect(NumberHelper.median([5])).toBe(5);
    });

    it('should calculate median for odd-length arrays', () => {
      expect(NumberHelper.median([1, 2, 3, 4, 5])).toBe(3);
      expect(NumberHelper.median([5, 1, 3])).toBe(3);
    });

    it('should calculate median for even-length arrays', () => {
      expect(NumberHelper.median([1, 2, 3, 4])).toBe(2.5);
      expect(NumberHelper.median([10, 20])).toBe(15);
    });

    it('should handle unsorted arrays', () => {
      expect(NumberHelper.median([3, 1, 4, 1, 5, 9, 2, 6])).toBe(3.5);
    });

    it('should handle negative numbers', () => {
      expect(NumberHelper.median([-5, -2, -8])).toBe(-5);
      expect(NumberHelper.median([-10, 10])).toBe(0);
    });

    it('should round result to two decimals', () => {
      expect(NumberHelper.median([1, 2])).toBe(1.5);
      expect(NumberHelper.median([1.111, 2.222])).toBe(1.67);
    });
  });

  describe('nearlyEqual', () => {
    it('should return true for equal numbers', () => {
      expect(NumberHelper.nearlyEqual(5, 5)).toBe(true);
      expect(NumberHelper.nearlyEqual(1.23, 1.23)).toBe(true);
    });

    it('should return true for nearly equal numbers within rounding', () => {
      expect(NumberHelper.nearlyEqual(1.231, 1.233)).toBe(true); // Both round to 1.23
      expect(NumberHelper.nearlyEqual(1.999, 2.001)).toBe(true); // Both round to 2
    });

    it('should return false for different numbers', () => {
      expect(NumberHelper.nearlyEqual(1.2, 1.3)).toBe(false);
      expect(NumberHelper.nearlyEqual(5, 6)).toBe(false);
    });

    it('should handle zero comparisons', () => {
      expect(NumberHelper.nearlyEqual(0, 0)).toBe(true);
      expect(NumberHelper.nearlyEqual(0.004, 0)).toBe(true); // Rounds to 0
      expect(NumberHelper.nearlyEqual(0.001, 0.002)).toBe(true); // Both round to 0
    });

    it('should handle negative numbers', () => {
      expect(NumberHelper.nearlyEqual(-1.231, -1.233)).toBe(true); // Both round to -1.23
      expect(NumberHelper.nearlyEqual(-5, -5)).toBe(true);
      expect(NumberHelper.nearlyEqual(-1.2, -1.3)).toBe(false);
    });
  });

  describe('formatNumber', () => {
    it('should format with default locale (en-US)', () => {
      expect(NumberHelper.formatNumber(1234.5)).toBe('1,234.50');
      expect(NumberHelper.formatNumber(1000000)).toBe('1,000,000.00');
    });

    it('should format with two decimal places', () => {
      expect(NumberHelper.formatNumber(10)).toBe('10.00');
      expect(NumberHelper.formatNumber(10.5)).toBe('10.50');
      expect(NumberHelper.formatNumber(10.567)).toBe('10.57');
    });

    it('should handle negative numbers', () => {
      expect(NumberHelper.formatNumber(-1234.5)).toBe('-1,234.50');
    });

    it('should handle zero', () => {
      expect(NumberHelper.formatNumber(0)).toBe('0.00');
    });

    it('should round to two decimals before formatting', () => {
      expect(NumberHelper.formatNumber(1.999)).toBe('2.00');
      expect(NumberHelper.formatNumber(1.234)).toBe('1.23');
    });

    it('should handle large numbers', () => {
      const result = NumberHelper.formatNumber(1234567.89);
      expect(result).toBe('1,234,567.89');
    });

    it('should accept custom locale', () => {
      // Note: Actual formatting depends on environment locale support
      const result = NumberHelper.formatNumber(1234.5, 'de-DE');
      expect(result).toMatch(/1[.,]234[.,]50/); // German uses different separators
    });
  });
});
