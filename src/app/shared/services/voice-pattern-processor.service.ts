import { Injectable } from '@angular/core';
import { DropdownDataService } from '@services/dropdown-data.service';
import { NumberHelper } from '@helpers/number.helper';
import { AddressHelper } from '@helpers/address.helper';
import { VOICE_PATTERNS, PatternDefinition } from '@components/voice-input/voice-patterns.config';
import { IVoiceParseResult } from '@interfaces/voice-parse-result.interface';

/**
 * @deprecated Use IVoiceParseResult from @interfaces/voice-parse-result.interface instead
 */
export type VoiceParseResult = IVoiceParseResult;

/**
 * Pattern match result with metadata
 */
interface PatternMatch {
  patternKey: string;
  matches: RegExpMatchArray;
  priority: number;
  combinesWith?: string[];
}

/**
 * Voice Pattern Processor Service
 * 
 * Processes voice transcripts using configured patterns from voice-patterns.config.ts.
 * Handles pattern matching, value extraction, and field mapping in priority order.
 */
@Injectable({
  providedIn: 'root'
})
export class VoicePatternProcessorService {

  constructor(private dropdownDataService: DropdownDataService) {}

  /**
   * Parse a voice transcript and extract structured data
   * 
   * @param transcript The speech recognition result text
   * @param dropdownData Optional dropdown data for best-match validation
   * @returns Parsed result with extracted fields
   */
  parseTranscript(
    transcript: string,
    dropdownData?: {
      serviceList?: string[];
      typeList?: string[];
      placeList?: string[];
      addressList?: string[];
    }
  ): IVoiceParseResult {
    const result: IVoiceParseResult = {};
    const processedFields = new Set<string>();

    // Get all pattern matches sorted by priority
    const matches = this.findAllMatches(transcript);

    // Process matches in priority order
    for (const match of matches) {
      this.processMatch(match, result, processedFields, transcript, dropdownData);
    }

    return result;
  }

