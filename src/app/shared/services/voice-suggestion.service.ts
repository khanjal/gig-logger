import { Injectable } from '@angular/core';

/**
 * Service for generating random voice input suggestions/examples.
 * These suggestions help users understand what they can say to the voice input component.
 */
@Injectable({
  providedIn: 'root'
})
export class VoiceSuggestionService {
  
  /**
   * Generates a random suggestion phrase based on available data.
   * @param serviceList Available service options
   * @param typeList Available type options
   * @param placeList Available place options
   * @returns Random example phrase
   */
  getRandomSuggestion(
    serviceList: string[] = [],
    typeList: string[] = [],
    placeList: string[] = []
  ): string {
    // Define pattern categories with example generators that match the actual regex patterns
    const categoryGenerators = [
      // SERVICE patterns - from servicePatterns array
      () => {
        const service = serviceList.length > 0 ? this.getRandomItem(serviceList) : 'DoorDash';
        const templates = ['I have a {s}', 'Working {s}', 'Service is {s}', 'Driving {s}', 'Using {s}', 'Got a {s}', 'It\'s a {s} gig', 'On {s}'];
        return this.getRandomItem(templates).replace('{s}', service);
      },
      
      // SERVICE + TYPE combined - from serviceTypePattern
      () => {
        const service = serviceList.length > 0 ? this.getRandomItem(serviceList) : 'DoorDash';
        const type = typeList.length > 0 ? this.getRandomItem(typeList) : 'delivery';
        const templates = ['I have a {s} {t}', 'Got a {s} {t}', 'Working {s} {t}', 'On a {s} {t}', 'Doing a {s} {t}'];
        return this.getRandomItem(templates).replace('{s}', service).replace('{t}', type);
      },
      
      // PICKUP/SHOP + PLACE pattern - from pickupShopPattern
      () => {
        const place = placeList.length > 0 ? this.getRandomItem(placeList) : 'McDonald\'s';
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
        const place = placeList.length > 0 ? this.getRandomItem(placeList) : 'Starbucks';
        const templates = ['Picking up from {p}', 'Place is {p}', 'Location is {p}', 'Store is {p}', 'At {p}', 'Grabbing from {p}', 'Getting from {p}', 'Merchant is {p}'];
        return this.getRandomItem(templates).replace('{p}', place);
      },
      
      // PAY + TIP combined - from payTipPattern
      () => {
        const pay = this.getRandomNumber(8, 25);
        const tip = this.getRandomNumber(2, 10);
        return `Pay is $${pay} and tip is $${tip}`;
      },
      
      // PAY + TIP + BONUS combined - from payTipBonusPattern
      () => {
        const pay = this.getRandomNumber(10, 25);
        const tip = this.getRandomNumber(2, 8);
        const bonus = this.getRandomNumber(2, 10);
        const templates = [
          `Pay is $${pay}, tip $${tip}, and bonus $${bonus}`,
          `$${pay} pay, $${tip} tip, $${bonus} bonus`,
          `Pay $${pay}, tip $${tip}, bonus $${bonus}`
        ];
        return this.getRandomItem(templates);
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
        const type = typeList.length > 0 ? this.getRandomItem(typeList) : 'delivery';
        const templates = ['Type is {t}', 'It\'s a {t}', 'Got a {t}', 'Have a {t} order', '{t} run', 'Doing a {t}', 'On a {t}'];
        return this.getRandomItem(templates).replace('{t}', type);
      },
      
      // PLACE + TYPE combined - from placeTypePattern
      () => {
        const place = placeList.length > 0 ? this.getRandomItem(placeList) : 'McDonald\'s';
        const type = typeList.length > 0 ? this.getRandomItem(typeList) : 'pickup';
        return `${place} ${type}`;
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

  /**
   * Get a random item from an array
   */
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get a random number between min and max (inclusive)
   */
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
