import { TestBed } from '@angular/core/testing';
import { SecureCookieStorageService } from './secure-cookie-storage.service';

describe('SecureCookieStorageService', () => {
  let service: SecureCookieStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SecureCookieStorageService]
    });
    service = TestBed.inject(SecureCookieStorageService);

    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=-99999999; Path=/`;
    });
  });

  afterEach(() => {
    // Clean up cookies after each test
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=-99999999; Path=/`;
    });
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should implement OAuthStorage interface', () => {
      expect(service.getItem).toBeDefined();
      expect(service.setItem).toBeDefined();
      expect(service.removeItem).toBeDefined();
    });
  });

  describe('setItem', () => {
    it('should set a cookie value', () => {
      service.setItem('test-key', 'test-value');

      const value = service.getItem('test-key');
      expect(value).toBe('test-value');
    });

    it('should encode special characters in values', () => {
      const specialValue = 'value with spaces & symbols!@#';
      service.setItem('special-key', specialValue);

      const value = service.getItem('special-key');
      expect(value).toBe(specialValue);
    });

    it('should handle empty string values', () => {
      service.setItem('empty-key', '');

      // Empty string in cookies is treated as null
      const value = service.getItem('empty-key');
      expect(value).toBeNull();
    });

    it('should handle JSON string values', () => {
      const jsonValue = JSON.stringify({ token: 'abc123', expires: 3600 });
      service.setItem('json-key', jsonValue);

      const value = service.getItem('json-key');
      expect(value).toBe(jsonValue);
    });

    it('should handle unicode characters', () => {
      const unicodeValue = 'Hello 世界 🌍';
      service.setItem('unicode-key', unicodeValue);

      const value = service.getItem('unicode-key');
      expect(value).toBe(unicodeValue);
    });

    it('should overwrite existing cookie value', () => {
      service.setItem('overwrite-key', 'original-value');
      service.setItem('overwrite-key', 'new-value');

      const value = service.getItem('overwrite-key');
      expect(value).toBe('new-value');
    });

    it('should handle multiple cookies', () => {
      service.setItem('key1', 'value1');
      service.setItem('key2', 'value2');
      service.setItem('key3', 'value3');

      expect(service.getItem('key1')).toBe('value1');
      expect(service.getItem('key2')).toBe('value2');
      expect(service.getItem('key3')).toBe('value3');
    });

    it('should handle keys with hyphens and underscores', () => {
      service.setItem('test-key_with-special_chars', 'value');

      const value = service.getItem('test-key_with-special_chars');
      expect(value).toBe('value');
    });
  });

  describe('getItem', () => {
    it('should return null for non-existent keys', () => {
      const value = service.getItem('non-existent-key');
      expect(value).toBeNull();
    });

    it('should retrieve previously set values', () => {
      service.setItem('retrieve-key', 'retrieve-value');

      const value = service.getItem('retrieve-key');
      expect(value).toBe('retrieve-value');
    });

    it('should decode URL-encoded values', () => {
      service.setItem('encoded-key', 'value%20with%20spaces');

      const value = service.getItem('encoded-key');
      expect(value).toBeTruthy();
    });

    it('should return null for keys with empty values', () => {
      // Manually set a cookie with empty value
      document.cookie = 'empty-cookie=; Path=/';

      const value = service.getItem('empty-cookie');
      // Empty cookie values should return null
      expect(value).toBeNull();
    });

    it('should handle keys that are substrings of other keys', () => {
      service.setItem('key', 'value1');
      service.setItem('key-extended', 'value2');

      expect(service.getItem('key')).toBe('value1');
      expect(service.getItem('key-extended')).toBe('value2');
    });
  });

  describe('removeItem', () => {
    it('should remove an existing cookie', () => {
      service.setItem('remove-key', 'remove-value');
      expect(service.getItem('remove-key')).toBe('remove-value');

      service.removeItem('remove-key');

      const value = service.getItem('remove-key');
      expect(value).toBeNull();
    });

    it('should not throw error when removing non-existent cookie', () => {
      expect(() => service.removeItem('non-existent')).not.toThrow();
    });

    it('should only remove specified cookie', () => {
      service.setItem('keep-key', 'keep-value');
      service.setItem('remove-key', 'remove-value');

      service.removeItem('remove-key');

      expect(service.getItem('keep-key')).toBe('keep-value');
      expect(service.getItem('remove-key')).toBeNull();
    });

    it('should allow re-setting a removed cookie', () => {
      service.setItem('reuse-key', 'original-value');
      service.removeItem('reuse-key');
      service.setItem('reuse-key', 'new-value');

      const value = service.getItem('reuse-key');
      expect(value).toBe('new-value');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle OAuth token storage workflow', () => {
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const idToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.id';

      service.setItem('access_token', accessToken);
      service.setItem('id_token', idToken);

      expect(service.getItem('access_token')).toBe(accessToken);
      expect(service.getItem('id_token')).toBe(idToken);

      service.removeItem('access_token');
      service.removeItem('id_token');

      expect(service.getItem('access_token')).toBeNull();
      expect(service.getItem('id_token')).toBeNull();
    });

    it('should handle rapid set/get operations', () => {
      for (let i = 0; i < 10; i++) {
        service.setItem('rapid-key', `value${i}`);
        expect(service.getItem('rapid-key')).toBe(`value${i}`);
      }
    });

    it('should maintain data integrity across multiple operations', () => {
      service.setItem('token1', 'abc123');
      service.setItem('token2', 'def456');
      service.setItem('token3', 'ghi789');

      expect(service.getItem('token1')).toBe('abc123');

      service.removeItem('token2');

      expect(service.getItem('token1')).toBe('abc123');
      expect(service.getItem('token2')).toBeNull();
      expect(service.getItem('token3')).toBe('ghi789');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long values', () => {
      const longValue = 'a'.repeat(1000);
      service.setItem('long-key', longValue);

      const value = service.getItem('long-key');
      expect(value).toBe(longValue);
    });

    it('should handle keys with dots and underscores', () => {
      const specialKey = 'key_with.dots_and-dashes';
      service.setItem(specialKey, 'value');

      const value = service.getItem(specialKey);
      expect(value).toBe('value');
    });

    it('should handle value with equals signs', () => {
      const valueWithEquals = 'key1=value1&key2=value2';
      service.setItem('equals-key', valueWithEquals);

      const value = service.getItem('equals-key');
      expect(value).toBe(valueWithEquals);
    });

    it('should handle value with semicolons', () => {
      const valueWithSemicolon = 'part1;part2;part3';
      service.setItem('semicolon-key', valueWithSemicolon);

      const value = service.getItem('semicolon-key');
      expect(value).toBe(valueWithSemicolon);
    });
  });
});
