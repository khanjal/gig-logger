import { AddressLineBreakPipe } from './address-line-break.pipe';

describe('AddressLineBreakPipe', () => {
  let pipe: AddressLineBreakPipe;

  beforeEach(() => {
    pipe = new AddressLineBreakPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return address unchanged if shorter than minLength', () => {
    const shortAddress = '123 Main St, City';
    expect(pipe.transform(shortAddress, 30)).toBe(shortAddress);
  });

  it('should replace comma-space with comma-newline for long addresses', () => {
    const longAddress = '123 North Main Street, Springfield, IL 62701';
    const expected = '123 North Main Street,\nSpringfield,\nIL 62701';
    expect(pipe.transform(longAddress, 30)).toBe(expected);
  });

  it('should use default minLength of 30', () => {
    const address = '123 Main St, City';
    expect(pipe.transform(address)).toBe(address);
  });

  it('should handle empty or null addresses', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBeFalsy();
  });

  it('should handle addresses with multiple commas', () => {
    const address = 'Place Name, 123 Street, City, State, ZIP';
    const expected = 'Place Name,\n123 Street,\nCity,\nState,\nZIP';
    expect(pipe.transform(address, 30)).toBe(expected);
  });
});
