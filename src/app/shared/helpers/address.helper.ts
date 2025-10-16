import { StringHelper } from "./string.helper";

// Abbreviation map for directions
const DIRECTION_MAP: Record<string, string> = {
    north: "N",
    east: "E",
    south: "S",
    west: "W",
    northeast: "NE",
    northwest: "NW",
    southeast: "SE",
    southwest: "SW"
};

// Abbreviation map for street types
const STREET_TYPE_MAP: Record<string, string> = {
    avenue: "Ave",
    boulevard: "Blvd",
    circle: "Cir",
    court: "Ct",
    drive: "Dr",
    lane: "Ln",
    place: "Pl",
    road: "Rd",
    street: "St",
    terrace: "Ter",
    parkway: "Pkwy",
    square: "Sq",
    trail: "Trl",
    highway: "Hwy",
    expressway: "Expy",
    center: "Ctr",
    plaza: "Plz",
    ridge: "Rdg",
    view: "Vw",
    heights: "Hts",
    manor: "Mnr",
    meadow: "Mdw",
    creek: "Crk",
    extension: "Ext",
    garden: "Gdn",
    gardens: "Gdns",
    gateway: "Gtwy",
    glen: "Gln",
    green: "Grn",
    grove: "Grv",
    harbor: "Hbr",
    hollow: "Holw",
    island: "Is",
    junction: "Jct",
    lake: "Lk",
    landing: "Lndg",
    light: "Lgt",
    lodge: "Ldg",
    meadows: "Mdws",
    mill: "Ml",
    mission: "Msn",
    mount: "Mt",
    mountain: "Mtn",
    orchard: "Orch",
    oval: "Oval",
    park: "Park",
    path: "Path",
    pike: "Pike",
    pine: "Pne",
    port: "Prt",
    prairie: "Pr",
    ramp: "Ramp",
    ranch: "Rnch",
    rapid: "Rpd",
    rapids: "Rpds",
    river: "Riv",
    shoal: "Shl",
    shoals: "Shls",
    shore: "Shr",
    shores: "Shrs",
    spring: "Spg",
    springs: "Spgs",
    station: "Sta",
    summit: "Smt",
    tunnel: "Tunl",
    turnpike: "Tpke",
    union: "Un",
    valley: "Vly",
    viaduct: "Via",
    village: "Vlg",
    villages: "Vlgs",
    ville: "Vl",
    vista: "Vis"
};

// Full abbreviation map
const ABBREV_MAP: Record<string, string> = { ...DIRECTION_MAP, ...STREET_TYPE_MAP };

// Regex for splitting addresses by comma with optional whitespace
const COMMA_SPLIT_REGEX = /,\s*/;

/**
 * Utility for address abbreviation and short address formatting.
 */
export class AddressHelper {
    /**
     * Returns a short, user-friendly address string.
     * @param address The full address string.
     * @param place The place name (optional).
     * @param length How many address parts to include (default 2).
     * @example
     * getShortAddress("123 North Main Street, Springfield, IL", "", 2) // "123 N Main St, Springfield"
     * getShortAddress("123 North Street, Springfield, IL", "", 2) // "123 North St, Springfield"
     */
    static getShortAddress(address: string, place: string = "", length: number = 2): string {
        if (!address) return "";
        // Remove the place from the address first
        address = this.removePlaceFromAddress(address, place);
        if (place && length === 0) {
            return address;
        }
        address = this.abbrvAddress(address);
        let addressArray = address.split(COMMA_SPLIT_REGEX).filter(part => part && part.trim().length > 0);
        if (addressArray.length === 0) return "";
        if (addressArray.length === 1) return addressArray[0];
        // Truncate first part if length > 2
        if (length > 2) {
            addressArray[0] = StringHelper.truncate(addressArray[0], 15);
        }
        return addressArray.slice(0, length).join(", ");
    }

    /**
     * Abbreviates common address words (directions, street types, etc.).
     * @param address The address string to abbreviate.
     * @example
     * abbrvAddress("123 North Main Street") // "123 N Main St"
     * abbrvAddress("123 North Street") // "123 North St"
     * abbrvAddress("123 North Savana Gardner Road") // "123 N Savana Gardner Rd"
     */
    static abbrvAddress(address: string): string {
        if (!address) return "";
        // Split by comma, focus on first part (street address)
        let parts = address.split(COMMA_SPLIT_REGEX);
        let street = parts[0];
        let streetWords = street.split(/\s+/).filter(word => word.length > 0);
        
        if (streetWords.length > 2) {
            // Abbreviate direction if present as the second word and followed by another word (not just street type)
            streetWords[1] = this.abbreviateWord(streetWords[1], DIRECTION_MAP);
            // Abbreviate street type if present at end
            streetWords[streetWords.length - 1] = this.abbreviateWord(streetWords[streetWords.length - 1], STREET_TYPE_MAP);
            parts[0] = streetWords.join(" ");
        } else if (streetWords.length === 2) {
            // Only abbreviate street type if present at end
            streetWords[1] = this.abbreviateWord(streetWords[1], ABBREV_MAP);
            parts[0] = streetWords.join(" ");
        } else if (streetWords.length === 1) {
            // Abbreviate if only one word and it's in the map
            parts[0] = this.abbreviateWord(streetWords[0], ABBREV_MAP);
        }
        
        // Rejoin with the rest of the address and clean up whitespace
        return parts.join(", ").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
    }

    /**
     * Helper method to abbreviate a single word using the provided map.
     * Preserves trailing punctuation (comma, period).
     * @param wordRaw The raw word to abbreviate.
     * @param map The abbreviation map to use.
     */
    private static abbreviateWord(wordRaw: string, map: Record<string, string>): string {
        const word = wordRaw.replace(/[,\.]/g, "").toLowerCase();
        const abbr = map[word];
        if (abbr) {
            return abbr + (wordRaw.endsWith(",") ? "," : "");
        }
        return wordRaw;
    }

    /**
     * Abbreviates a single direction word.
     * @param addressPart The direction word.
     */
    static abbrvDirection(addressPart: string): string {
        const key = addressPart.toLowerCase();
        return DIRECTION_MAP[key] || addressPart;
    }

    /**
     * Removes the place name from the address string if present.
     * @param address The full address string.
     * @param place The place name to remove.
     */
    static removePlaceFromAddress(address: string, place: string): string {
        if (!address) return '';
        if (!place) return address;
        
        const abbrvPlace = this.abbrvAddress(place).toLowerCase();
        const addressArray = address.split(COMMA_SPLIT_REGEX);
        
        if (addressArray.length === 0) return address;
        
        const first = addressArray[0].toLowerCase();
        const lowerPlace = place.toLowerCase();
        
        // Remove if first part matches place or abbrvPlace
        if (this.matchesPlace(first, lowerPlace, abbrvPlace)) {
            return addressArray.slice(1).join(', ').trim();
        }
        return address;
    }

    /**
     * Helper method to check if an address part matches a place name.
     * @param address The address part to check.
     * @param place The place name.
     * @param abbrvPlace The abbreviated place name.
     */
    private static matchesPlace(address: string, place: string, abbrvPlace: string): boolean {
        return address === place || 
               address === abbrvPlace || 
               address.startsWith(place) || 
               address.startsWith(abbrvPlace) ||
               place.startsWith(address) || 
               abbrvPlace.startsWith(address);
    }
}