export class DateHelper {
    static getDateFromDays(days: number = 0): Date {
        let currentDate = new Date();
        let date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()-days);
        let dateString = date;

        return dateString;
    }

    static getDatesArray(days: number = 0): string[] {
        let dates: string[] = [];

        for (let index = 0; index < days; index++) {
            dates.push(DateHelper.getISOFormat(this.getDateFromDays(index)));
        }

        return dates;
    }

    static getDateFromISO(date: string): Date {
        return new Date(`${date}\n`);
    }

    static getISOFormat(date?: Date) {
        if (!date) {
            date = new Date();
        }
        return date.toLocaleDateString("sv-SE"); // Use Swedish (Sweden) since it has the format we want (yyyy-MM-dd).
    }

    static getDays(): number {
        var date = new Date("01/01/1900");
        let time = new Date().getTime() - date.getTime();
        // To calculate the no. of days between two dates
        let days = time / (1000 * 3600 * 24);

        return Math.trunc(days) + 2;
    }

    static getFirstDayOfWeek(): number {
        return 1; // Forcing Monday to be the first day of the week.
    }

    static getTimeString(date: Date): string {
        let timeString = date.toLocaleTimeString();
        return timeString;
    }

    static getStartOfWeekDate(date: Date): string {
        const deltaStart =
            this.getFirstDayOfWeek() -
            this.getDayOfWeek(date);

        let startDate = new Date();
        startDate.setDate(startDate.getDate() + deltaStart);

        return this.getISOFormat(startDate);
    }

    static getDuration(start: string, end: string): string {
        if (!start || !end) {
            return "";
        }

        let startDate = Date.parse(new Date().toDateString() + ' ' + start);
        let endDate = Date.parse(new Date().toDateString() + ' ' + end);

        let diff = endDate - startDate;

        if (endDate < startDate) {
            endDate += 86400000; // Add day if end less than start.
            diff = endDate - startDate;
        }

        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / (60 * 1000)) % 60);
        const hours = Math.floor((diff / (60* 60 * 1000)) % 60);

        const duration = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}.000`;
        // console.log(duration);
        
        return duration;
    }

    static getDayOfWeek(date: Date = new Date()){
        let dayOfWeek = new Date(date).getDay();

        if (dayOfWeek === 0) {
            return 7; // We want Sunday to be 7
        }
        else {
            return dayOfWeek;
        }
    }

    static getMonday(date: Date = new Date()) {
        var day = date.getDay() || 7;  
        if( day !== 1 ) 
            date.setHours(-24 * (day - 1)); 
        return date;
    }

    static pad(number: number) {
        let numberString = number.toString();
        if (numberString.length < 2) {
            numberString = `0${numberString}`;
        }

        return numberString;
    }
}