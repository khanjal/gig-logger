export class NumberHelper {
    static getNumberFromString(numberString: string = ""): number {
        return Number(numberString.replace(/[^0-9.-]+/g,""));
    }
}