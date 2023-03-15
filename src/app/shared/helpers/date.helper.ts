export class DateHelper {
    static getDateString(date: Date): string {
        var datestring = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;

        return datestring;
    }
}