  /**
   * Find all pattern matches in the transcript, sorted by priority.
   * Each pattern key is matched at most once (first matching pattern wins).
   * 
   * @param transcript The speech recognition text to search
   * @returns Array of pattern matches sorted by priority (lowest number = highest priority)
   */
  private findAllMatches(transcript: string): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [patternKey, definition] of Object.entries(VOICE_PATTERNS)) {
      for (const pattern of definition.patterns) {
        const match = transcript.match(pattern);
        if (match) {
          matches.push({
            patternKey,
            matches: match,
            priority: definition.priority,
            combinesWith: definition.combinesWith
          });
          break; // Only use first matching pattern for this key
        }
      }
    }

    // Sort by priority (lower number = higher priority)
    return matches.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Process a single pattern match and update the result.
   * Skips processing if any of the fields this pattern would set have already been processed
   * by a higher-priority pattern (prevents overwrites).
   * 
   * @param match The pattern match with metadata
   * @param result The result object to update
   * @param processedFields Set of field names already processed
   * @param transcript The original transcript (for context)
   * @param dropdownData Optional dropdown data for validation
   */
  private processMatch(
    match: PatternMatch,
    result: IVoiceParseResult,
    processedFields: Set<string>,
    transcript: string,
    dropdownData?: {
      serviceList?: string[];
      typeList?: string[];
      placeList?: string[];
      addressList?: string[];
    }
  ): void {
    const { patternKey, matches, combinesWith } = match;

    // Check if ANY of the fields this pattern would set have already been processed
    if (combinesWith && combinesWith.some(field => processedFields.has(field))) {
      return;
    }

    // Process based on pattern type
    switch (patternKey) {
      // Combined patterns
      case 'pickupShop':
        this.processPickupShop(matches, result, dropdownData);
        processedFields.add('type');
        processedFields.add('place');
        break;

      case 'serviceType':
        this.processServiceType(matches, result, dropdownData);
        processedFields.add('service');
        processedFields.add('type');
        break;

      case 'payTip':
        this.processPayTip(matches, result);
        processedFields.add('pay');
        processedFields.add('tip');
        break;

      case 'payTipBonus':
        this.processPayTipBonus(matches, result);
        processedFields.add('pay');
        processedFields.add('tip');
        processedFields.add('bonus');
        break;

      case 'payDistance':
        this.processPayDistance(matches, result);
        processedFields.add('pay');
        processedFields.add('distance');
        break;

      case 'placeType':
        this.processPlaceType(matches, result, dropdownData);
        processedFields.add('place');
        processedFields.add('type');
        break;

      // Individual field patterns
      case 'service':
        if (!processedFields.has('service')) {
          this.processService(matches, result, dropdownData);
          processedFields.add('service');
        }
        break;

      case 'type':
        if (!processedFields.has('type')) {
          this.processType(matches, result, dropdownData);
          processedFields.add('type');
        }
        break;

      case 'place':
        if (!processedFields.has('place')) {
          this.processPlace(matches, result, dropdownData);
          processedFields.add('place');
        }
        break;

      case 'name':
        if (!processedFields.has('name')) {
          this.processName(matches, result);
          processedFields.add('name');
        }
        break;

      case 'pay':
        if (!processedFields.has('pay')) {
          this.processPay(matches, result);
          processedFields.add('pay');
        }
        break;

      case 'tip':
        if (!processedFields.has('tip')) {
          this.processTip(matches, result);
          processedFields.add('tip');
        }
        break;

      case 'bonus':
        if (!processedFields.has('bonus')) {
          this.processBonus(matches, result);
          processedFields.add('bonus');
        }
        break;

      case 'cash':
        if (!processedFields.has('cash')) {
          this.processCash(matches, result);
          processedFields.add('cash');
        }
        break;

      case 'distance':
        if (!processedFields.has('distance')) {
          this.processDistance(matches, result);
          processedFields.add('distance');
        }
        break;

      case 'startOdometer':
        if (!processedFields.has('startOdometer')) {
          this.processStartOdometer(matches, result);
          processedFields.add('startOdometer');
        }
        break;

      case 'endOdometer':
        if (!processedFields.has('endOdometer')) {
          this.processEndOdometer(matches, result);
          processedFields.add('endOdometer');
        }
        break;

      case 'pickupAddress':
        if (!processedFields.has('pickupAddress')) {
          this.processPickupAddress(matches, result, dropdownData);
          processedFields.add('pickupAddress');
        }
        break;

      case 'dropoffAddress':
        if (!processedFields.has('dropoffAddress')) {
          this.processDropoffAddress(matches, result, dropdownData);
          processedFields.add('dropoffAddress');
        }
        break;

      case 'unitNumber':
        if (!processedFields.has('unitNumber')) {
          this.processUnitNumber(matches, result);
          processedFields.add('unitNumber');
        }
        break;

      case 'orderNumber':
        if (!processedFields.has('orderNumber')) {
          this.processOrderNumber(matches, result);
          processedFields.add('orderNumber');
        }
        break;
    }
  }

  // ===== COMBINED PATTERN PROCESSORS =====

  /**
   * Process pickup/shop pattern: "I have a pickup from Starbucks".
   * Extracts type (pickup/shop) and place name.
   */
  private processPickupShop(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { typeList?: string[]; placeList?: string[] }
  ): void {
    if (matches[1] && dropdownData?.typeList) {
      result.type = this.dropdownDataService.findBestMatch(matches[1], dropdownData.typeList, 'Type') || matches[1];
    }
    if (matches[2]) {
      const placeCandidate = dropdownData?.placeList
        ? this.dropdownDataService.findBestMatch(matches[2], dropdownData.placeList, 'Place')
        : null;
      result.place = placeCandidate || matches[2];
    }
  }

  /**
   * Process service+type combined pattern: "DoorDash delivery", "Uber pickup".
   * Extracts service name and order type.
   */
  private processServiceType(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { serviceList?: string[]; typeList?: string[] }
  ): void {
    if (matches[1] && dropdownData?.serviceList) {
      const serviceCandidate = this.dropdownDataService.findBestMatch(
        matches[1].trim(),
        dropdownData.serviceList,
        'Service'
      );
      result.service = serviceCandidate || matches[1].trim();
    }
    if (matches[2] && dropdownData?.typeList) {
      const typeCandidate = this.dropdownDataService.findBestMatch(
        matches[2],
        dropdownData.typeList,
        'Type'
      );
      result.type = typeCandidate || matches[2];
    }
  }

  /**
   * Process pay+tip combined pattern: "$15 pay and $3 tip".
   * Extracts both payment and tip amounts.
   */
  private processPayTip(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const pay = parseFloat(matches[1].replace(/[,\s]/g, ''));
      if (!isNaN(pay)) result.pay = pay;
    }
    if (matches[2]) {
      const tip = parseFloat(matches[2].replace(/[,\s]/g, ''));
      if (!isNaN(tip)) result.tip = tip;
    }
  }

  /**
   * Process pay+tip+bonus combined pattern: "$20 pay, $5 tip, $3 bonus".
   * Extracts payment, tip, and bonus amounts.
   */
  private processPayTipBonus(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const pay = parseFloat(matches[1]);
      if (!isNaN(pay)) result.pay = pay;
    }
    if (matches[2]) {
      const tip = parseFloat(matches[2]);
      if (!isNaN(tip)) result.tip = tip;
    }
    if (matches[3]) {
      const bonus = parseFloat(matches[3]);
      if (!isNaN(bonus)) result.bonus = bonus;
    }
  }

  /**
   * Process pay+distance combined pattern: "$15 for 5 miles".
   * Extracts payment amount and distance.
   */
  private processPayDistance(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const pay = parseFloat(matches[1]);
      if (!isNaN(pay)) result.pay = pay;
    }
    if (matches[2]) {
      const distance = parseFloat(matches[2]);
      if (!isNaN(distance)) result.distance = distance;
    }
  }

  /**
   * Process place+type combined pattern: "McDonald's pickup", "Walmart delivery".
   * Extracts place name and order type.
   */
  private processPlaceType(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { placeList?: string[]; typeList?: string[] }
  ): void {
    if (matches[1] && dropdownData?.placeList) {
      const placeCandidate = this.dropdownDataService.findBestMatch(
        matches[1],
        dropdownData.placeList,
        'Place'
      );
      if (placeCandidate) result.place = placeCandidate;
      else result.place = matches[1];
    }
    if (matches[2] && dropdownData?.typeList) {
      result.type = this.dropdownDataService.findBestMatch(matches[2], dropdownData.typeList, 'Type') || matches[2];
    }
  }

  // ===== INDIVIDUAL FIELD PROCESSORS =====

  /**
   * Process service field: "I have a DoorDash", "working Uber Eats".
   * Extracts gig service name with dropdown validation.
   */
  private processService(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { serviceList?: string[] }
  ): void {
    if (matches[1] && dropdownData?.serviceList) {
      const serviceCandidate = this.dropdownDataService.findBestMatch(
        matches[1].trim(),
        dropdownData.serviceList,
        'Service'
      );
      if (serviceCandidate) result.service = serviceCandidate;
    }
  }

  /**
   * Process type field: "type is delivery", "it's a pickup".
   * Extracts order type with dropdown validation.
   */
  private processType(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { typeList?: string[] }
  ): void {
    if (matches[1] && dropdownData?.typeList) {
      result.type = this.dropdownDataService.findBestMatch(matches[1], dropdownData.typeList, 'Type') || matches[1];
    }
  }

  /**
   * Process place field: "picking up from McDonald's", "place is Starbucks".
   * Extracts place name with dropdown validation.
   */
  private processPlace(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { placeList?: string[] }
  ): void {
    if (matches[1]) {
      const placeCandidate = dropdownData?.placeList
        ? this.dropdownDataService.findBestMatch(matches[1], dropdownData.placeList, 'Place')
        : null;
      result.place = placeCandidate || matches[1];
    }
  }

  /**
   * Process customer name field: "customer is John Smith", "delivering to Sarah".
   * Extracts and capitalizes customer name.
   */
  private processName(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      // Capitalize each word in the name
      const name = matches[1].trim();
      result.name = name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
  }

  /**
   * Process payment field: "pay is $15", "$20 payment".
   * Extracts payment amount, supports numeric and word formats ("fifteen").
   */
  private processPay(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const raw = matches[1].replace(/[,\s]/g, '');
      const value = parseFloat(raw);
      if (!isNaN(value)) {
        result.pay = value;
      } else {
        const converted = NumberHelper.convertWordToNumber(raw);
        if (typeof converted === 'number' && !isNaN(converted)) {
          result.pay = converted;
        }
      }
    }
  }

  /**
   * Process tip field: "tip is $5", "$3 tip".
   * Extracts tip amount, supports numeric and word formats.
   */
  private processTip(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const raw = matches[1].replace(/[,\s]/g, '');
      const value = parseFloat(raw);
      if (!isNaN(value)) {
        result.tip = value;
      } else {
        const converted = NumberHelper.convertWordToNumber(raw);
        if (typeof converted === 'number' && !isNaN(converted)) {
          result.tip = converted;
        }
      }
    }
  }

  /**
   * Process bonus field: "$3 bonus", "bonus is $2".
   * Extracts bonus/surge/promo amount, supports numeric and word formats.
   */
  private processBonus(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const raw = matches[1].replace(/[,\s]/g, '');
      const value = parseFloat(raw);
      if (!isNaN(value)) {
        result.bonus = value;
      } else {
        const converted = NumberHelper.convertWordToNumber(raw);
        if (typeof converted === 'number' && !isNaN(converted)) {
          result.bonus = converted;
        }
      }
    }
  }

  /**
   * Process cash field: "cash is $10", "$5 cash tip".
   * Extracts cash amount, supports numeric and word formats.
   */
  private processCash(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const raw = matches[1].replace(/[,\s]/g, '');
      const value = parseFloat(raw);
      if (!isNaN(value)) {
        result.cash = value;
      } else {
        const converted = NumberHelper.convertWordToNumber(raw);
        if (typeof converted === 'number' && !isNaN(converted)) {
          result.cash = converted;
        }
      }
    }
  }

  /**
   * Process distance field: "distance is 5 miles", "5.2 miles".
   * Extracts distance value. Skipped if odometer readings are already present.
   */
  private processDistance(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    // Don't parse distance if odometer readings are present
    if (result.startOdometer || result.endOdometer) {
      return;
    }
    
    if (matches[1]) {
      const value = parseFloat(matches[1]);
      if (!isNaN(value)) {
        result.distance = value;
      }
    }
  }

  /**
   * Process start odometer field: "start odometer is 12345".
   * Extracts starting odometer reading (integer value).
   */
  private processStartOdometer(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const raw = matches[1].replace(/,/g, '');
      const value = parseFloat(raw);
      if (value !== undefined && !isNaN(value)) {
        result.startOdometer = Math.floor(value);
      }
    }
  }

  /**
   * Process end odometer field: "end odometer is 12350".
   * Extracts ending odometer reading (integer value).
   */
  private processEndOdometer(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const raw = matches[1].replace(/,/g, '');
      const value = parseFloat(raw);
      if (value !== undefined && !isNaN(value)) {
        result.endOdometer = Math.floor(value);
      }
    }
  }

  /**
   * Process pickup address field: "picking up from 123 Main St".
   * Extracts and cleans pickup address, validates against dropdown if available.
   */
  private processPickupAddress(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { addressList?: string[] }
  ): void {
    if (matches[1]) {
      const rawAddress = matches[1].trim();
      const cleaned = AddressHelper.getShortAddress(rawAddress);
      
      if (dropdownData?.addressList) {
        const addressCandidate = this.dropdownDataService.findBestMatch(
          cleaned,
          dropdownData.addressList,
          'Address'
        );
        if (addressCandidate) {
          result.pickupAddress = addressCandidate;
          return;
        }
      }
      
      result.pickupAddress = cleaned;
    }
  }

  /**
   * Process dropoff address field: "delivering to 456 Oak Ave".
   * Extracts and cleans dropoff address, validates against dropdown if available.
   */
  private processDropoffAddress(
    matches: RegExpMatchArray,
    result: IVoiceParseResult,
    dropdownData?: { addressList?: string[] }
  ): void {
    if (matches[1]) {
      const rawAddress = matches[1].trim();
      const cleaned = AddressHelper.getShortAddress(rawAddress);
      
      if (dropdownData?.addressList) {
        const addressCandidate = this.dropdownDataService.findBestMatch(
          cleaned,
          dropdownData.addressList,
          'Address'
        );
        if (addressCandidate) {
          result.dropoffAddress = addressCandidate;
          return;
        }
      }
      
      result.dropoffAddress = cleaned;
    }
  }

  /**
   * Process unit number field: "apartment 302", "unit 5B".
   * Extracts apartment/unit number, converts word numbers to digits.
   */
  private processUnitNumber(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      const converted = NumberHelper.convertWordToNumber(matches[1]);
      if (typeof converted === 'number' && !isNaN(converted)) {
        result.unitNumber = converted.toString();
      } else if (typeof converted === 'string') {
        result.unitNumber = matches[1].toUpperCase();
      } else {
        result.unitNumber = matches[1].toUpperCase();
      }
    }
  }

  /**
   * Process order number field: "order number 12345", "confirmation ABC123".
   * Extracts order/confirmation number as a string.
   */
  private processOrderNumber(matches: RegExpMatchArray, result: IVoiceParseResult): void {
    if (matches[1]) {
      result.orderNumber = matches[1].trim();
    }
  }
}
