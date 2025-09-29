export class NumberHelper {
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
}