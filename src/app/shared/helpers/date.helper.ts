export class DateHelper {
    static getDateString(date: Date): string {
        var dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;

        return dateString;
    }

    static getTimeString(date: Date): string {
        var timeString = date.toLocaleTimeString();
        return timeString;
    }
}