import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { DropdownDataService } from '@services/dropdown-data.service';
import { CommonModule, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

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

    // PLACE vs NAME: Context-aware parsing
    // "picking up from/at X" = place
    // "dropping off at X" = name
    
    // PLACE patterns (pickup location): "picking up from McDonald's", "the place is Starbucks"
    const placePatterns = [
      /(?:pick(?:ing)? up (?:from|at|as)|pickup (?:from|at|as))\s+([\w\s''`'.,&-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
      /(?:place is|place:|the place is)\s+([\w\s''`'.,&-]+?)$/i
    ];
    for (const pattern of placePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const raw = match[1].trim();
        const placeCandidate = this.findBestMatch(raw, this.placeList);
        const rawLower = raw.toLowerCase().trim();
        const nameLower = result.name ? result.name.toLowerCase().trim() : '';
        if (
          placeCandidate &&
          (!result.name || (placeCandidate.toLowerCase().trim() !== nameLower && rawLower !== nameLower))
        ) {
          result.place = placeCandidate;
        }
        break;
      }
    }

    // NAME patterns (customer/dropoff): "the name is John", "taking it to Jane", "for Mike"
    const namePatterns = [
      /(?:(?:the )?(?:name|person) is|name:|customer name is)\s*([\w\s]+?)$/i,
      /(?:drop(?:ping)? off at|dropoff at|dropping at)\s+([\w\s]+?)$/i,
      /(?:delivering to|deliver to|delivery to|taking (?:it )?to|going to)\s+([\w\s]+?)$/i,
      /(?:customer|client|for)\s+([\w\s]+?)$/i
    ];
    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.name = match[1].trim();
        break;
      }
    }

    // ADDRESS extraction is disabled for now; focus on name only

    // PAYMENT: "$15", "15 dollars", "pay is 15"
    const payPatterns = [
      /(?:pay(?:ment)? (?:is|was|:)|paid)\s*\$?(\d+(?:\.\d{1,2})?)/i,
      /\$(\d+(?:\.\d{1,2})?)(?!\s*tip)/i,  // $ but not followed by "tip"
      /(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?(?!\s*tip)/i  // dollars but not followed by "tip"
    ];
    for (const pattern of payPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.pay = match[1];
        break;
      }
    }

    // TIP: "$5 tip", "5 dollar tip", "tip is 5"
    const tipPatterns = [
      /(?:tip (?:is|was|:)|tipped)\s*\$?(\d+(?:\.\d{1,2})?)/i,
      /\$?(\d+(?:\.\d{1,2})?)\s*dollar(?:s)?\s*tip/i
    ];
    for (const pattern of tipPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.tip = match[1];
        break;
      }
    }

  // DISTANCE: Handles "5 miles", "5.5 mi", "10 kilometers"
  const distanceMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)/i);
  if (distanceMatch) result.distance = distanceMatch[1];

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
  const normalize = (str: string) => str.toLowerCase().replace(/[’'`]/g, '').trim();
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
