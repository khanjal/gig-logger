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

    // SERVICE: Enhanced pattern recognition
    // "I have a doordash", "doordash going to", "working uber", etc.
    const servicePatterns = [
      /(?:i have a |i have an |i got a |i got an )([\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at))/i,
      /(?:working |doing |on )([\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at))/i,
      /^([\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at))/i  // Service at start
    ];
    for (const pattern of servicePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const raw = match[1].trim();
        const matched = this.findBestMatch(raw, this.serviceList);
        // Only set if we found a match in the list (not just returning raw)
        if (matched && this.serviceList.some(s => s.toLowerCase().replace(/['\s]/g, '') === matched.toLowerCase().replace(/['\s]/g, ''))) {
          result.service = matched;
          break;
        }
      }
    }

    // PLACE vs NAME: Context-aware parsing
    // "picking up from/at X" = place
    // "going to X" after service mention = could be place OR name depending on context
    // "dropping off at X" = name
    
    // PLACE patterns (pickup location)
    const placePatterns = [
      /(?:picking up from|pick up from|pickup from|picking up at|pick up at|pickup at)\s+([\w\s'’]+?)(?:\s+(?:and|to|drop|deliver)|$)/i,
      /picking up\s+([\w\s'’]+?)(?:\s+(?:and|to|drop|deliver)|$)/i, // NEW: picking up X
      /(?:from|at)\s+the\s+([\w\s'’]+?)(?:\s+(?:and|drop)|$)/i,
      /(?:place is|place:|the place is)\s+([\w\s'’]+?)(?:\s+(?:and)|$)/i
    ];
    
    for (const pattern of placePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const raw = match[1].trim();
        result.place = this.findBestMatch(raw, this.placeList);
        break;
      }
    }

    // NAME patterns (dropoff location/customer)
    const namePatterns = [
      /(?:dropping off at|drop off at|dropoff at|dropping at)\s+([\w\s]+?)(?:\s+(?:for|with|,)|$)/i,
      /(?:delivering to|deliver to|delivery to|taking to|going to)\s+([\w\s]+?)(?:\s+(?:at|on|,)|$)/i, // 'going to' now always sets name
      /(?:customer|client|for)\s+([\w\s]+?)(?:\s+(?:at|on|,)|$)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.name = match[1].trim();
        break;
      }
    }

    // ADDRESS: "going to [address]" or "to [address]"
    // Only if not already captured as name
    if (!result.name) {
      const addressPatterns = [
        /(?:going to|headed to|to)\s+([\d]+[\w\d\s,.#-]+?)(?:\s+(?:for|with|,|$))/i,
        /(?:address is|address:|the address is)\s+([\w\d\s,.#-]+?)(?:\s+(?:for|with|,)|$)/i
      ];
      
      for (const pattern of addressPatterns) {
        const match = transcript.match(pattern);
        if (match) {
          const raw = match[1].trim();
          result.endAddress = this.findBestMatch(raw, this.addressList);
          break;
        }
      }
    }

    // PAYMENT: $15, 15 dollars, pay is 15
    const payPatterns = [
      /\$(\d+(?:\.\d{1,2})?)/,
      /(\d+(?:\.\d{1,2})?)\s*dollar/i,
      /(?:pay is|pay:|payment is|payment:|paid)\s*\$?(\d+(?:\.\d{1,2})?)/i
    ];
    for (const pattern of payPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.pay = match[1];
        break;
      }
    }

    // TIP: tip $3, 3 dollar tip, tip is 3
    const tipPatterns = [
      /tip\s*\$?(\d+(?:\.\d{1,2})?)/i,
      /(\d+(?:\.\d{1,2})?)\s*dollar\s*tip/i,
      /(?:tip is|tip:|tipped)\s*\$?(\d+(?:\.\d{1,2})?)/i
    ];
    for (const pattern of tipPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        result.tip = match[1];
        break;
      }
    }

    // DISTANCE: 5 miles, 5.5 mi, 10 kilometers
    const distanceMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)/i);
    if (distanceMatch) result.distance = distanceMatch[1];

    // TYPE: type delivery, pickup type, it's a delivery
    const typePatterns = [
      /(?:type is|type:|the type is)\s*([\w\s]+?)(?:\s+(?:for|to|at|from)|$)/i,
      /(?:it'?s a|this is a)\s*(delivery|pickup|dropoff|drop off|ride)/i,
      /(delivery|pickup|dropoff|drop off|ride)\s*(?:order|trip|type)/i
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
