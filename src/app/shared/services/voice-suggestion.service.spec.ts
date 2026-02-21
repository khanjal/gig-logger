import { TestBed } from '@angular/core/testing';
import { VoiceSuggestionService } from './voice-suggestion.service';

describe('VoiceSuggestionService', () => {
  let service: VoiceSuggestionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceSuggestionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRandomSuggestion', () => {
    it('should return a non-empty string', () => {
      const suggestion = service.getRandomSuggestion();
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    it('should generate suggestions with provided service list', () => {
      const services = ['DoorDash', 'Uber Eats', 'Instacart'];
      const suggestions = new Set<string>();
      
      // Generate multiple suggestions to verify variety
      for (let i = 0; i < 50; i++) {
        const suggestion = service.getRandomSuggestion(services, [], []);
        suggestions.add(suggestion);
      }
      
      // Should have generated multiple unique suggestions
      expect(suggestions.size).toBeGreaterThan(1);
    });

    it('should generate suggestions with provided type list', () => {
      const types = ['delivery', 'pickup', 'shop'];
      const suggestions = new Set<string>();
      
      for (let i = 0; i < 50; i++) {
        const suggestion = service.getRandomSuggestion([], types, []);
        suggestions.add(suggestion);
      }
      
      expect(suggestions.size).toBeGreaterThan(1);
    });

    it('should generate suggestions with provided place list', () => {
      const places = ['McDonald\'s', 'Walmart', 'Target'];
      const suggestions = new Set<string>();
      
      for (let i = 0; i < 50; i++) {
        const suggestion = service.getRandomSuggestion([], [], places);
        suggestions.add(suggestion);
      }
      
      expect(suggestions.size).toBeGreaterThan(1);
    });

    it('should use default values when lists are empty', () => {
      const suggestion = service.getRandomSuggestion([], [], []);
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
    });

    it('should generate money-related suggestions', () => {
      const suggestions = new Set<string>();
      
      // Generate many suggestions to likely get money patterns
      for (let i = 0; i < 100; i++) {
        const suggestion = service.getRandomSuggestion();
        suggestions.add(suggestion);
      }
      
      // Check if any suggestions contain money indicators
      const hasMoneySuggestion = Array.from(suggestions).some(s => 
        s.includes('$') || 
        /\b(pay|tip|bonus|cash)\b/i.test(s)
      );
      expect(hasMoneySuggestion).toBe(true);
    });

    it('should generate distance-related suggestions', () => {
      const suggestions = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const suggestion = service.getRandomSuggestion();
        suggestions.add(suggestion);
      }
      
      const hasDistanceSuggestion = Array.from(suggestions).some(s => 
        /\b(mile|miles|distance|drove)\b/i.test(s)
      );
      expect(hasDistanceSuggestion).toBe(true);
    });

    it('should generate odometer-related suggestions', () => {
      const suggestions = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const suggestion = service.getRandomSuggestion();
        suggestions.add(suggestion);
      }
      
      const hasOdometerSuggestion = Array.from(suggestions).some(s => 
        /\b(odometer|odo)\b/i.test(s)
      );
      expect(hasOdometerSuggestion).toBe(true);
    });

    it('should generate name-related suggestions', () => {
      const suggestions = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const suggestion = service.getRandomSuggestion();
        suggestions.add(suggestion);
      }
      
      const hasNameSuggestion = Array.from(suggestions).some(s => 
        /\b(John|Sarah|Mike|Emily|Lisa|David|customer|name)\b/i.test(s)
      );
      expect(hasNameSuggestion).toBe(true);
    });

    it('should generate unit/order number suggestions', () => {
      const suggestions = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const suggestion = service.getRandomSuggestion();
        suggestions.add(suggestion);
      }
      
      const hasNumberSuggestion = Array.from(suggestions).some(s => 
        /\b(unit|apartment|room|suite|order|confirmation|tracking)\b/i.test(s)
      );
      expect(hasNumberSuggestion).toBe(true);
    });
  });
});
