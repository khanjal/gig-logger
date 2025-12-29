import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should truncate text longer than default length', () => {
    const result = pipe.transform('This is a very long text that needs truncation'); // 20 chars - 3 for ... = 17
    expect(result).toBe('This is a very lo...');
  });

  it('should truncate text to custom length', () => {
    const result = pipe.transform('This is a test', 10); // 10 chars - 3 for ... = 7
    expect(result).toBe('This is...');
  });

  it('should use custom suffix', () => {
    const result = pipe.transform('This is a long text', 10, '---'); // 10 chars - 3 for --- = 7
    expect(result).toBe('This is---');
  });

  it('should not truncate text shorter than length', () => {
    const result = pipe.transform('Short', 20);
    expect(result).toBe('Short');
  });

  it('should handle empty string', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should handle exact length match', () => {
    const result = pipe.transform('Exactly twenty chars', 20);
    expect(result).toBe('Exactly twenty chars');
  });

  it('should handle single character', () => {
    const result = pipe.transform('A', 5);
    expect(result).toBe('A');
  });

  it('should handle unicode characters', () => {
    const result = pipe.transform('Hello 世界 Unicode test', 10); // 10 - 3 = 7 chars
    expect(result).toBe('Hello 世...');
  });

  it('should handle length of 0', () => {
    const result = pipe.transform('Test', 0);
    expect(result).toBe('...');
  });

  it('should handle very long suffix', () => {
    const result = pipe.transform('Test', 10, ' and more...'); // Text is short, no truncation
    expect(result).toBe('Test');
  });
});
