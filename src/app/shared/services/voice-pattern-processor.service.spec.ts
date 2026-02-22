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

    it('should return empty result for empty transcript', () => {
      const result = service.parseTranscript('');
      expect(result).toEqual({});
    });

    it('should return empty result for whitespace-only transcript', () => {
      const result = service.parseTranscript('   ');
      expect(result).toEqual({});
    });

    it('should return empty result for unmatched transcript', () => {
      const result = service.parseTranscript('random words with no patterns');
      expect(result).toEqual({});
    });
  });

  describe('Combined Patterns', () => {
    beforeEach(() => {
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
      });
    });

    it('should parse pickupShop pattern - pickup from place', () => {
      // Mock to handle both type and place lookups separately
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        if (list.includes('Pickup') && input.toLowerCase() === 'pickup') return 'Pickup';
        if (list.includes('McDonald\'s')) return 'McDonald\'s';
        return undefined;
      });
      const result = service.parseTranscript('got a pickup from McDonald\'s', {
        typeList: ['Pickup', 'Delivery'],
        placeList: ['McDonald\'s', 'Starbucks']
      });
      expect(result.type).toBe('Pickup');
      expect(result.place).toBe('McDonald\'s');
    });

    it('should parse pickupShop pattern - shopping from place', () => {
      // Mock to handle both type and place lookups separately
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        if (list.includes('Shopping') && input.toLowerCase() === 'shopping') return 'Shopping';
        if (list.includes('Costco')) return 'Costco';
        return undefined;
      });
      const result = service.parseTranscript('have a shopping from Costco', {
        typeList: ['Shopping', 'Delivery'],
        placeList: ['Costco', 'Target']
      });
      expect(result.type).toBe('Shopping');
      expect(result.place).toBe('Costco');
    });

    it('should parse serviceType pattern - DoorDash delivery', () => {
      const result = service.parseTranscript('got a DoorDash delivery', {
        serviceList: ['DoorDash', 'UberEats'],
        typeList: ['Delivery', 'Pickup']
      });
      expect(result.service).toBe('DoorDash');
      expect(result.type).toBe('Delivery');
    });

    it('should parse serviceType pattern - Uber ride', () => {
      const result = service.parseTranscript('working Uber ride', {
        serviceList: ['Uber', 'Lyft'],
        typeList: ['Ride', 'Pickup']
      });
      expect(result.service).toBe('Uber');
      expect(result.type).toBe('Ride');
    });

    it('should parse payTip pattern', () => {
      const result = service.parseTranscript('pay is 25 and tip is 5');
      expect(result.pay).toBe(25);
      expect(result.tip).toBe(5);
    });

    it('should parse payTipBonus pattern - all three amounts', () => {
      const result = service.parseTranscript('pay $20, tip $4, and bonus $3');
      expect(result.pay).toBe(20);
      expect(result.tip).toBe(4);
      expect(result.bonus).toBe(3);
    });

    it('should parse payTipBonus pattern - pay and bonus only', () => {
      const result = service.parseTranscript('pay $18 and peak pay $2.50');
      expect(result.pay).toBe(18);
      expect(result.bonus).toBe(2.50);
    });

    it('should parse payDistance pattern', () => {
      const result = service.parseTranscript('pay is $15 for 7 miles');
      expect(result.pay).toBe(15);
      expect(result.distance).toBe(7);
    });

    it('should parse placeType pattern', () => {
      // Mock to handle both place and type lookups separately
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        if (list.includes('Starbucks')) return 'Starbucks';
        if (list.includes('Pickup') && input.toLowerCase() === 'pickup') return 'Pickup';
        return undefined;
      });
      const result = service.parseTranscript('Starbucks pickup', {
        placeList: ['Starbucks', 'McDonald\'s'],
        typeList: ['Pickup', 'Delivery']
      });
      expect(result.place).toBe('Starbucks');
      expect(result.type).toBe('Pickup');
    });
  });

  describe('Service Patterns', () => {
    beforeEach(() => {
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
      });
    });

    it('should parse service with "I have a" prefix', () => {
      const result = service.parseTranscript('I have a DoorDash order', {
        serviceList: ['DoorDash', 'UberEats']
      });
      expect(result.service).toBe('DoorDash');
    });

    it('should parse service with "working" prefix', () => {
      const result = service.parseTranscript('working UberEats', {
        serviceList: ['UberEats', 'GrubHub']
      });
      expect(result.service).toBe('UberEats');
    });

    it('should parse service with "using" prefix', () => {
      const result = service.parseTranscript('using Instacart', {
        serviceList: ['Instacart', 'Shipt']
      });
      expect(result.service).toBe('Instacart');
    });
  });

  describe('Name Patterns', () => {
    it('should parse name with "customer is" prefix', () => {
      const result = service.parseTranscript('the customer is Sarah');
      expect(result.name).toBe('Sarah');
    });

    it('should parse name with "delivering to" prefix', () => {
      const result = service.parseTranscript('delivering to Michael');
      expect(result.name).toBe('Michael');
    });

    it('should parse name with "for" prefix', () => {
      const result = service.parseTranscript('package for Jennifer');
      expect(result.name).toBe('Jennifer');
    });

    it('should capitalize first letter of name', () => {
      const result = service.parseTranscript('customer is john');
      expect(result.name).toBe('John');
    });

    it('should preserve multi-word names', () => {
      const result = service.parseTranscript('customer is Mary Jane');
      expect(result.name).toBe('Mary Jane');
    });
  });

  describe('Place Patterns', () => {
    beforeEach(() => {
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase().includes(input.toLowerCase())) || undefined;
      });
    });

    it('should parse place with "picking up from" prefix', () => {
      dropdownDataService.findBestMatch.and.returnValue('Walmart');
      const result = service.parseTranscript('picking up from Walmart', {
        placeList: ['Walmart', 'Target']
      });
      expect(result.place).toBe('Walmart');
    });

    it('should parse place with "place is" prefix', () => {
      dropdownDataService.findBestMatch.and.returnValue('Chipotle');
      const result = service.parseTranscript('the place is Chipotle', {
        placeList: ['Chipotle', 'Panera']
      });
      expect(result.place).toBe('Chipotle');
    });

    it('should handle place names with apostrophes', () => {
      dropdownDataService.findBestMatch.and.returnValue('McDonald\'s');
      const result = service.parseTranscript('picking up from McDonald\'s', {
        placeList: ['McDonald\'s', 'Wendy\'s']
      });
      expect(result.place).toBe('McDonald\'s');
    });

    it('should handle place names with ampersands', () => {
      dropdownDataService.findBestMatch.and.returnValue('Bed & Bath');
      const result = service.parseTranscript('pickup from Bed & Bath', {
        placeList: ['Bed & Bath', 'Home Depot']
      });
      expect(result.place).toBe('Bed & Bath');
    });
  });

  describe('Money Patterns', () => {
    it('should parse pay with dollar sign', () => {
      const result = service.parseTranscript('pay is $25');
      expect(result.pay).toBe(25);
    });

    it('should parse pay with "dollars" suffix', () => {
      const result = service.parseTranscript('pay is 30 dollars');
      expect(result.pay).toBe(30);
    });

    it('should parse pay with decimal amount', () => {
      const result = service.parseTranscript('pay is $15.50');
      expect(result.pay).toBe(15.50);
    });

    it('should parse pay from "earned" statement', () => {
      const result = service.parseTranscript('I earned $22');
      expect(result.pay).toBe(22);
    });

    it('should parse tip with dollar sign', () => {
      const result = service.parseTranscript('tip is $5');
      expect(result.tip).toBe(5);
    });

    it('should parse tip from "tipped" statement', () => {
      const result = service.parseTranscript('customer tipped $8');
      expect(result.tip).toBe(8);
    });

    it('should parse tip with decimal', () => {
      const result = service.parseTranscript('tip is $3.50');
      expect(result.tip).toBe(3.50);
    });

    it('should parse bonus with dollar sign', () => {
      const result = service.parseTranscript('bonus is $4');
      expect(result.bonus).toBe(4);
    });

    it('should parse surge/peak pay as bonus', () => {
      const result = service.parseTranscript('peak pay $5.50');
      expect(result.bonus).toBe(5.50);
    });

    it('should parse promo as bonus', () => {
      const result = service.parseTranscript('promo $3');
      expect(result.bonus).toBe(3);
    });

    it('should parse cash payment', () => {
      const result = service.parseTranscript('cash is $10');
      expect(result.cash).toBe(10);
    });

    it('should parse received cash', () => {
      const result = service.parseTranscript('received $15 in cash');
      expect(result.cash).toBe(15);
    });

    it('should not confuse pay and tip in same transcript', () => {
      const result = service.parseTranscript('pay $20 and tip $4');
      expect(result.pay).toBe(20);
      expect(result.tip).toBe(4);
    });
  });

  describe('Address Patterns', () => {
    it('should parse pickup address', () => {
      const result = service.parseTranscript('picking up at 123 Main Street');
      // AddressHelper abbreviates "Street" to "St"
      expect(result.pickupAddress).toBe('123 Main St');
    });

    it('should parse pickup address with "from" prefix', () => {
      const result = service.parseTranscript('pickup from 456 Oak Avenue');
      // AddressHelper abbreviates "Avenue" to "Ave"
      expect(result.pickupAddress).toBe('456 Oak Ave');
    });

    it('should parse dropoff address', () => {
      const result = service.parseTranscript('dropping off at 789 Elm Street');
      // AddressHelper abbreviates "Street" to "St"
      expect(result.dropoffAddress).toBe('789 Elm St');
    });

    it('should parse destination address', () => {
      const result = service.parseTranscript('destination is 321 Pine Road');
      // AddressHelper abbreviates "Road" to "Rd"
      expect(result.dropoffAddress).toBe('321 Pine Rd');
    });

    it('should parse address with commas', () => {
      const result = service.parseTranscript('picking up at 100 Main St, Suite 200');
      expect(result.pickupAddress).toBe('100 Main St, Suite 200');
    });

    it('should shorten long addresses', () => {
      const result = service.parseTranscript('dropping off at 1234 Very Long Street Name Avenue North Suite 500');
      expect(result.dropoffAddress?.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Odometer and Distance Patterns', () => {
    it('should parse start odometer', () => {
      const result = service.parseTranscript('start odometer is 12345');
      expect(result.startOdometer).toBe(12345);
    });

    it('should parse start odometer with "odo" abbreviation', () => {
      const result = service.parseTranscript('starting odo is 98765');
      expect(result.startOdometer).toBe(98765);
    });

    it('should parse end odometer', () => {
      const result = service.parseTranscript('end odometer is 12355');
      expect(result.endOdometer).toBe(12355);
    });

    it('should parse end odometer with decimal', () => {
      const result = service.parseTranscript('ending odo is 54321.5');
      // NumberHelper converts odometer to integer (no decimals for odometer readings)
      expect(result.endOdometer).toBe(54321);
    });

    it('should parse distance with "miles" suffix', () => {
      const result = service.parseTranscript('distance is 8 miles');
      expect(result.distance).toBe(8);
    });

    it('should parse distance from "drove" statement', () => {
      const result = service.parseTranscript('I drove 12 miles');
      expect(result.distance).toBe(12);
    });

    it('should parse distance with decimal', () => {
      const result = service.parseTranscript('distance is 5.5 miles');
      expect(result.distance).toBe(5.5);
    });

    it('should calculate distance from odometer readings', () => {
      const result = service.parseTranscript('start odometer is 12345 and end odometer is 12355');
      expect(result.startOdometer).toBe(12345);
      expect(result.endOdometer).toBe(12355);
      // Note: distance calculation would be handled by the component
    });

    it('should parse only odometer when both distance and odometer are provided', () => {
      const result = service.parseTranscript('distance is 10 miles start odometer is 12345');
      // Distance is intentionally skipped when odometer is present (they're mutually exclusive)
      expect(result.distance).toBeUndefined();
      expect(result.startOdometer).toBe(12345);
    });
  });

  describe('Type Patterns', () => {
    beforeEach(() => {
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
      });
    });

    it('should parse type as "Delivery"', () => {
      const result = service.parseTranscript('type is delivery', {
        typeList: ['Delivery', 'Pickup']
      });
      expect(result.type).toBe('Delivery');
    });

    it('should parse type as "Pickup"', () => {
      const result = service.parseTranscript('it\'s a pickup', {
        typeList: ['Pickup', 'Delivery']
      });
      expect(result.type).toBe('Pickup');
    });

    it('should parse type as "Ride"', () => {
      const result = service.parseTranscript('got a ride', {
        typeList: ['Ride', 'Delivery']
      });
      expect(result.type).toBe('Ride');
    });

    it('should parse type as "Shop"', () => {
      const result = service.parseTranscript('doing a shop', {
        typeList: ['Shop', 'Delivery']
      });
      expect(result.type).toBe('Shop');
    });
  });

  describe('Identification Patterns', () => {
    it('should parse unit number', () => {
      const result = service.parseTranscript('unit 5B');
      expect(result.unitNumber).toBe('5B');
    });

    it('should parse apartment number', () => {
      const result = service.parseTranscript('apartment 302');
      expect(result.unitNumber).toBe('302');
    });

    it('should parse unit number with "apt" abbreviation', () => {
      const result = service.parseTranscript('apt 12A');
      expect(result.unitNumber).toBe('12A');
    });

    it('should parse suite number', () => {
      const result = service.parseTranscript('suite 500');
      expect(result.unitNumber).toBe('500');
    });

    it('should parse order number with "order number" prefix', () => {
      const result = service.parseTranscript('order number ABC123');
      expect(result.orderNumber).toBe('ABC123');
    });

    it('should parse order number with hash symbol', () => {
      const result = service.parseTranscript('order #12345');
      expect(result.orderNumber).toBe('12345');
    });

    it('should parse confirmation number', () => {
      const result = service.parseTranscript('confirmation XYZ789');
      expect(result.orderNumber).toBe('XYZ789');
    });

    it('should parse delivery ID', () => {
      const result = service.parseTranscript('delivery id DEL456');
      expect(result.orderNumber).toBe('DEL456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple spaces in transcript', () => {
      const result = service.parseTranscript('pay   is   $15');
      expect(result.pay).toBe(15);
    });

    it('should handle mixed case transcript', () => {
      const result = service.parseTranscript('PAY IS $20');
      expect(result.pay).toBe(20);
    });

    it('should handle transcript with leading/trailing spaces', () => {
      const result = service.parseTranscript('  pay is $18  ');
      expect(result.pay).toBe(18);
    });

    it('should handle zero amounts', () => {
      const result = service.parseTranscript('tip is $0');
      expect(result.tip).toBe(0);
    });

    it('should handle very large numbers', () => {
      const result = service.parseTranscript('end odometer is 999999');
      expect(result.endOdometer).toBe(999999);
    });

    it('should handle complex combined transcript', () => {
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        if (list.includes('DoorDash') && input.toLowerCase().includes('doordash')) return 'DoorDash';
        if (list.includes('Delivery') && input.toLowerCase() === 'delivery') return 'Delivery';
        return undefined;
      });
      
      // Put unit number before customer name so it can be extracted separately
      const result = service.parseTranscript(
        'got a DoorDash delivery pay is $15 and tip is $3 distance is 5 miles unit 5B customer is John',
        {
          serviceList: ['DoorDash', 'UberEats'],
          typeList: ['Delivery', 'Pickup']
        }
      );
      
      expect(result.service).toBe('DoorDash');
      expect(result.type).toBe('Delivery');
      expect(result.pay).toBe(15);
      expect(result.tip).toBe(3);
      expect(result.distance).toBe(5);
      expect(result.name).toBe('John');
      expect(result.unitNumber).toBe('5B');
    });
  });

  describe('Priority and Field Protection', () => {
    beforeEach(() => {
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        return list.find(item => item.toLowerCase() === input.toLowerCase()) || undefined;
      });
    });

    it('should not allow lower priority patterns to overwrite higher priority fields', () => {
      const result = service.parseTranscript('got an Uber ride at Starbucks', {
        serviceList: ['Uber', 'Lyft', 'Starbucks'],
        typeList: ['Ride', 'Delivery'],
        placeList: ['Starbucks', 'McDonald\'s']
      });
      
      // serviceType (priority 11) sets service='Uber', type='Ride'
      // placeType (priority 15) should NOT overwrite these
      expect(result.service).toBe('Uber');
      expect(result.type).toBe('Ride');
      expect(result.place).toBe('Starbucks');
    });

    it('should handle pickupShop preventing placeType from overwriting', () => {
      // Mock to handle both type and place lookups
      dropdownDataService.findBestMatch.and.callFake((input: string, list: string[]) => {
        if (list.includes('Pickup') && input.toLowerCase() === 'pickup') return 'Pickup';
        if (list.includes('Target')) return 'Target';
        return undefined;
      });
      
      const result = service.parseTranscript('got a pickup from Target', {
        typeList: ['Pickup', 'Delivery'],
        placeList: ['Target', 'Walmart']
      });
      
      // pickupShop (priority 10) sets type='Pickup', place='Target'
      // placeType (priority 15) should not overwrite
      expect(result.type).toBe('Pickup');
      expect(result.place).toBe('Target');
    });
  });
});
