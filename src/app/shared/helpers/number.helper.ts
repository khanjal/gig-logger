export class NumberHelper {
    /**
     * Converts word numbers to digits (e.g., "four" -> 4, "twenty" -> 20)
     * @param word The word to convert
     * @returns The numeric value or NaN if not matched
     */
    static convertWordToNumber(word: string): number {
        const wordMap: { [key: string]: string } = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
            'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
            'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
            'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
            'hundred': '100'
        };
        const lower = word.toLowerCase().trim();
        if (wordMap[lower]) return parseInt(wordMap[lower], 10);
        const parts = lower.split(/[\s-]+/);
        if (parts.length === 2 && wordMap[parts[0]] && wordMap[parts[1]]) {
            return parseInt(wordMap[parts[0]], 10) + parseInt(wordMap[parts[1]], 10);
        }
        return NaN;
    }
    
    static getNumberFromString(numberString: string = ""): number {
        let number = Number(numberString.replace(/[^0-9.-]+/g,""));
        return isNaN(number) ? 0 : number;
    }

    static getDataSize(bytes: number = 0, decimals = 2) {
        if (!bytes) {
            return "0B";
        }

        let units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

        let i = 0
        
        for (i; bytes > 1024; i++) {
            bytes /= 1024;
        }

        return parseFloat(bytes.toFixed(decimals)) + ' ' + units[i]
    }

    /**
     * Converts empty strings, null, or undefined values to null for numeric form fields.
     * This ensures proper JSON serialization where empty numeric fields should be null instead of empty strings.
     * @param value The form field value that could be a number, empty string, null, or undefined
     * @returns null if the value is empty/null/undefined, otherwise returns the original value
     */
    static toNullableNumber(value: any): any {
        return (value === '' || value === null || value === undefined) ? null : value;
    }

    /**
     * Safely converts any value to a number, defaulting to 0 if the value is null, undefined, or not a valid number.
     * @param value The value to convert
     * @returns A number, or 0 if conversion fails
     */
    static toNumber(value: any): number {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }

    /**
     * Rounds a number to two decimals using standard rounding.
     */
    static roundToTwo(value: number): number {
        return Math.round(value * 100) / 100;
    }

    /**
     * Computes the median of a numeric array. Returns 0 for empty arrays.
     */
    static median(values: number[]): number {
        if (!values.length) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 !== 0) return sorted[mid];
        return this.roundToTwo((sorted[mid - 1] + sorted[mid]) / 2);
    }

    /**
     * Compares two numbers after rounding to two decimals.
     * Since both values are already rounded, we compare them directly.
     */
    static nearlyEqual(a: number, b: number): boolean {
        return this.roundToTwo(a) === this.roundToTwo(b);
    }

    /**
     * Formats a number with locale grouping and two-decimal rounding.
     */
    static formatNumber(value: number, locale: string = 'en-US'): string {
        const rounded = this.roundToTwo(value);
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(rounded);
    }
}