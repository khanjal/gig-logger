export class NumberHelper {
    static getNumberFromString(numberString: string = ""): number {
        let number = Number(numberString.replace(/[^0-9.-]+/g,""));
        return isNaN(number) ? 0 : number;
    }

    static getDataSize(bytes: number = 0, decimals = 2) {
        // console.log(bytes);
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
}