export class NumberHelper {
    static getNumberFromString(numberString: string = ""): number {
        let number = Number(numberString.replace(/[^0-9.-]+/g,""));
        return isNaN(number) ? 0 : number;
    }
}