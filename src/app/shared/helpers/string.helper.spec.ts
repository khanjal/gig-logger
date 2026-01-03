import { StringHelper } from './string.helper';

describe('StringHelper', () => {
  
  describe('truncate', () => {
    it('should return original text if length is less than limit', () => {
      const text = 'Short text';
      const result = StringHelper.truncate(text, 20);
      expect(result).toBe('Short text');
    });

    it('should return original text if length equals limit', () => {
      const text = 'Exactly twenty chars';
      const result = StringHelper.truncate(text, 20);
      expect(result).toBe('Exactly twenty chars');
    });

    it('should truncate text longer than limit with default suffix', () => {
      const text = 'This is a very long text that needs truncation';
      const result = StringHelper.truncate(text, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    it('should use custom suffix when provided', () => {
      const text = 'This is a long text';
      const result = StringHelper.truncate(text, 15, '…');
      expect(result).toBe('This is a long…');
      expect(result.length).toBe(15);
    });

    it('should handle empty suffix', () => {
      const text = 'This is a long text';
      const result = StringHelper.truncate(text, 10, '');
      expect(result).toBe('This is a ');
      expect(result.length).toBe(10);
    });

    it('should account for suffix length in truncation', () => {
      const text = 'Hello World';
      const result = StringHelper.truncate(text, 8, '...');
      // Should truncate to 5 chars + 3 char suffix = 8 total
      expect(result).toBe('Hello...');
      expect(result.length).toBe(8);
    });

    it('should handle null or undefined text', () => {
      expect(StringHelper.truncate(null as any, 10)).toBeFalsy();
      expect(StringHelper.truncate(undefined as any, 10)).toBeFalsy();
    });

    it('should handle empty string', () => {
      const result = StringHelper.truncate('', 10);
      expect(result).toBe('');
    });

    it('should use default length of 20 when not specified', () => {
      const text = 'This is a text longer than twenty characters';
      const result = StringHelper.truncate(text);
      expect(result.length).toBe(20);
      expect(result).toBe('This is a text lo...');
    });

    it('should use default suffix of "..." when not specified', () => {
      const text = 'This is a long text';
      const result = StringHelper.truncate(text, 10);
      expect(result).toContain('...');
    });

    it('should handle single character strings', () => {
      const text = 'A';
      const result = StringHelper.truncate(text, 10);
      expect(result).toBe('A');
    });

    it('should handle special characters', () => {
      const text = 'Special chars: @#$%^&*()';
      const result = StringHelper.truncate(text, 15);
      expect(result).toBe('Special char...');
    });

    it('should handle unicode characters', () => {
      const text = 'Hello 世界 Unicode';
      const result = StringHelper.truncate(text, 12);
      expect(result.length).toBe(12);
    });

    it('should handle very long suffix', () => {
      const text = 'Short';
      const result = StringHelper.truncate(text, 10, ' [more]');
      // Since text is shorter than limit, should return original
      expect(result).toBe('Short');
    });

    it('should preserve words when suffix matches length', () => {
      const text = 'Hello World';
      const result = StringHelper.truncate(text, 11, '');
      expect(result).toBe('Hello World');
    });
  });
});
