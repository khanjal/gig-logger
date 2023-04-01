export class DateHelper {
    static getDateString(days: number = 0): string {
        let currentDate = new Date();
        let date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()-days);
        let dateString = date.toDateString();

        return dateString;
    }

    static getTimeString(date: Date): string {
        let timeString = date.toLocaleTimeString();
        return timeString;
    }
}