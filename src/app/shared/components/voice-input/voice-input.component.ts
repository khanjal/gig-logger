import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { DropdownDataService } from '@services/dropdown-data.service';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { convertWordToNumber } from '@helpers/number-converter.helper';

@Component({
  selector: 'voice-input',
  templateUrl: './voice-input.component.html',
  styleUrls: ['./voice-input.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIcon]
})

export class VoiceInputComponent implements OnInit {
  /**
   * Helper to match the first pattern and run a callback on match.
   */
  private matchFirstPattern<T>(patterns: RegExp[], transcript: string, onMatch: (match: RegExpMatchArray) => T | undefined): T | undefined {
    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        const result = onMatch(match);
        if (result !== undefined) return result;
      }
    }
    return undefined;
  }
  serviceList: string[] = [];
  addressList: string[] = [];
  typeList: string[] = [];
  placeList: string[] = [];

  transcript: string = '';
  recognition: any = null;
  recognizing: boolean = false;
  private transcriptTimeout: any = null;
  suggestionPhrase: string = '';

  constructor(
    private _dropdownDataService: DropdownDataService
  ) {}

  async ngOnInit(): Promise<void> {
    const data = await this._dropdownDataService.getAllDropdownData();
    this.serviceList = data.services;
    this.typeList = data.types;
    this.placeList = data.places;
    this.addressList = data.addresses;
  }

  @Output() voiceResult = new EventEmitter<any>();

  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

  onMicClick() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    if (!this.recognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        this.transcript = result;
        const parsed = this.parseTranscript(result);
        this.voiceResult.emit(parsed);
        this.recognizing = false;
        
        // Auto-hide transcript after 3 seconds
        if (this.transcriptTimeout) {
          clearTimeout(this.transcriptTimeout);
        }
        this.transcriptTimeout = setTimeout(() => {
          this.transcript = '';
        }, 3000);
      };
      this.recognition.onerror = (event: any) => {
        alert('Speech recognition error: ' + event.error);
        this.recognizing = false;
      };
      this.recognition.onend = () => {
        this.recognizing = false;
      };
    }
    if (!this.recognizing) {
      this.transcript = '';
      this.suggestionPhrase = this.getRandomSuggestion();
      this.recognition.start();
      this.recognizing = true;
    } else {
      this.recognition.stop();
      this.recognizing = false;
      this.suggestionPhrase = '';
    }
  }

  get micButtonColor(): string {
    // Always blue when inactive, always red when active, no hover color
    return this.recognizing ? 'bg-red-600' : 'bg-blue-600';
  }

  /**
   * Parses the recognized speech and returns an object with fields.
   */
  parseTranscript(transcript: string) {
    const result: any = {};
    const lowerTranscript = transcript.toLowerCase();
    // Debug: log the raw transcript
    // eslint-disable-next-line no-console
    console.log('[VoiceInput] Raw transcript:', transcript);

    // Special: Handle 'pickup' or 'shop' as type, and extract place after 'from'
    // e.g. 'I have a pickup from McDonald's', 'a shop from Dollar General'
    const pickupShopPattern = /(?:have a |a )?(pickup|shop) from ([\w\s'’`.,&-]+)/i;
    const pickupShopMatch = transcript.match(pickupShopPattern);
    if (pickupShopMatch) {
      result.type = this.findBestMatch(pickupShopMatch[1], this.typeList) || pickupShopMatch[1];
      const placeCandidate = this.findBestMatch(pickupShopMatch[2], this.placeList);
      if (placeCandidate) result.place = placeCandidate;
      else result.place = pickupShopMatch[2];
    }

    // SERVICE: "I have a doordash", "working uber", "service is lyft"
    const servicePatterns = [
      /(?:i have (?:a|an)|i got (?:a|an))\s+([\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:working|doing|on)\s+([\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /service (?:is|was|:)\s*([\w\s]+)/i
    ];
    const service = this.matchFirstPattern(servicePatterns, transcript, match => {
      const raw = match[1].trim();
      const matched = this.findBestMatch(raw, this.serviceList);
      return matched;
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

    // PLACE patterns (pickup location): "picking up from McDonald's", "the place is Starbucks"
    // Only match if NAME wasn't already set
    if (!result.name) {
      const placePatterns = [
        /(?:pick(?:ing)? up (?:from|at|as)|pickup (?:from|at|as))\s+([\w\s''`'.,&-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
        /(?:place is|place:|the place is)\s+([\w\s''`'.,&-]+?)$/i
      ];
      const place = this.matchFirstPattern(placePatterns, transcript, match => {
        const raw = match[1].trim();
        const placeCandidate = this.findBestMatch(raw, this.placeList);
        return placeCandidate || raw;
      });
      if (place) result.place = place;
    }

    // ADDRESS extraction is disabled for now; focus on name only

    // COMBINED PAY + TIP: "the pay was 2 and the tip was 3", "pay was four and tip was five"
    const payTipPattern = /(?:(?:the )?pay(?:ment)? (?:is|was|:)\s*)?\$?([\w\s.-]+?)\s*(?:dollar(?:s)?)?\s*and\s*(?:(?:the )?tip (?:is|was|:)\s*)?\$?([\w\s.-]+?)(?:\s*dollar(?:s)?)?$/i;
    const payTipMatch = transcript.match(payTipPattern);
    if (payTipMatch) {
      const payValue = convertWordToNumber(payTipMatch[1].trim());
      const tipValue = convertWordToNumber(payTipMatch[2].trim());
      // Only set if they're valid numbers
      if (/^\d+(?:\.\d{1,2})?$/.test(payValue)) result.pay = payValue;
      if (/^\d+(?:\.\d{1,2})?$/.test(tipValue)) result.tip = tipValue;
    }

    // COMBINED PAY + DISTANCE: "pay is 15 for 5 miles", "20 dollars for 10 miles"
    const payDistancePattern = /(?:pay(?:ment)? (?:is|was|:)|paid|amount (?:is|was|:))?\s*\$?(\d+(?:\.\d{1,2})?)\s*(?:dollar(?:s)?)?\s*for\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi)/i;
    const payDistanceMatch = transcript.match(payDistancePattern);
    if (payDistanceMatch) {
      result.pay = payDistanceMatch[1];
      result.distance = payDistanceMatch[2];
    }

    // PAYMENT: "$15", "15 dollars", "pay is fifteen" (only if not already set by combined pattern)
    if (!result.pay) {
      const payPatterns = [
        /(?:pay(?:ment)? (?:is|was|:)|paid|amount (?:is|was|:))\s*\$?([\w.-]+)/i,
        /\$(\d+(?:\.\d{1,2})?)(?!\s*tip)/i,  // $ but not followed by "tip"
        /(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?(?!\s*tip)/i  // dollars but not followed by "tip"
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

    // PICKUP ADDRESS: "picking up at 123 Main Street", "pickup address is downtown"
    const pickupAddressPatterns = [
      /(?:pick(?:ing)? up (?:at|on))\s+([\w\s,.-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
      /(?:pickup address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:from address (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ];

    const pickupAddress = this.matchFirstPattern(pickupAddressPatterns, transcript, match => match[1].trim());
    if (pickupAddress) result.pickupAddress = pickupAddress;

    // DROPOFF/DESTINATION ADDRESS: "dropping off at 456 Elm St", "destination is Main Street", "going to 789 Oak Ave"
    const dropoffAddressPatterns = [
      /(?:drop(?:ping)? off (?:at|on)|dropoff (?:at|on))\s+([\w\s,.-]+?)$/i,
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
    // "distance is 5 miles", "5.5 miles away", "drove 10 miles", "for 5 miles"
    if (!result.distance) {
      const distancePatterns = [
        /(?:distance (?:is|was|:))\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi)/i,
        /(?:drove|traveled|went)\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi)/i,
        /(\d+(?:\.\d+)?)\s*(?:mile|miles|mi)\s*(?:away|trip|drive)/i,
        /\bfor\s+(\d+(?:\.\d+)?)\s*(?:mile|miles|mi)/i  // "for 5 miles" (already handled by combined pay+distance, but included for standalone)
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
      return this.findBestMatch(raw, this.typeList);
    });
    if (type) result.type = type;

  // Debug: log the parsed result
  // eslint-disable-next-line no-console
  console.log('[VoiceInput] Parsed result:', result);


    return result;
  }

  /**
   * Finds the best match for a value in a list (case-insensitive, partial allowed)
   */
  findBestMatch(raw: string, list: string[]): string | undefined {
    // Normalize: remove apostrophes, lowercase, trim (keep spaces for natural matching)
    const normalize = (str: string) => str.toLowerCase().replace(/[''`]/g, '').trim();
    // Use dropdown service only for normalization (if it provides such a method), not for fallback matching
    const normRaw = normalize(raw);
    let best = list.find(item => normalize(item) === normRaw);
    if (best) return best;
    // Partial match
    best = list.find(item => normalize(item).includes(normRaw) || normRaw.includes(normalize(item)));
    if (best) return best;
    // Always return the raw value if no match
    return raw;
  }
}
