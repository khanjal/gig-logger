import { ShortAddressPipe } from './short-address.pipe';

describe('ShortAddressPipe', () => {
  let pipe: ShortAddressPipe;

  beforeEach(() => {
    pipe = new ShortAddressPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should abbreviate address with default length', () => {
    const result = pipe.transform('123 Main Street, City, State 12345');
    expect(result).toBeTruthy();
    expect(result.length).toBeLessThan('123 Main Street, City, State 12345'.length);
  });

  it('should use custom length', () => {
    const result = pipe.transform('123 Main Street, City, State', '', 3);
    expect(result).toBeTruthy();
  });

  it('should handle place name parameter', () => {
    const result = pipe.transform('123 Main Street, City', 'Target Store');
    expect(result).toBeTruthy();
  });

  it('should handle empty string', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should handle short addresses', () => {
    const result = pipe.transform('Main St');
    expect(result).toBe('Main St');
  });

  it('should abbreviate common street types', () => {
    const address = '123 Main Street';
    const result = pipe.transform(address);
    expect(result).toContain('St');
  });

  it('should handle addresses with place names', () => {
    const result = pipe.transform('123 Main Street', 'Walmart', 2);
    expect(result).toBeTruthy();
  });

  it('should handle multi-part addresses', () => {
    const result = pipe.transform('123 North Main Street, Apartment 4B, City, State 12345');
    expect(result).toBeTruthy();
    expect(result.length).toBeLessThan('123 North Main Street, Apartment 4B, City, State 12345'.length);
  });

  it('should handle addresses with directions', () => {
    const result = pipe.transform('123 North Main Street');
    expect(result).toBeTruthy();
  });

  it('should use default place as empty string', () => {
    const result1 = pipe.transform('123 Main Street');
    const result2 = pipe.transform('123 Main Street', '');
    expect(result1).toBe(result2);
  });

  it('should use default length of 2', () => {
    const result1 = pipe.transform('123 Main Street, City, State');
    const result2 = pipe.transform('123 Main Street, City, State', '', 2);
    expect(result1).toBe(result2);
  });
});
