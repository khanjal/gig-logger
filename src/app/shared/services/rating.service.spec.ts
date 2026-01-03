import { TestBed } from '@angular/core/testing';
import { RatingService } from './rating.service';
import { IRating } from '@interfaces/rating.interface';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('RatingService', () => {
  let service: RatingService;

  // Helper to create valid IRating objects
  const createMockRating = (overrides: Partial<IRating> = {}): IRating => ({
    date: '2024-01-15',
    time: '14:30',
    service: 'DoorDash',
    overall: 4.8,
    overallPercent: 96,
    fiveStar: 100,
    fourStar: 20,
    threeStar: 5,
    twoStar: 2,
    oneStar: 1,
    communication: 5,
    instruction: 5,
    handling: 4,
    friendly: 5,
    efficient: 5,
    extraEffort: 4,
    acceptance: 85,
    completion: 98,
    early: 75,
    violation: 0,
    ...overrides
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [RatingService]
    });
    service = TestBed.inject(RatingService);

    // Clear database before each test
    await spreadsheetDB.ratings.clear();
  });

  afterEach(async () => {
    // Clean up database after each test
    await spreadsheetDB.ratings.clear();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have rating$ observable', () => {
      expect(service.rating$).toBeDefined();
    });
  });

  describe('getRemoteRatings', () => {
    it('should fetch all ratings from database', async () => {
      const mockRatings = [
        createMockRating({ service: 'DoorDash', overall: 4.8 }),
        createMockRating({ service: 'Uber Eats', overall: 4.5 })
      ];
      await spreadsheetDB.ratings.bulkAdd(mockRatings);

      const result = await service.getRemoteRatings();

      expect(result.length).toBe(2);
      expect(result[0].service).toBe('DoorDash');
      expect(result[1].service).toBe('Uber Eats');
    });

    it('should return empty array when no ratings exist', async () => {
      const result = await service.getRemoteRatings();

      expect(result).toEqual([]);
    });

    it('should return all rating properties', async () => {
      const rating = createMockRating();
      await spreadsheetDB.ratings.add(rating);

      const result = await service.getRemoteRatings();

      expect(result.length).toBe(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].service).toBe('DoorDash');
      expect(result[0].overall).toBe(4.8);
      expect(result[0].fiveStar).toBe(100);
      expect(result[0].communication).toBe(5);
    });
  });

  describe('load', () => {
    it('should clear existing ratings and add new ones', async () => {
      // Add initial ratings
      const initialRatings = [createMockRating({ service: 'Initial' })];
      await spreadsheetDB.ratings.bulkAdd(initialRatings);

      // Load new ratings
      const newRatings = [
        createMockRating({ service: 'New1' }),
        createMockRating({ service: 'New2' })
      ];
      await service.load(newRatings);

      const result = await spreadsheetDB.ratings.toArray();
      expect(result.length).toBe(2);
      expect(result[0].service).toBe('New1');
      expect(result[1].service).toBe('New2');
    });

    it('should load empty array of ratings', async () => {
      // Add initial ratings
      await spreadsheetDB.ratings.add(createMockRating());

      await service.load([]);

      const result = await spreadsheetDB.ratings.toArray();
      expect(result).toEqual([]);
    });

    it('should load large number of ratings', async () => {
      const manyRatings = Array.from({ length: 50 }, (_, i) =>
        createMockRating({ service: `Service${i + 1}`, overall: (i % 5) + 1 })
      );

      await service.load(manyRatings);

      const result = await spreadsheetDB.ratings.toArray();
      expect(result.length).toBe(50);
    });

    it('should preserve all rating properties', async () => {
      const rating = createMockRating({
        date: '2024-12-28',
        time: '15:45',
        service: 'GrubHub',
        overall: 5.0,
        fiveStar: 150,
        communication: 5,
        friendly: 5
      });

      await service.load([rating]);

      const result = await spreadsheetDB.ratings.toArray();
      expect(result.length).toBe(1);
      expect(result[0].date).toBe('2024-12-28');
      expect(result[0].time).toBe('15:45');
      expect(result[0].service).toBe('GrubHub');
      expect(result[0].overall).toBe(5.0);
      expect(result[0].fiveStar).toBe(150);
    });
  });

  describe('Integration Scenarios', () => {
    it('should load ratings and then retrieve them', async () => {
      const ratings = [
        createMockRating({ service: 'DoorDash', overall: 5.0 }),
        createMockRating({ service: 'Uber Eats', overall: 4.5 })
      ];

      await service.load(ratings);
      const result = await service.getRemoteRatings();

      expect(result.length).toBe(2);
      expect(result[0].service).toBe('DoorDash');
      expect(result[1].service).toBe('Uber Eats');
    });

    it('should replace existing ratings when loading new ones', async () => {
      const oldRatings = [createMockRating({ service: 'Old' })];
      const newRatings = [createMockRating({ service: 'New' })];

      // Load old ratings
      await service.load(oldRatings);
      let result = await service.getRemoteRatings();
      expect(result.length).toBe(1);
      expect(result[0].service).toBe('Old');

      // Load new ratings (should clear old ones)
      await service.load(newRatings);
      result = await service.getRemoteRatings();
      expect(result.length).toBe(1);
      expect(result[0].service).toBe('New');
    });

    it('should handle multiple load calls in sequence', async () => {
      await service.load([createMockRating({ service: 'First' })]);
      await service.load([createMockRating({ service: 'Second' })]);
      await service.load([createMockRating({ service: 'Third' })]);

      const result = await service.getRemoteRatings();
      expect(result.length).toBe(1);
      expect(result[0].service).toBe('Third');
    });

    it('should handle complex rating data', async () => {
      const complexRating = createMockRating({
        date: '2024-12-28',
        time: '18:30',
        service: 'DoorDash',
        overall: 4.95,
        overallPercent: 99,
        fiveStar: 200,
        fourStar: 10,
        threeStar: 2,
        twoStar: 0,
        oneStar: 0,
        communication: 5,
        instruction: 5,
        handling: 5,
        friendly: 5,
        efficient: 5,
        extraEffort: 5,
        acceptance: 95,
        completion: 99,
        early: 85,
        violation: 0
      });

      await service.load([complexRating]);
      const result = await service.getRemoteRatings();

      expect(result.length).toBe(1);
      const loaded = result[0];
      expect(loaded.overall).toBe(4.95);
      expect(loaded.overallPercent).toBe(99);
      expect(loaded.fiveStar).toBe(200);
      expect(loaded.acceptance).toBe(95);
      expect(loaded.violation).toBe(0);
    });
  });
});
