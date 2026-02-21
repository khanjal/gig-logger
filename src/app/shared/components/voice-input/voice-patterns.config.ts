/**
 * Voice Input Pattern Configuration
 * 
 * Centralized regex patterns for parsing voice transcripts.
 * Patterns are organized by field type with metadata for processing order and combinations.
 */

export interface PatternDefinition {
  /** Regex patterns to match, in order of precedence */
  patterns: RegExp[];
  /** Processing priority (lower = earlier processing) */
  priority: number;
  /** Fields this can combine with in multi-field patterns */
  combinesWith?: string[];
  /** Description for documentation */
  description: string;
}

/**
 * All voice input patterns organized by field type.
 * Processing order matters - combined patterns should be checked before individual patterns.
 */
export const VOICE_PATTERNS: Record<string, PatternDefinition> = {
  /**
   * COMBINED PATTERNS - Priority 1 (check these first)
   * These extract multiple fields from a single phrase
   */
  pickupShop: {
    priority: 10,
    description: 'Handle pickup/shop as type, extract place after "from"',
    patterns: [
      /(?:^|(?:have|got|doing)\s+(?:a|an)\s+)(pickup|shop|shopping)\s+from\s+([\w\s''`.,&-]+)/i
    ],
    combinesWith: ['type', 'place']
  },

  serviceType: {
    priority: 11,
    description: 'Service + Type combined: "DoorDash delivery", "Uber ride"',
    patterns: [
      /(?:i have (?:a|an)|got (?:a|an)|doing (?:a|an)|working|on|using)\s+([\w\s]+?)\s+(delivery|pickup|ride|shop|shopping|dropoff|drop off)/i
    ],
    combinesWith: ['service', 'type']
  },

  payTip: {
    priority: 12,
    description: 'Pay + Tip combined: "pay is $15 and tip is $5"',
    patterns: [
      /(?:pay(?:ment)? (?:is|was|:)?\s*)?\$?([\w\s.-]+?)\s*(?:dollar(?:s)?)?\s*and\s*(?:tip (?:is|was|:)?\s*)?\$?([\w\s.-]+?)(?:\s*dollar(?:s)?)?$/i
    ],
    combinesWith: ['pay', 'tip']
  },

  payTipBonus: {
    priority: 13,
    description: 'Pay + Tip + Bonus combined: "Pay is $15, tip $3, and bonus $2"',
    patterns: [
      /(?:pay[:\s]*)?\$?(\d+(?:\.\d{1,2})?)(?:[\s,]+(?:and\s+)?tip[:\s]*\$?(\d+(?:\.\d{1,2})?))?[\s,]+(?:and\s+)?(?:bonus|promo|peak pay|surge)[:\s]*\$?(\d+(?:\.\d{1,2})?)/i
    ],
    combinesWith: ['pay', 'tip', 'bonus']
  },

  payDistance: {
    priority: 14,
    description: 'Pay + Distance combined: "pay is $15 for 5 miles"',
    patterns: [
      /(?:pay(?:ment)? (?:is|was|:)|paid|amount (?:is|was|:))?\s*\$?(\d+(?:\.\d{1,2})?)\s*(?:dollar(?:s)?)?\s*for\s*(\d+(?:\.\d+)?)\s*(mile|miles|mi|me|km|kilometer|kilometers)/i
    ],
    combinesWith: ['pay', 'distance']
  },

  placeType: {
    priority: 15,
    description: 'Place + Type combined: "McDonald\'s pickup", "Starbucks delivery"',
    patterns: [
      /([\w\s''`.,&-]+?)\s+(delivery|pickup|ride|shop|shopping|dropoff|drop off)(?:\s|$)/i
    ],
    combinesWith: ['place', 'type']
  },

  /**
   * SERVICE PATTERNS - Priority 2
   */
  service: {
    priority: 20,
    description: 'Service identification: "I have a doordash", "working uber"',
    patterns: [
      /(?:i have (?:a|an)|i got (?:a|an)|got (?:a|an))\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:working|doing|on|driving|running)\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:service|app|platform) (?:is|was|:)\s*((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+)/i,
      /(?:using|with)\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|going|to|for|from|at)|$)/i,
      /(?:it'?s|this is)\s+(?:a|an)\s+((?!address|destination|place|type|order|unit|pickup|shop|delivery)[\w\s]+?)(?:\s+(?:order|delivery|trip|gig)|$)/i
    ]
  },

  /**
   * NAME vs PLACE PATTERNS - Priority 3
   * Context-aware: parse NAME first to avoid conflicts
   */
  name: {
    priority: 30,
    description: 'Customer/recipient name: "the customer is Jeremy", "taking it to Jane"',
    patterns: [
      /(?:(?:the )?(?:name|person|customer|client) (?:is|was|:)|customer's|client's|name:|customer name is)\s*([\w\s]+?)$/i,
      /(?:drop(?:ping)? off (?:at|to|with|for)|dropoff (?:at|to|with|for)|dropping (?:at|to|with|for))\s+([\w\s]+?)$/i,
      /(?:delivering to|deliver to|delivery (?:to|for)|taking (?:it )?to|going to|headed to|bringing (?:it )?to)\s+([\w\s]+?)$/i,
      /(?:for|to)\s+([\w\s]+?)$/i
    ]
  },

  place: {
    priority: 31,
    description: 'Pickup location: "picking up from McDonald\'s", "the place is Starbucks"',
    patterns: [
      /(?:pick(?:ing)?[- ]?up (?:from|at)|pick[- ]?up (?:from|at)|grabbing (?:from|at)|getting (?:from|at))\s+([\w\s''`'.,&-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
      /(?:place is|place:|the place is|location is|store is|restaurant is|merchant is)\s+([\w\s''`'.,&-]+?)$/i,
      /(?:from|at)\s+([\w\s''`.,&-]+?)(?=\s+(?:and|to|drop|deliver|going)|$)/i
    ]
  },

  /**
   * MONEY PATTERNS - Priority 4
   * Parse in order: pay, tip, bonus, cash (with overlap prevention)
   */
  pay: {
    priority: 40,
    description: 'Payment amount: "$15", "pay is fifteen"',
    patterns: [
      /(?:(?:the )?pay(?:ment|out)? (?:is|was|:)|paid|(?:the )?amount (?:is|was|:)|made|earned|got paid|(?:the )?total (?:is|was|:))\s*\$?([\d.]+|[\w.-]+)/i,
      // Only match 'dollars' if not in a phrase containing 'tip', 'bonus', or 'cash' before or after
      /(?<!(?:tip|bonus|cash)[^\d]{0,20})(\d+(?:\.\d+)?)\s*dollar(?:s)?(?![^\d]{0,20}(?:tip|bonus|cash))/i,
      // Only match $amount if not in a phrase containing 'tip', 'bonus', or 'cash' before or after
      /(?<!(?:tip|bonus|cash)[^$]{0,20})\$(\d+(?:\.\d+)?)(?![^$]{0,20}(?:tip|bonus|cash))/i
    ]
  },

  tip: {
    priority: 41,
    description: 'Tip amount: "$5 tip", "tip is five"',
    patterns: [
      /(?:(?:the )?tip (?:is|was|:|of)|tipped(?: me)?|left (?:a )?tip|customer tipped|they tipped|(?:the )?gratuity (?:is|was|:))\s*\$?([\d.]+|[\w.-]+)/i,
      /\$?(\d+(?:\.\d+)?)\s*(?:dollar|buck)(?:s)?\s*(?:tip|gratuity)/i,
      /(\d+(?:\.\d+)?|[\w-]+)\s*(?:dollar|buck)(?:s)?\s*(?:tip|gratuity)/i,
      /\$(\d+(?:\.\d+)?)\s*(?:tip|gratuity)/i
    ]
  },

  bonus: {
    priority: 42,
    description: 'Bonus/incentive amount: "bonus is 5", "$5 bonus"',
    patterns: [
      /(?:(?:the )?bonus (?:is|was|:|of)|promo|promotion|incentive|peak pay|quest|surge)\s*\$?([\d.]+|[\w.-]+)/i,
      /\$?(\d+(?:\.\d+)?)\s*(?:dollar|buck)(?:s)?\s*(?:bonus|promo|promotion|incentive)/i,
      /([\d.]+|[\w-]+)\s*(?:dollar|buck)(?:s)?\s*(?:bonus|promo|promotion|incentive)/i,
      /\$?(\d+(?:\.\d+)?)\s*(?:bonus|promo|promotion|incentive|peak pay|quest|surge)/i
    ]
  },

  cash: {
    priority: 43,
    description: 'Cash payment: "cash is 10", "$10 cash"',
    patterns: [
      /(?:(?:the )?cash (?:is|was|:|payment|tip))\s*\$?([\d.]+|[\w.-]+)/i,
      /(?:given|received|got)\s*\$?([\d.]+|[\w.-]+)\s*(?:in )?cash/i,
      /\$?([\d.]+)\s*(?:dollar|buck)(?:s)?\s*(?:cash|in cash)/i,
      /([\d.]+|[\w-]+)\s*(?:dollar|buck)(?:s)?\s*(?:cash|in cash)/i,
      /(?:paid|paying|payed)\s*(?:in\s+)?cash\s*\$?([\d.]+|[\w.-]+)/i
    ]
  },

  /**
   * ADDRESS PATTERNS - Priority 5
   */
  pickupAddress: {
    priority: 50,
    description: 'Pickup address: "picking up at 123 Main Street"',
    patterns: [
      /(?:pick(?:ing)?[- ]?up (?:at|on|from))\s+([\w\s,.-]+?)(?=\s+(?:and|to|drop|deliver)|$)/i,
      /(?:pick[- ]?up (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:from (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:start(?:ing)? (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ]
  },

  dropoffAddress: {
    priority: 51,
    description: 'Dropoff address: "dropping off at 456 Elm St", "destination is Main Street"',
    patterns: [
      /(?:drop(?:ping)? off (?:at|on|to)|drop[- ]?off (?:at|on|to)|dropping (?:at|on|to))\s+([\w\s,.-]+?)$/i,
      /(?:drop[- ]?off (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:destination (?:is|was|:)|destination (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:to (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i,
      /(?:going to|heading to|delivering to)\s+([\w\s,.-]+?)$/i,
      /(?:end (?:address|location) (?:is|was|:))\s+([\w\s,.-]+?)$/i
    ]
  },

  /**
   * ODOMETER & DISTANCE PATTERNS - Priority 6
   */
  startOdometer: {
    priority: 60,
    description: 'Start odometer reading: "start odometer is 12345"',
    patterns: [
      /(?:start(?:ing)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i,
      /(?:odometer|odo) start (?:is|was|:)?\s*([\w.,-]+)/i,
      /(?:begin(?:ning)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i
    ]
  },

  endOdometer: {
    priority: 61,
    description: 'End odometer reading: "end odometer is 12345"',
    patterns: [
      /(?:end(?:ing)? (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i,
      /(?:odometer|odo) end (?:is|was|:)?\s*([\w.,-]+)/i,
      /(?:final (?:odometer|odo) (?:is|was|:))\s*([\w.,-]+)/i
    ]
  },

  distance: {
    priority: 62,
    description: 'Distance traveled: "distance is 5 miles", "drove 10 miles"',
    patterns: [
      /(?:\bdistance (?:is|was|:)|total distance\b)\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i,
      /(?:\bdrove|traveled|went|it was\b)\s*(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i,
      /\b(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b\s*(?:away|trip|drive|total)?/i,
      /\bfor\s+(\d+(?:\.\d+)?)\s*(?:mile|miles|mi|km|kilometer|kilometers)\b/i
    ]
  },

  /**
   * TYPE PATTERNS - Priority 7
   */
  type: {
    priority: 70,
    description: 'Gig type: "type is delivery", "it\'s a pickup"',
    patterns: [
      /(?:(?:the )?type (?:is|was|:))\s*([\w\s]+?)(?=\s+(?:for|to|at|from)|$)/i,
      /(?:it'?s a|this is a|got a|have a|doing a|on a)\s*(delivery|pickup|dropoff|drop off|ride|shop|shopping)/i,
      /(delivery|pickup|dropoff|drop off|ride|shop|shopping)\s*(?:order|trip|run|gig)/i
    ]
  },

  /**
   * IDENTIFICATION PATTERNS - Priority 8
   */
  unitNumber: {
    priority: 80,
    description: 'Unit/apartment number: "unit 5B", "apartment 302"',
    patterns: [
      /(?:unit|apartment|apt|building|bldg|floor|room|suite)\s*(?:number\s*)?(?:is\s*)?([\dA-Za-z-]+)(?!\s*(?:order|delivery|trip))/i,
      /(?:in|at|to)\s+(?:unit|apartment|apt|building|bldg|floor|room|suite)\s*(?:number\s*)?([\dA-Za-z-]+)/i,
      /(?:the\s+)?(?:unit|apartment|apt|building|bldg|floor|room|suite)\s+([\dA-Za-z-]+)/i
    ]
  },

  orderNumber: {
    priority: 81,
    description: 'Order/delivery number: "order number 12345", "confirmation ABC123"',
    patterns: [
      /(?:order\s+(?:number|id|code)|delivery\s+(?:number|id|code)|trip\s+(?:number|id|code)|confirmation\s+(?:number|code)?|tracking\s+(?:number|code)?|reference\s+(?:number|code)?)\s*(?:is\s*)?([\dA-Za-z-]+)/i,
      /(?:order|delivery|trip)\s*#\s*([\dA-Za-z-]+)/i
    ]
  }
};

/**
 * Get patterns sorted by priority (for ordered processing)
 */
export function getSortedPatternKeys(): string[] {
  return Object.keys(VOICE_PATTERNS).sort((a, b) => {
    return VOICE_PATTERNS[a].priority - VOICE_PATTERNS[b].priority;
  });
}
