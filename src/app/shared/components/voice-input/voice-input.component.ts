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
  serviceList: string[] = [];
  addressList: string[] = [];
  typeList: string[] = [];
  placeList: string[] = [];

  transcript: string = '';
  recognition: any = null;
  recognizing: boolean = false;
  private transcriptTimeout: any = null;

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
      this.recognition.start();
      this.recognizing = true;
    } else {
      this.recognition.stop();
      this.recognizing = false;
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
    for (const pattern of servicePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const raw = match[1].trim();
        const matched = this.findBestMatch(raw, this.serviceList);
        if (matched) {
          result.service = matched;
          break;
        }
      }
    }

    // NAME vs PLACE: Context-aware parsing
    // Parse NAME first to avoid conflicts
    // "the customer/name is X" = name
    // "picking up from X" = place
    
    // NAME patterns (customer/dropoff): "the name is John", "the customer is Jeremy", "taking it to Jane"
    const namePatterns = [
      /(?:(?:the )?(?:name|person|customer) is|customer's|name:|customer name is)\s*([\w\s]+?)$/i,
      /(?:drop(?:ping)? off at|dropoff at|dropping at)\s+([\w\s]+?)$/i,
      /(?:delivering to|deliver to|delivery to|taking (?:it )?to|going to)\s+([\w\s]+?)$/i,
      /(?:for)\s+([a-zA-Z][\w\s]+?)$/i  // "for" followed by name starting with letter, not numbers
    ];
    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.name = match[1].trim();
        break;
      }
    }

    // PLACE patterns (pickup location): "picking up from McDonald's", "the place is Starbucks"
    // Only match if NAME wasn't already set
    if (!result.name) {
      const placePatterns = [
        /(?:pick(?:ing)? up (?:from|at|as)|pickup (?:from|at|as))\s+([\w\s''`'.,&-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
        /(?:place is|place:|the place is)\s+([\w\s''`'.,&-]+?)$/i
      ];
      for (const pattern of placePatterns) {
        const match = transcript.match(pattern);
        if (match) {
          const raw = match[1].trim();
          const placeCandidate = this.findBestMatch(raw, this.placeList);
          if (placeCandidate) {
            result.place = placeCandidate;
          }
          break;
        }
      }
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
      for (const pattern of payPatterns) {
        const match = transcript.match(pattern);
        if (match) {
          const converted = convertWordToNumber(match[1].trim());
          if (/^\d+(?:\.\d{1,2})?$/.test(converted)) {
            result.pay = converted;
            break;
          }
        }
      }
    }

    // TIP: "$5 tip", "five dollar tip", "tip is five" (only if not already set by combined pattern)
    if (!result.tip) {
      const tipPatterns = [
        /(?:tip (?:is|was|:)|tipped)\s*\$?([\w.-]+)/i,
        /\$?(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?\s*tip/i,
        /([\w-]+)\s*dollar(?:s)?\s*tip/i
      ];
      for (const pattern of tipPatterns) {
        const match = transcript.match(pattern);
        if (match) {
          const converted = convertWordToNumber(match[1].trim());
          if (/^\d+(?:\.\d{1,2})?$/.test(converted)) {
            result.tip = converted;
            break;
          }
        }
      }
    }

    // DISTANCE: "5 miles", "5.5 mi" (only if not already set by combined pattern)
    if (!result.distance) {
      const distanceMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)/i);
      if (distanceMatch) result.distance = distanceMatch[1];
    }

    // BONUS: "bonus is 5", "five dollar bonus", "$5 bonus"
    const bonusPatterns = [
      /(?:bonus (?:is|was|:))\s*\$?([\w.-]+)/i,
      /\$?(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?\s*bonus/i,
      /([\w-]+)\s*dollar(?:s)?\s*bonus/i
    ];
    for (const pattern of bonusPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const converted = convertWordToNumber(match[1].trim());
        if (/^\d+(?:\.\d{1,2})?$/.test(converted)) {
          result.bonus = converted;
          break;
        }
      }
    }

    // CASH: "cash is 10", "ten dollars cash", "$10 cash"
    const cashPatterns = [
      /(?:cash (?:is|was|:))\s*\$?([\w.-]+)/i,
      /\$?(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?\s*cash/i,
      /([\w-]+)\s*dollar(?:s)?\s*cash/i
    ];
    for (const pattern of cashPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const converted = convertWordToNumber(match[1].trim());
        if (/^\d+(?:\.\d{1,2})?$/.test(converted)) {
          result.cash = converted;
          break;
        }
      }
    }

    // PICKUP ADDRESS: "picking up at 123 Main Street", "pickup address is downtown"
    const pickupAddressPatterns = [
      /(?:pick(?:ing)? up (?:at|on))\s+([\w\s,.-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
      /(?:pickup address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:from address (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ];
    for (const pattern of pickupAddressPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.pickupAddress = match[1].trim();
        break;
      }
    }

    // DROPOFF/DESTINATION ADDRESS: "dropping off at 456 Elm St", "destination is Main Street", "going to 789 Oak Ave"
    const dropoffAddressPatterns = [
      /(?:drop(?:ping)? off (?:at|on)|dropoff (?:at|on))\s+([\w\s,.-]+?)$/i,
      /(?:destination (?:is|was|:)|destination address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:to address (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:going to|heading to)\s+([\w\s,.-]+?)$/i,
      /(?:end address (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ];
    for (const pattern of dropoffAddressPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.dropoffAddress = match[1].trim();
        break;
      }
    }

    // START ODOMETER: "start odometer is 12345", "odometer start 12345", "odo start 12345"
    const startOdometerPatterns = [
      /(?:start(?:ing)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i,
      /(?:odometer|odo) start (?:is|was|:)?\s*([\w.,-]+)/i,
      /(?:begin(?:ning)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i
    ];
    for (const pattern of startOdometerPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        let raw = convertWordToNumber(match[1].trim());
        raw = raw.replace(/,/g, '');
        result.startOdometer = raw;
        break;
      }
    }

    // END ODOMETER: "end odometer is 12350", "odometer end 12350", "odo end 12350"
    const endOdometerPatterns = [
      /(?:end(?:ing)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i,
      /(?:odometer|odo) end (?:is|was|:)?\s*([\w.,-]+)/i,
      /(?:final (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i
    ];
    for (const pattern of endOdometerPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        let raw = convertWordToNumber(match[1].trim());
        raw = raw.replace(/,/g, '');
        result.endOdometer = raw;
        break;
      }
    }

    // TYPE: "type is delivery", "it's a pickup", "delivery order"
    const typePatterns = [
      /(?:(?:the )?type (?:is|was|:))\s*([\w\s]+?)(?=\s+(?:for|to|at|from)|$)/i,
      /(?:it'?s a|this is a)\s*(delivery|pickup|dropoff|drop off|ride)/i,
      /(delivery|pickup|dropoff|drop off|ride)\s*(?:order|trip)/i
    ];
    for (const pattern of typePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const raw = match[1].trim();
        result.type = this.findBestMatch(raw, this.typeList);
        break;
      }
    }

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
