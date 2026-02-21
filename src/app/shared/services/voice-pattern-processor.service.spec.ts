import { TestBed } from '@angular/core/testing';
import { VoicePatternProcessorService } from './voice-pattern-processor.service';
import { DropdownDataService } from './dropdown-data.service';

describe('VoicePatternProcessorService', () => {
  let service: VoicePatternProcessorService;
  let dropdownDataService: jasmine.SpyObj<DropdownDataService>;

  beforeEach(() => {
    const dropdownSpy = jasmine.createSpyObj('DropdownDataService', ['findBestMatch']);

    TestBed.configureTestingModule({
      providers: [
        VoicePatternProcessorService,
        { provide: DropdownDataService, useValue: dropdownSpy }
      ]
    });

    service = TestBed.inject(VoicePatternProcessorService);
    dropdownDataService = TestBed.inject(DropdownDataService) as jasmine.SpyObj<DropdownDataService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseTranscript', () => {
    it('should parse service from transcript', () => {
      dropdownDataService.findBestMatch.and.returnValue('DoorDash');
      const result = service.parseTranscript('I have a DoorDash', {
        serviceList: ['DoorDash', 'UberEats']
      });
      expect(result.service).toBe('DoorDash');
    });

    it('should parse pay amount', () => {
      const result = service.parseTranscript('pay is 15');
      expect(result.pay).toBe(15);
    });

    it('should parse combined service and type', () => {
      // Mock case-insensitive matching
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
      });
      
      const result = service.parseTranscript('got an Uber pickup', {
        serviceList: ['Uber', 'Lyft'],
        typeList: ['Pickup', 'Delivery']
      });
      expect(result.service).toBe('Uber');
      expect(result.type).toBe('Pickup');
    });

    it('should parse pay and tip combined', () => {
      const result = service.parseTranscript('pay 15 dollars and tip 3 dollars');
      expect(result.pay).toBe(15);
      expect(result.tip).toBe(3);
    });

    it('should parse pay, tip, and bonus combined', () => {
      const result = service.parseTranscript('$20 pay, $5 tip, $3 bonus');
      expect(result.pay).toBe(20);
      expect(result.tip).toBe(5);
      expect(result.bonus).toBe(3);
    });

    it('should parse distance', () => {
      const result = service.parseTranscript('distance is 5 miles');
      expect(result.distance).toBe(5);
    });

    it('should parse start odometer', () => {
      const result = service.parseTranscript('start odometer is 12345');
      expect(result.startOdometer).toBe(12345);
    });

    it('should parse end odometer', () => {
      const result = service.parseTranscript('end odometer is 12350');
      expect(result.endOdometer).toBe(12350);
    });

    it('should parse name', () => {
      const result = service.parseTranscript('customer is Jeremy');
      expect(result.name).toBe('Jeremy');
    });

    it('should parse place', () => {
      dropdownDataService.findBestMatch.and.returnValue('McDonald\'s');
      const result = service.parseTranscript('picking up from McDonald\'s', {
        placeList: ['McDonald\'s', 'Starbucks']
      });
      expect(result.place).toBe('McDonald\'s');
    });

    it('should respect pattern priority', () => {
      // Mock case-insensitive matching
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
      });
      
      const result = service.parseTranscript('got an Uber pickup', {
        serviceList: ['Uber', 'Lyft'],
        typeList: ['Pickup', 'Delivery']
      });
      // Combined pattern (priority 11) should be processed before individual patterns
      expect(result.service).toBe('Uber');
      expect(result.type).toBe('Pickup');
    });

    it('should not overwrite fields set by higher-priority patterns', () => {
      // Mock case-insensitive matching
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
      });
      
      const result = service.parseTranscript('I have a DoorDash pickup from Main Street', {
        serviceList: ['DoorDash', 'UberEats'],
        typeList: ['Pickup', 'Delivery'],
        placeList: ['Main Street']
      });
      // serviceType pattern (priority 11) sets service, individual service pattern (priority 20) should not override
      expect(result.service).toBe('DoorDash');
      expect(result.type).toBe('Pickup');
    });

    it('should handle unit numbers with letters', () => {
      const result = service.parseTranscript('unit 5B');
      expect(result.unitNumber).toBe('5B');
    });

    it('should parse order number', () => {
      const result = service.parseTranscript('order number ABC123');
      expect(result.orderNumber).toBe('ABC123');
    });
  });
});
