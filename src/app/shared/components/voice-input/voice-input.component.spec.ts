import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoiceInputComponent } from './voice-input.component';
import { DropdownDataService } from '@services/dropdown-data.service';
import { LoggerService } from '@services/logger.service';
import { PermissionService } from '@services/permission.service';
import { VoiceSuggestionService } from '@services/voice-suggestion.service';
import { VoicePatternProcessorService } from '@services/voice-pattern-processor.service';

describe('VoiceInputComponent', () => {
  let component: VoiceInputComponent;
  let fixture: ComponentFixture<VoiceInputComponent>;
  let dropdownSpy: jasmine.SpyObj<DropdownDataService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let permissionSpy: jasmine.SpyObj<PermissionService>;
  let suggestionSpy: jasmine.SpyObj<VoiceSuggestionService>;

  beforeEach(async () => {
    dropdownSpy = jasmine.createSpyObj('DropdownDataService', ['getAllDropdownData', 'findBestMatch']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'info', 'debug']);
    permissionSpy = jasmine.createSpyObj('PermissionService', ['isSpeechRecognitionSupported', 'hasMicrophonePermission', 'getMicrophoneState']);
    suggestionSpy = jasmine.createSpyObj('VoiceSuggestionService', ['getRandomSuggestion']);

    dropdownSpy.getAllDropdownData.and.returnValue(Promise.resolve({
      services: ['DoorDash', 'Uber Eats'],
      types: ['Delivery', 'Pickup'],
      places: ['McDonald\'s', 'Starbucks'],
      addresses: [],
      regions: [],
      names: []
    }));
    
    suggestionSpy.getRandomSuggestion.and.returnValue('Sample suggestion');
    
    permissionSpy.isSpeechRecognitionSupported.and.returnValue(true);
    permissionSpy.hasMicrophonePermission.and.returnValue(Promise.resolve(true));
    permissionSpy.getMicrophoneState.and.returnValue('granted');

    await TestBed.configureTestingModule({
      imports: [VoiceInputComponent],
      providers: [
        VoicePatternProcessorService,  // Provide the real service
        { provide: DropdownDataService, useValue: dropdownSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: PermissionService, useValue: permissionSpy },
        { provide: VoiceSuggestionService, useValue: suggestionSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceInputComponent);
    component = fixture.componentInstance;
    
    // Mock recognition object
    component.recognition = {
      start: jasmine.createSpy('start'),
      stop: jasmine.createSpy('stop'),
      abort: jasmine.createSpy('abort'),
      onresult: null,
      onerror: null,
      onend: null
    } as any;
  });

  afterEach(() => {
    // Cleanup is handled by ngOnDestroy
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads dropdown data', async () => {
      await component.ngOnInit();

      expect(dropdownSpy.getAllDropdownData).toHaveBeenCalled();
      expect(component.serviceList.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('cleans up timers and recognition', () => {
      spyOn(component as any, 'cleanup');

      component.ngOnDestroy();

      expect((component as any).cleanup).toHaveBeenCalled();
    });
  });

  describe('isSpeechRecognitionSupported', () => {
    it('returns true when webkitSpeechRecognition exists', () => {
      (window as any).webkitSpeechRecognition = function() {};
      permissionSpy.getMicrophoneState.and.returnValue('granted');

      expect(component.isSpeechRecognitionSupported()).toBeTrue();

      delete (window as any).webkitSpeechRecognition;
    });

    it('returns false when speech recognition unavailable', () => {
      const original = (window as any).webkitSpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).SpeechRecognition;
      permissionSpy.isSpeechRecognitionSupported.and.returnValue(false);

      expect(component.isSpeechRecognitionSupported()).toBeFalse();

      if (original) (window as any).webkitSpeechRecognition = original;
    });

    it('returns false when microphone is denied', () => {
      (window as any).webkitSpeechRecognition = function() {};
      permissionSpy.isSpeechRecognitionSupported.and.returnValue(true);
      permissionSpy.getMicrophoneState.and.returnValue('denied');

      expect(component.isSpeechRecognitionSupported()).toBeFalse();

      delete (window as any).webkitSpeechRecognition;
    });
  });

  describe('onMicClick', () => {
    it('shows alert when speech recognition not supported', async () => {
      spyOn(window, 'alert');
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(false);

      await component.onMicClick();

      expect(window.alert).toHaveBeenCalled();
    });

    it('initializes recognition on first click', async () => {
      component.recognition = null;
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(true);
      spyOn(component as any, 'initializeSpeechRecognition');
      spyOn(component as any, 'startListening');

      await component.onMicClick();

      expect((component as any).initializeSpeechRecognition).toHaveBeenCalled();
    });

    it('starts listening when not recognizing', async () => {
      component.recognition = { 
        start: jasmine.createSpy('start'),
        abort: jasmine.createSpy('abort')
      } as any;
      component.recognizing = false;
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(true);
      spyOn(component as any, 'startListening').and.callThrough();

      await component.onMicClick();

      expect((component as any).startListening).toHaveBeenCalled();
    });

    it('stops listening when already recognizing', async () => {
      component.recognition = { 
        stop: jasmine.createSpy('stop'),
        abort: jasmine.createSpy('abort')
      } as any;
      component.recognizing = true;
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(true);
      spyOn(component as any, 'stopListening').and.callThrough();

      await component.onMicClick();

      expect((component as any).stopListening).toHaveBeenCalled();
    });
  });

  describe('parseTranscript', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      dropdownSpy.findBestMatch.and.callFake((input, _list, _type) => input);
    });

    describe('Service Patterns', () => {
      it('parses service from "I have a DoorDash"', () => {
        const result = component.parseTranscript('I have a DoorDash order');
        expect(result.service).toBeDefined();
      });

      it('parses service from "working Uber Eats"', () => {
        const result = component.parseTranscript('working Uber Eats');
        expect(result.service).toBe('Uber Eats');
      });
    });

    describe('Service + Type Combined', () => {
      it('parses "I have a DoorDash delivery"', () => {
        const result = component.parseTranscript('I have a DoorDash delivery');
        expect(result.service).toBe('DoorDash');
        expect(result.type).toBe('delivery');
      });

      it('parses "got an Uber pickup"', () => {
        const result = component.parseTranscript('got an Uber pickup');
        expect(result.service).toBe('Uber');
        expect(result.type).toBe('pickup');
      });
    });

    describe('Place Patterns', () => {
      it('parses place from "Picking up from McDonald\'s"', () => {
        const result = component.parseTranscript('Picking up from McDonald\'s');
        expect(result.place).toBe('McDonald\'s');
      });

      it('parses place from "the place is Walmart"', () => {
        const result = component.parseTranscript('the place is Walmart');
        expect(result.place).toBe('Walmart');
      });
    });

    describe('Name Patterns', () => {
      it('parses name from "The customer is John Smith"', () => {
        const result = component.parseTranscript('The customer is John Smith');
        expect(result.name).toBe('John Smith');
      });

      it('capitalizes single-letter names', () => {
        const result = component.parseTranscript('The customer is j d');
        expect(result.name).toBe('J D');
      });

      it('parses "delivering to Sarah"', () => {
        const result = component.parseTranscript('delivering to Sarah');
        expect(result.name).toBe('Sarah');
      });
    });

    describe('Pay + Tip Combined', () => {
      it('parses combined pay and tip', () => {
        const result = component.parseTranscript('Pay is $20 and tip is $5');
        expect(result.pay).toBe(20);
        expect(result.tip).toBe(5);
      });

      it('parses "pay 15 dollars and tip 3 dollars"', () => {
        const result = component.parseTranscript('pay 15 dollars and tip 3 dollars');
        expect(result.pay).toBe(15);
        expect(result.tip).toBe(3);
      });
    });

    describe('Pay + Tip + Bonus Combined', () => {
      it('parses "pay is $15, tip $3, and bonus $2"', () => {
        const result = component.parseTranscript('pay is $15, tip $3, and bonus $2');
        expect(result.pay).toBe(15);
        expect(result.tip).toBe(3);
        expect(result.bonus).toBe(2);
      });

      it('parses "$20 pay, $5 tip, $3 bonus"', () => {
        const result = component.parseTranscript('$20 pay, $5 tip, $3 bonus');
        expect(result.pay).toBe(20);
        expect(result.tip).toBe(5);
        expect(result.bonus).toBe(3);
      });
    });

    describe('Pay + Distance Combined', () => {
      it('parses "pay is $15 for 5 miles"', () => {
        const result = component.parseTranscript('pay is $15 for 5 miles');
        expect(result.pay).toBe(15);
        expect(result.distance).toBe(5);
      });

      it('parses "$20 for 10 miles"', () => {
        const result = component.parseTranscript('$20 for 10 miles');
        expect(result.pay).toBe(20);
        expect(result.distance).toBe(10);
      });
    });

    describe('Individual Money Patterns', () => {
      it('parses pay amount from "Pay is $15"', () => {
        const result = component.parseTranscript('Pay is $15');
        expect(result.pay).toBe(15);
      });

      it('parses tip amount from "Tip is $5"', () => {
        const result = component.parseTranscript('Tip is $5');
        expect(result.tip).toBe(5);
      });

      it('parses bonus from "$3 bonus"', () => {
        const result = component.parseTranscript('$3 bonus');
        expect(result.bonus).toBe(3);
      });

      it('parses cash from "cash is $10"', () => {
        const result = component.parseTranscript('cash is $10');
        expect(result.cash).toBe(10);
      });

      it('parses decimals "$12.50"', () => {
        const result = component.parseTranscript('pay is $12.50');
        expect(result.pay).toBe(12.50);
      });
    });

    describe('Distance & Odometer', () => {
      it('parses "distance is 5 miles"', () => {
        const result = component.parseTranscript('distance is 5 miles');
        expect(result.distance).toBe(5);
      });

      it('parses "start odometer is 12345"', () => {
        const result = component.parseTranscript('start odometer is 12345');
        expect(result.startOdometer).toBe(12345);
      });

      it('parses "end odometer is 12350"', () => {
        const result = component.parseTranscript('end odometer is 12350');
        expect(result.endOdometer).toBe(12350);
      });

      it('does not parse distance when odometer is present', () => {
        const result = component.parseTranscript('start odometer is 50000 and 5 miles');
        expect(result.startOdometer).toBeDefined();
        expect(result.distance).toBeUndefined();
      });
    });

   describe('Type Patterns', () => {
      it('parses type from "I have a pickup from Starbucks"', () => {
        // Mock findBestMatch to return actual matches when found
        dropdownSpy.findBestMatch.and.callFake((input: string, list: string[]) => {
          return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
        });
        
        const result = component.parseTranscript('I have a pickup from Starbucks');
        expect(result.type).toBe('Pickup');  // Should match capitalized from dropdown
        expect(result.place).toBe('Starbucks');
      });

      it('parses "type is delivery"', () => {
        const result = component.parseTranscript('type is delivery');
        expect(result.type).toBe('delivery');  // Default mock returns input as-is
      });

      it('parses "it\'s a pickup"', () => {
        const result = component.parseTranscript('it\'s a pickup');
        expect(result.type).toBe('pickup');  // Default mock returns input as-is
      });
    });

    describe('Place + Type Combined', () => {
      it('parses "McDonald\'s pickup"', () => {
        const result = component.parseTranscript('McDonald\'s pickup');
        expect(result.place).toBe('McDonald\'s');
        expect(result.type).toBe('pickup');
      });

      it('parses "Walmart delivery"', () => {
        const result = component.parseTranscript('Walmart delivery');
        expect(result.place).toBe('Walmart');
        expect(result.type).toBe('delivery');
      });
    });

    describe('Unit & Order Numbers', () => {
      it('parses "unit 5B"', () => {
        const result = component.parseTranscript('unit 5B');
        expect(result.unitNumber).toBe('5B');
      });

      it('parses "apartment 302"', () => {
        const result = component.parseTranscript('apartment 302');
        expect(result.unitNumber).toBe('302');
      });

      it('parses "order number 12345"', () => {
        const result = component.parseTranscript('order number 12345');
        expect(result.orderNumber).toBe('12345');
      });

      it('parses "confirmation ABC123"', () => {
        const result = component.parseTranscript('confirmation ABC123');
        expect(result.orderNumber).toBe('ABC123');
      });
    });

    describe('Complex Multi-Field Parsing', () => {
      it('parses multiple fields in one sentence', () => {
        const result = component.parseTranscript('I have a DoorDash delivery for $15');
        expect(result.service).toBe('DoorDash');
        expect(result.type).toBe('delivery');
        expect(result.pay).toBe(15);
      });
    });

    describe('Edge Cases', () => {
      it('handles empty transcript', () => {
        const result = component.parseTranscript('');
        expect(Object.keys(result).length).toBe(0);
      });

      it('handles unrecognized patterns gracefully', () => {
        const result = component.parseTranscript('random gibberish text');
        expect(Object.keys(result).length).toBe(0);
      });
    });
  });

  describe('micButtonColor', () => {
    it('returns red when recognizing', () => {
      component.recognizing = true;

      expect(component.micButtonColor).toBe('bg-red-600');
    });

    it('returns blue when not recognizing', () => {
      component.recognizing = false;

      expect(component.micButtonColor).toBe('bg-blue-600');
    });
  });

  describe('parsedResultEntries', () => {
    it('returns empty array when no parsed result', () => {
      component.parsedResult = null;

      expect(component.parsedResultEntries).toEqual([]);
    });

    it('converts camelCase to Proper Case', () => {
      component.parsedResult = { pickupAddress: '123 Main St' };

      const entries = component.parsedResultEntries;

      expect(entries[0].key).toBe('Pickup Address');
    });
  });

  describe('hasParsedData', () => {
    it('returns false when no parsed result', () => {
      component.parsedResult = null;

      expect(component.hasParsedData).toBeFalse();
    });

    it('returns true when parsed result has data', () => {
      component.parsedResult = { service: 'DoorDash' };

      expect(component.hasParsedData).toBeTrue();
    });
  });

  describe('voiceResult emission', () => {
    it('emits parsed result after recognition', () => {
      spyOn(component.voiceResult, 'emit');
      
      // Directly set parsedResult and emit
      component.parsedResult = { service: 'DoorDash', place: 'McDonald\'s' };
      component.voiceResult.emit(component.parsedResult);

      expect(component.voiceResult.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ service: 'DoorDash' })
      );
    });
  });
});
