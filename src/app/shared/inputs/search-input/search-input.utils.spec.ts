import { createSearchItem, isRateLimitError, isGoogleResult, isValidSearchType } from './search-input.utils';

describe('search-input.utils', () => {
  beforeEach(() => {
    spyOn(console, 'warn');
  });

  describe('createSearchItem', () => {
    it('throws when item is invalid', () => {
      expect(() => createSearchItem(null, 'name')).toThrowError(/Invalid item provided/);
    });

    it('returns coerced values when name property is not a string', () => {
      const item: any = { id: 5, name: 123, saved: 1, trips: '2' };
      const res = createSearchItem(item, 'name');

      expect(res.id).toBe(5);
      expect(res.name).toBe('123');
      expect(res.value).toBe('123');
      expect(res.saved).toBeTrue();
      expect(res.trips).toBe(2);
    });

    it('returns expected ISearchItem when name is a string', () => {
      const item: any = { id: 9, name: 'Alice', saved: 0, trips: 3 };
      const res = createSearchItem(item, 'name');

      expect(res.id).toBe(9);
      expect(res.name).toBe('Alice');
      expect(res.value).toBe('Alice');
      expect(res.saved).toBeFalse();
      expect(res.trips).toBe(3);
    });
  });

  describe('isRateLimitError', () => {
    it('returns false for falsy error', () => {
      expect(isRateLimitError(undefined)).toBeFalse();
    });

    it('detects by code (case-insensitive)', () => {
      expect(isRateLimitError({ code: 'OVER_QUERY_LIMIT' })).toBeTrue();
      expect(isRateLimitError({ code: 'request_denied' })).toBeTrue();
    });

    it('detects by message content or status', () => {
      expect(isRateLimitError({ message: 'Quota exceeded for this API' })).toBeTrue();
      expect(isRateLimitError({ message: 'Too many requests' })).toBeTrue();
      expect(isRateLimitError({ status: 429 })).toBeTrue();
    });

    it('returns false for unrelated errors', () => {
      expect(isRateLimitError({ message: 'Something else', code: 'unknown' })).toBeFalse();
    });
  });

  describe('isGoogleResult', () => {
    it('identifies google result items', () => {
      const item: any = { id: undefined, trips: 0, saved: false };
      expect(isGoogleResult(item)).toBeTrue();
    });

    it('returns false for non-google items', () => {
      expect(isGoogleResult({ id: 1, name: 'Bob', value: 'Bob', trips: 0, saved: false })).toBeFalse();
      expect(isGoogleResult({ id: undefined, name: 'Carol', value: 'Carol', trips: 1, saved: false })).toBeFalse();
      expect(isGoogleResult({ id: undefined, name: 'Eve', value: 'Eve', trips: 0, saved: true })).toBeFalse();
    });
  });

  describe('isValidSearchType', () => {
    it('accepts valid types and rejects invalid ones', () => {
      expect(isValidSearchType('Address')).toBeTrue();
      expect(isValidSearchType('Name')).toBeTrue();
      expect(isValidSearchType('FooBar')).toBeFalse();
    });
  });

  // Additional tests for exported functions can be added here when new helpers are added
});
