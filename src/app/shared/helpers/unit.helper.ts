/**
 * Unit conversion and preference utility
 * Handles distance unit conversions and user preferences
 */
export class UnitHelper {
    
    /**
     * Get the user's preferred distance unit
     * Currently defaults to 'mi' but can be extended to read from user preferences
     * @returns 'mi' for miles or 'km' for kilometers
     */
    static getPreferredDistanceUnit(): string {
        // TODO: Replace with actual user preference when implemented
        // const userPreference = localStorage.getItem('preferredDistanceUnit');
        // return userPreference || 'mi';
        return 'mi';
    }
    
    /**
     * Convert distance from miles to the preferred unit
     * @param distanceInMiles Distance value in miles
     * @returns Converted distance value
     */
    static convertDistance(distanceInMiles: number): number {
        if (!distanceInMiles) return 0;
        
        const unit = this.getPreferredDistanceUnit();
        if (unit === 'km') {
            return distanceInMiles * 1.60934; // miles to kilometers
        }
        return distanceInMiles;
    }
    
    /**
     * Format distance for display with appropriate unit
     * @param distanceInMiles Distance value in miles
     * @param decimals Number of decimal places (default: 1)
     * @returns Formatted distance string with unit
     */
    static formatDistance(distanceInMiles: number, decimals: number = 1): string {
        if (!distanceInMiles) {
            return `-- ${this.getPreferredDistanceUnit()}`;
        }
        
        const convertedDistance = this.convertDistance(distanceInMiles);
        const unit = this.getPreferredDistanceUnit();
        return `${convertedDistance.toFixed(decimals)} ${unit}`;
    }
    
    /**
     * Set user's preferred distance unit
     * @param unit 'mi' for miles or 'km' for kilometers
     */
    static setPreferredDistanceUnit(unit: 'mi' | 'km'): void {
        // TODO: Implement when user preference system is added
        // localStorage.setItem('preferredDistanceUnit', unit);
        console.log(`Distance unit preference set to: ${unit} (not persisted yet)`);
    }
}
