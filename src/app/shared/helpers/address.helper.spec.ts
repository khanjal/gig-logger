import { AddressHelper } from './address.helper';

describe('AddressHelper', () => {

  describe('getShortAddress', () => {
    it('should return empty string for null or undefined', () => {
      expect(AddressHelper.getShortAddress(null as any)).toBe('');
      expect(AddressHelper.getShortAddress(undefined as any)).toBe('');
      expect(AddressHelper.getShortAddress('')).toBe('');
    });

    it('should abbreviate and return first 2 parts by default', () => {
      const address = '123 North Main Street, Springfield, IL';
      const result = AddressHelper.getShortAddress(address);
      expect(result).toBe('123 N Main St, Springfield');
    });

    it('should handle custom length parameter', () => {
      const address = '123 North Main Street, Springfield, IL, 62701';
      const result = AddressHelper.getShortAddress(address, '', 3);
      expect(result).toContain('123 N Main St');
      expect(result).toContain('Springfield');
      expect(result).toContain('IL');
    });

    it('should handle single-part addresses', () => {
      const address = '123 North Street';
      const result = AddressHelper.getShortAddress(address);
      expect(result).toBe('123 N St'); // Abbreviates both when 2+ words
    });

    it('should remove place from address when provided', () => {
      const address = 'McDonald\'s, 123 Main Street, Springfield';
      const result = AddressHelper.getShortAddress(address, 'McDonald\'s', 2);
      expect(result).not.toContain('McDonald');
      expect(result).toContain('123 Main St');
    });

    it('should truncate first part when length > 2', () => {
      const address = '123 Very Long Street Name That Should Be Truncated, Springfield, IL';
      const result = AddressHelper.getShortAddress(address, '', 3);
      expect(result.split(',')[0].length).toBeLessThanOrEqual(15);
    });

    it('should handle addresses with only city and state', () => {
      const address = 'Springfield, IL';
      const result = AddressHelper.getShortAddress(address);
      expect(result).toBe('Springfield, IL');
    });

    it('should filter empty parts', () => {
      const address = '123 Main Street, , Springfield';
      const result = AddressHelper.getShortAddress(address);
      expect(result).toBe('123 Main St, Springfield');
    });
  });

  describe('abbrvAddress', () => {
    it('should return empty string for null or undefined', () => {
      expect(AddressHelper.abbrvAddress(null as any)).toBe('');
      expect(AddressHelper.abbrvAddress(undefined as any)).toBe('');
      expect(AddressHelper.abbrvAddress('')).toBe('');
    });

    it('should abbreviate cardinal directions', () => {
      expect(AddressHelper.abbrvAddress('123 North Main Street')).toBe('123 N Main St');
      expect(AddressHelper.abbrvAddress('123 South Park Avenue')).toBe('123 S Park Ave');
      expect(AddressHelper.abbrvAddress('123 East Lake Drive')).toBe('123 E Lake Dr');
      expect(AddressHelper.abbrvAddress('123 West Oak Lane')).toBe('123 W Oak Ln');
    });

    it('should abbreviate intercardinal directions', () => {
      expect(AddressHelper.abbrvAddress('123 Northeast Boulevard')).toBe('123 NE Blvd');
      expect(AddressHelper.abbrvAddress('123 Southwest Parkway')).toBe('123 SW Pkwy');
    });

    it('should abbreviate street types', () => {
      expect(AddressHelper.abbrvAddress('123 Main Street')).toBe('123 Main St');
      expect(AddressHelper.abbrvAddress('456 Oak Avenue')).toBe('456 Oak Ave');
      expect(AddressHelper.abbrvAddress('789 Park Boulevard')).toBe('789 Park Blvd');
      expect(AddressHelper.abbrvAddress('321 Lake Drive')).toBe('321 Lake Dr');
    });

    it('should abbreviate both direction and street type', () => {
      expect(AddressHelper.abbrvAddress('123 North Main Street')).toBe('123 N Main St');
      expect(AddressHelper.abbrvAddress('456 South Oak Avenue')).toBe('456 S Oak Ave');
    });

    it('should handle multi-word street names', () => {
      const result = AddressHelper.abbrvAddress('123 North Savana Gardner Road');
      expect(result).toBe('123 N Savana Gardner Rd');
    });

    it('should abbreviate two-word addresses correctly', () => {
      const result = AddressHelper.abbrvAddress('123 North Street');
      expect(result).toBe('123 N St'); // Both words abbreviate when 2 words
    });

    it('should handle single-word addresses', () => {
      expect(AddressHelper.abbrvAddress('Street')).toBe('St');
      expect(AddressHelper.abbrvAddress('North')).toBe('N');
    });

    it('should handle two-word addresses', () => {
      expect(AddressHelper.abbrvAddress('Main Street')).toBe('Main St');
      expect(AddressHelper.abbrvAddress('North Boulevard')).toBe('North Blvd');
    });

    it('should be case insensitive', () => {
      expect(AddressHelper.abbrvAddress('123 NORTH MAIN STREET')).toBe('123 N MAIN St');
      expect(AddressHelper.abbrvAddress('123 north main street')).toBe('123 N main St');
    });

    it('should preserve full address with city and state', () => {
      const result = AddressHelper.abbrvAddress('123 North Main Street, Springfield, IL');
      expect(result).toContain('123 N Main St');
      expect(result).toContain('Springfield');
      expect(result).toContain('IL');
    });

    it('should clean up extra whitespace', () => {
      const result = AddressHelper.abbrvAddress('123  North   Main  Street');
      expect(result).toBe('123 N Main St');
    });

    it('should handle various street types', () => {
      expect(AddressHelper.abbrvAddress('123 Circle Court')).toBe('123 Circle Ct');
      expect(AddressHelper.abbrvAddress('456 Plaza Place')).toBe('456 Plaza Pl');
      expect(AddressHelper.abbrvAddress('789 Highway Terrace')).toBe('789 Highway Ter');
    });
  });

  describe('abbrvDirection', () => {
    it('should abbreviate cardinal directions', () => {
      expect(AddressHelper.abbrvDirection('North')).toBe('N');
      expect(AddressHelper.abbrvDirection('South')).toBe('S');
      expect(AddressHelper.abbrvDirection('East')).toBe('E');
      expect(AddressHelper.abbrvDirection('West')).toBe('W');
    });

    it('should abbreviate intercardinal directions', () => {
      expect(AddressHelper.abbrvDirection('Northeast')).toBe('NE');
      expect(AddressHelper.abbrvDirection('Northwest')).toBe('NW');
      expect(AddressHelper.abbrvDirection('Southeast')).toBe('SE');
      expect(AddressHelper.abbrvDirection('Southwest')).toBe('SW');
    });

    it('should be case insensitive', () => {
      expect(AddressHelper.abbrvDirection('NORTH')).toBe('N');
      expect(AddressHelper.abbrvDirection('north')).toBe('N');
      expect(AddressHelper.abbrvDirection('NoRtH')).toBe('N');
    });

    it('should return original value if not a direction', () => {
      expect(AddressHelper.abbrvDirection('Main')).toBe('Main');
      expect(AddressHelper.abbrvDirection('Street')).toBe('Street');
    });

    it('should handle empty or null values', () => {
      expect(AddressHelper.abbrvDirection('')).toBe('');
    });
  });

  describe('removePlaceFromAddress', () => {
    it('should return empty string for null or undefined address', () => {
      expect(AddressHelper.removePlaceFromAddress(null as any, 'Place')).toBe('');
      expect(AddressHelper.removePlaceFromAddress('', 'Place')).toBe('');
    });

    it('should return original address if place is empty', () => {
      const address = '123 Main Street, Springfield';
      expect(AddressHelper.removePlaceFromAddress(address, '')).toBe(address);
      expect(AddressHelper.removePlaceFromAddress(address, null as any)).toBe(address);
    });

    it('should remove exact matching place name', () => {
      const address = 'McDonald\'s, 123 Main Street, Springfield';
      const result = AddressHelper.removePlaceFromAddress(address, 'McDonald\'s');
      expect(result).toBe('123 Main Street, Springfield');
    });

    it('should remove abbreviated place name', () => {
      const address = 'McDonald\'s North Avenue, 123 Main Street';
      const result = AddressHelper.removePlaceFromAddress(address, 'McDonald\'s North Avenue');
      expect(result).not.toContain('McDonald');
    });

    it('should be case insensitive', () => {
      const address = 'STARBUCKS, 123 Main Street';
      const result = AddressHelper.removePlaceFromAddress(address, 'Starbucks');
      expect(result).toBe('123 Main Street');
    });

    it('should handle partial matches', () => {
      const address = 'McDonald\'s Restaurant, 123 Main Street';
      const result = AddressHelper.removePlaceFromAddress(address, 'McDonald\'s');
      expect(result).not.toContain('McDonald');
    });

    it('should not remove if place is in middle or end', () => {
      const address = '123 Main Street, McDonald\'s Building, Springfield';
      const result = AddressHelper.removePlaceFromAddress(address, 'McDonald\'s');
      // Should only remove from first part
      expect(result).toBe(address);
    });

    it('should handle addresses without commas', () => {
      const address = 'McDonald\'s';
      const result = AddressHelper.removePlaceFromAddress(address, 'McDonald\'s');
      expect(result).toBe('');
    });

    it('should trim whitespace from result', () => {
      const address = 'Place Name, 123 Main Street';
      const result = AddressHelper.removePlaceFromAddress(address, 'Place Name');
      expect(result).toBe('123 Main Street');
      expect(result.startsWith(' ')).toBe(false);
    });
  });
});
