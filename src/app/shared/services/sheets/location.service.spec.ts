import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import type { ILocation } from '@interfaces/entities/location.interface';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocationService]
    });
    service = TestBed.inject(LocationService);
  });

  afterEach(async () => {
    await spreadsheetDB.locations.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('clear', () => {
    it('clears all locations from database', async () => {
      await spreadsheetDB.locations.add({ address: '123 Main', place: 'Walmart' } as ILocation);

      await service.clear();

      const count = await spreadsheetDB.locations.count();
      expect(count).toBe(0);
    });
  });

  describe('list', () => {
    it('returns all locations from database', async () => {
      const location1: ILocation = { address: '123 Main', place: 'Walmart' } as ILocation;
      const location2: ILocation = { address: '456 Elm', place: 'Target' } as ILocation;
      await spreadsheetDB.locations.bulkAdd([location1, location2]);

      const result = await service.list();

      expect(result.length).toBe(2);
      expect(result[0].address).toBe('123 Main');
      expect(result[1].address).toBe('456 Elm');
    });

    it('returns empty array when no locations exist', async () => {
      const result = await service.list();

      expect(result).toEqual([]);
    });
  });

  describe('loadLocations', () => {
    it('clears existing and loads new locations', async () => {
      await spreadsheetDB.locations.add({ address: 'old', place: 'Old Place' } as ILocation);

      const newLocations: ILocation[] = [
        { address: '123 Main', place: 'Walmart' } as ILocation,
        { address: '456 Elm', place: 'Target' } as ILocation
      ];

      await service.load(newLocations);

      const result = await spreadsheetDB.locations.toArray();
      expect(result.length).toBe(2);
      expect(result.find(l => l.address === 'old')).toBeUndefined();
      expect(result.find(l => l.address === '123 Main')).toBeDefined();
    });
  });

  describe('queryRemoteLocations', () => {
    it('queries locations by field and value', async () => {
      const locations: ILocation[] = [
        { address: '123 Main', place: 'Walmart' } as ILocation,
        { address: '456 Elm', place: 'Target' } as ILocation,
        { address: '789 Oak', place: 'Walmart' } as ILocation
      ];
      await spreadsheetDB.locations.bulkAdd(locations);

      const result = await service.query('place', 'Walmart');

      expect(result.length).toBe(2);
      expect(result.every(l => l.place === 'Walmart')).toBeTrue();
    });

    it('returns empty array when no matches found', async () => {
      const result = await service.query('place', 'Nonexistent');

      expect(result).toEqual([]);
    });
  });
});
