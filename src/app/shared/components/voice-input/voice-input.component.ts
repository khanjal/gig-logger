import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { DropdownDataService } from '@services/dropdown-data.service';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { convertWordToNumber } from '@helpers/number-converter.helper';

/**
 * Interface for parsed voice input results
 */
interface VoiceParseResult {
  service?: string;
  type?: string;
  place?: string;
  name?: string;
  pay?: string;
  tip?: string;
  bonus?: string;
  cash?: string;
  distance?: string;
  startOdometer?: string;
  endOdometer?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
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
    private _dropdownDataService: DropdownDataService
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
    console.error('[VoiceInput] Speech recognition error:', event.error);
    
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
      console.error('[VoiceInput] Failed to start recognition:', error);
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
    // Avoid matching 'address', 'destination', etc. as service
    const servicePatterns = [
      /(?:i have (?:a|an)|i got (?:a|an))\s+((?!address|destination|place|type)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:working|doing|on)\s+((?!address|destination|place|type)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /service (?:is|was|:)\s*((?!address|destination|place|type)[\w\s]+)/i
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
      /(?:(?:the )?(?:name|person|customer) is|customer's|name:|customer name is)\s*([\w\s]+?)$/i,
      /(?:drop(?:ping)? off at|dropoff at|dropping at)\s+([\w\s]+?)$/i,
      /(?:delivering to|deliver to|delivery to|taking (?:it )?to|going to)\s+([\w\s]+?)$/i,
      /(?:for)\s+([a-zA-Z][\w\s]+?)$/i
    ];
    const name = this.matchFirstPattern(namePatterns, transcript, match => match[1].trim());
    if (name) result.name = name;

    // PLACE patterns (pickup/pick-up location): "picking up from McDonald's", "picking pick-up from Walmart", "the place is Starbucks", "from McDonald's"
    // Only match if NAME wasn't already set
    if (!result.name) {
      const placePatterns = [
        /(?:pick(?:ing)?[- ]?up (?:from|at|as)|pick[- ]?up (?:from|at|as))\s+([\w\s''`'.,&-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
        /(?:place is|place:|the place is)\s+([\w\s''`'.,&-]+?)$/i,
        /from ([\w\s''`.,&-]+)/i // Added: match 'from [place]'
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
        const payValue = convertWordToNumber(payTipMatch[1].trim());
        const tipValue = convertWordToNumber(payTipMatch[2].trim());
        // Only set if they're valid numbers
        if (/^\d+(?:\.\d{1,2})?$/.test(payValue)) result.pay = payValue;
        if (/^\d+(?:\.\d{1,2})?$/.test(tipValue)) result.tip = tipValue;
      }
    }

    // COMBINED PAY + DISTANCE: "pay is 15 for 5 miles", "20 dollars for 10 miles"
    const payDistancePattern = /(?:pay(?:ment)? (?:is|was|:)|paid|amount (?:is|was|:))?\s*\$?(\d+(?:\.\d{1,2})?)\s*(?:dollar(?:s)?)?\s*for\s*(\d+(?:\.\d+)?)\s*(mile|miles|mi|me|km|kilometer|kilometers)/i;
    const payDistanceMatch = transcript.match(payDistancePattern);
    if (payDistanceMatch) {
      result.pay = payDistanceMatch[1];
      result.distance = payDistanceMatch[2];
    }

    // PAYMENT: "$15", "15 dollars", "pay is fifteen" (only if not already set by combined pattern)
    if (!result.pay) {
      const payPatterns = [
        /(?:pay(?:ment)? (?:is|was|:)|paid|amount (?:is|was|:))\s*\$?([\w.-]+)/i,
        // Only match $amount if not in a phrase containing 'tip', 'bonus', or 'cash' before or after
        /(?<!(?:tip|bonus|cash)[^$]{0,20})\$(\d+(?:\.\d{1,2})?)(?![^$]{0,20}(?:tip|bonus|cash))/i,
        // Only match 'dollars' if not in a phrase containing 'tip', 'bonus', or 'cash' before or after
        /(?<!(?:tip|bonus|cash)[^\d]{0,20})(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?(?![^\d]{0,20}(?:tip|bonus|cash))/i
      ];

      const pay = this.matchFirstPattern(payPatterns, transcript, match => {
        const converted = convertWordToNumber(match[1].trim());
        if (/^\d+(?:\.\d{1,2})?$/.test(converted)) return converted;
        return undefined;
      });
      if (pay) result.pay = pay;
    }

    // TIP: "$5 tip", "five dollar tip", "tip is five" (only if not already set by combined pattern)
    if (!result.tip) {
      const tipPatterns = [
        /(?:tip (?:is|was|:)|tipped)\s*\$?([\w.-]+)/i,
        /\$?(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?\s*tip/i,
        /([\w-]+)\s*dollar(?:s)?\s*tip/i,
        /\$(\d+(?:\.\d{1,2})?)\s*tip/i, // e.g. "$8 tip"
        /(\d+(?:\.\d{1,2})?)\s*tip/i // e.g. "8.00 tip"
      ];

      const tip = this.matchFirstPattern(tipPatterns, transcript, match => {
        const converted = convertWordToNumber(match[1].trim());
        if (/^\d+(?:\.\d{1,2})?$/.test(converted)) return converted;
        return undefined;
      });
      if (tip) result.tip = tip;
    }

    // BONUS: "bonus is 5", "five dollar bonus", "$5 bonus"
    const bonusPatterns = [
      /(?:bonus (?:is|was|:))\s*\$?([\w.-]+)/i,
      /\$?(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?\s*bonus/i,
      /([\w-]+)\s*dollar(?:s)?\s*bonus/i
    ];

    const bonus = this.matchFirstPattern(bonusPatterns, transcript, match => {
      const converted = convertWordToNumber(match[1].trim());
      if (/^\d+(?:\.\d{1,2})?$/.test(converted)) return converted;
      return undefined;
    });
    if (bonus) result.bonus = bonus;

    // CASH: "cash is 10", "ten dollars cash", "$10 cash"
    const cashPatterns = [
      /(?:cash (?:is|was|:))\s*\$?([\w.-]+)/i,
      /\$?(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?\s*cash/i,
      /([\w-]+)\s*dollar(?:s)?\s*cash/i
    ];

    const cash = this.matchFirstPattern(cashPatterns, transcript, match => {
      const converted = convertWordToNumber(match[1].trim());
      if (/^\d+(?:\.\d{1,2})?$/.test(converted)) return converted;
      return undefined;
    });
    if (cash) result.cash = cash;

    // PICKUP ADDRESS: "picking up at 123 Main Street", "pickup address is downtown", "pick-up address is downtown"
    const pickupAddressPatterns = [
      /(?:pick(?:ing)?[- ]?up (?:at|on))\s+([\w\s,.-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
      /(?:pick[- ]?up address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:from address (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ];

    const pickupAddress = this.matchFirstPattern(pickupAddressPatterns, transcript, match => match[1].trim());
    if (pickupAddress) result.pickupAddress = pickupAddress;

    // DROPOFF/DESTINATION ADDRESS: "dropping off at 456 Elm St", "destination is Main Street", "going to 789 Oak Ave"
    const dropoffAddressPatterns = [
      /(?:drop(?:ping)? off (?:at|on)|drop[- ]?off (?:at|on))\s+([\w\s,.-]+?)$/i,
      /(?:drop[- ]?off address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:destination (?:is|was|:)|destination address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:to address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:going to|heading to)\s+([\w\s,.-]+?)$/i,
      /(?:end address (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ];

    const dropoffAddress = this.matchFirstPattern(dropoffAddressPatterns, transcript, match => match[1].trim());
    if (dropoffAddress) result.dropoffAddress = dropoffAddress;

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
      let raw = convertWordToNumber(match[1].trim());
      raw = raw.replace(/,/g, '');
      return raw;
    });
    if (startOdometerMatch) result.startOdometer = startOdometerMatch;

    const endOdometerMatch = this.matchFirstPattern(endOdometerPatterns, transcript, match => {
      let raw = convertWordToNumber(match[1].trim());
      raw = raw.replace(/,/g, '');
      return raw;
    });
    if (endOdometerMatch) result.endOdometer = endOdometerMatch;

    // DISTANCE: Only match with explicit distance context to avoid odometer confusion
    // Supports miles and kilometers (mile, mi, km, kilometer, kilometers)
    // Do NOT match distance if odometer start or end was matched
    if (!result.distance && !result.startOdometer && !result.endOdometer) {
      const distancePatterns = [
        /(?:\bdistance (?:is|was|:)\b)\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i,
        /(?:\bdrove|traveled|went\b)\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i,
        /\b(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|me|km|kilometer|kilometers)\b\s*(?:away|trip|drive)?/i,
        /\bfor\s+(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|me|km|kilometer|kilometers)\b/i  // "for 5 miles" or "for 5 km"
      ];
      const distance = this.matchFirstPattern(distancePatterns, transcript, match => match[1]);
      if (distance) result.distance = distance;
    }

    // TYPE: "type is delivery", "it's a pickup", "delivery order"
    const typePatterns = [
      /(?:(?:the )?type (?:is|was|:))\s*([\w\s]+?)(?=\s+(?:for|to|at|from)|$)/i,
      /(?:it'?s a|this is a)\s*(delivery|pickup|dropoff|drop off|ride)/i,
      /(delivery|pickup|dropoff|drop off|ride)\s*(?:order|trip)/i
    ];

    const type = this.matchFirstPattern(typePatterns, transcript, match => {
      const raw = match[1].trim();
      return this._dropdownDataService.findBestMatch(raw, this.typeList, 'Type');
    });

    if (type) result.type = type;

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
        const templates = ['I have a {s}', 'Working {s}', 'Service is {s}'];
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
        const templates = ['The name is {n}', 'The customer is {n}', 'Delivering to {n}'];
        return this.getRandomItem(templates).replace('{n}', name);
      },
      
      // PLACE patterns - from placePatterns array
      () => {
        const place = this.placeList.length > 0 ? this.getRandomItem(this.placeList) : 'Starbucks';
        const templates = ['Picking up from {p}', 'Place is {p}'];
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
        const templates = ['Pay is ${p}', 'Payment was ${p}', '${p} dollars'];
        return this.getRandomItem(templates).replace('${p}', pay.toString());
      },
      
      // TIP patterns - from tipPatterns array
      () => {
        const tip = this.getRandomNumber(2, 10);
        const templates = ['Tip is ${t}', '${t} dollar tip'];
        return this.getRandomItem(templates).replace('${t}', tip.toString());
      },
      
      // DISTANCE patterns - from distancePatterns array
      () => {
        const distance = this.getRandomNumber(1, 20);
        const templates = ['Distance is {d} miles', 'Drove {d} miles', '{d} miles away'];
        return this.getRandomItem(templates).replace('{d}', distance.toString());
      },
      
      // BONUS patterns - from bonusPatterns array
      () => {
        const bonus = this.getRandomNumber(2, 10);
        const templates = ['Bonus is ${b}', '${b} dollar bonus'];
        return this.getRandomItem(templates).replace('${b}', bonus.toString());
      },
      
      // CASH patterns - from cashPatterns array
      () => {
        const cash = this.getRandomNumber(5, 20);
        const templates = ['Cash is ${c}', '${c} dollars cash'];
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
        const templates = ['Type is {t}', 'It\'s a {t}'];
        return this.getRandomItem(templates).replace('{t}', type);
      }
    ];

    // Randomly select and execute a generator
    const generator = this.getRandomItem(categoryGenerators);
    return generator();
  }
}
