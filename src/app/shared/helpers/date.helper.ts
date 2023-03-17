export class DateHelper {
    static getDateString(days: number = 0): string {
        let date = new Date;
        let dateString = `${date.getMonth() + 1}/${date.getDate()-days}/${date.getFullYear().toString().substr(-2)}`;

        return dateString;
    }

    static getTimeString(date: Date): string {
        let timeString = date.toLocaleTimeString();
        return timeString;
    }
}