import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { DropdownDataService } from '@services/dropdown-data.service';
import { LoggerService } from '@services/logger.service';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { NumberHelper } from '@helpers/number.helper';
import { AddressHelper } from '@helpers/address.helper';

/**
 * Interface for parsed voice input results
 */
interface VoiceParseResult {
  service?: string;
  type?: string;
  place?: string;
  name?: string;
  pay?: number;
  tip?: number;
  bonus?: number;
  cash?: number;
  distance?: number;
  startOdometer?: number;
  endOdometer?: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  unitNumber?: string;
  orderNumber?: string;
}

@Component({
  selector: 'voice-input',
  templateUrl: './voice-input.component.html',
  styleUrls: ['./voice-input.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIcon]
})

export class VoiceInputComponent implements OnInit, OnDestroy {
  // Dropdown data (from database + canonical JSON fallback)
  serviceList: string[] = [];
  addressList: string[] = [];
  typeList: string[] = [];
  placeList: string[] = [];

  // Component state
  transcript: string = '';
  parsedResult: VoiceParseResult | null = null;
  recognition: any = null;
  recognizing: boolean = false;
  private transcriptTimeout: any = null;
  suggestionPhrase: string = '';

  // Auto-hide delay (in milliseconds)
  private readonly TRANSCRIPT_AUTO_HIDE_DELAY = 3000;

  constructor(
    private _dropdownDataService: DropdownDataService,
    private logger: LoggerService
  ) {}

  async ngOnInit(): Promise<void> {
    // Load dropdown data (service handles canonical fallback)
    const data = await this._dropdownDataService.getAllDropdownData();
    this.serviceList = data.services;
    this.typeList = data.types;
    this.placeList = data.places;
    this.addressList = data.addresses;
  }

  @Output() voiceResult = new EventEmitter<VoiceParseResult>();

  /**
   * Helper to match the first pattern and run a callback on match.
   */
  private matchFirstPattern<T>(
    patterns: RegExp[], 
    transcript: string, 
    onMatch: (match: RegExpMatchArray) => T | undefined
  ): T | undefined {
    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        const result = onMatch(match);
        if (result !== undefined) return result;
      }
    }
    return undefined;
  }

  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.transcriptTimeout) {
      clearTimeout(this.transcriptTimeout);
      this.transcriptTimeout = null;
    }
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
  }

  onMicClick(): void {
    if (!this.isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    if (!this.recognition) {
      this.initializeSpeechRecognition();
    }

    if (!this.recognizing) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    
    this.recognition.onresult = (event: any) => this.handleRecognitionResult(event);
    this.recognition.onerror = (event: any) => this.handleRecognitionError(event);
    this.recognition.onend = () => {
      this.recognizing = false;
    };
  }

  private handleRecognitionResult(event: any): void {
    const result = event.results[0][0].transcript;
    this.transcript = result;
    const parsed = this.parseTranscript(result);
    this.parsedResult = parsed;
    this.voiceResult.emit(parsed);
    this.recognizing = false;
    
    // Auto-hide transcript after delay
    this.scheduleTranscriptHide();
  }

  private handleRecognitionError(event: any): void {
    this.logger.error('VoiceInput - Speech recognition error:', event.error);
    
    const errorMessages: { [key: string]: string } = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone detected. Please check your device settings.',
      'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
      'network': 'Network error. Please check your internet connection.',
    };
    
    const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
    alert(message);
    this.recognizing = false;
  }

  private startListening(): void {
    this.transcript = '';
    this.parsedResult = null;
    this.suggestionPhrase = this.getRandomSuggestion();
    
    try {
      this.recognition.start();
      this.recognizing = true;
    } catch (error) {
      this.logger.error('VoiceInput - Failed to start recognition:', error);
      this.recognizing = false;
    }
  }

  private stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.recognizing = false;
    this.suggestionPhrase = '';
  }

  private scheduleTranscriptHide(): void {
    if (this.transcriptTimeout) {
      clearTimeout(this.transcriptTimeout);
    }
    
    this.transcriptTimeout = setTimeout(() => {
      this.transcript = '';
      this.parsedResult = null;
    }, this.TRANSCRIPT_AUTO_HIDE_DELAY);
  }

  get micButtonColor(): string {
    // Always blue when inactive, always red when active, no hover color
    return this.recognizing ? 'bg-red-600' : 'bg-blue-600';
  }

  /**
   * Gets the parsed result as an array of key-value pairs for template iteration
   */
  get parsedResultEntries(): Array<{ key: string; value: string }> {
    if (!this.parsedResult) return [];
    // Convert camelCase keys to Proper Case with spaces
    const toProperCase = (str: string) =>
      str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
    return Object.entries(this.parsedResult).map(([key, value]) => ({ key: toProperCase(key), value: value || '' }));
  }

  /**
   * Checks if parsed result has any data
   */
  get hasParsedData(): boolean {
    return this.parsedResultEntries.length > 0;
  }

  /**
   * Parses the recognized speech and returns an object with fields.
   */
  parseTranscript(transcript: string): VoiceParseResult {
    const result: VoiceParseResult = {};
    
    // Special: Handle 'pickup' or 'shop' as type, and extract place after 'from'
    // e.g. 'I have a pickup from McDonald's', 'a shop from Dollar General'
    const pickupShopPattern = /(?:have a |a )?(pickup|shop) from ([\w\s''`.,&-]+)/i;
    const pickupShopMatch = transcript.match(pickupShopPattern);
    if (pickupShopMatch) {
      result.type = this._dropdownDataService.findBestMatch(pickupShopMatch[1], this.typeList, 'Type') || pickupShopMatch[1];
      const placeCandidate = this._dropdownDataService.findBestMatch(pickupShopMatch[2], this.placeList, 'Place');
      if (placeCandidate) result.place = placeCandidate;
      else result.place = pickupShopMatch[2];
    }

    // SERVICE: "I have a doordash", "working uber", "service is lyft"
    const servicePatterns = [
      /(?:i have (?:a|an)|i got (?:a|an)|got (?:a|an))\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:working|doing|on|driving|running)\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:service|app|platform) (?:is|was|:)\s*((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+)/i,
      /(?:using|with)\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:it'?s|this is)\s+(?:a|an)\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|gig)|$)/i
    ];
    const service = this.matchFirstPattern(servicePatterns, transcript, match => {
      const raw = match[1].trim();
      return this._dropdownDataService.findBestMatch(raw, this.serviceList, 'Service');
    });
    if (service) result.service = service;

    // NAME vs PLACE: Context-aware parsing
    // Parse NAME first to avoid conflicts
    // "the customer/name is X" = name
    // "picking up from X" = place
    
    // NAME patterns (customer/dropoff): "the name is John", "the customer is Jeremy", "taking it to Jane"
    const namePatterns = [
      /(?:(?:the )?(?:name|person|customer|client) (?:is|was|:)|customer's|client's|name:|customer name is)\s*([\w\s]+?)$/i,
      /(?:drop(?:ping)? off (?:at|to|with|for)|dropoff (?:at|to|with|for)|dropping (?:at|to|with|for))\s+([\w\s]+?)$/i,
      /(?:delivering to|deliver to|delivery (?:to|for)|taking (?:it )?to|going to|headed to|bringing (?:it )?to)\s+([\w\s]+?)$/i,
      /(?:for|to)\s+([\w\s]+?)$/i
    ];
    const name = this.matchFirstPattern(namePatterns, transcript, match => match[1].trim());
    if (name) {
      // Capitalize any single-character word in the name
      result.name = name.replace(/\b([a-zA-Z])\b/g, (m, c) => c.toUpperCase());
    }

    // PLACE patterns (pickup/pick-up location): "picking up from McDonald's", "the place is Starbucks", "from McDonald's"
    // Only match if NAME wasn't already set
    if (!result.name) {
      const placePatterns = [
        /(?:pick(?:ing)?[- ]?up (?:from|at)|pick[- ]?up (?:from|at)|grabbing (?:from|at)|getting (?:from|at))\s+([\w\s''`'.,&-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
        /(?:place is|place:|the place is|location is|store is|restaurant is|merchant is)\s+([\w\s''`'.,&-]+?)$/i,
        /(?:from|at)\s+([\w\s''`.,&-]+?)(?=\s+(?:and|to|drop|deliver|going)|$)/i
      ];
      const place = this.matchFirstPattern(placePatterns, transcript, match => {
        const raw = match[1].trim();
        const placeCandidate = this._dropdownDataService.findBestMatch(raw, this.placeList, 'Place');
        return placeCandidate || raw;
      });
      if (place) result.place = place;
    }

    // ADDRESS extraction is disabled for now; focus on name only

    // COMBINED PAY + TIP: Only match if both 'pay' and 'tip' are present as field names
    const payTipPattern = /(?:pay(?:ment)? (?:is|was|:)?\s*)?\$?([\w\s.-]+?)\s*(?:dollar(?:s)?)?\s*and\s*(?:tip (?:is|was|:)?\s*)?\$?([\w\s.-]+?)(?:\s*dollar(?:s)?)?$/i;
    if (/pay(?:ment)?[\w\s:$]*and[\w\s:$]*tip/i.test(transcript) || /tip[\w\s:$]*and[\w\s:$]*pay(?:ment)?/i.test(transcript)) {
      const payTipMatch = transcript.match(payTipPattern);
      if (payTipMatch) {
        const payValue = NumberHelper.convertWordToNumber(payTipMatch[1].trim());
        const tipValue = NumberHelper.convertWordToNumber(payTipMatch[2].trim());
        // Only set if they're valid numbers
        if (/^\d+(?:\.\d{1,2})?$/.test(payValue.toString())) result.pay = payValue;
        if (/^\d+(?:\.\d{1,2})?$/.test(tipValue.toString())) result.tip = tipValue;
      }
    }

    // COMBINED PAY + DISTANCE: "pay is 15 for 5 miles", "20 dollars for 10 miles"
    const payDistancePattern = /(?:pay(?:ment)? (?:is|was|:)|paid|amount (?:is|was|:))?\s*\$?(\d+(?:\.\d{1,2})?)\s*(?:dollar(?:s)?)?\s*for\s*(\d+(?:\.\d+)?)\s*(mile|miles|mi|me|km|kilometer|kilometers)/i;
    const payDistanceMatch = transcript.match(payDistancePattern);
    if (payDistanceMatch) {
      result.pay = NumberHelper.getNumberFromString(payDistanceMatch[1]);
      result.distance = NumberHelper.getNumberFromString(payDistanceMatch[2]);
    }

    // PAYMENT: "$15", "15 dollars", "pay is fifteen" (only if not already set by combined pattern)
    if (!result.pay) {
      const payPatterns = [
        /(?:(?:the )?pay(?:ment|out)? (?:is|was|:)|paid|(?:the )?amount (?:is|was|:)|made|earned|got paid|(?:the )?total (?:is|was|:))\s*\$?([\d.]+|[\w.-]+)/i,
        // Only match 'dollars' if not in a phrase containing 'tip', 'bonus', or 'cash' before or after
        /(?<!(?:tip|bonus|cash)[^\d]{0,20})(\d+(?:\.\d+)?)\s*dollar(?:s)?(?![^\d]{0,20}(?:tip|bonus|cash))/i,
        // Only match $amount if not in a phrase containing 'tip', 'bonus', or 'cash' before or after
        /(?<!(?:tip|bonus|cash)[^$]{0,20})\$(\d+(?:\.\d+)?)(?![^$]{0,20}(?:tip|bonus|cash))/i
      ];

      const pay = this.matchFirstPattern(payPatterns, transcript, match => {
        const raw = match[1].trim();
        // If already a valid number, use it directly
        if (/^\d+(?:\.\d+)?$/.test(raw)) {
          return parseFloat(raw);
        }
        // Otherwise convert word to number
        const converted = NumberHelper.convertWordToNumber(raw);
        if (/^\d+(?:\.\d+)?$/.test(converted.toString())) return converted;
        return undefined;
      });
      if (pay) result.pay = pay;
    }

    // TIP: "$5 tip", "five dollar tip", "tip is five" (only if not already set by combined pattern)
    if (!result.tip) {
      const tipPatterns = [
        /(?:(?:the )?tip (?:is|was|:|of)|tipped(?: me)?|left (?:a )?tip|customer tipped|they tipped|(?:the )?gratuity (?:is|was|:))\s*\$?([\d.]+|[\w.-]+)/i,
        /\$?(\d+(?:\.\d+)?)\s*(?:dollar|buck)(?:s)?\s*(?:tip|gratuity)/i,
        /(\d+(?:\.\d+)?|[\w-]+)\s*(?:dollar|buck)(?:s)?\s*(?:tip|gratuity)/i,
        /\$(\d+(?:\.\d+)?)\s*(?:tip|gratuity)/i
      ];

      const tip = this.matchFirstPattern(tipPatterns, transcript, match => {
        const raw = match[1].trim();
        // If already a valid number, use it directly
        if (/^\d+(?:\.\d+)?$/.test(raw)) {
          return parseFloat(raw);
        }
        // Otherwise convert word to number
        const converted = NumberHelper.convertWordToNumber(raw);
        if (/^\d+(?:\.\d+)?$/.test(converted.toString())) return converted;
        return undefined;
      });
      if (tip) result.tip = tip;
    }

    // BONUS: "bonus is 5", "five dollar bonus", "$5 bonus"
    const bonusPatterns = [
      /(?:(?:the )?bonus (?:is|was|:|of)|promo|promotion|incentive|peak pay|quest|surge)\s*\$?([\d.]+|[\w.-]+)/i,
      /\$?(\d+(?:\.\d+)?)\s*(?:dollar|buck)(?:s)?\s*(?:bonus|promo|promotion|incentive)/i,
      /([\d.]+|[\w-]+)\s*(?:dollar|buck)(?:s)?\s*(?:bonus|promo|promotion|incentive)/i
    ];

    const bonus = this.matchFirstPattern(bonusPatterns, transcript, match => {
      const raw = match[1].trim();
      if (/^\d+(?:\.\d+)?$/.test(raw)) {
        return parseFloat(raw);
      }
      const converted = NumberHelper.convertWordToNumber(raw);
      if (/^\d+(?:\.\d+)?$/.test(converted.toString())) return converted;
      return undefined;
    });
    if (bonus) result.bonus = bonus;

    // CASH: "cash is 10", "ten dollars cash", "$10 cash"
    const cashPatterns = [
      /(?:(?:the )?cash (?:is|was|:|payment|tip))\s*\$?([\d.]+|[\w.-]+)/i,
      /(?:given|received|got)\s*\$?([\d.]+|[\w.-]+)\s*(?:in )?cash/i,
      /\$?([\d.]+)\s*(?:dollar|buck)(?:s)?\s*(?:cash|in cash)/i,
      /([\d.]+|[\w-]+)\s*(?:dollar|buck)(?:s)?\s*(?:cash|in cash)/i,
      /(?:paid|paying|payed)\s*(?:in\s+)?cash\s*\$?([\d.]+|[\w.-]+)/i
    ];

    const cash = this.matchFirstPattern(cashPatterns, transcript, match => {
      const raw = match[1].trim();
      if (/^\d+(?:\.\d+)?$/.test(raw)) {
        return parseFloat(raw);
      }
      const converted = NumberHelper.convertWordToNumber(raw);
      if (/^\d+(?:\.\d+)?$/.test(converted.toString())) return converted;
      return undefined;
    });
    if (cash) result.cash = cash;

    // PICKUP ADDRESS: "picking up at 123 Main Street", "pickup address is downtown", "pick-up address is downtown"
    const pickupAddressPatterns = [
      /(?:pick(?:ing)?[- ]?up (?:at|on|from))\s+([\w\s,.-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
      /(?:pick[- ]?up (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:from (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:start(?:ing)? (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ];

    const pickupAddress = this.matchFirstPattern(pickupAddressPatterns, transcript, match => match[1].trim());
    if (pickupAddress) result.pickupAddress = AddressHelper.getShortAddress(pickupAddress);

    // DROPOFF/DESTINATION ADDRESS: "dropping off at 456 Elm St", "destination is Main Street", "going to 789 Oak Ave"
    const dropoffAddressPatterns = [
      /(?:drop(?:ping)? off (?:at|on|to)|drop[- ]?off (?:at|on|to)|dropping (?:at|on|to))\s+([\w\s,.-]+?)$/i,
      /(?:drop[- ]?off (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:destination (?:is|was|:)|destination (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:to (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:going to|heading to|delivering to)\s+([\w\s,.-]+?)$/i,
      /(?:end (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ];

    const dropoffAddress = this.matchFirstPattern(dropoffAddressPatterns, transcript, match => match[1].trim());
    if (dropoffAddress) result.dropoffAddress = AddressHelper.getShortAddress(dropoffAddress);

    // Verify pickupAddress against addressList
    if (result.pickupAddress) {
      const verifiedPickup = this._dropdownDataService.findBestMatch(result.pickupAddress, this.addressList, 'Address');
      if (verifiedPickup) {
        result.pickupAddress = verifiedPickup;
      }
    }

    // Verify dropoffAddress against addressList
    if (result.dropoffAddress) {
      const verifiedDropoff = this._dropdownDataService.findBestMatch(result.dropoffAddress, this.addressList, 'Address');
      if (verifiedDropoff) {
        result.dropoffAddress = verifiedDropoff;
      }
    }

    // START ODOMETER: "start odometer is 12345", "odometer start 12345", "odo start 12345"
    const startOdometerPatterns = [
      /(?:start(?:ing)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i,
      /(?:odometer|odo) start (?:is|was|:)?\s*([\w.,-]+)/i,
      /(?:begin(?:ning)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i
    ];
    const endOdometerPatterns = [
      /(?:end(?:ing)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i,
      /(?:odometer|odo) end (?:is|was|:)?\s*([\w.,-]+)/i,
      /(?:final (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i
    ];

    const startOdometerMatch = this.matchFirstPattern(startOdometerPatterns, transcript, match => {
      let raw = NumberHelper.convertWordToNumber(match[1].trim());
      return raw;
    });
    if (startOdometerMatch) result.startOdometer = startOdometerMatch;

    const endOdometerMatch = this.matchFirstPattern(endOdometerPatterns, transcript, match => {
      let raw = NumberHelper.convertWordToNumber(match[1].trim());
      return raw;
    });
    if (endOdometerMatch) result.endOdometer = endOdometerMatch;

    // DISTANCE: Only match with explicit distance context to avoid odometer confusion
    // Supports miles and kilometers (mile, mi, km, kilometer, kilometers)
    // Do NOT match distance if odometer start or end was matched
    if (!result.distance && !result.startOdometer && !result.endOdometer) {
      const distancePatterns = [
        /(?:\bdistance (?:is|was|:)|total distance\b)\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i,
        /(?:\bdrove|traveled|went|it was\b)\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i,
        /\b(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b\s*(?:away|trip|drive|total)?/i,
        /\bfor\s+(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i
      ];
      const distance = this.matchFirstPattern(distancePatterns, transcript, match => match[1]);
      if (distance) result.distance = NumberHelper.getNumberFromString(distance);
    }

    // TYPE: "type is delivery", "it's a pickup", "delivery order"
    const typePatterns = [
      /(?:(?:the )?type (?:is|was|:))\s*([\w\s]+?)(?=\s+(?:for|to|at|from)|$)/i,
      /(?:it'?s a|this is a|got a|have a|doing a|on a)\s*(delivery|pickup|dropoff|drop off|ride|shop|shopping)/i,
      /(delivery|pickup|dropoff|drop off|ride|shop|shopping)\s*(?:order|trip|run|gig)/i
    ];

    const type = this.matchFirstPattern(typePatterns, transcript, match => {
      const raw = match[1].trim();
      return this._dropdownDataService.findBestMatch(raw, this.typeList, 'Type');
    });

    if (type) result.type = type;

    // UNIT NUMBER: apartment, building, floor, room, unit, suite, etc.
    // Excludes "order" to prevent cross-matching with order number
    const unitPatterns = [
      /(?:unit|apartment|apt|building|bldg|floor|room|suite)\s*(?:number\s*)?(?:is\s*)?([\dA-Za-z-]+)(?!\s*(?:order|delivery|trip))/i,
      /(?:in|at|to)\s+(?:unit|apartment|apt|building|bldg|floor|room|suite)\s*(?:number\s*)?([\dA-Za-z-]+)/i,
      /(?:the\s+)?(?:unit|apartment|apt|building|bldg|floor|room|suite)\s+([\dA-Za-z-]+)/i
    ];
    const unitNumber = this.matchFirstPattern(unitPatterns, transcript, match => {
      const raw = match[1].replace(/\s+/g, '').trim();
      const converted = NumberHelper.convertWordToNumber(raw).toString();
      return converted || raw;
    });
    if (unitNumber) result.unitNumber = unitNumber;

    // ORDER NUMBER: order, delivery, trip, etc.
    // Excludes "unit" to prevent cross-matching with unit number
    const orderPatterns = [
      /(?:order\s+(?:number|id|code)|delivery\s+(?:number|id|code)|trip\s+(?:number|id|code)|confirmation\s+(?:number|code)?|tracking\s+(?:number|code)?|reference\s+(?:number|code)?)\s*(?:is\s*)?([\dA-Za-z-]+)/i,
      /(?:order|delivery|trip)\s*#\s*([\dA-Za-z-]+)/i
    ];
    const orderNumber = this.matchFirstPattern(orderPatterns, transcript, match => {
      const raw = match[1].replace(/\s+/g, '').trim();
      return raw;
    });
    if (orderNumber) result.orderNumber = orderNumber;

    return result;
  }

  /**
   * Dynamically generates example phrases by analyzing the actual regex patterns used in parsing.
   * This ensures examples stay in sync with the actual parsing logic.
   */
  private getRandomSuggestion(): string {
    // Define pattern categories with example generators that match the actual regex patterns
    const categoryGenerators = [
      // SERVICE patterns - from servicePatterns array
      () => {
        const service = this.serviceList.length > 0 ? this.getRandomItem(this.serviceList) : 'DoorDash';
        const templates = ['I have a {s}', 'Working {s}', 'Service is {s}', 'Driving {s}', 'Using {s}', 'Got a {s}', 'It\'s a {s} gig', 'On {s}'];
        return this.getRandomItem(templates).replace('{s}', service);
      },
      
      // PICKUP/SHOP + PLACE pattern - from pickupShopPattern
      () => {
        const place = this.placeList.length > 0 ? this.getRandomItem(this.placeList) : 'McDonald\'s';
        const type = this.getRandomItem(['pickup', 'shop']);
        return `I have a ${type} from ${place}`;
      },
      
      // NAME patterns - from namePatterns array
      () => {
        const name = this.getRandomItem(['John', 'Sarah', 'Mike', 'Emily', 'Lisa', 'David']);
        const templates = ['The name is {n}', 'The customer is {n}', 'Delivering to {n}', 'The client is {n}', 'Drop off to {n}', 'Taking it to {n}', 'For {n}', 'Headed to {n}'];
        return this.getRandomItem(templates).replace('{n}', name);
      },
      
      // PLACE patterns - from placePatterns array
      () => {
        const place = this.placeList.length > 0 ? this.getRandomItem(this.placeList) : 'Starbucks';
        const templates = ['Picking up from {p}', 'Place is {p}', 'Location is {p}', 'Store is {p}', 'At {p}', 'Grabbing from {p}', 'Getting from {p}', 'Merchant is {p}'];
        return this.getRandomItem(templates).replace('{p}', place);
      },
      
      // PAY + TIP combined - from payTipPattern
      () => {
        const pay = this.getRandomNumber(8, 25);
        const tip = this.getRandomNumber(2, 10);
        return `Pay is $${pay} and tip is $${tip}`;
      },
      
      // PAY + DISTANCE combined - from payDistancePattern
      () => {
        const pay = this.getRandomNumber(10, 25);
        const distance = this.getRandomNumber(2, 15);
        return `Pay is $${pay} for ${distance} miles`;
      },
      
      // PAY patterns - from payPatterns array
      () => {
        const pay = this.getRandomNumber(8, 30);
        const templates = ['Pay is ${p}', 'Payment was ${p}', '${p} dollars', 'Payout of ${p}', 'Earning is ${p}', 'Made ${p}', 'Earned ${p}', 'Got paid ${p}'];
        return this.getRandomItem(templates).replace('${p}', pay.toString());
      },
      
      // TIP patterns - from tipPatterns array
      () => {
        const tip = this.getRandomNumber(2, 10);
        const templates = ['Tip is ${t}', '${t} dollar tip', 'Gratuity is ${t}', 'Tipped me ${t}', 'Left a ${t} tip', 'Customer tipped ${t}'];
        return this.getRandomItem(templates).replace('${t}', tip.toString());
      },
      
      // DISTANCE patterns - from distancePatterns array
      () => {
        const distance = this.getRandomNumber(1, 20);
        const templates = ['Distance is {d} miles', 'Drove {d} miles', '{d} miles away', 'It was {d} miles', 'Traveled {d} miles', 'Total distance {d} miles'];
        return this.getRandomItem(templates).replace('{d}', distance.toString());
      },
      
      // BONUS patterns - from bonusPatterns array
      () => {
        const bonus = this.getRandomNumber(2, 10);
        const templates = ['Bonus is ${b}', '${b} dollar bonus', 'Peak pay ${b}', 'Quest bonus ${b}', 'Surge ${b}', 'Promo ${b}'];
        return this.getRandomItem(templates).replace('${b}', bonus.toString());
      },
      
      // CASH patterns - from cashPatterns array
      () => {
        const cash = this.getRandomNumber(5, 20);
        const templates = ['Cash is ${c}', '${c} dollars cash', 'Paid in cash ${c}', 'Cash payment ${c}'];
        return this.getRandomItem(templates).replace('${c}', cash.toString());
      },
      
      // START ODOMETER patterns - from startOdometerPatterns array
      () => {
        const odo = this.getRandomNumber(50000, 99999).toLocaleString();
        const templates = ['Starting odometer is {o}', 'Odometer start {o}'];
        return this.getRandomItem(templates).replace('{o}', odo);
      },
      
      // END ODOMETER patterns - from endOdometerPatterns array
      () => {
        const odo = this.getRandomNumber(50000, 99999).toLocaleString();
        const templates = ['Ending odometer is {o}', 'Odometer end {o}'];
        return this.getRandomItem(templates).replace('{o}', odo);
      },
      
      // TYPE patterns - from typePatterns array
      () => {
        const type = this.typeList.length > 0 ? this.getRandomItem(this.typeList) : 'delivery';
        const templates = ['Type is {t}', 'It\'s a {t}', 'Got a {t}', 'Have a {t} order', '{t} run', 'Doing a {t}', 'On a {t}'];
        return this.getRandomItem(templates).replace('{t}', type);
      },
      
      // UNIT NUMBER patterns - from unitPatterns array
      () => {
        const unit = this.getRandomNumber(100, 999);
        const templates = ['Unit number {u}', 'Apartment {u}', 'Room {u}', 'Suite {u}', 'The room is {u}'];
        return this.getRandomItem(templates).replace('{u}', unit.toString());
      },
      
      // ORDER NUMBER patterns - from orderPatterns array
      () => {
        const orderNum = Math.random().toString(36).substring(2, 8).toUpperCase();
        const templates = ['Order number {o}', 'Order ID {o}', 'Confirmation {o}', 'Tracking number {o}', 'Order code {o}', 'Reference number {o}'];
        return this.getRandomItem(templates).replace('{o}', orderNum);
      }
    ];

    // Randomly select and execute a generator
    const generator = this.getRandomItem(categoryGenerators);
    return generator();
  }
}
