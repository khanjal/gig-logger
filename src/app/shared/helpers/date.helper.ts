export class DateHelper {
    static getDateString(days: number = 0): string {
        let currentDate = new Date();
        let date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()-days);
        let dateString = date.toLocaleDateString();

        return dateString;
    }

    static getDatesArray(days: number = 0): string[] {
        let dates: string[] = [];

        for (let index = 0; index < days; index++) {
            dates.push(this.getDateString(index));
        }

        return dates;
    }

    static getDays(): number {
        var date = new Date("01/01/1900");
        let time = new Date().getTime() - date.getTime();
        // To calculate the no. of days between two dates
        let days = time / (1000 * 3600 * 24);

        return Math.trunc(days) + 2;
    }

    static getTimeString(date: Date): string {
        let timeString = date.toLocaleTimeString();
        return timeString;
    }
}