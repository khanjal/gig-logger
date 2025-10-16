import { StringHelper } from "./string.helper";

// Abbreviation map for address words, formatted for readability
const ABBREV_MAP: Record<string, string> = {
    // Directions
    north: "N",
    east: "E",
    south: "S",
    west: "W",
    northeast: "NE",
    northwest: "NW",
    southeast: "SE",
    southwest: "SW",
    // Street types
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

/**
 * Utility for address abbreviation and short address formatting.
 */
export class AddressHelper {
    /**
     * Returns a short, user-friendly address string.
     * @param address The full address string.
     * @param place The place name (optional).
     * @param length How many address parts to include (default 2).
     */
    static getShortAddress(address: string, place: string = "", length: number = 2): string {
        if (!address) return "";
        // Remove the place from the address first
        address = this.removePlaceFromAddress(address, place);
        if (place && length === 0) {
            return address;
        }
        address = this.abbrvAddress(address);
        let addressArray = address.split(/,\s*/).filter(part => part && part.trim().length > 0);
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
     */
    static abbrvAddress(address: string): string {
        if (!address) return "";
        // Split by comma, focus on first part (street address)
        let parts = address.split(/,\s*/);
        let street = parts[0];
        let streetWords = street.split(/\s+/);
        if (streetWords.length > 2) {
            // Abbreviate direction if present as the second word and followed by another word (not just street type)
            let secondWordRaw = streetWords[1];
            let secondWord = secondWordRaw.replace(/[,\.]/g, "").toLowerCase();
            if (["north","south","east","west","northeast","northwest","southeast","southwest"].includes(secondWord)) {
                streetWords[1] = ABBREV_MAP[secondWord] + (secondWordRaw.endsWith(",") ? "," : "");
            }
            // Abbreviate street type if present at end
            let lastWordRaw = streetWords[streetWords.length - 1];
            let lastWord = lastWordRaw.replace(/[,\.]/g, "").toLowerCase();
            if (ABBREV_MAP[lastWord]) {
                streetWords[streetWords.length - 1] = ABBREV_MAP[lastWord] + (lastWordRaw.endsWith(",") ? "," : "");
            }
            parts[0] = streetWords.join(" ");
        } else if (streetWords.length === 1) {
            // Abbreviate if only one word and it's a street type
            let wordRaw = streetWords[0];
            let word = wordRaw.replace(/[,\.]/g, "").toLowerCase();
            if (ABBREV_MAP[word]) {
                parts[0] = ABBREV_MAP[word] + (wordRaw.endsWith(",") ? "," : "");
            }
        } else if (streetWords.length === 2) {
            // Only abbreviate street type if present at end
            let lastWordRaw = streetWords[streetWords.length - 1];
            let lastWord = lastWordRaw.replace(/[,\.]/g, "").toLowerCase();
            if (ABBREV_MAP[lastWord]) {
                streetWords[streetWords.length - 1] = ABBREV_MAP[lastWord] + (lastWordRaw.endsWith(",") ? "," : "");
            }
            parts[0] = streetWords.join(" ");
        }
        // Rejoin with the rest of the address
        return parts.join(", ").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
    }

    /**
     * Abbreviates a single direction word.
     * @param addressPart The direction word.
     */
    static abbrvDirection(addressPart: string): string {
        switch (addressPart.toLowerCase()) {
            case "north": return 'N';
            case "east": return 'E';
            case "south": return 'S';
            case "west": return 'W';
            default: return addressPart;
        }
    }

    /**
     * Removes the place name from the address string if present.
     * @param address The full address string.
     * @param place The place name to remove.
     */
    static removePlaceFromAddress(address: string, place: string): string {
        if (!address) return '';
        if (!place) return address;
        let abbrvPlace = this.abbrvAddress(place).toLocaleLowerCase();
        let addressArray = address.split(/,\s*/);
        if (addressArray.length === 0) return address;
        let first = addressArray[0].toLocaleLowerCase();
        let lowerPlace = place.toLocaleLowerCase();
        // Remove if first part matches place or abbrvPlace
        if (
            first === lowerPlace ||
            first === abbrvPlace ||
            first.startsWith(lowerPlace) ||
            first.startsWith(abbrvPlace) ||
            lowerPlace.startsWith(first) ||
            abbrvPlace.startsWith(first)
        ) {
            return addressArray.slice(1).join(', ').trim();
        }
        return address;
    }
}