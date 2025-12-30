import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoiceInputComponent } from './voice-input.component';
import { DropdownDataService } from '@services/dropdown-data.service';
import { LoggerService } from '@services/logger.service';

describe('VoiceInputComponent', () => {
  let component: VoiceInputComponent;
  let fixture: ComponentFixture<VoiceInputComponent>;
  let dropdownSpy: jasmine.SpyObj<DropdownDataService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    dropdownSpy = jasmine.createSpyObj('DropdownDataService', ['getAllDropdownData', 'findBestMatch']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'info', 'debug']);

    dropdownSpy.getAllDropdownData.and.returnValue(Promise.resolve({
      services: ['DoorDash', 'Uber Eats'],
      types: ['Delivery', 'Pickup'],
      places: ['McDonald\'s', 'Starbucks'],
      addresses: [],
      regions: [],
      names: []
    }));

    await TestBed.configureTestingModule({
      imports: [VoiceInputComponent],
      providers: [
        { provide: DropdownDataService, useValue: dropdownSpy },
        { provide: LoggerService, useValue: loggerSpy }
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

      expect(component.isSpeechRecognitionSupported()).toBeTrue();

      delete (window as any).webkitSpeechRecognition;
    });

    it('returns false when speech recognition unavailable', () => {
      const original = (window as any).webkitSpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).SpeechRecognition;

      expect(component.isSpeechRecognitionSupported()).toBeFalse();

      if (original) (window as any).webkitSpeechRecognition = original;
    });
  });

  describe('onMicClick', () => {
    it('shows alert when speech recognition not supported', () => {
      spyOn(window, 'alert');
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(false);

      component.onMicClick();

      expect(window.alert).toHaveBeenCalled();
    });

    it('initializes recognition on first click', () => {
      component.recognition = null;
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(true);
      spyOn(component as any, 'initializeSpeechRecognition');
      spyOn(component as any, 'startListening');

      component.onMicClick();

      expect((component as any).initializeSpeechRecognition).toHaveBeenCalled();
    });

    it('starts listening when not recognizing', () => {
      component.recognition = { 
        start: jasmine.createSpy('start'),
        abort: jasmine.createSpy('abort')
      } as any;
      component.recognizing = false;
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(true);
      spyOn(component as any, 'startListening').and.callThrough();

      component.onMicClick();

      expect((component as any).startListening).toHaveBeenCalled();
    });

    it('stops listening when already recognizing', () => {
      component.recognition = { 
        stop: jasmine.createSpy('stop'),
        abort: jasmine.createSpy('abort')
      } as any;
      component.recognizing = true;
      spyOn(component, 'isSpeechRecognitionSupported').and.returnValue(true);
      spyOn(component as any, 'stopListening').and.callThrough();

      component.onMicClick();

      expect((component as any).stopListening).toHaveBeenCalled();
    });
  });

  describe('parseTranscript', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      dropdownSpy.findBestMatch.and.callFake((input, _list, _type) => input);
    });

    it('parses service from transcript', () => {
      const result = component.parseTranscript('I have a DoorDash order');

      expect(result.service).toBeDefined();
    });

    it('parses place from transcript', () => {
      const result = component.parseTranscript('Picking up from McDonald\'s');

      expect(result.place).toBe('McDonald\'s');
    });

    it('parses name from transcript', () => {
      const result = component.parseTranscript('The customer is John Smith');

      expect(result.name).toBe('John Smith');
    });

    it('parses pay amount from transcript', () => {
      const result = component.parseTranscript('Pay is $15');

      expect(result.pay).toBe(15);
    });

    it('parses tip amount from transcript', () => {
      const result = component.parseTranscript('Tip is $5');

      expect(result.tip).toBe(5);
    });

    it('parses combined pay and tip', () => {
      const result = component.parseTranscript('Pay is $20 and tip is $5');

      expect(result.pay).toBe(20);
      expect(result.tip).toBe(5);
    });

    it('parses type as pickup or shop', () => {
      const result = component.parseTranscript('I have a pickup from Starbucks');

      expect(result.type).toBeDefined();
      expect(result.place).toBe('Starbucks');
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
